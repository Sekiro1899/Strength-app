/**
 * Profil du pratiquant — dérivé de ses réponses au questionnaire.
 *
 * Le moteur déduisait jusqu'ici le niveau du PERSONA, qui est un profil de
 * motivation, pas d'expérience : deux personnes très différentes tombant sur
 * le même persona recevaient exactement le même plafond d'exercices. Le niveau
 * (q7) et l'âge (q1) sont pourtant demandés dès l'onboarding — ce module les
 * lit et en fait des contraintes de sélection.
 */

import type { AppUser, ExerciseLevel } from "./types";

/** Tranches d'âge du questionnaire (q1). */
export type AgeBand = "18_25" | "26_45" | "45_60" | "60_plus";

/** Objectif principal déclaré (q3). */
export type Objective =
  | "aesthetics"
  | "strength"
  | "performance"
  | "efficiency"
  | "complete_athlete";

/**
 * Rapport à l'intensité (q9) — « quand tu penses à transpirer, tu te dis… ».
 * `prefers_strength_style` est la réponse « pas vraiment mon truc, je préfère
 * la contraction pure et les temps de repos ».
 */
export type IntensityStyle =
  | "loves_intensity"
  | "accepts_intensity"
  | "prefers_strength_style";

export interface Profile {
  /** Plafond de difficulté des exercices proposés. */
  level: ExerciseLevel;
  ageBand: AgeBand | null;
  /**
   * Les régressions (Air Squat, pompes sur genoux, bench dips) ont leur place
   * dans le bloc principal d'un débutant ou d'un pratiquant âgé : elles
   * enseignent le mouvement. Pour les autres, elles ne chargent pas assez —
   * on leur préfère un goblet squat ou une barre.
   */
  allowRegressions: boolean;
  objective: Objective | null;
  intensityStyle: IntensityStyle | null;
  /**
   * Vient chercher de la charge et de la masse, pas de la sueur.
   *
   * Deux réponses le disent ensemble : un objectif de musculation (esthétique
   * ou force pure) et un refus de l'intensité cardio. À ce profil, un finisher
   * en AMRAP n'apporte rien qu'il ait demandé — et un programme de force
   * classique lui parle bien davantage qu'un tirage.
   */
  strengthOriented: boolean;
  /**
   * Ne veut pas de finisher cardio. Réponse q9 seule.
   *
   * C'était jusqu'ici un effet de bord de `strengthOriented`, qui exige AUSSI
   * un objectif de musculation : quelqu'un visant la performance et ayant
   * pourtant répondu « transpirer, pas vraiment mon truc » recevait quand même
   * un AMRAP en fin de séance. Le questionnaire doit primer — c'est la réponse
   * qui décide, pas la case dans laquelle on l'a rangé.
   */
  avoidsFinisher: boolean;
  /**
   * Temps annoncé à l'onboarding pour UNE séance (q5), en minutes.
   *
   * Plafond du cycle, distinct du créneau du jour : répondre « j'ai le temps »
   * un matin ne peut pas dépasser ce qu'on a déclaré pouvoir y consacrer.
   */
  sessionMinutesMax: number;
  /**
   * Articulations à ménager : pas de sauts ni de mouvements balistiques.
   *
   * Deux cas. Après 60 ans, l'impact répété ne se récupère plus de la même
   * façon. Et un débutant — ou quelqu'un qui reprend — après 45 ans n'a pas
   * encore les tendons pour amortir des sauts : il lui manque les mois de
   * pratique qui les préparent, pas la volonté.
   */
  avoidsImpact: boolean;
  /**
   * Séances par semaine que le pratiquant se dit prêt à tenir (q6).
   *
   * C'est le volume HEBDOMADAIRE qui compte, pas celui d'une séance : à cinq
   * séances par semaine, chacune doit peser moins qu'à trois, sans quoi la
   * charge cumulée ne se récupère pas. La durée du cycle s'ajuste aussi —
   * voir `cycleWeeks` dans lib/plan.
   */
  sessionsPerWeek: number;
  /**
   * Entrée en charge à ménager : débutant, ou passé 45 ans.
   *
   * Distinct de `avoidsImpact`, qui ne parle que des sauts. Ici c'est la
   * RÉCUPÉRATION qui est en jeu : ces profils encaissent moins bien la
   * répétition, pas un mouvement en particulier. Quatre séances par semaine ne
   * leur sont pas refusées — mais chacune pèse moins.
   */
  needsGentleProgression: boolean;
}

const LEVEL_BY_ANSWER: Record<string, ExerciseLevel> = {
  beginner: "debutant",
  intermediate: "intermediaire",
  advanced: "avance",
};

const AGE_BANDS: AgeBand[] = ["18_25", "26_45", "45_60", "60_plus"];

const OBJECTIVES: Objective[] = [
  "aesthetics",
  "strength",
  "performance",
  "efficiency",
  "complete_athlete",
];

/**
 * Temps par séance déclaré à l'onboarding (q5) — miroir de
 * `maps_to_duration_max` sur les options du questionnaire.
 */
const SESSION_MINUTES: Record<string, number> = {
  under_45min: 45,
  "60min": 60,
  unlimited: 120,
};

const DEFAULT_SESSION_MINUTES = 60;

/**
 * Séances par semaine (q6) — la borne HAUTE de la réponse : c'est le rythme
 * que le pratiquant se dit prêt à tenir, donc celui qu'il faut planifier.
 */
const SESSIONS_PER_WEEK: Record<string, number> = {
  "1_2_sessions": 2,
  "3_4_sessions": 4,
  "5_plus_sessions": 5,
};

const DEFAULT_SESSIONS_PER_WEEK = 3;

/** Tranches d'âge où l'impact ne se récupère plus comme à vingt ans. */
const SENIOR_BANDS: AgeBand[] = ["45_60", "60_plus"];

const INTENSITY_STYLES: IntensityStyle[] = [
  "loves_intensity",
  "accepts_intensity",
  "prefers_strength_style",
];

function answer(
  answers: Record<string, string | string[]> | null | undefined,
  key: string,
): string | null {
  const value = answers?.[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

/** Profil par défaut, quand le questionnaire n'a pas encore été rempli. */
export const DEFAULT_PROFILE: Profile = {
  level: "intermediaire",
  ageBand: null,
  allowRegressions: false,
  objective: null,
  intensityStyle: null,
  strengthOriented: false,
  avoidsFinisher: false,
  sessionMinutesMax: DEFAULT_SESSION_MINUTES,
  avoidsImpact: false,
  sessionsPerWeek: DEFAULT_SESSIONS_PER_WEEK,
  needsGentleProgression: false,
};

export function profileFromAnswers(
  answers: Record<string, string | string[]> | null | undefined,
): Profile {
  const rawLevel = answer(answers, "q7");
  const rawAge = answer(answers, "q1");
  const rawObjective = answer(answers, "q3");
  const rawIntensity = answer(answers, "q9");
  const rawSessionTime = answer(answers, "q5");
  const rawFrequency = answer(answers, "q6");

  const level = (rawLevel && LEVEL_BY_ANSWER[rawLevel]) || DEFAULT_PROFILE.level;
  const ageBand = AGE_BANDS.includes(rawAge as AgeBand) ? (rawAge as AgeBand) : null;
  const objective = OBJECTIVES.includes(rawObjective as Objective)
    ? (rawObjective as Objective)
    : null;
  const intensityStyle = INTENSITY_STYLES.includes(rawIntensity as IntensityStyle)
    ? (rawIntensity as IntensityStyle)
    : null;

  return {
    level,
    ageBand,
    // Un débutant apprend le mouvement ; après 60 ans, l'entrée en charge se
    // fait plus progressivement. Dans les deux cas la régression a sa place.
    allowRegressions: level === "debutant" || ageBand === "60_plus",
    objective,
    intensityStyle,
    strengthOriented:
      (objective === "aesthetics" || objective === "strength") &&
      intensityStyle === "prefers_strength_style",
    avoidsFinisher: intensityStyle === "prefers_strength_style",
    sessionMinutesMax:
      SESSION_MINUTES[rawSessionTime ?? ""] ?? DEFAULT_SESSION_MINUTES,
    avoidsImpact:
      ageBand === "60_plus" ||
      (level === "debutant" && SENIOR_BANDS.includes(ageBand as AgeBand)),
    sessionsPerWeek:
      SESSIONS_PER_WEEK[rawFrequency ?? ""] ?? DEFAULT_SESSIONS_PER_WEEK,
    needsGentleProgression:
      level === "debutant" || SENIOR_BANDS.includes(ageBand as AgeBand),
  };
}

export function profileFromUser(user: AppUser | null | undefined): Profile {
  return profileFromAnswers(user?.questionnaire_answers);
}

/** Libellés d'affichage — écran profil. */
export const LEVEL_LABELS: Record<ExerciseLevel, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

export const AGE_LABELS: Record<AgeBand, string> = {
  "18_25": "18-25 ans",
  "26_45": "26-45 ans",
  "45_60": "45-60 ans",
  "60_plus": "60 ans et plus",
};

/** Correspondances du questionnaire, exposées au référentiel de l'admin. */
export const PROFILE_TUNING = {
  sessionMinutes: SESSION_MINUTES,
  sessionsPerWeek: SESSIONS_PER_WEEK,
  seniorBands: SENIOR_BANDS,
  defaultSessionMinutes: DEFAULT_SESSION_MINUTES,
  defaultSessionsPerWeek: DEFAULT_SESSIONS_PER_WEEK,
} as const;
