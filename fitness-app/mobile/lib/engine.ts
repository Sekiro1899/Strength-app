/**
 * Moteur de génération — miroir de backend/engine/{exercise_selector,block_builder}.py
 *
 * Pur et sans I/O : exécutable côté client comme en edge function.
 *
 * Trois entrées pilotent la composition :
 *   target_programs / exercise_type  — quel exercice, dans quel bloc
 *   locations                        — praticable au lieu déclaré
 *   energy                           — charge ET volume
 *
 * La sélection est aléatoire mais REPRODUCTIBLE : le tirage est seedé sur
 * (programme, jour), donc rejouer la même séance redonne la même chose, alors
 * que deux séances différentes composent réellement différemment. Un historique
 * des séances récentes évite en plus de resservir les mêmes exercices.
 */

import { EXERCISES } from "./fixtures";
import type {
  Exercise,
  ExerciseBlock,
  ExerciseType,
  Focus,
  Program,
  ProgramPhase,
  TrainingLocation,
} from "./types";

const FOCUS_CATEGORY_MAP: Record<Focus, string[]> = {
  push: ["push"],
  pull: ["pull"],
  legs: ["legs"],
  upper: ["push", "pull", "arms"],
  lower: ["legs"],
  full_body: ["push", "pull", "legs", "arms"],
};

const FOCUS_WARMUP_TARGET_MAP: Record<Focus, string[]> = {
  push: ["push", "bench", "ohp"],
  pull: ["pull", "deadlift"],
  legs: ["leg", "squat", "single_leg"],
  upper: ["push", "pull", "bench", "ohp"],
  lower: ["leg", "squat", "deadlift", "single_leg"],
  full_body: ["all"],
};

const CIRCUIT_CATEGORIES = ["complex", "explosive", "conditioning"];

const LEVEL_ORDER: Record<string, number> = {
  debutant: 0,
  intermediaire: 1,
  avance: 2,
};

// ─────────────────────────────────────────────
// Tirage aléatoire reproductible
// ─────────────────────────────────────────────

/** FNV-1a — transforme la clé de séance en graine numérique. */
function hashSeed(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — petit PRNG rapide, suffisant pour du tirage d'exercices. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Graine d'une séance : stable pour un couple (programme, jour). */
export function sessionSeed(userProgramId: string, dayNumber: number): number {
  return hashSeed(`${userProgramId}#${dayNumber}`);
}

/** Fisher-Yates — un vrai mélange, là où un pas arithmétique répétait les séries. */
function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Tire `count` exercices en privilégiant ceux qui n'ont pas servi récemment.
 * On ne les interdit pas : sur un pool étroit il faut bien réutiliser.
 */
function pick(
  pool: Exercise[],
  count: number,
  rng: () => number,
  recentIds: Set<string>,
): Exercise[] {
  if (pool.length === 0 || count <= 0) return [];
  const fresh = shuffle(pool.filter((e) => !recentIds.has(e.id)), rng);
  const stale = shuffle(pool.filter((e) => recentIds.has(e.id)), rng);
  return [...fresh, ...stale].slice(0, count);
}

// ─────────────────────────────────────────────
// Énergie → charge et volume
// ─────────────────────────────────────────────

export interface VolumePolicy {
  loadDelta: number;
  setsDelta: number;
  compounds: number;
  isolations: number;
  core: number;
  warmup: number;
  withFinisher: boolean;
}

/**
 * L'énergie déclarée en début de séance module la charge ET le volume.
 * Épuisé, on raccourcit la séance ; au top, on l'étoffe.
 */
export function volumeForEnergy(energy: number): VolumePolicy {
  switch (Math.max(1, Math.min(5, Math.round(energy)))) {
    case 1:
      return { loadDelta: -15, setsDelta: -1, compounds: 2, isolations: 1, core: 1, warmup: 5, withFinisher: false };
    case 2:
      return { loadDelta: -10, setsDelta: -1, compounds: 3, isolations: 1, core: 2, warmup: 5, withFinisher: false };
    case 4:
      return { loadDelta: 0, setsDelta: 0, compounds: 4, isolations: 3, core: 3, warmup: 4, withFinisher: true };
    case 5:
      return { loadDelta: 5, setsDelta: 1, compounds: 4, isolations: 3, core: 3, warmup: 3, withFinisher: true };
    default:
      return { loadDelta: 0, setsDelta: 0, compounds: 3, isolations: 2, core: 2, warmup: 4, withFinisher: true };
  }
}

// ─────────────────────────────────────────────
// Sélection
// ─────────────────────────────────────────────

interface SelectOptions {
  categories?: string[];
  exerciseTypes?: ExerciseType[];
  levelMax?: string;
  location: TrainingLocation;
  warmupTargets?: string[];
  allowUniversal?: boolean;
  excludeIds?: Set<string>;
}

function selectExercises(programId: string, opts: SelectOptions): Exercise[] {
  const maxLevel = LEVEL_ORDER[opts.levelMax ?? "avance"] ?? 2;
  const exclude = opts.excludeIds ?? new Set<string>();

  return EXERCISES.filter((ex) => {
    if (exclude.has(ex.id)) return false;

    const targets = ex.target_programs ?? [];
    if (targets.length === 0) {
      if (!opts.allowUniversal) return false;
    } else if (!targets.includes(programId)) {
      return false;
    }

    // Le lieu déclaré en début de séance décide du matériel disponible.
    if (!(ex.locations ?? ["gym"]).includes(opts.location)) return false;

    if (opts.categories && !opts.categories.includes(ex.category)) return false;
    if (
      opts.exerciseTypes &&
      (!ex.exercise_type || !opts.exerciseTypes.includes(ex.exercise_type))
    ) {
      return false;
    }
    if ((LEVEL_ORDER[ex.level] ?? 0) > maxLevel) return false;

    if (opts.warmupTargets) {
      const t = ex.warmup_target ?? [];
      if (!(t.includes("all") || opts.warmupTargets.some((w) => t.includes(w)))) {
        return false;
      }
    }
    return true;
  });
}

export interface BuildContext {
  program: Program;
  phase: ProgramPhase | null;
  focus: Focus;
  levelMax: string;
  energy: number;
  location: TrainingLocation;
  /** Exercices vus lors des dernières séances — évités en priorité. */
  recentIds: Set<string>;
  rng: () => number;
}

function resolveLoadPct(phase: ProgramPhase | null, program: Program): number {
  return phase?.load_pct_1rm ?? program.rep_range_min ?? 65;
}

// ─────────────────────────────────────────────
// Blocs
// ─────────────────────────────────────────────

export function buildWarmup(ctx: BuildContext): ExerciseBlock[] {
  const policy = volumeForEnergy(ctx.energy);

  let pool = selectExercises(ctx.program.id, {
    categories: ["warmup"],
    warmupTargets: FOCUS_WARMUP_TARGET_MAP[ctx.focus] ?? ["all"],
    location: ctx.location,
    allowUniversal: true,
  });
  if (pool.length < policy.warmup) {
    pool = selectExercises(ctx.program.id, {
      categories: ["warmup"],
      location: ctx.location,
      allowUniversal: true,
    });
  }

  return pick(pool, policy.warmup, ctx.rng, ctx.recentIds).map((ex) => {
    const isMobility = ex.intent.includes("mobilite");
    return {
      exercise_id: ex.id,
      name: ex.name,
      sets: isMobility ? 2 : 1,
      ...(isMobility ? { duration_sec: 30 } : { reps: 10 }),
      notes: isMobility ? "Mobilité" : "Activation musculaire",
      log_results: false,
    };
  });
}

function buildCircuitMain(ctx: BuildContext): ExerciseBlock[] {
  const policy = volumeForEnergy(ctx.energy);
  const pool = selectExercises(ctx.program.id, {
    categories: CIRCUIT_CATEGORIES,
    levelMax: ctx.levelMax,
    location: ctx.location,
  });

  const reps = Math.round(
    ((ctx.phase?.rep_range_min ?? 8) + (ctx.phase?.rep_range_max ?? 10)) / 2,
  );
  const rest = ctx.phase?.rest_sec_min ?? 60;
  const load = Math.max(resolveLoadPct(ctx.phase, ctx.program) + policy.loadDelta, 40);
  const count = policy.compounds + policy.isolations;

  return pick(pool, count, ctx.rng, ctx.recentIds).map((ex, i) => {
    const isCardio = ex.exercise_type === "cardio";
    return {
      exercise_id: ex.id,
      name: ex.name,
      sets: Math.max(2, 3 + policy.setsDelta),
      ...(isCardio ? { duration_sec: 40 } : { reps, load_pct_1rm: load }),
      rest_sec: rest,
      notes: `Circuit — tour ${i + 1}`,
      log_results: true,
    };
  });
}

export function buildMain(ctx: BuildContext): ExerciseBlock[] {
  if (ctx.program.session_structure === "circuit") return buildCircuitMain(ctx);

  const policy = volumeForEnergy(ctx.energy);
  const categories = FOCUS_CATEGORY_MAP[ctx.focus] ?? ["push", "pull", "legs"];
  const bodyweightOnly = ctx.program.id === "program_bodyweight";

  const setsCompounds = Math.max(2, (ctx.phase?.sets_compounds ?? 4) + policy.setsDelta);
  const setsIsolation = Math.max(2, (ctx.phase?.sets_isolation ?? 3) + policy.setsDelta);
  const repMin = ctx.phase?.rep_range_min ?? ctx.program.rep_range_min ?? 8;
  const repMax = ctx.phase?.rep_range_max ?? ctx.program.rep_range_max ?? 12;
  const rest = ctx.phase?.rest_sec_min ?? 90;
  const load = Math.min(
    Math.max(resolveLoadPct(ctx.phase, ctx.program) + policy.loadDelta, 40),
    100,
  );

  const base = {
    levelMax: ctx.levelMax,
    location: ctx.location,
    ...(bodyweightOnly ? {} : {}),
  };

  const compounds = pick(
    selectExercises(ctx.program.id, { ...base, categories, exerciseTypes: ["compound"] }),
    policy.compounds,
    ctx.rng,
    ctx.recentIds,
  );
  const used = new Set(compounds.map((e) => e.id));

  const isolations = pick(
    selectExercises(ctx.program.id, {
      ...base,
      categories,
      exerciseTypes: ["isolation"],
      excludeIds: used,
    }),
    policy.isolations,
    ctx.rng,
    ctx.recentIds,
  );

  const reps = Math.round((repMin + repMax) / 2);
  const isoReps = Math.min(reps + 2, repMax + 2);

  return [
    ...compounds.map((ex) => ({
      exercise_id: ex.id,
      name: ex.name,
      sets: setsCompounds,
      reps,
      ...(bodyweightOnly ? {} : { load_pct_1rm: load }),
      rest_sec: rest,
      notes: `Compound — ${setsCompounds}x${reps}`,
      log_results: true,
    })),
    ...isolations.map((ex) => ({
      exercise_id: ex.id,
      name: ex.name,
      sets: setsIsolation,
      reps: isoReps,
      ...(bodyweightOnly ? {} : { load_pct_1rm: Math.max(load - 10, 40) }),
      rest_sec: Math.max(rest - 15, 30),
      notes: `Isolation — ${setsIsolation}x${isoReps}`,
      log_results: true,
    })),
  ];
}

export function buildCore(ctx: BuildContext): ExerciseBlock[] {
  if (!ctx.program.has_core_block) return [];
  const policy = volumeForEnergy(ctx.energy);

  const pool = selectExercises(ctx.program.id, {
    exerciseTypes: ["core"],
    levelMax: ctx.levelMax,
    location: ctx.location,
  });

  return pick(pool, policy.core, ctx.rng, ctx.recentIds).map((ex) => {
    const isEndurance = ex.category === "core_endurance";
    return {
      exercise_id: ex.id,
      name: ex.name,
      sets: Math.max(2, 3 + policy.setsDelta),
      ...(isEndurance ? { duration_sec: 40 } : { reps: 12 }),
      rest_sec: 45,
      notes: isEndurance ? "Gainage" : "Core — force",
      log_results: true,
    };
  });
}

export function buildFinisher(ctx: BuildContext): ExerciseBlock[] {
  const policy = volumeForEnergy(ctx.energy);
  // Énergie au plus bas : on supprime le finisher plutôt que de le bâcler.
  if (!policy.withFinisher) return [];

  const pool = selectExercises(ctx.program.id, {
    categories: ["finisher"],
    levelMax: ctx.levelMax,
    location: ctx.location,
    allowUniversal: true,
  });

  return pick(pool, 2, ctx.rng, ctx.recentIds).map((ex) => ({
    exercise_id: ex.id,
    name: ex.name,
    sets: 1,
    duration_sec: 180,
    notes: "Finisher",
    log_results: false,
  }));
}

export function findExercise(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
