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
 * Durée du cycle : elle s'ajuste à la fréquence hebdomadaire.
 *
 * Un cycle représente une QUANTITÉ DE TRAVAIL, pas une durée. Qui s'entraîne
 * cinq fois par semaine parcourt en six semaines ce que quelqu'un à deux
 * séances met quinze semaines à faire — la même progression, à des rythmes
 * différents. Figer la durée reviendrait soit à sous-charger les assidus, soit
 * à demander aux autres de tenir un programme qu'ils ne finiront pas.
 *
 * Sur les programmes en circuit, les paliers sont donnés tels quels : les
 * adaptations cardio sont rapides mais la lassitude aussi, et la courbe n'y
 * suit pas le simple produit semaines x séances.
 */
const CIRCUIT_WEEKS_BY_FREQUENCY: Record<number, number> = {
  2: 10,
  3: 7,
  4: 4,
  5: 4,
};

/**
 * Les durées inscrites sur les programmes en split supposent trois séances par
 * semaine. C'est la référence à partir de laquelle le cycle s'étire ou se
 * resserre.
 */
const REFERENCE_SESSIONS_PER_WEEK = 3;

/**
 * Une séance par semaine ne construit rien : le temps de récupération dépasse
 * le temps d'adaptation, et le pratiquant recommence à chaque fois. Deux est
 * le plancher.
 */
export const MIN_SESSIONS_PER_WEEK = 2;

const MIN_CYCLE_WEEKS = 4;
const MAX_CYCLE_WEEKS = 16;

export function cycleWeeks(program: Program, sessionsPerWeek: number): number {
  const perWeek = Math.max(sessionsPerWeek, MIN_SESSIONS_PER_WEEK);

  if (program.session_structure === "circuit") {
    const table = CIRCUIT_WEEKS_BY_FREQUENCY;
    return table[Math.min(perWeek, 5)] ?? table[5];
  }

  // Ailleurs, le volume total du cycle est conservé : autant de séances,
  // réparties sur autant de semaines qu'il en faut.
  const totalSessions = (program.duration_weeks ?? 8) * REFERENCE_SESSIONS_PER_WEEK;
  const weeks = Math.round(totalSessions / perWeek);
  return Math.min(Math.max(weeks, MIN_CYCLE_WEEKS), MAX_CYCLE_WEEKS);
}

export function scalePhases(
  phases: ProgramPhase[],
  fullWeeks: number,
  targetWeeks: number,
): ProgramPhase[] {
  const ordered = [...phases].sort((a, b) => a.phase_number - b.phase_number);
  if (!ordered.length || targetWeeks >= fullWeeks) return ordered;
  // Moins de semaines que de phases : chacune en garde une, les dernières
  // sautent. Mieux vaut perdre une phase entière qu'un demi-cycle de chacune.
  if (targetWeeks <= ordered.length) return ordered.slice(0, targetWeeks).map(one);

  const ideal = ordered.map((p) => (p.duration_weeks * targetWeeks) / fullWeeks);
  const weeks = ideal.map((v) => Math.max(1, Math.floor(v)));
  let remaining = targetWeeks - weeks.reduce((a, b) => a + b, 0);

  // Les restes les plus élevés d'abord ; à égalité, la phase la plus précoce.
  const order = ideal
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; remaining > 0; k = (k + 1) % order.length) {
    weeks[order[k].i] += 1;
    remaining -= 1;
  }

  return ordered.map((phase, i) => ({ ...phase, duration_weeks: weeks[i] }));
}

function one(phase: ProgramPhase): ProgramPhase {
  return { ...phase, duration_weeks: 1 };
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
  // Le cycle raccourci garde toutes ses phases, comprimées.
  const scaled = scalePhases(phases, program.duration_weeks ?? weeks, weeks);
  const pattern = WEEKDAYS[perWeek] ?? WEEKDAYS[3];

  const anchor = mondayOf(startDate);
  const startISO = toISODate(startDate);
  const plan: PlannedSession[] = [];

  let dayNumber = 0;
  for (let week = 1; week <= weeks; week++) {
    const phase = phaseForWeek(scaled, week);

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
