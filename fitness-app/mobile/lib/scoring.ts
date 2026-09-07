/**
 * Scoring persona — fonction pure, sans I/O.
 *
 * Référence : docs/data/04_questionnaire_initial.json → scoring_algorithm
 *   - méthode  : additive, result = argmax
 *   - tiebreak : CR > SMB > AW > BF > SAV (sécurité débutant)
 *
 * Isolé ici pour être testable et réutilisable par le mode démo comme par le
 * mode live — les deux DOIVENT produire le même persona pour les mêmes réponses.
 */

import type {
  Persona,
  PersonaCode,
  PersonaProgramEligibility,
  PersonaScores,
  QuestionnaireOption,
  ScoringResult,
} from "./types";

/**
 * Ordre de départage. L'argmax parcourt ce tableau, donc le premier code
 * atteignant le score max l'emporte — CR gagne les égalités, SAV les perd.
 */
export const TIEBREAK_ORDER: PersonaCode[] = ["CR", "SMB", "AW", "BF", "SAV"];

export const PERSONA_CODE_TO_ID: Record<PersonaCode, string> = {
  SMB: "persona_smb",
  BF: "persona_bf",
  AW: "persona_aw",
  CR: "persona_cr",
  SAV: "persona_sav",
};

const ZERO_SCORES: PersonaScores = { SMB: 0, BF: 0, AW: 0, CR: 0, SAV: 0 };

/**
 * Somme les scores de toutes les options sélectionnées, puis argmax.
 *
 * @param answers  { question_id: value | value[] } — multiple_choice donne un tableau
 * @param options  toutes les questionnaire_options (non filtrées)
 */
export function scoreAnswers(
  answers: Record<string, string | string[]>,
  options: QuestionnaireOption[],
): ScoringResult {
  const scores: PersonaScores = { ...ZERO_SCORES };

  for (const [questionId, answer] of Object.entries(answers)) {
    const values = Array.isArray(answer) ? answer : [answer];
    for (const value of values) {
      const option = options.find(
        (o) => o.question_id === questionId && o.value === value,
      );
      if (!option) continue;
      scores.SMB += option.score_smb ?? 0;
      scores.BF += option.score_bf ?? 0;
      scores.AW += option.score_aw ?? 0;
      scores.CR += option.score_cr ?? 0;
      scores.SAV += option.score_sav ?? 0;
    }
  }

  const max = Math.max(...TIEBREAK_ORDER.map((code) => scores[code]));
  const atMax = TIEBREAK_ORDER.filter((code) => scores[code] === max);

  return { winner: atMax[0], scores, tied: atMax.length > 1 };
}

/**
 * Applique la règle d'exclusivité d'une question multiple_choice.
 *
 * Cas concret : q8 option "flexible" (is_exclusive) ne peut pas être combinée
 * avec gym/outdoor/home. Cocher l'exclusive vide le reste ; cocher une autre
 * retire l'exclusive.
 */
export function toggleMultiChoice(
  current: string[],
  value: string,
  questionOptions: QuestionnaireOption[],
): string[] {
  const picked = questionOptions.find((o) => o.value === value);

  if (current.includes(value)) {
    return current.filter((v) => v !== value);
  }

  if (picked?.is_exclusive) {
    return [value];
  }

  const exclusiveValues = new Set(
    questionOptions.filter((o) => o.is_exclusive).map((o) => o.value),
  );
  return [...current.filter((v) => !exclusiveValues.has(v)), value];
}

/**
 * Résout le programme à assigner pour un persona.
 *
 * SAV a `primary_program_id: null` en seed (il fonctionne en rotation
 * hebdomadaire sur les 5 programmes). Comme `user_programs.program_id` est
 * NOT NULL, on retombe sur la matrice d'éligibilité triée par rank_order —
 * qui donne program_strength (rank_order 1, lundi) comme point d'entrée.
 *
 * @returns l'id du programme, ou null si rien n'est résolvable
 */
export function resolveProgramId(
  persona: Pick<Persona, "id" | "primary_program_id" | "secondary_program_id">,
  eligibility: PersonaProgramEligibility[],
): string | null {
  if (persona.primary_program_id) return persona.primary_program_id;

  const ranked = eligibility
    .filter(
      (e) =>
        e.persona_id === persona.id && e.eligibility_rank === "primary",
    )
    .sort((a, b) => (a.rank_order ?? 99) - (b.rank_order ?? 99));

  if (ranked.length > 0) return ranked[0].program_id;

  return persona.secondary_program_id ?? null;
}

/**
 * Streak calendaire : jours consécutifs avec au moins une séance complétée.
 * Repart de zéro si la dernière séance n'est ni aujourd'hui ni hier.
 */
export function computeStreak(
  completedAt: (string | null | undefined)[],
  now: Date,
): number {
  const DAY_MS = 86_400_000;
  const toDay = (d: Date) => d.toISOString().slice(0, 10);

  const days = [
    ...new Set(
      completedAt
        .filter((d): d is string => Boolean(d))
        .map((d) => toDay(new Date(d))),
    ),
  ].sort((a, b) => b.localeCompare(a));

  if (days.length === 0) return 0;

  const today = toDay(now);
  const yesterday = toDay(new Date(now.getTime() - DAY_MS));
  if (days[0] !== today && days[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const gap = Date.parse(days[i - 1]) - Date.parse(days[i]);
    if (gap === DAY_MS) streak++;
    else break;
  }
  return streak;
}
