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
};

export function profileFromAnswers(
  answers: Record<string, string | string[]> | null | undefined,
): Profile {
  const rawLevel = answer(answers, "q7");
  const rawAge = answer(answers, "q1");
  const rawObjective = answer(answers, "q3");
  const rawIntensity = answer(answers, "q9");

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
