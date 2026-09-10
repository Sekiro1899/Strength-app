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
}

const LEVEL_BY_ANSWER: Record<string, ExerciseLevel> = {
  beginner: "debutant",
  intermediate: "intermediaire",
  advanced: "avance",
};

const AGE_BANDS: AgeBand[] = ["18_25", "26_45", "45_60", "60_plus"];

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
};

export function profileFromAnswers(
  answers: Record<string, string | string[]> | null | undefined,
): Profile {
  const rawLevel = answer(answers, "q7");
  const rawAge = answer(answers, "q1");

  const level = (rawLevel && LEVEL_BY_ANSWER[rawLevel]) || DEFAULT_PROFILE.level;
  const ageBand = AGE_BANDS.includes(rawAge as AgeBand) ? (rawAge as AgeBand) : null;

  return {
    level,
    ageBand,
    // Un débutant apprend le mouvement ; après 60 ans, l'entrée en charge se
    // fait plus progressivement. Dans les deux cas la régression a sa place.
    allowRegressions: level === "debutant" || ageBand === "60_plus",
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
