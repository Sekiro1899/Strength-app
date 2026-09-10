/**
 * Moteur de génération — miroir de backend/engine/{exercise_selector,block_builder}.py
 *
 * Pur et sans I/O : exécutable côté client comme en edge function.
 *
 * Trois entrées pilotent la composition :
 *   target_programs / exercise_type  — quel exercice, dans quel bloc
 *   locations                        — praticable au lieu déclaré
 *   energy                           — charge ET volume
 *
 * Chaque bloc a son propre tirage, contraint par ses règles de composition :
 *   warmup    — mobilité avant activation, cibles d'échauffement réparties
 *   main      — chaque catégorie du focus représentée, compounds avant isolations
 *   core      — un patron de mouvement différent par exercice
 *   finisher  — libre
 * L'ordre À L'INTÉRIEUR d'un temps est tiré ; l'ordre DES temps ne l'est pas.
 *
 * La sélection est aléatoire mais REPRODUCTIBLE : le tirage est seedé sur
 * (programme, jour), donc rejouer la même séance redonne la même chose, alors
 * que deux séances différentes composent réellement différemment. Un historique
 * des séances récentes évite en plus de resservir les mêmes exercices.
 */

import { EXERCISES } from "./fixtures";
import type { Objective, Profile } from "./profile";
import { estimateMinutes } from "./prescription";
import { scalingFor } from "./scaling";
import {
  LEARNING_LOAD_PCT,
  LEARNING_NOTE,
  LEARNING_WEEKS,
  TEXTBOOK_PROGRAMS,
  resolveLift,
} from "./textbook";
import type {
  Exercise,
  ExerciseBlock,
  ExerciseType,
  Focus,
  Program,
  ProgramPhase,
  TimeBudget,
  TrainingLocation,
} from "./types";

/**
 * Sur un split PPL, le travail de bras suit le patron moteur : les triceps
 * poussent, les biceps tirent. Sans `arms` ici, un jour push d'un programme
 * d'hypertrophie ne disposait que d'UNE isolation — donc toujours la même.
 */
const FOCUS_CATEGORY_MAP: Record<Focus, string[]> = {
  push: ["push", "arms"],
  pull: ["pull", "arms"],
  legs: ["legs"],
  upper: ["push", "pull", "arms"],
  lower: ["legs"],
  full_body: ["push", "pull", "legs", "arms"],
};

const FOCUS_WARMUP_TARGET_MAP: Record<Focus, string[]> = {
  push: ["push", "bench", "ohp"],
  pull: ["pull", "deadlift"],
  legs: ["leg", "squat", "single_leg"],
  upper: ["push", "pull", "bench", "ohp"],
  lower: ["leg", "squat", "deadlift", "single_leg"],
  full_body: ["all"],
};

const CIRCUIT_CATEGORIES = ["complex", "explosive", "conditioning"];

/** Extenseurs du coude = jour push ; tout le reste des bras = jour pull. */
function armGroup(ex: Exercise): "triceps" | "biceps" {
  return ex.muscles_primary.some((m) => /triceps/i.test(m)) ? "triceps" : "biceps";
}

/**
 * Planchers de récupération.
 *
 * Ce sont des PLANCHERS : une phase de force pure qui réclame trois minutes
 * garde ses trois minutes. Ils ne servent qu'à empêcher le cas inverse — une
 * série lourde expédiée avec une minute de repos, où la charge s'effondre
 * d'une série à l'autre et où la prescription ne veut plus rien dire.
 */
const COMPOUND_REST_FLOOR = 120;
const COMPOUND_REST_SHORT = 90;
const ISOLATION_REST = 75;
const ISOLATION_REST_SHORT = 60;

/**
 * Repos d'un mouvement unilatéral.
 *
 * Le côté qui attend récupère pendant que l'autre travaille : une pause ENTRE
 * les deux ne sert à rien — on change de jambe et on enchaîne. Reste la pause
 * après la paire : nulle sur une isolation légère (des élévations de jambe
 * s'enchaînent), courte sur tout le reste, où la charge ou le gainage
 * demandent de souffler.
 */
const CORE_REST = 45;

const UNILATERAL_REST = 30;
const UNILATERAL_REST_ISOLATION = 0;

function unilateralRest(ex: Exercise): number {
  return ex.exercise_type === "isolation" ? UNILATERAL_REST_ISOLATION : UNILATERAL_REST;
}

/** Repos d'un bloc : le barème unilatéral prime sur celui de la séance. */
function restFor(ex: Exercise, base: number): number {
  return ex.unilateral ? unilateralRest(ex) : base;
}

/** Champs portés jusqu'au client quand l'exercice se travaille un côté à la fois. */
function unilateralFields(ex: Exercise): { unilateral?: true } {
  return ex.unilateral ? { unilateral: true } : {};
}

/** Créneau court : une série de moins sur les compounds, pas un repos de moins. */
const SETS_COMPOUND_SHORT = 3;

/**
 * Plafond de séries, tous reports compris.
 *
 * Quand le pool est étroit, le volume perdu se reporte sur les séries
 * (`fitToPool` puis `compensate`). Les deux reports pouvaient se cumuler et
 * sortir des séances à six séries par compound : à deux minutes de repos, cela
 * fait quarante minutes rien que sur les compounds. Passé cinq séries le
 * report ne conserve plus le volume, il rend la séance infaisable — mieux vaut
 * la perdre un peu.
 */
const MAX_SETS_COMPOUND = 5;
const MAX_SETS_ISOLATION = 4;

const LEVEL_ORDER: Record<string, number> = {
  debutant: 0,
  intermediaire: 1,
  avance: 2,
};

// ─────────────────────────────────────────────
// Tirage aléatoire reproductible
// ─────────────────────────────────────────────

/** FNV-1a — transforme la clé de séance en graine numérique. */
function hashSeed(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — petit PRNG rapide, suffisant pour du tirage d'exercices. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Graine d'une séance : stable pour un couple (programme, jour). */
export function sessionSeed(userProgramId: string, dayNumber: number): number {
  return hashSeed(`${userProgramId}#${dayNumber}`);
}

/** Fisher-Yates — un vrai mélange, là où un pas arithmétique répétait les séries. */
function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Ordonne un pool : ceux qui n'ont pas servi récemment d'abord, mélangés
 * à l'intérieur de chaque strate. On n'interdit jamais un exercice — sur un
 * pool étroit il faut bien réutiliser.
 */
function orderByFreshness(
  pool: Exercise[],
  rng: () => number,
  recentIds: Set<string>,
): Exercise[] {
  return [
    ...shuffle(pool.filter((e) => !recentIds.has(e.id)), rng),
    ...shuffle(pool.filter((e) => recentIds.has(e.id)), rng),
  ];
}

/** Tirage simple, quand le pool n'a pas de sous-groupes à équilibrer. */
function pick(
  pool: Exercise[],
  count: number,
  rng: () => number,
  recentIds: Set<string>,
): Exercise[] {
  if (pool.length === 0 || count <= 0) return [];
  return orderByFreshness(pool, rng, recentIds).slice(0, count);
}

interface Group {
  key: string;
  items: Exercise[];
}

/** Répartit un pool en sous-groupes ; les exercices sans clé sont écartés. */
function groupByKey(
  pool: Exercise[],
  key: (e: Exercise) => string | null | undefined,
): Group[] {
  const groups = new Map<string, Exercise[]>();
  for (const ex of pool) {
    const k = key(ex);
    if (!k) continue;
    const g = groups.get(k);
    if (g) g.push(ex);
    else groups.set(k, [ex]);
  }
  return [...groups.entries()].map(([k, items]) => ({ key: k, items }));
}

/**
 * Tire `count` exercices en gardant chaque sous-groupe représenté.
 *
 * C'est la règle qui manquait : un tirage à plat sur un focus `upper` mélange
 * push, pull et arms dans le même sac et peut rendre quatre compounds de push
 * et zéro pull — aléatoire, mais faux. On sert donc les sous-groupes en
 * tourniquet, chacun dans son propre ordre fraîcheur-d'abord.
 */
function pickBalanced(
  groups: Group[],
  count: number,
  rng: () => number,
  recentIds: Set<string>,
  opts: { priorityKey?: string | null; strictFamilies?: boolean } = {},
): Exercise[] {
  if (count <= 0) return [];
  const { priorityKey, strictFamilies } = opts;
  // L'ordre de passage des groupes est lui-même tiré : sinon le premier
  // sous-groupe serait toujours servi en premier.
  let ordered = shuffle(groups.filter((g) => g.items.length > 0), rng);
  if (priorityKey) {
    // Le compound en trop d'une séance chargée revient au groupe mis en avant
    // ce jour-là : deux push aujourd'hui, deux pull la prochaine fois.
    ordered = [
      ...ordered.filter((g) => g.key === priorityKey),
      ...ordered.filter((g) => g.key !== priorityKey),
    ];
  }
  const queues = ordered.map((g) => orderByFreshness(g.items, rng, recentIds));

  const out: Exercise[] = [];
  const taken = new Set<string>();
  const families = new Set<string>();

  // `strict` interdit deux exercices de la même famille de mouvement — c'est
  // ce qui évite d'enchaîner tractions et tractions négatives, qui sollicitent
  // exactement la même chose. On relâche la contrainte au second passage,
  // faute de quoi un pool étroit rendrait un bloc incomplet.
  const drain = (strict: boolean) => {
    let progress = true;
    while (out.length < count && progress) {
      progress = false;
      for (const queue of queues) {
        if (out.length >= count) break;
        const index = queue.findIndex((ex) => {
          if (taken.has(ex.id)) return false;
          if (!strict) return true;
          return !ex.movement_family || !families.has(ex.movement_family);
        });
        if (index === -1) continue;
        const [chosen] = queue.splice(index, 1);
        taken.add(chosen.id);
        if (chosen.movement_family) families.add(chosen.movement_family);
        out.push(chosen);
        progress = true;
      }
    }
  };

  drain(true);
  // Sur le bloc principal la contrainte ne se relâche pas : mieux vaut un
  // exercice de moins (compensé en séries) que deux fois le même patron.
  if (!strictFamilies) drain(false);
  return out;
}

// ─────────────────────────────────────────────
// Énergie → charge et volume
// ─────────────────────────────────────────────

export interface VolumePolicy {
  loadDelta: number;
  setsDelta: number;
  compounds: number;
  isolations: number;
  core: number;
  warmup: number;
  withFinisher: boolean;
}

/**
 * L'énergie déclarée en début de séance module la charge ET le volume.
 * Épuisé, on raccourcit la séance ; au top, on l'étoffe.
 */
export function volumeForEnergy(energy: number): VolumePolicy {
  switch (Math.max(1, Math.min(5, Math.round(energy)))) {
    case 1:
      return { loadDelta: -15, setsDelta: -1, compounds: 2, isolations: 1, core: 1, warmup: 5, withFinisher: false };
    case 2:
      return { loadDelta: -10, setsDelta: -1, compounds: 3, isolations: 1, core: 2, warmup: 5, withFinisher: false };
    case 4:
      return { loadDelta: 0, setsDelta: 0, compounds: 4, isolations: 3, core: 3, warmup: 4, withFinisher: true };
    case 5:
      return { loadDelta: 5, setsDelta: 1, compounds: 4, isolations: 3, core: 3, warmup: 3, withFinisher: true };
    default:
      return { loadDelta: 0, setsDelta: 0, compounds: 3, isolations: 2, core: 2, warmup: 4, withFinisher: true };
  }
}

/**
 * Le créneau annoncé PRIME sur l'énergie déclarée.
 *
 * Se sentir en forme ne crée pas de temps. Un pratiquant qui annonçait trente
 * minutes et une énergie de 5 recevait jusqu'ici la séance étoffée — un
 * compound de plus, une isolation de plus, une série de plus partout — donc
 * une séance qu'il ne pouvait pas finir. L'énergie continue de moduler la
 * CHARGE ; c'est le temps disponible qui décide du VOLUME.
 *
 * Le plafond n'est jamais un plancher : annoncer un créneau court ne rallonge
 * pas la séance de quelqu'un d'épuisé.
 */
export function applyTimeBudget(
  policy: VolumePolicy,
  budget: TimeBudget,
): VolumePolicy {
  if (budget !== "short") return policy;
  return {
    ...policy,
    // `loadDelta` n'est pas touché : être frais reste payant sur la barre.
    setsDelta: Math.min(policy.setsDelta, 0),
    compounds: Math.min(policy.compounds, 3),
    isolations: Math.min(policy.isolations, 2),
    core: Math.min(policy.core, 1),
    warmup: Math.min(policy.warmup, 3),
    withFinisher: false,
  };
}

/**
 * À cinq séances par semaine et plus, chaque séance pèse moins.
 *
 * C'est le volume HEBDOMADAIRE qui se récupère, pas celui d'une séance. Garder
 * le même contenu qu'à trois séances revient à demander presque le double de
 * travail sur la semaine — la fatigue s'accumule et la charge finit par
 * baisser d'elle-même. Une série de moins par exercice suffit à rendre le
 * rythme tenable.
 */
const HIGH_FREQUENCY_THRESHOLD = 5;

/**
 * Seuil abaissé pour les entrées en charge à ménager.
 *
 * Un débutant, ou quelqu'un passé 45 ans, qui insiste pour venir quatre fois
 * par semaine : on ne le lui refuse pas — c'est sa motivation, et elle vaut
 * mieux que trois séances qu'il ne fera pas. Mais quatre séances par semaine
 * chez lui pèsent ce que cinq pèsent ailleurs, alors on allège plus tôt, et on
 * baisse aussi la charge : c'est la répétition qui use, pas la série isolée.
 */
const GENTLE_FREQUENCY_THRESHOLD = 4;
const GENTLE_LOAD_DELTA = -10;

export function applyFrequency(
  policy: VolumePolicy,
  sessionsPerWeek: number,
  gentleProgression = false,
): VolumePolicy {
  const threshold = gentleProgression
    ? GENTLE_FREQUENCY_THRESHOLD
    : HIGH_FREQUENCY_THRESHOLD;
  if (sessionsPerWeek < threshold) return policy;
  return {
    ...policy,
    setsDelta: policy.setsDelta - 1,
    loadDelta: gentleProgression
      ? policy.loadDelta + GENTLE_LOAD_DELTA
      : policy.loadDelta,
  };
}

/**
 * Volume effectif de la séance. Trois plafonds successifs : l'énergie propose,
 * le créneau du jour plafonne, la fréquence hebdomadaire allège.
 */
function sessionPolicy(ctx: BuildContext): VolumePolicy {
  return applyFrequency(
    applyTimeBudget(volumeForEnergy(ctx.energy), ctx.timeBudget),
    ctx.profile.sessionsPerWeek,
    ctx.profile.needsGentleProgression,
  );
}

// ─────────────────────────────────────────────
// Sélection
// ─────────────────────────────────────────────

interface SelectOptions {
  categories?: string[];
  exerciseTypes?: ExerciseType[];
  levelMax?: string;
  location: TrainingLocation;
  warmupTargets?: string[];
  allowUniversal?: boolean;
  excludeIds?: Set<string>;
  /** Restreint la catégorie `arms` à un seul groupe (jours push / pull). */
  armGroup?: "triceps" | "biceps";
  /** Écarte les variantes allégées — tout le monde sauf débutants et 60+. */
  excludeRegressions?: boolean;
  /**
   * Écarte sauts et mouvements balistiques. Il ne s'agit pas d'un plafond de
   * difficulté — un squat lourd reste proposé — mais du seul impact : c'est la
   * réception au sol qui abîme, pas la charge.
   */
  excludeHighImpact?: boolean;
  /**
   * Pool d'échauffement : la catégorie `warmup`, plus tout exercice portant
   * une cible d'échauffement. L'Air Squat sert d'abord à ça.
   */
  warmupPool?: boolean;
}

function selectExercises(programId: string, opts: SelectOptions): Exercise[] {
  const maxLevel = LEVEL_ORDER[opts.levelMax ?? "avance"] ?? 2;
  const exclude = opts.excludeIds ?? new Set<string>();

  return EXERCISES.filter((ex) => {
    if (exclude.has(ex.id)) return false;
    if (opts.excludeHighImpact && ex.high_impact) return false;

    const targets = ex.target_programs ?? [];
    if (targets.length === 0) {
      if (!opts.allowUniversal) return false;
    } else if (!targets.includes(programId)) {
      return false;
    }

    // Le lieu déclaré en début de séance décide du matériel disponible.
    if (!(ex.locations ?? ["gym"]).includes(opts.location)) return false;

    if (opts.warmupPool) {
      if (ex.category !== "warmup" && !(ex.warmup_target ?? []).length) return false;
    } else if (opts.categories && !opts.categories.includes(ex.category)) {
      return false;
    }
    if (opts.excludeRegressions && ex.is_regression) return false;
    if (opts.armGroup && ex.category === "arms" && armGroup(ex) !== opts.armGroup) {
      return false;
    }
    if (
      opts.exerciseTypes &&
      (!ex.exercise_type || !opts.exerciseTypes.includes(ex.exercise_type))
    ) {
      return false;
    }
    if ((LEVEL_ORDER[ex.level] ?? 0) > maxLevel) return false;

    if (opts.warmupTargets) {
      const t = ex.warmup_target ?? [];
      if (!(t.includes("all") || opts.warmupTargets.some((w) => t.includes(w)))) {
        return false;
      }
    }
    return true;
  });
}

/** En dessous de ce rapport pool/tirage, la rotation ne peut plus varier. */
const POOL_VARIETY_FACTOR = 2;

const LEVEL_LADDER = ["debutant", "intermediaire", "avance"];

/**
 * Sélectionne en élargissant le plafond de niveau si le pool est trop étroit.
 *
 * Le plafond vient du persona, et il est parfois plus serré que la
 * bibliothèque ne le permet : un Corporate Rusher plafonné à `intermediaire`
 * n'avait que 7 complexes éligibles pour 5 tirés par séance — le même jeu
 * revenait forcément. Mieux vaut lui proposer un mouvement avancé de temps en
 * temps que la même séance chaque fois. On ne descend jamais en dessous du
 * plafond demandé : on ne fait que l'élargir quand il étouffe le tirage.
 */
function selectVaried(
  programId: string,
  opts: SelectOptions,
  count: number,
): Exercise[] {
  const start = LEVEL_LADDER.indexOf(opts.levelMax ?? "avance");
  let pool = selectExercises(programId, opts);
  for (
    let i = (start < 0 ? LEVEL_LADDER.length : start) + 1;
    i < LEVEL_LADDER.length && pool.length < count * POOL_VARIETY_FACTOR;
    i++
  ) {
    const wider = selectExercises(programId, { ...opts, levelMax: LEVEL_LADDER[i] });
    if (wider.length > pool.length) pool = wider;
  }
  return pool;
}

/**
 * Ajuste le nombre d'exercices à ce que le pool peut réellement faire varier,
 * et reporte le volume perdu sur les séries.
 *
 * Tirer 7 exercices dans une réserve de 8 ne produit pas une séance variée :
 * elle contient presque tout le pool, donc la suivante aussi. Mieux vaut moins
 * de mouvements et plus de tours — la charge de travail est conservée, et deux
 * séances consécutives cessent d'être la même liste réordonnée.
 */
function fitToPool(
  poolSize: number,
  wanted: number,
  sets: number,
): { count: number; sets: number } {
  const capacity = Math.floor(poolSize / POOL_VARIETY_FACTOR);
  if (capacity < 1 || capacity >= wanted) return { count: wanted, sets };
  // Le report est plafonné : au-delà, la séance devient interminable.
  return { count: capacity, sets: Math.min(Math.ceil((sets * wanted) / capacity), sets + 3) };
}

// Chaînes antagonistes : on n'apparie en superset qu'un tirage avec une
// poussée. Deux squats enchaînés ne feraient qu'épuiser les mêmes jambes.
const PUSH_FAMILIES = new Set(["horizontal_push", "vertical_push", "dip", "muscle_up"]);
const PULL_FAMILIES = new Set(["vertical_pull", "horizontal_pull", "pullover"]);

/**
 * Apparie les blocs deux à deux et les rend ADJACENTS : l'écran de séance
 * reconnaît un superset en regardant le bloc suivant. Le repos passe après
 * la paire, il n'y en a pas entre les deux mouvements.
 */
function applySupersets(
  blocks: ExerciseBlock[],
  canPair: (a: ExerciseBlock, b: ExerciseBlock) => boolean,
): ExerciseBlock[] {
  const remaining = [...blocks];
  const out: ExerciseBlock[] = [];
  while (remaining.length) {
    const first = remaining.shift()!;
    const index = remaining.findIndex((b) => canPair(first, b));
    if (index === -1) {
      out.push(first);
      continue;
    }
    const [second] = remaining.splice(index, 1);
    first.superset_with = second.exercise_id;
    // Le repos de la PAIRE est le plus long des deux : apparier une isolation
    // unilatérale, qui n'a pas de repos propre, ne doit pas supprimer celui
    // que l'autre mouvement réclame.
    second.rest_sec = Math.max(first.rest_sec ?? 0, second.rest_sec ?? 0);
    first.rest_sec = 0;
    out.push(first, second);
  }
  return out;
}

/** Reporte sur les séries le volume perdu quand un exercice manque. */
function compensate(sets: number, wanted: number, actual: number): number {
  if (actual >= wanted || actual < 1) return sets;
  return Math.min(Math.ceil((sets * wanted) / actual), sets + 3);
}

export interface BuildContext {
  program: Program;
  /**
   * Cycle en cours. Sert de graine STABLE : le programme textbook attribué au
   * pratiquant ne doit pas changer d'une séance à l'autre.
   */
  userProgramId: string;
  /** Persona : décide de l'ampleur du travail de force (voir STRENGTH). */
  personaId: string | null;
  phase: ProgramPhase | null;
  /** Semaine du cycle — décide des semaines d'apprentissage d'un débutant. */
  weekNumber: number;
  focus: Focus;
  /** Profil du pratiquant — plafond de niveau et tolérance aux régressions. */
  profile: Profile;
  /** Numéro de séance : fait tourner l'accent d'une séance à l'autre. */
  dayNumber: number;
  /** Créneau annoncé — décide de la mise en superset. */
  timeBudget: TimeBudget;
  levelMax: string;
  energy: number;
  location: TrainingLocation;
  /** Exercices vus lors des dernières séances — évités en priorité. */
  recentIds: Set<string>;
  rng: () => number;
}

/**
 * Fenêtre de répétitions prescrite.
 *
 * Une plage centrée sur la moyenne de la phase tombait sur des bornes
 * impaires — « 9-11 » — qu'aucun pratiquant n'a en tête. On découpe la plage
 * du programme en fenêtres de deux répétitions calées sur les paliers usuels
 * (8-10, 10-12, 12-14) et on en fait tourner une par séance : la prescription
 * reste dans le cadre de la phase, et deux séances de suite cessent de
 * demander exactement le même effort.
 */
function repWindow(min: number, max: number, index: number): [number, number] {
  if (max <= min) return [min, min];
  // Une plage déjà courte EST la fenêtre : 8-10 ne se redécoupe pas.
  if (max - min <= 3) return [min, max];
  const windows: [number, number][] = [];
  for (let lo = min; lo + 2 <= max; lo += 2) windows.push([lo, lo + 2]);
  if (windows.length === 0) return [min, max];
  return windows[Math.abs(index) % windows.length];
}

/**
 * Travail de force ponctuel, greffé sur une séance d'hypertrophie.
 *
 * Le but n'est PAS de produire une séance Starting Strength : c'est un
 * programme à part entière, avec sa propre progression de charge, et il n'a
 * rien à faire au milieu d'un tirage. Ce qu'on greffe, c'est un exercice —
 * cinq séries de cinq sur le premier mouvement lourd — pendant que le reste
 * de la séance garde le tempo habituel, trois ou quatre séries de dix.
 *
 * Deux personas font exception : Summer Muscle Builder et Brut Force viennent
 * chercher de la charge, et y ont droit sur les deux premiers compounds, avec
 * les déclinaisons plus lourdes du barème. Les isolations n'y passent jamais.
 */
interface StrengthProtocol {
  label: string;
  sets: number;
  reps: number;
  /** Points de 1RM ajoutés : moins de répétitions, donc plus lourd. */
  loadDelta: number;
  rest_sec: number;
}

const STRENGTH_PROTOCOLS: StrengthProtocol[] = [
  { label: "5×5 force", sets: 5, reps: 5, loadDelta: 12, rest_sec: 180 },
  { label: "3×5 Starting Strength", sets: 3, reps: 5, loadDelta: 17, rest_sec: 180 },
  { label: "5×3 force maximale", sets: 5, reps: 3, loadDelta: 22, rest_sec: 210 },
];

/** Personas orientés charge : barème complet, sur les deux premiers compounds. */
const STRENGTH_PERSONAS = new Set(["persona_smb", "persona_bf"]);

/**
 * Objectifs qui justifient de charger. Le 5x5 sert à prendre du muscle ET de
 * la force ; sur un objectif d'efficacité ou de performance athlétique, il
 * mange le temps de la séance sans servir ce qui a été demandé.
 */
const STRENGTH_OBJECTIVES = new Set<Objective>([
  "aesthetics",
  "strength",
  "complete_athlete",
]);

/** Une séance sur trois porte du travail de force. */
const STRENGTH_EVERY = 3;

/**
 * Familles qui supportent le lourd. Un 5x5 sur des élévations latérales n'a
 * aucun sens — le barème ne s'applique qu'aux mouvements qui portent la charge.
 */
const HEAVY_FAMILIES = new Set([
  "squat",
  "hinge",
  "horizontal_push",
  "vertical_push",
  "horizontal_pull",
  "vertical_pull",
  "dip",
]);

interface StrengthPlan {
  protocol: StrengthProtocol;
  /** Nombre de compounds de tête concernés. */
  lifts: number;
}

function strengthPlan(ctx: BuildContext): StrengthPlan | null {
  // Un circuit se joue sur la densité, pas sur la charge.
  if (ctx.program.session_structure === "circuit") return null;
  // Cinq séries à trois minutes de repos, c'est vingt-cinq minutes sur un seul
  // mouvement : hors de question quand le créneau est déjà compté.
  if (ctx.timeBudget === "short") return null;
  // Du lourd sur un jour sans jus, c'est comme ça qu'on se blesse.
  if (ctx.energy < 3) return null;
  // Le 5x5 suppose une technique déjà en place. Un débutant a d'abord des
  // mouvements à apprendre — c'est le rôle des semaines d'apprentissage des
  // séances textbook, pas d'une série lourde greffée sur une séance ordinaire.
  if (ctx.profile.level === "debutant") return null;

  const dedicated = STRENGTH_PERSONAS.has(ctx.personaId ?? "");
  // Hors des deux personas de force, encore faut-il que la charge fasse
  // partie de ce que le pratiquant est venu chercher.
  if (!dedicated && !STRENGTH_OBJECTIVES.has(ctx.profile.objective as Objective)) {
    return null;
  }
  if (ctx.dayNumber % STRENGTH_EVERY !== 0) return null;
  const cycle = Math.floor(ctx.dayNumber / STRENGTH_EVERY);
  return {
    // Ailleurs que chez les deux personas de force, on s'en tient au 5x5 :
    // c'est le schéma que tout le monde reconnaît.
    protocol: dedicated
      ? STRENGTH_PROTOCOLS[cycle % STRENGTH_PROTOCOLS.length]
      : STRENGTH_PROTOCOLS[0],
    lifts: dedicated ? 2 : 1,
  };
}

/**
 * Réécrit un bloc au barème de force. Retourne `false` si le mouvement ne s'y
 * prête pas — le bloc garde alors sa prescription d'hypertrophie.
 */
function applyStrength(
  block: ExerciseBlock,
  exercise: Exercise,
  protocol: StrengthProtocol,
  bodyweightOnly: boolean,
): boolean {
  if (!HEAVY_FAMILIES.has(exercise.movement_family ?? "")) return false;
  // Le barème est écrit pour des mouvements bilatéraux chargés à la barre. Un
  // « 5x5 à 82 % » sur des pompes archer ou un soulevé de terre unijambiste ne
  // veut rien dire, et réimposerait trois minutes de repos là où la règle est
  // justement d'enchaîner les côtés.
  if (exercise.unilateral) return false;

  block.sets = protocol.sets;
  block.reps = protocol.reps;
  // Le barème impose un nombre sec : plus de fourchette à afficher.
  delete block.reps_max;
  if (block.load_pct_1rm !== undefined) {
    // 92 % reste un maximum de travail : au-delà on est sur du test de 1RM.
    block.load_pct_1rm = Math.min(block.load_pct_1rm + protocol.loadDelta, 92);
  }
  block.rest_sec = protocol.rest_sec;
  block.protocol_label = protocol.label;
  block.notes = bodyweightOnly
    ? `${protocol.label} — lesté dès que la série passe propre`
    : `${protocol.label} — ${protocol.sets}x${protocol.reps} lourd`;
  return true;
}

/**
 * Charge de travail, en pourcentage du 1RM.
 *
 * Six phases sur treize seulement portent une charge explicite. Les autres
 * laissaient le champ vide et retombaient ici sur `program.rep_range_min` —
 * un NOMBRE DE RÉPÉTITIONS lu comme un pourcentage. Huit, remonté au plancher
 * de 40, et toute une phase de Progressive Overload se prescrivait à 40 % de
 * 1RM : un échauffement présenté comme du travail.
 */
const DEFAULT_LOAD_PCT = 65;

function resolveLoadPct(phase: ProgramPhase | null): number {
  return phase?.load_pct_1rm ?? DEFAULT_LOAD_PCT;
}

// ─────────────────────────────────────────────
// Blocs
// ─────────────────────────────────────────────

export function buildWarmup(ctx: BuildContext): ExerciseBlock[] {
  const policy = sessionPolicy(ctx);

  let pool = selectExercises(ctx.program.id, {
    warmupPool: true,
    warmupTargets: FOCUS_WARMUP_TARGET_MAP[ctx.focus] ?? ["all"],
    location: ctx.location,
    allowUniversal: true,
    excludeHighImpact: ctx.profile.avoidsImpact,
  });
  if (pool.length < policy.warmup) {
    pool = selectExercises(ctx.program.id, {
      warmupPool: true,
      location: ctx.location,
      allowUniversal: true,
      excludeHighImpact: ctx.profile.avoidsImpact,
    });
  }

  // Règle d'échauffement : on mobilise avant d'activer. Le tirage est libre
  // À L'INTÉRIEUR de chaque temps, l'ordre des deux temps ne l'est pas.
  const isPureMobility = (ex: Exercise) =>
    ex.intent.includes("mobilite") &&
    !ex.intent.includes("stabilite") &&
    !ex.intent.includes("endurance");

  const mobilityCount = Math.floor(policy.warmup / 2);
  const byTarget = (ex: Exercise) => (ex.warmup_target ?? ["all"])[0] ?? "all";

  const mobility = pickBalanced(
    groupByKey(pool.filter(isPureMobility), byTarget),
    mobilityCount,
    ctx.rng,
    ctx.recentIds,
  );
  const taken = new Set(mobility.map((e) => e.id));
  const activation = pickBalanced(
    groupByKey(
      pool.filter((ex) => !isPureMobility(ex) && !taken.has(ex.id)),
      byTarget,
    ),
    policy.warmup - mobility.length,
    ctx.rng,
    ctx.recentIds,
  );

  // L'étiquette suit le TEMPS où l'exercice est placé, la prescription suit sa
  // NATURE : un mouvement tenu se compte en secondes même en phase d'activation.
  const toBlock = (ex: Exercise, tier: string): ExerciseBlock => {
    const isHeld = ex.intent.includes("mobilite");
    return {
      exercise_id: ex.id,
      name: ex.name,
      sets: isHeld ? 2 : 1,
      ...(isHeld ? { duration_sec: 30 } : { reps: 10 }),
      notes: tier,
      log_results: false,
    };
  };

  return [
    ...mobility.map((ex) => toBlock(ex, "Mobilité")),
    ...activation.map((ex) => toBlock(ex, "Activation musculaire")),
  ];
}

function buildCircuitMain(ctx: BuildContext): ExerciseBlock[] {
  const policy = sessionPolicy(ctx);
  const count = policy.compounds + policy.isolations;
  const pool = selectVaried(
    ctx.program.id,
    {
      categories: CIRCUIT_CATEGORIES,
      levelMax: ctx.levelMax,
      location: ctx.location,
      excludeHighImpact: ctx.profile.avoidsImpact,
    },
    count,
  );

  const reps = Math.round(
    ((ctx.phase?.rep_range_min ?? 8) + (ctx.phase?.rep_range_max ?? 10)) / 2,
  );
  const rest = ctx.phase?.rest_sec_min ?? 60;
  const load = Math.max(resolveLoadPct(ctx.phase) + policy.loadDelta, 40);
  const fit = fitToPool(pool.length, count, Math.max(2, 3 + policy.setsDelta));

  return pickBalanced(
    groupByKey(pool, (ex) => ex.category),
    fit.count,
    ctx.rng,
    ctx.recentIds,
  ).map((ex, i) => {
    const isCardio = ex.exercise_type === "cardio";
    // Un benchmark porte son propre format : 20 min d'AMRAP ne se découpent
    // pas en 4 séries de 40 s.
    const imposed = ex.prescribed_duration_sec !== null;
    return {
      exercise_id: ex.id,
      name: ex.name,
      sets: imposed ? (ex.prescribed_sets ?? 1) : fit.sets,
      ...(imposed
        ? { duration_sec: ex.prescribed_duration_sec! }
        : isCardio
          ? { duration_sec: 40 }
          : { reps, load_pct_1rm: load }),
      rest_sec: restFor(ex, rest),
      ...unilateralFields(ex),
      notes: imposed ? "Circuit — format imposé" : `Circuit — tour ${i + 1}`,
      // Un circuit au poids de corps enchaîne tractions et dips : la même
      // question de progression s'y pose qu'en séance de musculation.
      ...(scalingFor(ex.id) ? { scaling: scalingFor(ex.id)! } : {}),
      log_results: true,
    };
  });
}

/**
 * Chances qu'une séance soit RÉCITÉE plutôt que tirée.
 *
 * Plus hautes chez les jeunes et les débutants : ce sont eux qui gagnent le
 * plus à suivre un programme écrit, où la charge monte séance après séance,
 * plutôt qu'un assemblage qui change à chaque fois. Un pratiquant avancé, lui,
 * sait déjà ce qu'il cherche — on le laisse surtout sur le tirage.
 */
const TEXTBOOK_ODDS = 0.3;
const TEXTBOOK_ODDS_YOUNG_OR_NOVICE = 0.6;

function textbookOdds(profile: Profile): number {
  return profile.level === "debutant" || profile.ageBand === "18_25"
    ? TEXTBOOK_ODDS_YOUNG_OR_NOVICE
    : TEXTBOOK_ODDS;
}

function practicableAt(id: string, location: TrainingLocation): boolean {
  const ex = findExercise(id);
  return Boolean(ex && (ex.locations ?? ["gym"]).includes(location));
}

/**
 * Séance de force classique, servie telle qu'elle est écrite.
 *
 * Retourne null dès qu'une condition manque — la séance repasse alors par le
 * tirage. C'est vrai en particulier du matériel : un poste sans candidat
 * praticable au lieu déclaré écarte le programme entier plutôt que de le
 * bricoler. Starting Strength sans barre n'est pas Starting Strength.
 */
function buildTextbookMain(ctx: BuildContext): ExerciseBlock[] | null {
  // Réservé à qui vient chercher de la charge et pas de la sueur (q3 + q9).
  if (!ctx.profile.strengthOriented) return null;
  // Trois mouvements lourds à trois minutes de repos : il faut le temps.
  if (ctx.timeBudget === "short") return null;

  // Tirage à part : consulter le hasard du tirage d'exercices ici décalerait
  // toutes les séances ordinaires, alors que rien n'a changé pour elles.
  const roll = createRng(hashSeed(`textbook#${ctx.userProgramId}#${ctx.dayNumber}`))();
  if (roll >= textbookOdds(ctx.profile)) return null;

  // Le programme attribué est stable sur tout le cycle : changer de méthode
  // chaque semaine, c'est n'en suivre aucune.
  const program =
    TEXTBOOK_PROGRAMS[hashSeed(ctx.userProgramId) % TEXTBOOK_PROGRAMS.length];
  // L'alternance des deux jours EST le programme.
  const day = program.days[ctx.dayNumber % program.days.length];

  // Un débutant qui découvre le squat barre n'a pas de charge à chercher, il a
  // un mouvement à installer.
  const learning =
    ctx.profile.level === "debutant" && ctx.weekNumber <= LEARNING_WEEKS;

  const blocks: ExerciseBlock[] = [];
  for (const lift of day.lifts) {
    const id = resolveLift(lift, ctx.location, practicableAt);
    if (!id) return null;
    const ex = findExercise(id);
    if (!ex) return null;

    blocks.push({
      exercise_id: ex.id,
      name: ex.name,
      sets: lift.sets,
      reps: lift.reps,
      load_pct_1rm: learning ? Math.min(lift.loadPct, LEARNING_LOAD_PCT) : lift.loadPct,
      rest_sec: lift.restSec,
      protocol_label: `${program.name} · ${day.label}`,
      notes: learning ? LEARNING_NOTE : `${lift.sets}x${lift.reps} — ${program.name}`,
      ...(scalingFor(ex.id) ? { scaling: scalingFor(ex.id)! } : {}),
      ...unilateralFields(ex),
      log_results: true,
    });
  }
  return blocks;
}

/**
 * Nom de la séance quand elle est récitée plutôt que composée.
 *
 * Une séance textbook remplace le focus prévu au plan : l'alternance jour A /
 * jour B EST le programme. Afficher « Push » au-dessus d'un squat et d'un
 * soulevé de terre ne tromperait personne longtemps, mais ferait douter du
 * reste. On recompose donc l'étiquette depuis le programme servi.
 */
export function textbookLabel(ctx: BuildContext): string | null {
  return buildTextbookMain(ctx)?.[0]?.protocol_label ?? null;
}

export function buildMain(ctx: BuildContext): ExerciseBlock[] {
  if (ctx.program.session_structure === "circuit") return buildCircuitMain(ctx);

  // Certaines séances ne se composent pas : elles se récitent.
  const textbook = buildTextbookMain(ctx);
  if (textbook) return textbook;

  const policy = sessionPolicy(ctx);
  const categories = FOCUS_CATEGORY_MAP[ctx.focus] ?? ["push", "pull", "legs"];
  const bodyweightOnly = ctx.program.id === "program_bodyweight";

  const short = ctx.timeBudget === "short";

  // Quatre séries de dix tractions à soixante secondes de repos, ce n'est pas
  // une séance dure, c'est une séance ratée : la charge s'effondre dès la
  // troisième série. Sur du compound on part de deux minutes. Quand le créneau
  // manque, on ne rogne pas le repos — on retire une série et on descend à
  // quatre-vingt-dix secondes, ce qui préserve la qualité de chaque série.
  const rest = Math.max(
    ctx.phase?.rest_sec_min ?? 0,
    short ? COMPOUND_REST_SHORT : COMPOUND_REST_FLOOR,
  );
  const restIsolation = short ? ISOLATION_REST_SHORT : ISOLATION_REST;

  const setsCompounds = Math.min(
    Math.max(2, (ctx.phase?.sets_compounds ?? 4) + policy.setsDelta),
    short ? SETS_COMPOUND_SHORT : Infinity,
  );
  const setsIsolation = Math.max(2, (ctx.phase?.sets_isolation ?? 3) + policy.setsDelta);
  const repMin = ctx.phase?.rep_range_min ?? ctx.program.rep_range_min ?? 8;
  const repMax = ctx.phase?.rep_range_max ?? ctx.program.rep_range_max ?? 12;
  const load = Math.min(
    Math.max(resolveLoadPct(ctx.phase) + policy.loadDelta, 40),
    100,
  );

  const base = {
    levelMax: ctx.levelMax,
    location: ctx.location,
    // Une variante allégée n'a sa place dans le bloc principal que chez un
    // débutant ou un pratiquant âgé. Pour les autres : goblet squat ou barre.
    excludeRegressions: !ctx.profile.allowRegressions,
    // La réception au sol abîme, pas la charge : un squat lourd reste proposé.
    excludeHighImpact: ctx.profile.avoidsImpact,
    ...(ctx.focus === "push"
      ? { armGroup: "triceps" as const }
      : ctx.focus === "pull"
        ? { armGroup: "biceps" as const }
        : {}),
  };

  // Chaque catégorie du focus doit être représentée avant qu'une seule ne
  // soit servie deux fois — d'où le tirage en tourniquet plutôt qu'à plat.
  // Un full body sort ainsi 1 push, 1 pull, 1 leg avant tout doublon.
  const compoundPool = selectVaried(
    ctx.program.id,
    { ...base, categories, exerciseTypes: ["compound"] },
    policy.compounds,
  );
  const compoundFit = fitToPool(compoundPool.length, policy.compounds, setsCompounds);
  const compoundGroups = groupByKey(compoundPool, (ex) => ex.category);

  // Quand l'énergie autorise un compound de plus, il ne doit pas retomber
  // toujours sur le même patron. L'accent tourne avec le numéro de séance :
  // deux push cette fois, deux pull la suivante.
  const rotation = compoundGroups.map((g) => g.key).sort();
  const emphasis = rotation.length
    ? rotation[ctx.dayNumber % rotation.length]
    : null;

  const compounds = pickBalanced(
    compoundGroups,
    compoundFit.count,
    ctx.rng,
    ctx.recentIds,
    { priorityKey: emphasis, strictFamilies: true },
  );
  const used = new Set(compounds.map((e) => e.id));

  const isolationPool = selectVaried(
    ctx.program.id,
    { ...base, categories, exerciseTypes: ["isolation"], excludeIds: used },
    policy.isolations,
  );
  const isolationFit = fitToPool(isolationPool.length, policy.isolations, setsIsolation);
  const isolations = pickBalanced(
    groupByKey(isolationPool, (ex) => ex.category),
    isolationFit.count,
    ctx.rng,
    ctx.recentIds,
    { strictFamilies: true },
  );

  // La contrainte de famille peut rendre moins d'exercices que demandé : on
  // reporte le volume manquant sur les séries, comme pour un pool étroit.
  const compoundSets = Math.min(
    compensate(compoundFit.sets, compoundFit.count, compounds.length),
    MAX_SETS_COMPOUND,
  );
  const isolationSets = Math.min(
    compensate(isolationFit.sets, isolationFit.count, isolations.length),
    MAX_SETS_ISOLATION,
  );

  // La fenêtre tourne d'une séance à l'autre à l'intérieur de la plage de la
  // phase : 8-10 cette fois, 10-12 la prochaine. L'isolation travaille deux
  // répétitions plus haut que le compound, décalée d'un cran pour que les deux
  // ne changent pas en même temps.
  const [reps, repsTop] = repWindow(repMin, repMax, ctx.dayNumber);
  const [isoReps, isoRepsTop] = repWindow(repMin + 2, repMax + 3, ctx.dayNumber + 1);
  const repsMax = repsTop > reps ? repsTop : undefined;
  const isoRepsMax = isoRepsTop > isoReps ? isoRepsTop : undefined;

  const range = (lo: number, hi?: number) => (hi && hi !== lo ? `${lo}-${hi}` : `${lo}`);

  const compoundBlocks: ExerciseBlock[] = compounds.map((ex) => ({
    exercise_id: ex.id,
    name: ex.name,
    sets: compoundSets,
    reps,
    ...(repsMax ? { reps_max: repsMax } : {}),
    ...(bodyweightOnly ? {} : { load_pct_1rm: load }),
    rest_sec: restFor(ex, rest),
    ...unilateralFields(ex),
    notes: `Compound — ${compoundSets}x${range(reps, repsMax)}`,
    // Sur des tractions ou des dips, la prescription seule ne suffit pas :
    // il faut dire par où monter et par où descendre.
    ...(scalingFor(ex.id) ? { scaling: scalingFor(ex.id)! } : {}),
    // Seuls les compounds portent la progression : c'est là que la charge se
    // suit d'une séance à l'autre.
    log_results: true,
  }));

  // Le travail de force se greffe sur les compounds de TÊTE, jamais sur toute
  // la séance : le reste garde son tempo d'hypertrophie.
  const plan = strengthPlan(ctx);
  if (plan) {
    // On vise le premier mouvement ÉLIGIBLE, pas le premier tout court : viser
    // strictement la tête de séance ne déclenchait le barème qu'une fois sur
    // deux, selon que le tirage avait ouvert sur un squat ou sur du gainage.
    let applied = 0;
    for (let i = 0; i < compoundBlocks.length && applied < plan.lifts; i++) {
      if (applyStrength(compoundBlocks[i], compounds[i], plan.protocol, bodyweightOnly)) {
        applied++;
      }
    }
  }

  const isolationBlocks: ExerciseBlock[] = isolations.map((ex) => ({
    exercise_id: ex.id,
    name: ex.name,
    sets: isolationSets,
    reps: isoReps,
    ...(isoRepsMax ? { reps_max: isoRepsMax } : {}),
    ...(bodyweightOnly ? {} : { load_pct_1rm: Math.max(load - 10, 40) }),
    rest_sec: restFor(ex, restIsolation),
    ...unilateralFields(ex),
    notes: `Isolation — ${isolationSets}x${range(isoReps, isoRepsMax)}`,
    ...(scalingFor(ex.id) ? { scaling: scalingFor(ex.id)! } : {}),
    // Pas de saisie de charge sur l'isolation : on coche la série et on
    // enchaîne. La progression se mesure sur les compounds.
    log_results: false,
  }));

  // Deux règles distinctes. L'isolation s'apparie toujours : c'est léger, les
  // familles sont déjà différentes, et ça n'entame pas la qualité du travail.
  // Le compound ne s'apparie que si le créneau manque — sur du lourd, le
  // superset coûte en charge, on ne le paie que pour tenir dans le temps.
  const familyOf = new Map<string, string | null>(
    [...compounds, ...isolations].map((ex) => [ex.id, ex.movement_family]),
  );
  const antagonists = (a: ExerciseBlock, b: ExerciseBlock) => {
    // Une série lourde se prend seule : l'apparier reviendrait à préfatiguer
    // le mouvement même qu'on cherche à charger.
    if (a.protocol_label || b.protocol_label) return false;
    const fa = familyOf.get(a.exercise_id) ?? "";
    const fb = familyOf.get(b.exercise_id) ?? "";
    return (
      (PUSH_FAMILIES.has(fa) && PULL_FAMILIES.has(fb)) ||
      (PULL_FAMILIES.has(fa) && PUSH_FAMILIES.has(fb))
    );
  };

  // Créneau court : on apparie aussi les compounds, mais uniquement
  // antagonistes — un tirage avec une poussée, jamais deux fois la même chaîne.
  const finalCompounds =
    ctx.timeBudget === "short"
      ? applySupersets(compoundBlocks, antagonists)
      : compoundBlocks;

  const finalIsolations = applySupersets(isolationBlocks, () => true);

  return [...finalCompounds, ...finalIsolations];
}

export function buildCore(ctx: BuildContext): ExerciseBlock[] {
  if (!ctx.program.has_core_block) return [];
  const policy = sessionPolicy(ctx);

  const pool = selectVaried(
    ctx.program.id,
    {
      exerciseTypes: ["core"],
      levelMax: ctx.levelMax,
      location: ctx.location,
      excludeRegressions: !ctx.profile.allowRegressions,
      excludeHighImpact: ctx.profile.avoidsImpact,
    },
    policy.core,
  );

  // Deux exercices de core tirés à plat, c'est deux gainages d'affilée. On
  // tire un patron de mouvement différent par exercice tant qu'il en reste.
  const coreFit = fitToPool(pool.length, policy.core, Math.max(2, 3 + policy.setsDelta));

  return pickBalanced(
    groupByKey(pool, (ex) => ex.movement_pattern),
    coreFit.count,
    ctx.rng,
    ctx.recentIds,
  ).map((ex) => {
    const isEndurance = ex.category === "core_endurance";
    return {
      exercise_id: ex.id,
      name: ex.name,
      sets: coreFit.sets,
      ...(isEndurance ? { duration_sec: 40 } : { reps: 12 }),
      rest_sec: restFor(ex, CORE_REST),
      ...unilateralFields(ex),
      notes: isEndurance ? "Gainage" : "Core — force",
      log_results: true,
    };
  });
}

export function buildFinisher(ctx: BuildContext): ExerciseBlock[] {
  // Ce profil a répondu que transpirer n'était pas son sujet, et qu'il
  // préférait la contraction et les temps de repos (q9). Un finisher en AMRAP
  // ne lui apporte rien qu'il soit venu chercher — on lui rend le temps.
  if (ctx.profile.strengthOriented) return [];

  const policy = sessionPolicy(ctx);
  // Énergie au plus bas : on supprime le finisher plutôt que de le bâcler.
  if (!policy.withFinisher) return [];

  const pool = selectVaried(
    ctx.program.id,
    {
      categories: ["finisher"],
      levelMax: ctx.levelMax,
      location: ctx.location,
      allowUniversal: true,
      excludeHighImpact: ctx.profile.avoidsImpact,
    },
    2,
  );

  return pick(pool, 2, ctx.rng, ctx.recentIds).map((ex) => ({
    exercise_id: ex.id,
    name: ex.name,
    sets: 1,
    duration_sec: 180,
    notes: "Finisher",
    log_results: false,
  }));
}

// ─────────────────────────────────────────────
// Faire tenir la séance dans le créneau
// ─────────────────────────────────────────────

/**
 * Minutes allouées par créneau.
 *
 * Le créneau pilotait le volume sans que personne ne mesure le résultat :
 * annoncer trente minutes donnait des séances à cinquante-sept. Ces valeurs
 * sont maintenant une contrainte vérifiée, pas une intention.
 */
const BUDGET_MINUTES: Record<TimeBudget, number> = {
  short: 45,
  standard: 60,
};

/** Plancher : en dessous, ce n'est plus une séance, c'est un échauffement. */
const MIN_COMPOUNDS = 2;
const MIN_WARMUP = 2;
const MIN_SETS_UNDER_PRESSURE = 3;

export interface SessionBlocks {
  warmup: ExerciseBlock[];
  main: ExerciseBlock[];
  core: ExerciseBlock[];
  finisher: ExerciseBlock[];
}

/**
 * Budget réel d'une séance : le créneau du jour, plafonné par le temps
 * déclaré à l'onboarding. Répondre « j'ai le temps » un matin ne peut pas
 * dépasser ce qu'on a dit pouvoir y consacrer.
 */
export function sessionBudgetMinutes(ctx: BuildContext): number {
  return Math.min(BUDGET_MINUTES[ctx.timeBudget], ctx.profile.sessionMinutesMax);
}

/** Un superset dont le partenaire a disparu n'est plus un superset. */
function healSupersets(blocks: ExerciseBlock[]): ExerciseBlock[] {
  const present = new Set(blocks.map((b) => b.exercise_id));
  for (const b of blocks) {
    if (b.superset_with && !present.has(b.superset_with)) {
      delete b.superset_with;
      // Il portait un repos nul parce que la paire enchaînait : il le récupère.
      if (!b.rest_sec) b.rest_sec = 60;
    }
  }
  return blocks;
}

/**
 * Rogne la séance jusqu'à ce qu'elle tienne dans le créneau annoncé.
 *
 * L'ordre de sacrifice va du plus accessoire au plus structurant : le finisher
 * d'abord, puis le gainage, puis les isolations, puis l'échauffement, puis les
 * séries. Les compounds partent en dernier et jamais en dessous de deux — une
 * séance sans mouvement lourd n'est plus la séance demandée, elle est juste
 * plus courte.
 *
 * Le compound de tête est protégé : c'est lui qui porte le travail du jour, et
 * c'est souvent lui qui porte le barème de force.
 */
export function fitSessionToBudget(
  session: SessionBlocks,
  budgetMinutes: number,
): SessionBlocks {
  const out: SessionBlocks = {
    warmup: [...session.warmup],
    main: [...session.main],
    core: [...session.core],
    finisher: [...session.finisher],
  };
  // Chaque mesure répare d'abord les supersets orphelins.
  //
  // Retirer un mouvement peut casser une paire, et le survivant récupère alors
  // le repos qu'il n'avait pas — ce qui RALLONGE la séance. Mesurer avant la
  // réparation laissait passer des séances au-dessus du budget : elles
  // tenaient au moment du contrôle, plus après. `healSupersets` est idempotent,
  // l'appeler à chaque mesure ne coûte rien.
  const total = () => {
    healSupersets(out.main);
    return estimateMinutes([...out.warmup, ...out.main, ...out.core, ...out.finisher]);
  };

  if (total() <= budgetMinutes) return out;

  // 1. Le finisher : c'est du bonus, il saute en entier.
  out.finisher = [];
  if (total() <= budgetMinutes) return out;

  // 2. Le gainage, un exercice à la fois.
  while (out.core.length && total() > budgetMinutes) out.core.pop();
  if (total() <= budgetMinutes) return out;

  // 3. Les isolations, en partant de la fin.
  const isIsolation = (b: ExerciseBlock) => b.notes?.startsWith("Isolation");
  while (out.main.some(isIsolation) && total() > budgetMinutes) {
    const last = out.main.map(isIsolation).lastIndexOf(true);
    out.main.splice(last, 1);
  }
  if (total() <= budgetMinutes) return out;

  // 4. L'échauffement, sans descendre sous deux mouvements : arriver froid
  //    sur du lourd coûte plus cher que la séance ne rapporte.
  while (out.warmup.length > MIN_WARMUP && total() > budgetMinutes) out.warmup.pop();
  if (total() <= budgetMinutes) return out;

  // 5. Le travail de force EN TROP. Deux séries lourdes à trois minutes de
  //    repos pèsent trente-sept minutes à elles seules ; le premier mouvement
  //    porte l'intention de la séance, le second n'est qu'un bonus.
  while (out.main.filter((b) => b.protocol_label).length > 1 && total() > budgetMinutes) {
    const last = out.main.map((b) => Boolean(b.protocol_label)).lastIndexOf(true);
    out.main.splice(last, 1);
  }
  if (total() <= budgetMinutes) return out;

  // 6. Les séries des compounds, jusqu'à trois. En dessous, il ne reste plus
  //    assez de volume pour que la séance compte.
  for (const b of out.main) {
    if (total() <= budgetMinutes) break;
    if (b.protocol_label) continue; // un barème de force ne se rogne pas
    if (b.sets > MIN_SETS_UNDER_PRESSURE) b.sets = MIN_SETS_UNDER_PRESSURE;
  }
  if (total() <= budgetMinutes) return out;

  // 7. Les compounds eux-mêmes, en dernier recours, jamais sous deux.
  while (out.main.length > MIN_COMPOUNDS && total() > budgetMinutes) out.main.pop();

  return out;
}

export function findExercise(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
