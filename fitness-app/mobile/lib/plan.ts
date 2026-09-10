/**
 * Planification du cycle complet.
 *
 * À la création du programme on génère le plan ENTIER : une entrée par séance,
 * datée, du premier au dernier jour du cycle. Le contenu (exercices) n'est pas
 * matérialisé ici — il est généré au démarrage de la séance, pour que la
 * sélection tienne compte de l'énergie du jour et de la phase atteinte.
 *
 * C'est ce plan qui permet de savoir si le cycle est terminé, et donc de
 * déclencher le feedback au bon moment plutôt que sur un bouton manuel.
 */

import { buildSessionLabel, resolveFocus } from "./protocol";
import type { Focus, Program, ProgramPhase, Protocol } from "./types";

/**
 * Répartition des séances dans la semaine (1 = lundi).
 * On évite deux jours consécutifs tant que la fréquence le permet.
 */
const WEEKDAYS: Record<number, number[]> = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [1, 2, 3, 4, 5, 6, 7],
};

export interface PlannedSession {
  /** Rang absolu dans le cycle, 1-indexé — c'est le day_number du moteur. */
  day_number: number;
  week_number: number;
  /** Rang de la séance dans sa semaine, 1-indexé. */
  day_in_week: number;
  phase_id: string | null;
  focus: Focus;
  session_label: string;
  protocol: Protocol;
  /** Date planifiée, format YYYY-MM-DD. */
  scheduled_date: string;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Lundi de la semaine contenant `date` (semaine ISO, lundi = début). */
function mondayOf(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (dow - 1));
  return d;
}

/**
 * Associe chaque semaine du cycle à sa phase.
 * Les phases se succèdent : durées cumulées sur duration_weeks.
 */
export function phaseForWeek(
  phases: ProgramPhase[],
  week: number,
): ProgramPhase | null {
  const ordered = [...phases].sort((a, b) => a.phase_number - b.phase_number);
  let elapsed = 0;
  for (const phase of ordered) {
    elapsed += phase.duration_weeks;
    if (week <= elapsed) return phase;
  }
  return ordered[ordered.length - 1] ?? null;
}

/**
 * Génère le plan complet du cycle.
 *
 * @param startDate jour de démarrage ; la première séance tombe le premier
 *                  jour d'entraînement à partir de cette date.
 */
/**
 * Durée du cycle, ajustée à ce que le pratiquant a annoncé pouvoir tenir.
 *
 * Deux raccourcis, et c'est toujours le plus court qui gagne :
 *
 * À cinq séances par semaine et plus, le volume hebdomadaire est déjà élevé.
 * Étaler ça sur dix semaines, c'est demander à quelqu'un de tenir un rythme
 * soutenu pendant deux mois et demi — la plupart décrochent avant. Six
 * semaines se terminent, et un cycle terminé vaut mieux qu'un cycle abandonné.
 *
 * Sur les programmes en circuit — lactate, préparation athlétique — les
 * adaptations sont rapides mais la lassitude aussi : quatre semaines, puis on
 * change. C'est le cas de Corporate Rusher.
 */
export const HIGH_FREQUENCY_THRESHOLD = 5;
export const HIGH_FREQUENCY_WEEKS = 6;
export const CIRCUIT_WEEKS = 4;

export function cycleWeeks(program: Program, sessionsPerWeek: number): number {
  const caps = [program.duration_weeks ?? 8];
  if (program.session_structure === "circuit") caps.push(CIRCUIT_WEEKS);
  if (sessionsPerWeek >= HIGH_FREQUENCY_THRESHOLD) caps.push(HIGH_FREQUENCY_WEEKS);
  return Math.min(...caps);
}

export function buildSessionPlan(
  program: Program,
  phases: ProgramPhase[],
  protocol: Protocol,
  startDate: Date,
  sessionsPerWeek?: number,
): PlannedSession[] {
  const perWeek = Math.min(
    Math.max(sessionsPerWeek ?? program.frequency_per_week_min, 1),
    7,
  );
  const weeks = cycleWeeks(program, perWeek);
  const pattern = WEEKDAYS[perWeek] ?? WEEKDAYS[3];

  const anchor = mondayOf(startDate);
  const startISO = toISODate(startDate);
  const plan: PlannedSession[] = [];

  let dayNumber = 0;
  for (let week = 1; week <= weeks; week++) {
    const phase = phaseForWeek(phases, week);

    for (let i = 0; i < pattern.length; i++) {
      const date = new Date(anchor);
      date.setDate(anchor.getDate() + (week - 1) * 7 + (pattern[i] - 1));
      const iso = toISODate(date);

      // On ne planifie rien avant la date de démarrage : si l'utilisateur
      // commence un jeudi, les créneaux lundi/mercredi de la semaine 1 sautent.
      if (iso < startISO) continue;

      dayNumber += 1;
      const focus = resolveFocus(protocol, dayNumber);
      plan.push({
        day_number: dayNumber,
        week_number: week,
        day_in_week: i + 1,
        phase_id: phase?.id ?? null,
        focus,
        session_label: buildSessionLabel(focus),
        protocol,
        scheduled_date: iso,
      });
    }
  }

  return plan;
}

/** Nombre total de séances du cycle. */
export function planLength(plan: PlannedSession[]): number {
  return plan.length;
}

/**
 * Prochaine séance à réaliser : la première non complétée.
 * On suit l'ordre du plan, pas la date — une séance manquée reste due.
 */
export function nextPlanned(
  plan: PlannedSession[],
  completedDayNumbers: Set<number>,
): PlannedSession | null {
  return plan.find((s) => !completedDayNumbers.has(s.day_number)) ?? null;
}

/** Le cycle est terminé quand toutes les séances du plan sont complétées. */
export function isCycleComplete(
  plan: PlannedSession[],
  completedDayNumbers: Set<number>,
): boolean {
  return plan.length > 0 && plan.every((s) => completedDayNumbers.has(s.day_number));
}

/** Retard accumulé : séances dont la date est passée et non faites. */
export function overdueCount(
  plan: PlannedSession[],
  completedDayNumbers: Set<number>,
  today: Date,
): number {
  const iso = toISODate(today);
  return plan.filter(
    (s) => s.scheduled_date < iso && !completedDayNumbers.has(s.day_number),
  ).length;
}
