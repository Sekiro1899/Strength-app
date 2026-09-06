/**
 * Miroir EXACT de backend/engine/generator.py.
 *
 * Le dashboard prévisualise la prochaine séance sans appeler l'API. Ce fichier
 * doit donc rester synchronisé avec le moteur, sinon l'aperçu et la séance
 * réellement générée divergent.
 *
 * Référence : PROTOCOL_SCHEDULE, _resolve_focus, _build_session_label.
 */

import type { Focus, Protocol } from "./types";

/**
 * generator.py::PROTOCOL_SCHEDULE — copié à l'identique.
 * Note : la clé est "push_pull_leg" (singulier), pas "push_pull_legs".
 */
export const PROTOCOL_SCHEDULE: Record<Protocol, Focus[]> = {
  full_body: ["full_body"],
  upper_lower: ["upper", "lower"],
  push_pull: ["push", "pull"],
  push_pull_leg: ["push", "pull", "legs"],
};

/** generator.py::_build_session_label::focus_labels */
const FOCUS_LABELS: Record<Focus, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  upper: "Upper Body",
  lower: "Lower Body",
  full_body: "Full Body",
};

/** generator.py::_resolve_focus — `(day_number - 1) % len(schedule)`. */
export function resolveFocus(
  protocol: Protocol | null | undefined,
  dayNumber: number,
): Focus {
  const schedule = PROTOCOL_SCHEDULE[protocol as Protocol] ?? ["full_body"];
  const index = (dayNumber - 1) % schedule.length;
  return schedule[index];
}

/** generator.py::_build_session_label */
export function buildSessionLabel(focus: Focus): string {
  return (
    FOCUS_LABELS[focus] ??
    String(focus)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/**
 * Numéro du prochain jour à partir des séances déjà complétées.
 * day_number est 1-indexé côté moteur, d'où le +1.
 */
export function nextDayNumber(totalSessionsCompleted: number): number {
  return totalSessionsCompleted + 1;
}

/** Semaine courante déduite de la fréquence du programme. */
export function weekForDay(dayNumber: number, sessionsPerWeek: number): number {
  if (sessionsPerWeek <= 0) return 1;
  return Math.floor((dayNumber - 1) / sessionsPerWeek) + 1;
}
