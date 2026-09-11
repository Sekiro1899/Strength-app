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
/**
 * Volume d'un cycle, compté en SÉANCES.
 *
 * Un programme ne porte plus de durée. « Strength Focus, 14 semaines » était
 * une promesse que rien ne tenait : la durée réelle dépend du rythme, et
 * l'afficher comme une propriété du programme contredisait la réponse du
 * pratiquant sur l'écran même où on la lui annonçait.
 *
 * Ce qu'un programme porte, c'est un ARC : un nombre de séances nécessaire
 * pour traverser ses phases et faire monter la charge. C'est cet arc qui est
 * fixe ; la durée en semaines s'en déduit.
 *
 * Les valeurs viennent des durées historiques ramenées à trois séances par
 * semaine, arrondies. La force demande le plus de séances — la charge maximale
 * monte lentement et chaque palier doit être répété ; le cardio le moins, les
 * adaptations y sont rapides et la lassitude aussi.
 */
const CYCLE_SESSIONS_BY_OBJECTIVE: Record<string, number> = {
  max_strength: 36,
  hypertrophy: 30,
  bodyweight_hypertrophy: 27,
  athletic_performance: 24,
  cardio_efficiency: 21,
};

const DEFAULT_CYCLE_SESSIONS = 27;

/**
 * Une séance par semaine ne construit rien : le temps de récupération dépasse
 * le temps d'adaptation, et le pratiquant recommence à chaque fois. Deux est
 * le plancher.
 */
export const MIN_SESSIONS_PER_WEEK = 2;

const MIN_CYCLE_WEEKS = 4;
const MAX_CYCLE_WEEKS = 16;

/** Le nombre de séances que le cycle contient, quel que soit le rythme. */
export function cycleSessions(program: Program): number {
  return CYCLE_SESSIONS_BY_OBJECTIVE[program.objective] ?? DEFAULT_CYCLE_SESSIONS;
}

/**
 * La durée du cycle en semaines : l'arc du programme divisé par le rythme que
 * le pratiquant s'est dit prêt à tenir. Rien d'autre.
 */
export function cycleWeeks(program: Program, sessionsPerWeek: number): number {
  const perWeek = Math.max(sessionsPerWeek, MIN_SESSIONS_PER_WEEK);
  const weeks = Math.round(cycleSessions(program) / perWeek);
  return Math.min(Math.max(weeks, MIN_CYCLE_WEEKS), MAX_CYCLE_WEEKS);
}

/**
 * Longueur d'origine de l'arc, lue sur les phases elles-mêmes.
 *
 * On s'appuyait sur `program.duration_weeks` — la propriété qu'on vient
 * justement de retirer du vocabulaire. Les phases portent déjà leur durée :
 * leur somme EST l'arc, sans détour.
 */
export function phaseSpan(phases: ProgramPhase[], fallback: number): number {
  const span = phases.reduce((sum, p) => sum + (p.duration_weeks ?? 0), 0);
  return span > 0 ? span : fallback;
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
  const scaled = scalePhases(phases, phaseSpan(phases, weeks), weeks);
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

/** Réglages de durée de cycle, exposés au référentiel de l'admin. */
export const PLAN_TUNING = {
  cycleSessionsByObjective: CYCLE_SESSIONS_BY_OBJECTIVE,
  defaultCycleSessions: DEFAULT_CYCLE_SESSIONS,
  minSessionsPerWeek: MIN_SESSIONS_PER_WEEK,
  minCycleWeeks: MIN_CYCLE_WEEKS,
  maxCycleWeeks: MAX_CYCLE_WEEKS,
} as const;
