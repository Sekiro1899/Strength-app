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
import type { Profile } from "./profile";
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
    second.rest_sec = first.rest_sec;
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
  phase: ProgramPhase | null;
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

function resolveLoadPct(phase: ProgramPhase | null, program: Program): number {
  return phase?.load_pct_1rm ?? program.rep_range_min ?? 65;
}

// ─────────────────────────────────────────────
// Blocs
// ─────────────────────────────────────────────

export function buildWarmup(ctx: BuildContext): ExerciseBlock[] {
  const policy = volumeForEnergy(ctx.energy);

  let pool = selectExercises(ctx.program.id, {
    warmupPool: true,
    warmupTargets: FOCUS_WARMUP_TARGET_MAP[ctx.focus] ?? ["all"],
    location: ctx.location,
    allowUniversal: true,
  });
  if (pool.length < policy.warmup) {
    pool = selectExercises(ctx.program.id, {
      warmupPool: true,
      location: ctx.location,
      allowUniversal: true,
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
  const policy = volumeForEnergy(ctx.energy);
  const count = volumeForEnergy(ctx.energy).compounds + volumeForEnergy(ctx.energy).isolations;
  const pool = selectVaried(
    ctx.program.id,
    { categories: CIRCUIT_CATEGORIES, levelMax: ctx.levelMax, location: ctx.location },
    count,
  );

  const reps = Math.round(
    ((ctx.phase?.rep_range_min ?? 8) + (ctx.phase?.rep_range_max ?? 10)) / 2,
  );
  const rest = ctx.phase?.rest_sec_min ?? 60;
  const load = Math.max(resolveLoadPct(ctx.phase, ctx.program) + policy.loadDelta, 40);
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
      rest_sec: rest,
      notes: imposed ? "Circuit — format imposé" : `Circuit — tour ${i + 1}`,
      log_results: true,
    };
  });
}

export function buildMain(ctx: BuildContext): ExerciseBlock[] {
  if (ctx.program.session_structure === "circuit") return buildCircuitMain(ctx);

  const policy = volumeForEnergy(ctx.energy);
  const categories = FOCUS_CATEGORY_MAP[ctx.focus] ?? ["push", "pull", "legs"];
  const bodyweightOnly = ctx.program.id === "program_bodyweight";

  const setsCompounds = Math.max(2, (ctx.phase?.sets_compounds ?? 4) + policy.setsDelta);
  const setsIsolation = Math.max(2, (ctx.phase?.sets_isolation ?? 3) + policy.setsDelta);
  const repMin = ctx.phase?.rep_range_min ?? ctx.program.rep_range_min ?? 8;
  const repMax = ctx.phase?.rep_range_max ?? ctx.program.rep_range_max ?? 12;
  const rest = ctx.phase?.rest_sec_min ?? 90;
  const load = Math.min(
    Math.max(resolveLoadPct(ctx.phase, ctx.program) + policy.loadDelta, 40),
    100,
  );

  const base = {
    levelMax: ctx.levelMax,
    location: ctx.location,
    // Une variante allégée n'a sa place dans le bloc principal que chez un
    // débutant ou un pratiquant âgé. Pour les autres : goblet squat ou barre.
    excludeRegressions: !ctx.profile.allowRegressions,
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
  const compoundSets = compensate(compoundFit.sets, compoundFit.count, compounds.length);
  const isolationSets = compensate(isolationFit.sets, isolationFit.count, isolations.length);

  // Une prescription centrée sur 11 se lit mal : on rend la plage dont 11 est
  // le milieu. Une phase qui impose un nombre sec (5x5) n'est pas élargie.
  const spread = repMax > repMin ? 1 : 0;
  const mid = Math.round((repMin + repMax) / 2);
  const reps = Math.max(repMin, mid - spread);
  const repsMax = spread ? Math.min(repMax, mid + spread) : undefined;
  const isoMid = Math.min(mid + 2, repMax + 2);
  const isoReps = isoMid - spread;
  const isoRepsMax = spread ? isoMid + spread : undefined;

  const range = (lo: number, hi?: number) => (hi && hi !== lo ? `${lo}-${hi}` : `${lo}`);

  const compoundBlocks: ExerciseBlock[] = compounds.map((ex) => ({
    exercise_id: ex.id,
    name: ex.name,
    sets: compoundSets,
    reps,
    ...(repsMax ? { reps_max: repsMax } : {}),
    ...(bodyweightOnly ? {} : { load_pct_1rm: load }),
    rest_sec: rest,
    notes: `Compound — ${compoundSets}x${range(reps, repsMax)}`,
    // Seuls les compounds portent la progression : c'est là que la charge se
    // suit d'une séance à l'autre.
    log_results: true,
  }));

  const isolationBlocks: ExerciseBlock[] = isolations.map((ex) => ({
    exercise_id: ex.id,
    name: ex.name,
    sets: isolationSets,
    reps: isoReps,
    ...(isoRepsMax ? { reps_max: isoRepsMax } : {}),
    ...(bodyweightOnly ? {} : { load_pct_1rm: Math.max(load - 10, 40) }),
    rest_sec: Math.max(rest - 15, 30),
    notes: `Isolation — ${isolationSets}x${range(isoReps, isoRepsMax)}`,
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
  const policy = volumeForEnergy(ctx.energy);

  const pool = selectVaried(
    ctx.program.id,
    {
      exerciseTypes: ["core"],
      levelMax: ctx.levelMax,
      location: ctx.location,
      excludeRegressions: !ctx.profile.allowRegressions,
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
      rest_sec: 45,
      notes: isEndurance ? "Gainage" : "Core — force",
      log_results: true,
    };
  });
}

export function buildFinisher(ctx: BuildContext): ExerciseBlock[] {
  const policy = volumeForEnergy(ctx.energy);
  // Énergie au plus bas : on supprime le finisher plutôt que de le bâcler.
  if (!policy.withFinisher) return [];

  const pool = selectVaried(
    ctx.program.id,
    {
      categories: ["finisher"],
      levelMax: ctx.levelMax,
      location: ctx.location,
      allowUniversal: true,
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

export function findExercise(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
