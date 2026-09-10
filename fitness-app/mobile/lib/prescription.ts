/**
 * Mise en forme d'une prescription.
 *
 * Vit ici et pas dans un écran : l'aperçu de séance et l'écran de suivi
 * affichent la MÊME prescription, et chacun la formatait de son côté. L'un
 * rendait « 10-12 », l'autre « 10 » — le pratiquant voyait deux consignes
 * différentes pour un seul bloc.
 */

import type { ExerciseBlock } from "./types";

/**
 * Cible d'une série. Une fourchette quand il y en a une : « 10-12 » se lit et
 * s'exécute, là où un « 11 » sec n'est qu'une moyenne calculée.
 */
export function formatTarget(block: ExerciseBlock, unit = false): string {
  if (block.duration_sec !== undefined) return `${block.duration_sec}s`;
  if (block.reps === undefined) return "—";
  const suffix = unit ? " reps" : "";
  return block.reps_max && block.reps_max !== block.reps
    ? `${block.reps}-${block.reps_max}${suffix}`
    : `${block.reps}${suffix}`;
}

/** Prescription complète d'un bloc : « 4 × 10-12 ». */
export function setsLabel(block: ExerciseBlock): string {
  if (block.reps === undefined && block.duration_sec === undefined) {
    return `${block.sets} série${block.sets > 1 ? "s" : ""}`;
  }
  return `${block.sets} × ${formatTarget(block)}`;
}
