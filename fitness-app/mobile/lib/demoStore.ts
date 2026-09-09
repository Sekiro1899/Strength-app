/**
 * Backend de démo — 100 % local, aucun réseau.
 *
 * Rejoue les vraies données seed et les vraies règles du moteur
 * (lib/engine.ts, miroir de backend/engine) pour que le mode démo montre ce
 * que fera la production.
 *
 * État persisté en localStorage sur le web, en mémoire sur natif.
 */

import {
  buildCore,
  buildFinisher,
  buildMain,
  buildWarmup,
  createRng,
  sessionSeed,
} from "./engine";
import type { BuildContext } from "./engine";
import { PERSONAS, PERSONA_PROGRAM_ELIGIBILITY, PROGRAMS, PROGRAM_PHASES } from "./fixtures";
import { buildSessionPlan, isCycleComplete, nextPlanned, phaseForWeek } from "./plan";
import type { PlannedSession } from "./plan";
import { resolveProgramId } from "./scoring";
import type {
  AppUser,
  PersonaScores,
  Protocol,
  UserProgram,
  TrainingLocation,
  WorkoutRequest,
  WorkoutResponse,
  WorkoutSession,
} from "./types";

/** Combien de séances passées comptent pour éviter de resservir un exercice. */
const ROTATION_WINDOW = 2;

const STORAGE_KEY = "strength-app.demo.v2";

interface DemoState {
  user: AppUser | null;
  userProgram: UserProgram | null;
  /** Plan complet du cycle, généré au démarrage du programme. */
  plan: PlannedSession[];
  /** Séances matérialisées (contenu généré au lancement). */
  sessions: WorkoutSession[];
}

const EMPTY: DemoState = { user: null, userProgram: null, plan: [], sessions: [] };

let memory: DemoState = { ...EMPTY };

function hasLocalStorage(): boolean {
  try {
    return typeof globalThis.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function read(): DemoState {
  if (!hasLocalStorage()) return memory;
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoState) : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

function write(state: DemoState): void {
  memory = state;
  if (!hasLocalStorage()) return;
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota plein ou storage bloqué — la copie mémoire suffit à la session */
  }
}

export function resetDemo(): void {
  write({ ...EMPTY });
}

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter.toString().padStart(6, "0")}`;
}

// ─────────────────────────────────────────────
// Auth simulée
// ─────────────────────────────────────────────

export function demoSignUp(email: string): AppUser {
  const user: AppUser = {
    id: nextId("demo_user"),
    email,
    full_name: null,
    persona_id: null,
    questionnaire_answers: null,
    questionnaire_scores: null,
    experience_level: null,
    sessions_per_week: null,
    session_duration_target: null,
    onboarding_completed: false,
  };
  write({ ...EMPTY, user });
  return user;
}

export function demoSignIn(email: string): AppUser {
  const state = read();
  if (state.user && state.user.email === email) return state.user;
  return demoSignUp(email);
}

export function demoSignOut(): void {
  write({ ...read(), user: null });
}

export function demoCurrentUser(): AppUser | null {
  return read().user;
}

// ─────────────────────────────────────────────
// Onboarding — crée le programme ET son plan complet
// ─────────────────────────────────────────────

export function demoCompleteOnboarding(
  answers: Record<string, string | string[]>,
  scores: PersonaScores,
  personaId: string,
  today: Date,
): { user: AppUser; userProgram: UserProgram } {
  const state = read();
  const persona = PERSONAS.find((p) => p.id === personaId);
  if (!persona) throw new Error(`Persona inconnu : ${personaId}`);

  const programId = resolveProgramId(persona, PERSONA_PROGRAM_ELIGIBILITY);
  if (!programId) throw new Error(`Aucun programme éligible pour ${persona.code}`);

  const program = PROGRAMS.find((p) => p.id === programId)!;
  const phases = PROGRAM_PHASES.filter((ph) => ph.program_id === programId);
  const protocol: Protocol = program.default_protocol ?? "full_body";

  const plan = buildSessionPlan(program, phases, protocol, today);

  const user: AppUser = {
    ...(state.user ?? demoSignUp("demo@strength.app")),
    persona_id: persona.id,
    questionnaire_answers: answers,
    questionnaire_scores: scores,
    onboarding_completed: true,
  };

  const userProgram: UserProgram = {
    id: nextId("demo_up"),
    user_id: user.id,
    program_id: programId,
    persona_id: persona.id,
    protocol,
    status: "active",
    current_phase_id: plan[0]?.phase_id ?? null,
    current_week: 1,
    start_date: today.toISOString().slice(0, 10),
    total_sessions_planned: plan.length,
    total_sessions_completed: 0,
  };

  write({ user, userProgram, plan, sessions: [] });
  return { user, userProgram };
}

export function demoActiveProgram(): UserProgram | null {
  const up = read().userProgram;
  return up && up.status === "active" ? up : null;
}

export function demoProgram(): UserProgram | null {
  return read().userProgram;
}

export function demoPlan(): PlannedSession[] {
  return read().plan;
}

export function demoSessions(): WorkoutSession[] {
  return read().sessions;
}

export function demoCompletedDayNumbers(): Set<number> {
  return new Set(
    read().sessions.filter((s) => s.status === "completed").map((s) => s.day_number),
  );
}

/** Prochaine séance du plan non encore complétée. */
export function demoNextPlanned(): PlannedSession | null {
  const state = read();
  return nextPlanned(state.plan, demoCompletedDayNumbers());
}

/** Le cycle est-il intégralement terminé ? Déclenche le feedback. */
export function demoCycleComplete(): boolean {
  const state = read();
  return isCycleComplete(state.plan, demoCompletedDayNumbers());
}

// ─────────────────────────────────────────────
// Génération de séance
// ─────────────────────────────────────────────

function levelForPersona(personaId: string): string {
  const persona = PERSONAS.find((p) => p.id === personaId);
  if (persona?.experience_level === "advanced") return "avance";
  if (persona?.experience_level === "beginner_intermediate") return "intermediaire";
  return "intermediaire";
}

/**
 * Exercices vus lors des dernières séances : la sélection les évite en
 * priorité, ce qui fait réellement varier le contenu d'une séance à l'autre.
 */
function recentExerciseIds(sessions: WorkoutSession[]): Set<string> {
  const recent = [...sessions]
    .sort((a, b) => b.day_number - a.day_number)
    .slice(0, ROTATION_WINDOW);
  const ids = new Set<string>();
  for (const s of recent) {
    for (const block of [s.warmup_block, s.main_block, s.core_block, s.finisher_block]) {
      for (const b of block ?? []) ids.add(b.exercise_id);
    }
  }
  return ids;
}

/** Équivalent local de POST /workout/generate. */
export function demoGenerateWorkout(request: WorkoutRequest): WorkoutResponse {
  const state = read();
  const program = PROGRAMS.find((p) => p.id === request.program_id);
  if (!program) throw new Error(`Programme introuvable : ${request.program_id}`);

  const dayNumber = request.day_number ?? 1;
  const planned = state.plan.find((s) => s.day_number === dayNumber);

  const weekNumber = planned?.week_number ?? request.week_number ?? 1;
  const phases = PROGRAM_PHASES.filter((ph) => ph.program_id === program.id);
  const phase =
    phases.find((ph) => ph.id === (planned?.phase_id ?? request.phase_id)) ??
    phaseForWeek(phases, weekNumber);

  const protocol: Protocol =
    planned?.protocol ?? request.protocol ?? program.default_protocol ?? "full_body";
  const focus = planned?.focus ?? request.focus ?? "full_body";
  const label = planned?.session_label ?? focus;

  const levelMax = levelForPersona(request.persona_id);
  const energy = request.energy_level ?? 3;
  const location: TrainingLocation = request.location ?? "gym";

  const ctx: BuildContext = {
    program,
    phase,
    focus,
    levelMax,
    energy,
    location,
    recentIds: recentExerciseIds(state.sessions),
    rng: createRng(sessionSeed(request.user_program_id, dayNumber)),
  };

  // Une séance déjà matérialisée est renvoyée telle quelle, SAUF si l'énergie
  // ou le lieu déclarés ont changé : la séance doit alors être recomposée.
  const existing = state.sessions.find(
    (s) =>
      s.day_number === dayNumber &&
      s.status !== "completed" &&
      s.energy_level === (request.energy_level ?? 3) &&
      s.location === (request.location ?? "gym"),
  );
  if (existing) {
    return {
      session_id: existing.id,
      program_id: program.id,
      phase_id: existing.phase_id,
      protocol: existing.protocol ?? protocol,
      focus: existing.focus ?? focus,
      session_label: existing.session_label ?? label,
      warmup_block: existing.warmup_block ?? [],
      main_block: existing.main_block ?? [],
      core_block: existing.core_block ?? [],
      finisher_block: existing.finisher_block ?? [],
    };
  }

  const session: WorkoutSession = {
    id: nextId("demo_session"),
    user_id: request.user_id,
    user_program_id: request.user_program_id,
    phase_id: phase?.id ?? null,
    week_number: weekNumber,
    day_number: dayNumber,
    session_label: label,
    protocol,
    focus,
    status: "in_progress",
    energy_level: energy,
    location,
    warmup_block: buildWarmup(ctx),
    main_block: buildMain(ctx),
    core_block: buildCore(ctx),
    finisher_block: buildFinisher(ctx),
    scheduled_date: planned?.scheduled_date ?? null,
    started_at: null,
    completed_at: null,
    actual_duration_min: null,
  };

  // Recomposer une séance remplace la précédente version du même jour, sinon
  // le plan se retrouverait avec deux entrées pour le même day_number.
  const others = state.sessions.filter(
    (s) => !(s.day_number === dayNumber && s.status !== "completed"),
  );
  write({ ...state, sessions: [...others, session] });

  return {
    session_id: session.id,
    program_id: program.id,
    phase_id: session.phase_id,
    protocol,
    focus,
    session_label: label,
    warmup_block: session.warmup_block!,
    main_block: session.main_block!,
    core_block: session.core_block!,
    finisher_block: session.finisher_block!,
  };
}

export function demoGetSession(sessionId: string): WorkoutSession | null {
  return read().sessions.find((s) => s.id === sessionId) ?? null;
}

/**
 * Clôture une séance. Si c'était la dernière du plan, le programme passe en
 * `completed` — c'est ce qui déclenche l'écran de fin de cycle et le feedback.
 */
export function demoCompleteSession(sessionId: string, completedAt: string): void {
  const state = read();
  const sessions = state.sessions.map((s) =>
    s.id === sessionId
      ? { ...s, status: "completed" as const, completed_at: completedAt }
      : s,
  );
  const target = sessions.find((s) => s.id === sessionId);
  const completed = new Set(
    sessions.filter((s) => s.status === "completed").map((s) => s.day_number),
  );
  const done = isCycleComplete(state.plan, completed);

  const next = nextPlanned(state.plan, completed);
  const userProgram = state.userProgram
    ? {
        ...state.userProgram,
        total_sessions_completed: completed.size,
        current_week: next?.week_number ?? target?.week_number ?? state.userProgram.current_week,
        current_phase_id: next?.phase_id ?? state.userProgram.current_phase_id,
        status: done ? ("completed" as const) : state.userProgram.status,
      }
    : null;

  write({ ...state, sessions, userProgram });
}
