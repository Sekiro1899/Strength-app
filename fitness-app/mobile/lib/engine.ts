/**
 * Miroir du moteur de génération — backend/engine/{exercise_selector,block_builder}.py
 *
 * Les mêmes règles doivent produire la même séance des deux côtés, sinon
 * l'aperçu du mode démo ment sur ce que fera la production.
 *
 * Deux colonnes de la bibliothèque pilotent tout :
 *   target_programs : appartenance au programme (vide = universel)
 *   exercise_type   : compound | isolation | core | cardio -> choisit le bloc
 */

import { EXERCISES } from "./fixtures";
import type {
  Exercise,
  ExerciseBlock,
  ExerciseType,
  Focus,
  Program,
  ProgramPhase,
} from "./types";

/** exercise_selector.py::FOCUS_CATEGORY_MAP */
const FOCUS_CATEGORY_MAP: Record<Focus, string[]> = {
  push: ["push"],
  pull: ["pull"],
  legs: ["legs"],
  upper: ["push", "pull", "arms"],
  lower: ["legs"],
  full_body: ["push", "pull", "legs", "arms"],
};

/** exercise_selector.py::FOCUS_WARMUP_TARGET_MAP */
const FOCUS_WARMUP_TARGET_MAP: Record<Focus, string[]> = {
  push: ["push", "bench", "ohp"],
  pull: ["pull", "deadlift"],
  legs: ["leg", "squat", "single_leg"],
  upper: ["push", "pull", "bench", "ohp"],
  lower: ["leg", "squat", "deadlift", "single_leg"],
  full_body: ["all"],
};

/** Programmes en circuit : aucun découpage par patron moteur. */
const CIRCUIT_CATEGORIES = ["complex", "explosive", "conditioning"];

const LEVEL_ORDER: Record<string, number> = {
  debutant: 0,
  intermediaire: 1,
  avance: 2,
};

const WARMUP_COUNT: Record<string, number> = {
  very_light: 2,
  light: 3,
  moderate: 4,
  heavy: 5,
};

interface SelectOptions {
  categories?: string[];
  exerciseTypes?: ExerciseType[];
  levelMax?: string;
  bodyweightOnly?: boolean;
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
    // Sans programme cible, l'exercice est universel (warmup / finisher).
    if (targets.length === 0) {
      if (!opts.allowUniversal) return false;
    } else if (!targets.includes(programId)) {
      return false;
    }

    if (opts.categories && !opts.categories.includes(ex.category)) return false;
    if (
      opts.exerciseTypes &&
      (!ex.exercise_type || !opts.exerciseTypes.includes(ex.exercise_type))
    ) {
      return false;
    }
    if ((LEVEL_ORDER[ex.level] ?? 0) > maxLevel) return false;
    if (opts.bodyweightOnly && !ex.bodyweight_compatible) return false;

    if (opts.warmupTargets) {
      const t = ex.warmup_target ?? [];
      const hit = t.includes("all") || opts.warmupTargets.some((w) => t.includes(w));
      if (!hit) return false;
    }
    return true;
  });
}

/**
 * Tirage déterministe : trié par id puis parcouru à pas régulier.
 * Le seed vient du numéro de séance, ce qui fait varier les exercices d'une
 * séance à l'autre tout en restant rejouable.
 */
function pick(pool: Exercise[], count: number, seed: number): Exercise[] {
  if (pool.length === 0 || count <= 0) return [];
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  if (sorted.length <= count) return sorted;

  const step = Math.max(1, Math.floor(sorted.length / count));
  const out: Exercise[] = [];
  const seen = new Set<string>();
  for (let i = 0; out.length < count && i < sorted.length * 2; i++) {
    const ex = sorted[(seed + i * step) % sorted.length];
    if (!seen.has(ex.id)) {
      seen.add(ex.id);
      out.push(ex);
    }
  }
  return out;
}

function resolveLoadPct(phase: ProgramPhase | null, program: Program): number {
  return phase?.load_pct_1rm ?? program.rep_range_min ?? 65;
}

// ─────────────────────────────────────────────
// Blocs
// ─────────────────────────────────────────────

export function buildWarmup(
  program: Program,
  focus: Focus,
  energy: number,
  seed: number,
): ExerciseBlock[] {
  let count = WARMUP_COUNT.moderate;
  if (energy <= 2) count = Math.min(count + 1, 5);

  let pool = selectExercises(program.id, {
    categories: ["warmup"],
    warmupTargets: FOCUS_WARMUP_TARGET_MAP[focus] ?? ["all"],
    allowUniversal: true,
  });
  if (pool.length < count) {
    pool = selectExercises(program.id, {
      categories: ["warmup"],
      allowUniversal: true,
    });
  }

  return pick(pool, count, seed).map((ex) => {
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

function buildCircuitMain(
  program: Program,
  phase: ProgramPhase | null,
  levelMax: string,
  energy: number,
  seed: number,
): ExerciseBlock[] {
  const pool = selectExercises(program.id, {
    categories: CIRCUIT_CATEGORIES,
    levelMax,
  });
  const count = energy >= 3 ? 5 : 4;
  const reps = Math.round(
    ((phase?.rep_range_min ?? 8) + (phase?.rep_range_max ?? 10)) / 2,
  );
  const rest = phase?.rest_sec_min ?? 60;
  let load = resolveLoadPct(phase, program);
  if (energy <= 2) load = Math.max(load - 10, 40);

  return pick(pool, count, seed).map((ex, i) => {
    const isCardio = ex.exercise_type === "cardio";
    return {
      exercise_id: ex.id,
      name: ex.name,
      sets: 3,
      ...(isCardio ? { duration_sec: 40 } : { reps, load_pct_1rm: load }),
      rest_sec: rest,
      notes: `Circuit — tour ${i + 1}`,
      log_results: true,
    };
  });
}

export function buildMain(
  program: Program,
  phase: ProgramPhase | null,
  focus: Focus,
  levelMax: string,
  energy: number,
  seed: number,
): ExerciseBlock[] {
  if (program.session_structure === "circuit") {
    return buildCircuitMain(program, phase, levelMax, energy, seed);
  }

  const categories = FOCUS_CATEGORY_MAP[focus] ?? ["push", "pull", "legs"];
  const bodyweightOnly = program.id === "program_bodyweight";

  let setsCompounds = phase?.sets_compounds ?? 4;
  const setsIsolation = phase?.sets_isolation ?? 3;
  const repMin = phase?.rep_range_min ?? program.rep_range_min ?? 8;
  const repMax = phase?.rep_range_max ?? program.rep_range_max ?? 12;
  const rest = phase?.rest_sec_min ?? 90;
  let load = resolveLoadPct(phase, program);

  if (energy <= 2) {
    load = Math.max(load - 10, 40);
    setsCompounds = Math.max(setsCompounds - 1, 2);
  } else if (energy >= 5) {
    load = Math.min(load + 5, 100);
  }

  const compounds = pick(
    selectExercises(program.id, {
      categories,
      exerciseTypes: ["compound"],
      levelMax,
      bodyweightOnly,
    }),
    Math.min(categories.length + 1, 4),
    seed,
  );
  const used = new Set(compounds.map((e) => e.id));

  const isolations = pick(
    selectExercises(program.id, {
      categories,
      exerciseTypes: ["isolation"],
      levelMax,
      bodyweightOnly,
      excludeIds: used,
    }),
    Math.min(categories.length, 3),
    seed,
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

export function buildCore(
  program: Program,
  levelMax: string,
  energy: number,
  seed: number,
): ExerciseBlock[] {
  // Le bloc core n'existe que sur les programmes qui le déclarent.
  if (!program.has_core_block) return [];

  const pool = selectExercises(program.id, {
    exerciseTypes: ["core"],
    levelMax,
  });

  return pick(pool, energy >= 3 ? 3 : 2, seed).map((ex) => {
    const isEndurance = ex.category === "core_endurance";
    return {
      exercise_id: ex.id,
      name: ex.name,
      sets: 3,
      ...(isEndurance ? { duration_sec: 40 } : { reps: 12 }),
      rest_sec: 45,
      notes: isEndurance ? "Gainage" : "Core — force",
      log_results: true,
    };
  });
}

export function buildFinisher(
  program: Program,
  levelMax: string,
  energy: number,
  seed: number,
): ExerciseBlock[] {
  if (energy <= 1) return [];

  const pool = selectExercises(program.id, {
    categories: ["finisher"],
    levelMax,
    allowUniversal: true,
  });

  return pick(pool, 2, seed).map((ex) => ({
    exercise_id: ex.id,
    name: ex.name,
    sets: 1,
    duration_sec: 180,
    notes: "Finisher",
    log_results: false,
  }));
}

/** Retrouve la fiche complète d'un exercice (description, muscles, image). */
export function findExercise(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
