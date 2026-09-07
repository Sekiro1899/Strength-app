/**
 * Backend de démo — 100 % local, aucun réseau.
 *
 * Objectif : ouvrir la page web et parcourir tout le flux
 * (signup → questionnaire → persona → dashboard → séance → feedback)
 * sans clés Supabase ni FastAPI démarré.
 *
 * Ce n'est PAS un stub : il rejoue les vraies données seed et le vrai
 * algorithme de sélection d'exercices (mêmes mappings que backend/engine),
 * pour que ce qu'on voit à l'écran ressemble à la production.
 *
 * L'état est persisté dans localStorage sur le web et en mémoire sur natif.
 */

import {
  EXERCISES,
  PERSONAS,
  PERSONA_PROGRAM_ELIGIBILITY,
  PROGRAMS,
  PROGRAM_PHASES,
} from "./fixtures";
import { buildSessionLabel, resolveFocus } from "./protocol";
import { resolveProgramId } from "./scoring";
import type {
  AppUser,
  Exercise,
  ExerciseBlock,
  Focus,
  PersonaScores,
  Program,
  ProgramPhase,
  Protocol,
  WorkoutRequest,
  WorkoutResponse,
  WorkoutSession,
  UserProgram,
} from "./types";

// ─────────────────────────────────────────────
// Persistance
// ─────────────────────────────────────────────

const STORAGE_KEY = "strength-app.demo.v1";

interface DemoState {
  user: AppUser | null;
  userPrograms: UserProgram[];
  sessions: WorkoutSession[];
}

const EMPTY: DemoState = { user: null, userPrograms: [], sessions: [] };

function hasLocalStorage(): boolean {
  try {
    return typeof globalThis.localStorage !== "undefined";
  } catch {
    return false;
  }
}

let memory: DemoState = { ...EMPTY };

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
    /* quota plein ou storage bloqué — on garde la copie mémoire */
  }
}

export function resetDemo(): void {
  write({ ...EMPTY, userPrograms: [], sessions: [] });
}

// ─────────────────────────────────────────────
// Identifiants déterministes
// ─────────────────────────────────────────────

let counter = 0;

/** uuid-like stable, sans Math.random (rejouabilité des captures d'écran). */
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter.toString().padStart(6, "0")}`;
}

// ─────────────────────────────────────────────
// Auth simulée
// ─────────────────────────────────────────────

export function demoSignUp(email: string): AppUser {
  const state = read();
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
  write({ ...state, user, userPrograms: [], sessions: [] });
  return user;
}

export function demoSignIn(email: string): AppUser {
  const state = read();
  // Reconnexion : on garde la progression si c'est le même email.
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
// Onboarding
// ─────────────────────────────────────────────

export function demoCompleteOnboarding(
  answers: Record<string, string | string[]>,
  scores: PersonaScores,
  personaId: string,
): { user: AppUser; userProgram: UserProgram } {
  const state = read();
  const persona = PERSONAS.find((p) => p.id === personaId);
  if (!persona) throw new Error(`Persona inconnu : ${personaId}`);

  const programId = resolveProgramId(persona, PERSONA_PROGRAM_ELIGIBILITY);
  if (!programId) {
    throw new Error(`Aucun programme éligible pour ${persona.code}`);
  }

  const program = PROGRAMS.find((p) => p.id === programId)!;
  const firstPhase = PROGRAM_PHASES.filter((ph) => ph.program_id === programId)
    .sort((a, b) => a.phase_number - b.phase_number)[0];

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
    protocol: program.default_protocol,
    status: "active",
    current_phase_id: firstPhase?.id ?? null,
    current_week: 1,
    start_date: new Date().toISOString().slice(0, 10),
    total_sessions_planned: null,
    total_sessions_completed: 0,
  };

  write({ user, userPrograms: [userProgram], sessions: [] });
  return { user, userProgram };
}

export function demoActiveProgram(): UserProgram | null {
  const state = read();
  return state.userPrograms.find((up) => up.status === "active") ?? null;
}

export function demoSessions(): WorkoutSession[] {
  return read().sessions;
}

// ─────────────────────────────────────────────
// Génération de séance (miroir de backend/engine)
// ─────────────────────────────────────────────

/** exercise_selector.py::FOCUS_CATEGORY_MAP */
const FOCUS_CATEGORY_MAP: Record<Focus, string[]> = {
  push: ["push"],
  pull: ["pull"],
  legs: ["legs"],
  upper: ["push", "pull", "arms"],
  lower: ["legs"],
  full_body: ["push", "pull", "legs"],
};

const LEVEL_ORDER: Record<string, number> = {
  debutant: 0,
  intermediaire: 1,
  avance: 2,
};

/** Sélection déterministe : tri par id puis pas régulier dans la liste. */
function pick(pool: Exercise[], count: number, seed: number): Exercise[] {
  if (pool.length === 0) return [];
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  const out: Exercise[] = [];
  const step = Math.max(1, Math.floor(sorted.length / Math.max(1, count)));
  for (let i = 0; i < count; i++) {
    out.push(sorted[(seed + i * step) % sorted.length]);
  }
  // dédoublonne sans retomber en dessous du compte demandé quand c'est possible
  const seen = new Set<string>();
  const unique = out.filter((e) => !seen.has(e.id) && seen.add(e.id));
  if (unique.length < count) {
    for (const e of sorted) {
      if (unique.length >= count) break;
      if (!seen.has(e.id)) {
        seen.add(e.id);
        unique.push(e);
      }
    }
  }
  return unique;
}

function byLevel(pool: Exercise[], levelMax: string): Exercise[] {
  const max = LEVEL_ORDER[levelMax] ?? 2;
  return pool.filter((e) => (LEVEL_ORDER[e.level] ?? 0) <= max);
}

function buildWarmup(focus: Focus, seed: number): ExerciseBlock[] {
  const pool = EXERCISES.filter((e) => e.category === "warmup");
  return pick(pool, 4, seed).map((ex) => {
    const isMobility = ex.intent.includes("mobilite");
    return {
      exercise_id: ex.id,
      name: ex.name,
      sets: isMobility ? 2 : 1,
      ...(isMobility ? { duration_sec: 30 } : { reps: 10 }),
      notes: isMobility ? "Mobilité" : "Activation musculaire",
    };
  });
}

function buildMain(
  focus: Focus,
  phase: ProgramPhase | null,
  program: Program,
  levelMax: string,
  seed: number,
): ExerciseBlock[] {
  const categories = FOCUS_CATEGORY_MAP[focus] ?? ["push", "pull", "legs"];
  const pool = byLevel(
    EXERCISES.filter((e) => categories.includes(e.category)),
    levelMax,
  );

  const sets = phase?.sets_compounds ?? 4;
  const repMin = phase?.rep_range_min ?? program.rep_range_min ?? 8;
  const repMax = phase?.rep_range_max ?? program.rep_range_max ?? 12;
  const reps = Math.round((repMin + repMax) / 2);
  const rest = phase?.rest_sec_min ?? 90;
  const load = phase?.load_pct_1rm ?? null;

  return pick(pool, 5, seed).map((ex, i) => ({
    exercise_id: ex.id,
    name: ex.name,
    sets: i < 2 ? sets : Math.max(2, sets - 1),
    reps,
    ...(load ? { load_pct_1rm: load } : {}),
    rest_sec: rest,
    notes: i < 2 ? `Compound — ${sets}x${reps}` : `Accessoire — ${reps} reps`,
  }));
}

function buildCore(levelMax: string, seed: number): ExerciseBlock[] {
  const pool = byLevel(
    EXERCISES.filter(
      (e) => e.category === "core_strength" || e.category === "core_endurance",
    ),
    levelMax,
  );
  return pick(pool, 2, seed).map((ex) => ({
    exercise_id: ex.id,
    name: ex.name,
    sets: 3,
    ...(ex.category === "core_endurance"
      ? { duration_sec: 40 }
      : { reps: 12 }),
    rest_sec: 45,
    notes: "Gainage",
  }));
}

function buildFinisher(levelMax: string, seed: number): ExerciseBlock[] {
  const pool = byLevel(
    EXERCISES.filter(
      (e) => e.category === "finisher" || e.category === "conditioning",
    ),
    levelMax,
  );
  return pick(pool, 2, seed).map((ex) => ({
    exercise_id: ex.id,
    name: ex.name,
    sets: 1,
    duration_sec: 60,
    notes: "Finisher",
  }));
}

/**
 * Équivalent local de POST /workout/generate.
 * Persiste la séance dans le store démo, comme le fait le vrai générateur
 * dans la table `sessions`.
 */
export function demoGenerateWorkout(request: WorkoutRequest): WorkoutResponse {
  const state = read();
  const program = PROGRAMS.find((p) => p.id === request.program_id);
  if (!program) throw new Error(`Programme introuvable : ${request.program_id}`);

  const persona = PERSONAS.find((p) => p.id === request.persona_id);
  const levelMax =
    persona?.experience_level === "advanced"
      ? "avance"
      : persona?.experience_level === "beginner_intermediate"
        ? "intermediaire"
        : "intermediaire";

  const phase =
    PROGRAM_PHASES.find((ph) => ph.id === request.phase_id) ??
    PROGRAM_PHASES.filter((ph) => ph.program_id === program.id).sort(
      (a, b) => a.phase_number - b.phase_number,
    )[0] ??
    null;

  const protocol: Protocol =
    request.protocol ?? program.default_protocol ?? "full_body";
  const dayNumber = request.day_number ?? 1;
  const focus: Focus = request.focus ?? resolveFocus(protocol, dayNumber);
  const sessionLabel = buildSessionLabel(focus);
  const seed = dayNumber * 7;

  const session: WorkoutSession = {
    id: nextId("demo_session"),
    user_id: request.user_id,
    user_program_id: request.user_program_id,
    phase_id: phase?.id ?? null,
    week_number: request.week_number ?? 1,
    day_number: dayNumber,
    session_label: sessionLabel,
    protocol,
    focus,
    status: "planned",
    energy_level: request.energy_level ?? 3,
    warmup_block: buildWarmup(focus, seed),
    main_block: buildMain(focus, phase, program, levelMax, seed),
    core_block: buildCore(levelMax, seed),
    finisher_block: buildFinisher(levelMax, seed),
    scheduled_date: null,
    started_at: null,
    completed_at: null,
    actual_duration_min: null,
  };

  write({ ...state, sessions: [...state.sessions, session] });

  return {
    session_id: session.id,
    program_id: program.id,
    phase_id: session.phase_id,
    protocol,
    focus,
    session_label: sessionLabel,
    warmup_block: session.warmup_block!,
    main_block: session.main_block!,
    core_block: session.core_block!,
    finisher_block: session.finisher_block!,
  };
}

export function demoGetSession(sessionId: string): WorkoutSession | null {
  return read().sessions.find((s) => s.id === sessionId) ?? null;
}

/** Marque la séance terminée et incrémente le compteur du programme. */
export function demoCompleteSession(
  sessionId: string,
  completedAt: string,
): void {
  const state = read();
  const sessions = state.sessions.map((s) =>
    s.id === sessionId
      ? { ...s, status: "completed" as const, completed_at: completedAt }
      : s,
  );
  const target = sessions.find((s) => s.id === sessionId);
  const userPrograms = state.userPrograms.map((up) =>
    up.id === target?.user_program_id
      ? {
          ...up,
          total_sessions_completed: up.total_sessions_completed + 1,
          current_week: Math.max(
            up.current_week,
            target.week_number ?? up.current_week,
          ),
        }
      : up,
  );
  write({ ...state, sessions, userPrograms });
}
