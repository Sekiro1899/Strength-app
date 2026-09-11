/**
 * Métriques d'entraînement — tonnage, dépense, puissance.
 *
 * Tout le calcul vit ici, et nulle part ailleurs : c'est ce qui garantit que
 * le total affiché sur « Mes entraînements » est le même que celui qui sert à
 * l'infographie. Les écrans lisent, ils ne calculent pas.
 *
 * Trois honnêtetés à garder en tête :
 *
 *  1. Le TONNAGE est exact quand la charge est saisie. Sur un mouvement au
 *     poids de corps il repose sur le poids déclaré par le pratiquant et sur
 *     une fraction moyenne par famille de mouvement — une traction déplace
 *     tout le corps, une pompe environ les deux tiers.
 *
 *  2. Les CALORIES suivent la table des METs (Ainsworth), pas le travail
 *     mécanique. La musculation dépense l'essentiel de son énergie en
 *     contraction isométrique et en maintien postural, que le travail
 *     mécanique ne voit pas : le calculer par la physique donnerait 50 kcal
 *     pour une séance qui en coûte 400.
 *
 *  3. Les WATTS sont une ESTIMATION et doivent être présentés comme telle.
 *     La puissance dépend de l'amplitude réelle du mouvement, qui varie avec
 *     la morphologie et n'est pas en base. On utilise une amplitude moyenne
 *     par famille, et on rapporte le travail au temps d'EFFORT — pas au temps
 *     total, sans quoi allonger ses repos ferait « baisser sa puissance ».
 */

import { SECONDS_PER_REP } from "./prescription";
import type { BlockType, Exercise } from "./types";

/** Accélération de la pesanteur, m·s⁻². */
const G = 9.80665;

// ─────────────────────────────────────────────
// Ce que le corps déplace
// ─────────────────────────────────────────────

/**
 * Fraction du poids de corps que le mouvement déplace, par famille.
 *
 * La question n'est pas « cet exercice peut-il se faire sans charge » mais
 * « la masse du pratiquant monte-t-elle ». Un goblet squat demande un haltère,
 * donc `bodyweight_compatible` vaut false — et pourtant le corps monte à
 * chaque répétition. Se fier à ce drapeau donnait zéro kilo soulevé pour une
 * séance entière de squats et de fentes.
 *
 * Deux régimes, donc.
 */

/**
 * Familles où le corps monte TOUJOURS, chargé ou non : on se relève d'un
 * squat, on se hisse à une barre. La charge externe s'ajoute au corps.
 *
 * Valeurs issues de la littérature sur les appuis : au squat les segments
 * portés représentent environ 65 % de la masse totale (les pieds et les
 * jambes basses ne montent pas), à la traction le corps entier quitte le sol.
 */
const CARRIED_ALWAYS: Record<string, number> = {
  squat: 0.65,
  lunge: 0.65,
  vertical_pull: 1.0,
  dip: 1.0,
  muscle_up: 1.0,
};

/**
 * Familles où cela dépend de l'exercice. Le développé couché et la pompe
 * partagent la famille `horizontal_push` : dans un cas la barre porte la
 * charge, dans l'autre le buste. C'est là — et là seulement — que
 * `bodyweight_compatible` tranche.
 *
 * Le soulevé de terre est ici volontairement : le buste pivote, il ne
 * s'élève pas. On ne compte que la barre, comme partout ailleurs.
 */
const CARRIED_IF_BODYWEIGHT: Record<string, number> = {
  horizontal_push: 0.64, // pompe : les pieds gardent une part au sol
  horizontal_pull: 0.6, // tirage australien : le corps reste incliné
  hinge: 0.6, // nordic curl, hip thrust au poids de corps
  hip_extension: 0.45,
  calf: 0.9,
};

/** Repli pour un compound au poids de corps sans famille renseignée. */
const DEFAULT_BODYWEIGHT_FRACTION = 0.6;

/**
 * Part du poids de corps que ce mouvement déplace. 0 quand la charge est
 * entièrement externe (développé couché, curl) ou quand il n'y a rien à peser
 * (gainage, mobilité, cardio).
 */
export function bodyweightFraction(exercise: Exercise | null | undefined): number {
  if (!exercise) return 0;
  // Le gainage et le cardio ne « soulèvent » rien qu'on puisse totaliser.
  if (exercise.exercise_type === "core" || exercise.exercise_type === "cardio") {
    return 0;
  }

  const family = exercise.movement_family;
  if (family && family in CARRIED_ALWAYS) return CARRIED_ALWAYS[family];

  if (!exercise.bodyweight_compatible) return 0;
  if (family && family in CARRIED_IF_BODYWEIGHT) return CARRIED_IF_BODYWEIGHT[family];
  return exercise.exercise_type === "compound" ? DEFAULT_BODYWEIGHT_FRACTION : 0;
}

// ─────────────────────────────────────────────
// Amplitude — uniquement pour la puissance
// ─────────────────────────────────────────────

/**
 * Amplitude verticale moyenne d'une répétition, en mètres.
 *
 * Ordres de grandeur pour un adulte de taille moyenne. Sert au seul calcul de
 * puissance, jamais au tonnage : une valeur fausse ici décale les watts, elle
 * ne corrompt pas les kilos soulevés.
 */
const RANGE_OF_MOTION_M: Record<string, number> = {
  squat: 0.5,
  lunge: 0.45,
  hinge: 0.45,
  hip_extension: 0.35,
  horizontal_push: 0.4,
  vertical_push: 0.55,
  horizontal_pull: 0.45,
  vertical_pull: 0.55,
  dip: 0.45,
  muscle_up: 0.75,
  pullover: 0.5,
  elbow_flexion: 0.35,
  elbow_extension: 0.35,
  rear_delt: 0.4,
  shoulder_isolation: 0.4,
  abduction: 0.35,
  calf: 0.12,
};

const DEFAULT_RANGE_OF_MOTION_M = 0.4;

function rangeOfMotion(exercise: Exercise | null | undefined): number {
  const family = exercise?.movement_family;
  if (family && family in RANGE_OF_MOTION_M) return RANGE_OF_MOTION_M[family];
  return DEFAULT_RANGE_OF_MOTION_M;
}

// ─────────────────────────────────────────────
// Dépense énergétique
// ─────────────────────────────────────────────

/**
 * MET par densité de séance (Ainsworth Compendium, catégorie 02 « resistance
 * training »). C'est le repos entre séries qui sépare les régimes : à 60
 * secondes on est en filière métabolique, à 180 en force pure.
 */
const MET_BY_REST: { maxRest: number; met: number }[] = [
  { maxRest: 45, met: 6.0 }, // circuit, finisher
  { maxRest: 75, met: 5.0 }, // hypertrophie classique
  { maxRest: 120, met: 4.0 },
  { maxRest: Infinity, met: 3.5 }, // force, repos longs
];

function metForRest(averageRestSec: number): number {
  return MET_BY_REST.find((row) => averageRestSec <= row.maxRest)!.met;
}

/** Poids de corps retenu quand le pratiquant ne l'a pas encore renseigné. */
export const DEFAULT_BODY_WEIGHT_KG = 75;

// ─────────────────────────────────────────────
// Journal de séance
// ─────────────────────────────────────────────

/** Une série telle qu'elle a été réalisée. Miroir allégé de `session_logs`. */
export interface SetLog {
  exercise_id: string;
  block_type: BlockType;
  /** 1-indexé. Un mouvement unilatéral compte une entrée PAR CÔTÉ. */
  set_number: number;
  reps: number | null;
  /**
   * Charge EXTERNE saisie, en kg — lest de ceinture compris. Le poids de corps
   * n'y est jamais inclus : il est ajouté au calcul via `bodyweightFraction`,
   * pour rester juste même si le pratiquant change de poids entre deux mois.
   */
  load_kg: number | null;
  rest_sec_planned: number | null;
  completed: boolean;
}

/** Les séries d'une séance terminée. */
export interface SessionLog {
  session_id: string;
  /** ISO — sert au découpage par semaine. */
  completed_at: string;
  sets: SetLog[];
}

// ─────────────────────────────────────────────
// Agrégation
// ─────────────────────────────────────────────

export interface TrainingStats {
  /** Séances terminées sur la période. */
  sessions: number;
  /** Kilos cumulés : Σ répétitions × (charge + part du poids de corps). */
  tonnageKg: number;
  /** Répétitions validées, tous blocs confondus. */
  reps: number;
  /** Séries validées. */
  sets: number;
  /** Dépense estimée, en kilocalories (METs × poids × durée). */
  kcal: number;
  /** Puissance mécanique moyenne PENDANT L'EFFORT, en watts. Estimation. */
  watts: number;
  /** Temps d'effort cumulé, en minutes (hors repos). */
  effortMinutes: number;
  /** Durée totale estimée des séances, repos compris, en minutes. */
  totalMinutes: number;
}

export const EMPTY_STATS: TrainingStats = {
  sessions: 0,
  tonnageKg: 0,
  reps: 0,
  sets: 0,
  kcal: 0,
  watts: 0,
  effortMinutes: 0,
  totalMinutes: 0,
};

/** Charge totale d'UNE répétition : ce que la barre porte, plus le corps. */
export function repLoadKg(
  set: SetLog,
  exercise: Exercise | null | undefined,
  bodyWeightKg: number,
): number {
  return (set.load_kg ?? 0) + bodyweightFraction(exercise) * bodyWeightKg;
}

export function computeStats(
  logs: SessionLog[],
  exercisesById: Map<string, Exercise>,
  bodyWeightKg: number,
): TrainingStats {
  const weight = bodyWeightKg > 0 ? bodyWeightKg : DEFAULT_BODY_WEIGHT_KG;

  let tonnageKg = 0;
  let reps = 0;
  let sets = 0;
  let joules = 0;
  let effortSeconds = 0;
  let restSeconds = 0;

  for (const log of logs) {
    for (const set of log.sets) {
      if (!set.completed) continue;
      sets += 1;
      restSeconds += set.rest_sec_planned ?? 0;

      const count = set.reps ?? 0;
      if (count <= 0) continue;

      const exercise = exercisesById.get(set.exercise_id);
      const load = repLoadKg(set, exercise, weight);

      reps += count;
      tonnageKg += count * load;
      joules += count * load * G * rangeOfMotion(exercise);
      effortSeconds += count * SECONDS_PER_REP;
    }
  }

  const totalSeconds = effortSeconds + restSeconds;
  const totalMinutes = totalSeconds / 60;
  const averageRest = sets > 0 ? restSeconds / sets : 0;
  // MET × 3,5 ml·kg⁻¹·min⁻¹ × poids / 200 = kcal·min⁻¹ (formule ACSM).
  const kcal = (metForRest(averageRest) * 3.5 * weight * totalMinutes) / 200;

  return {
    sessions: logs.length,
    tonnageKg,
    reps,
    sets,
    kcal,
    watts: effortSeconds > 0 ? joules / effortSeconds : 0,
    effortMinutes: effortSeconds / 60,
    totalMinutes,
  };
}

// ─────────────────────────────────────────────
// Découpage temporel
// ─────────────────────────────────────────────

/** Lundi 00:00 de la semaine contenant `now`. La semaine française. */
export function startOfWeek(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  // getDay() : 0 = dimanche. On veut 6 jours de recul le dimanche, 0 le lundi.
  const shift = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - shift);
  return d;
}

/** Les séances de la semaine en cours, lundi → dimanche. */
export function logsThisWeek(logs: SessionLog[], now: Date): SessionLog[] {
  const from = startOfWeek(now).getTime();
  return logs.filter((l) => new Date(l.completed_at).getTime() >= from);
}

// ─────────────────────────────────────────────
// Découpage pour les graphiques
// ─────────────────────────────────────────────

/** Horizon d'observation choisi par le pratiquant. */
export type Horizon = "week" | "program" | "all";

export const HORIZONS: { key: Horizon; label: string; hint: string }[] = [
  { key: "week", label: "Cette semaine", hint: "Lundi → dimanche" },
  { key: "program", label: "Ce programme", hint: "Depuis le début du cycle" },
  { key: "all", label: "Depuis le début", hint: "Tout l'historique" },
];

/** Début de la période, ou null quand elle n'a pas de borne. */
export function horizonStart(
  horizon: Horizon,
  now: Date,
  programStart: string | null,
): Date | null {
  if (horizon === "week") return startOfWeek(now);
  if (horizon === "program" && programStart) return new Date(`${programStart}T00:00:00`);
  return null;
}

export function logsInHorizon(
  logs: SessionLog[],
  horizon: Horizon,
  now: Date,
  programStart: string | null,
): SessionLog[] {
  const from = horizonStart(horizon, now, programStart);
  if (!from) return logs;
  const t = from.getTime();
  return logs.filter((l) => new Date(l.completed_at).getTime() >= t);
}

/** Une colonne du graphique de volume. */
export interface Bucket {
  /** Étiquette courte sous la barre : « lun », « S12 ». */
  label: string;
  /** Étiquette longue, affichée à la sélection. */
  full: string;
  tonnageKg: number;
  sessions: number;
}

const DAY_MS = 86_400_000;
const DAY_LABELS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

/**
 * Répartit le tonnage dans le temps.
 *
 * Par JOUR sur une semaine — sept colonnes, dont les creux se lisent. Par
 * SEMAINE au-delà : quatre-vingt-dix colonnes d'un jour chacune ne dessinent
 * rien qu'un bruit.
 */
export function bucketTonnage(
  logs: SessionLog[],
  exercisesById: Map<string, Exercise>,
  bodyWeightKg: number,
  horizon: Horizon,
  now: Date,
  programStart: string | null,
): Bucket[] {
  const weight = bodyWeightKg > 0 ? bodyWeightKg : DEFAULT_BODY_WEIGHT_KG;

  if (horizon === "week") {
    const monday = startOfWeek(now);
    return DAY_LABELS.map((label, i) => {
      const from = monday.getTime() + i * DAY_MS;
      const dayLogs = logs.filter((l) => {
        const t = new Date(l.completed_at).getTime();
        return t >= from && t < from + DAY_MS;
      });
      const date = new Date(from);
      return {
        label,
        full: date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" }),
        tonnageKg: computeStats(dayLogs, exercisesById, weight).tonnageKg,
        sessions: dayLogs.length,
      };
    });
  }

  // Regroupement par semaine calendaire, de la plus ancienne à la plus récente.
  const byWeek = new Map<number, SessionLog[]>();
  for (const log of logs) {
    const key = startOfWeek(new Date(log.completed_at)).getTime();
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(log);
  }
  const keys = [...byWeek.keys()].sort((a, b) => a - b);
  return keys.map((key, i) => {
    const date = new Date(key);
    return {
      label: `S${i + 1}`,
      full: `Semaine du ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`,
      tonnageKg: computeStats(byWeek.get(key)!, exercisesById, weight).tonnageKg,
      sessions: byWeek.get(key)!.length,
    };
  });
}

/**
 * Familles de travail, dans l'ordre fixe de la palette.
 *
 * Volontairement cinq : c'est ce que la palette garantit comme distinguable,
 * y compris en vision daltonienne. Les catégories restantes (explosif,
 * complexes, conditionnement) tombent dans « Gainage & circuits » plutôt que
 * de créer une sixième couleur que personne ne pourrait séparer des autres.
 */
export const WORK_GROUPS = [
  { key: "push", label: "Poussée" },
  { key: "pull", label: "Tirage" },
  { key: "legs", label: "Jambes" },
  { key: "arms", label: "Bras" },
  { key: "other", label: "Gainage & circuits" },
] as const;

export type WorkGroup = (typeof WORK_GROUPS)[number]["key"];

function workGroup(exercise: Exercise | undefined): WorkGroup {
  switch (exercise?.category) {
    case "push":
      return "push";
    case "pull":
      return "pull";
    case "legs":
      return "legs";
    case "arms":
      return "arms";
    default:
      return "other";
  }
}

export interface GroupShare {
  key: WorkGroup;
  label: string;
  tonnageKg: number;
  /** Part du total, entre 0 et 1. */
  share: number;
}

/** Répartition du tonnage par famille de travail, ordre de palette conservé. */
export function tonnageByGroup(
  logs: SessionLog[],
  exercisesById: Map<string, Exercise>,
  bodyWeightKg: number,
): GroupShare[] {
  const weight = bodyWeightKg > 0 ? bodyWeightKg : DEFAULT_BODY_WEIGHT_KG;
  const totals = new Map<WorkGroup, number>(WORK_GROUPS.map((g) => [g.key, 0]));

  for (const log of logs) {
    for (const set of log.sets) {
      if (!set.completed) continue;
      const count = set.reps ?? 0;
      if (count <= 0) continue;
      const exercise = exercisesById.get(set.exercise_id);
      const key = workGroup(exercise);
      totals.set(key, totals.get(key)! + count * repLoadKg(set, exercise, weight));
    }
  }

  const total = [...totals.values()].reduce((a, b) => a + b, 0);
  return WORK_GROUPS.map((g) => ({
    key: g.key,
    label: g.label,
    tonnageKg: totals.get(g.key)!,
    share: total > 0 ? totals.get(g.key)! / total : 0,
  }));
}

// ─────────────────────────────────────────────
// Infographie — rendre un nombre abstrait palpable
// ─────────────────────────────────────────────

/**
 * Objets de référence, du plus léger au plus lourd.
 *
 * On choisit celui qui donne un compte lisible : « 3 pianos » parle, « 0,004
 * Boeing » ne parle pas, et « 1 240 sacs de ciment » non plus. La règle est de
 * viser entre 1 et 40 unités, et de prendre l'objet le plus lourd qui tient
 * dans cette fourchette — c'est celui qui impressionne le plus honnêtement.
 */
const LANDMARKS: {
  kg: number;
  /** Forme avec article : « un piano à queue », « la Tour Eiffel ». */
  one: string;
  /** Nom nu au singulier — s'emploie sous 2 : « 1,3 piano à queue ». */
  noun: string;
  /** Nom nu au pluriel. */
  many: string;
  emoji: string;
}[] = [
  { kg: 20, one: "un pack d'eau", noun: "pack d'eau", many: "packs d'eau", emoji: "💧" },
  { kg: 35, one: "un sac de ciment", noun: "sac de ciment", many: "sacs de ciment", emoji: "🧱" },
  { kg: 70, one: "une machine à laver", noun: "machine à laver", many: "machines à laver", emoji: "🌀" },
  { kg: 130, one: "un réfrigérateur", noun: "réfrigérateur", many: "réfrigérateurs", emoji: "🧊" },
  { kg: 250, one: "une moto", noun: "moto", many: "motos", emoji: "🏍️" },
  { kg: 400, one: "un piano à queue", noun: "piano à queue", many: "pianos à queue", emoji: "🎹" },
  { kg: 600, one: "un cheval de trait", noun: "cheval de trait", many: "chevaux de trait", emoji: "🐴" },
  { kg: 750, one: "une vache", noun: "vache", many: "vaches", emoji: "🐄" },
  { kg: 1200, one: "une citadine", noun: "citadine", many: "citadines", emoji: "🚗" },
  { kg: 2500, one: "un tout-terrain", noun: "tout-terrain", many: "tout-terrains", emoji: "🚙" },
  { kg: 6000, one: "un éléphant d'Afrique", noun: "éléphant d'Afrique", many: "éléphants d'Afrique", emoji: "🐘" },
  { kg: 12000, one: "un bus", noun: "bus", many: "bus", emoji: "🚌" },
  { kg: 41000, one: "un Boeing 737", noun: "Boeing 737", many: "Boeing 737", emoji: "✈️" },
  { kg: 120000, one: "une locomotive", noun: "locomotive", many: "locomotives", emoji: "🚂" },
  { kg: 225000, one: "la Statue de la Liberté", noun: "Statue de la Liberté", many: "Statues de la Liberté", emoji: "🗽" },
  { kg: 575000, one: "un Airbus A380", noun: "Airbus A380", many: "Airbus A380", emoji: "🛫" },
  { kg: 7300000, one: "la Tour Eiffel", noun: "Tour Eiffel", many: "Tours Eiffel", emoji: "🗼" },
];

/**
 * Au-delà, le compte cesse d'être parlant : « 1 240 sacs de ciment » ne dit
 * rien de plus que le nombre de kilos qu'il traduit.
 */
const LANDMARK_MAX_COUNT = 40;

export interface Landmark {
  /** Nombre d'unités — une décimale sous 10, entier au-delà. */
  count: number;
  /** Nom accordé au compte : « éléphants d'Afrique ». Sans article. */
  label: string;
  emoji: string;
  /** Phrase prête à afficher, article et accord compris. */
  sentence: string;
}

/**
 * Traduit un tonnage en objets du monde réel.
 *
 * Retourne null sous le plus petit repère : annoncer « 0,3 pack d'eau » à
 * quelqu'un qui vient de faire sa première séance, c'est se moquer de lui.
 */
export function tonnageLandmark(tonnageKg: number): Landmark | null {
  if (tonnageKg < LANDMARKS[0].kg) return null;

  // Le repère le plus LOURD qui reste sous le plafond de lisibilité : c'est
  // celui qui impressionne le plus, sans exagérer d'un gramme.
  const pick =
    [...LANDMARKS]
      .reverse()
      .find((l) => tonnageKg / l.kg >= 1 && tonnageKg / l.kg <= LANDMARK_MAX_COUNT) ??
    LANDMARKS[LANDMARKS.length - 1];

  const raw = tonnageKg / pick.kg;
  const count = raw < 10 ? Math.round(raw * 10) / 10 : Math.round(raw);
  // En français le nom reste au singulier sous 2 : « 1,3 piano », « 2 pianos ».
  const label = count >= 2 ? pick.many : pick.noun;

  return {
    count,
    label,
    emoji: pick.emoji,
    sentence:
      count === 1
        ? `Tu as soulevé l'équivalent ${liaison(pick.one)}.`
        : `Tu as soulevé l'équivalent de ${formatCount(count)} ${label}.`,
  };
}

/** « de » + « un piano » = « d'un piano ». « de » + « la Tour » ne s'élide pas. */
function liaison(withArticle: string): string {
  return withArticle.startsWith("un") ? `d'${withArticle}` : `de ${withArticle}`;
}

function formatCount(count: number): string {
  return Number.isInteger(count)
    ? String(count)
    : count.toFixed(1).replace(".", ",");
}

/** « 12,4 t » au-delà de la tonne, « 840 kg » en dessous. */
export function formatTonnage(kg: number): string {
  if (kg >= 1000) {
    const tonnes = kg / 1000;
    return `${tonnes >= 100 ? Math.round(tonnes) : tonnes.toFixed(1).replace(".", ",")} t`;
  }
  return `${Math.round(kg)} kg`;
}

/** Coefficients de calcul, exposés au référentiel de l'admin. */
export const METRICS_TUNING = {
  carriedAlways: CARRIED_ALWAYS,
  carriedIfBodyweight: CARRIED_IF_BODYWEIGHT,
  defaultBodyweightFraction: DEFAULT_BODYWEIGHT_FRACTION,
  rangeOfMotionM: RANGE_OF_MOTION_M,
  metByRest: MET_BY_REST,
  defaultBodyWeightKg: DEFAULT_BODY_WEIGHT_KG,
  secondsPerRep: SECONDS_PER_REP,
} as const;

// ─────────────────────────────────────────────
// Équivalents alimentaires
// ─────────────────────────────────────────────

/**
 * Ce que la dépense représente dans l'assiette.
 *
 * Les valeurs sont des portions courantes, pas des chiffres de laboratoire —
 * une pizza margherita entière tourne autour de 900 kcal, un burger simple
 * autour de 500. L'ordre va du plus léger au plus lourd, même règle de choix
 * que pour le tonnage : le repère le plus consistant qui reste lisible.
 */
const FOOD_LANDMARKS: { kcal: number; one: string; noun: string; many: string; emoji: string }[] = [
  { kcal: 50, one: "un carré de chocolat", noun: "carré de chocolat", many: "carrés de chocolat", emoji: "🍫" },
  { kcal: 90, one: "une banane", noun: "banane", many: "bananes", emoji: "🍌" },
  { kcal: 150, one: "une bière", noun: "bière", many: "bières", emoji: "🍺" },
  { kcal: 250, one: "un croissant", noun: "croissant", many: "croissants", emoji: "🥐" },
  { kcal: 300, one: "une part de pizza", noun: "part de pizza", many: "parts de pizza", emoji: "🍕" },
  { kcal: 500, one: "un burger", noun: "burger", many: "burgers", emoji: "🍔" },
  { kcal: 900, one: "une pizza entière", noun: "pizza entière", many: "pizzas entières", emoji: "🍕" },
];

const FOOD_MAX_COUNT = 30;

/** Même forme que `Landmark`, pour que l'écran traite les deux pareil. */
export function caloriesLandmark(kcal: number): Landmark | null {
  if (kcal < FOOD_LANDMARKS[0].kcal) return null;

  const pick =
    [...FOOD_LANDMARKS]
      .reverse()
      .find((l) => kcal / l.kcal >= 1 && kcal / l.kcal <= FOOD_MAX_COUNT) ??
    FOOD_LANDMARKS[FOOD_LANDMARKS.length - 1];

  const raw = kcal / pick.kcal;
  const count = raw < 10 ? Math.round(raw * 10) / 10 : Math.round(raw);
  const label = count >= 2 ? pick.many : pick.noun;

  return {
    count,
    label,
    emoji: pick.emoji,
    sentence:
      count === 1
        ? `Tu as brûlé l'équivalent ${liaison(pick.one)}.`
        : `Tu as brûlé l'équivalent de ${formatCount(count)} ${label}.`,
  };
}
