/**
 * Panneau d'administration — accès, schéma d'exercice, écriture.
 *
 * ── L'ACCÈS ────────────────────────────────────────────────────────────
 * Il repose sur `users.role = 'admin'` côté Supabase, avec des policies RLS
 * qui refusent l'écriture à tout le reste (voir la migration
 * supabase/migrations/*_admin_role.sql). Le masquage de l'écran côté client
 * est un CONFORT, jamais une sécurité : le bundle JavaScript est lisible par
 * quiconque ouvre l'application. Le seul verrou qui compte est celui du
 * serveur.
 *
 * En mode démo il n'y a ni serveur, ni rôle, ni données d'autrui : le panneau
 * s'ouvre en LECTURE SEULE, sur la bibliothèque déjà présente dans le bundle.
 * Rien de nouveau n'y est exposé, et aucune écriture n'est possible.
 *
 * ── L'ÉCRITURE ─────────────────────────────────────────────────────────
 * Un exercice ajouté part dans la table `exercises` de Supabase. C'est bien
 * lui qui « rentre dans le moteur » : le générateur Python lit cette table à
 * chaque séance (`backend/engine/exercise_selector.py`). Aucune étape de
 * déploiement n'est nécessaire — l'exercice est tirable à la séance suivante.
 */

import { EXERCISES } from "./fixtures";
import { isDemoMode, supabase } from "./supabase";
import type {
  Exercise,
  ExerciseCategory,
  ExerciseLevel,
  ExerciseType,
  MovementPattern,
  TrainingLocation,
} from "./types";

// ─────────────────────────────────────────────
// Accès
// ─────────────────────────────────────────────

export interface AdminAccess {
  /** L'écran peut s'ouvrir. */
  allowed: boolean;
  /** L'écriture est possible. Faux en démo, faux sans rôle admin. */
  canWrite: boolean;
  /** À afficher quand `canWrite` est faux — dire pourquoi vaut mieux que griser. */
  reason: string | null;
}

const DEMO_REASON =
  "Mode démo : la bibliothèque s'affiche telle qu'elle est livrée, mais rien ne peut être écrit. L'ajout d'exercice passe par Supabase — voir docs/SUPABASE.md.";

const NOT_ADMIN_REASON =
  "Ce compte n'a pas le rôle administrateur. L'écriture est refusée par le serveur, pas seulement masquée ici.";

export async function fetchAdminAccess(userId: string): Promise<AdminAccess> {
  if (isDemoMode()) {
    return { allowed: true, canWrite: false, reason: DEMO_REASON };
  }

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  // Une erreur de lecture n'est pas une autorisation : on ferme.
  if (error || data?.role !== "admin") {
    return { allowed: false, canWrite: false, reason: NOT_ADMIN_REASON };
  }
  return { allowed: true, canWrite: true, reason: null };
}

// ─────────────────────────────────────────────
// Vocabulaires
// ─────────────────────────────────────────────

export const CATEGORIES: ExerciseCategory[] = [
  "push",
  "pull",
  "arms",
  "legs",
  "core_strength",
  "core_endurance",
  "explosive",
  "complex",
  "conditioning",
  "warmup",
  "finisher",
];

export const EXERCISE_TYPES: ExerciseType[] = [
  "compound",
  "isolation",
  "core",
  "cardio",
];

export const LEVELS: ExerciseLevel[] = ["debutant", "intermediaire", "avance"];

export const LOCATIONS: TrainingLocation[] = ["gym", "home", "outdoor"];

export const MOVEMENT_PATTERNS: MovementPattern[] = [
  "anti_extension",
  "flexion",
  "extension",
  "rotation",
  "anti_lateral_flexion",
  "hip_flexion",
];

export const INTENTS = [
  "force",
  "hypertrophie",
  "endurance",
  "explosivite",
  "cardio",
  "mobilite",
  "stabilite",
];

export const WARMUP_TARGETS = [
  "all",
  "push",
  "pull",
  "leg",
  "squat",
  "deadlift",
  "bench",
  "ohp",
  "single_leg",
];

/** Vocabulaire fermé — dérivé de `material_required` à l'import. */
export const EQUIPMENT_TAGS = [
  "barbell",
  "dumbbell",
  "kettlebell",
  "plate",
  "cable",
  "machine",
  "bench",
  "rack",
  "pullup_bar",
  "rings",
  "band",
  "rope",
  "box",
  "mat",
  "ball",
  "wheel",
];

/**
 * Familles déjà en usage. Ce n'est pas une liste fermée — une nouvelle famille
 * est légitime — mais réutiliser une famille existante est presque toujours ce
 * qu'on veut : c'est elle qui empêche deux mouvements équivalents de tomber
 * dans la même séance.
 */
export function knownMovementFamilies(): string[] {
  return [...new Set(EXERCISES.map((e) => e.movement_family).filter(Boolean))]
    .sort() as string[];
}

// ─────────────────────────────────────────────
// Axes de regroupement du Kanban
// ─────────────────────────────────────────────

export type KanbanAxis = "role" | "category" | "location";

export const KANBAN_AXES: { key: KanbanAxis; label: string; hint: string }[] = [
  {
    key: "role",
    label: "Rôle moteur",
    hint: "C'est cet axe que le générateur utilise pour composer une séance.",
  },
  {
    key: "category",
    label: "Catégorie",
    hint: "Le découpage musculaire, tel qu'on lit une salle.",
  },
  {
    key: "location",
    label: "Lieu",
    hint: "Un exercice praticable à plusieurs endroits apparaît dans plusieurs colonnes.",
  },
];

/**
 * Les colonnes d'un axe, et à laquelle (ou lesquelles) un exercice appartient.
 *
 * Le rôle moteur mérite une explication : `exercise_type` prime sur la
 * catégorie pour décider du bloc, mais un warmup ou un finisher n'a pas de
 * type — il se range par catégorie. La colonne rend donc la décision réelle du
 * moteur, pas une classification théorique.
 */
export function kanbanColumns(axis: KanbanAxis): string[] {
  if (axis === "role") {
    return ["warmup", "compound", "isolation", "core", "cardio", "finisher", "non classé"];
  }
  if (axis === "category") return CATEGORIES;
  return LOCATIONS;
}

export function columnsFor(exercise: Exercise, axis: KanbanAxis): string[] {
  if (axis === "category") return [exercise.category];
  if (axis === "location") return exercise.locations.length ? exercise.locations : ["gym"];

  if (exercise.category === "warmup") return ["warmup"];
  if (exercise.category === "finisher") return ["finisher"];
  return [exercise.exercise_type ?? "non classé"];
}

/** Libellés lisibles des colonnes — les valeurs machine restent en base. */
export const COLUMN_LABELS: Record<string, string> = {
  warmup: "Échauffement",
  compound: "Compound",
  isolation: "Isolation",
  core: "Gainage",
  cardio: "Cardio",
  finisher: "Finisher",
  "non classé": "Non classé",
  push: "Poussée",
  pull: "Tirage",
  arms: "Bras",
  legs: "Jambes",
  core_strength: "Gainage — force",
  core_endurance: "Gainage — endurance",
  explosive: "Explosif",
  complex: "Complexes",
  conditioning: "Conditionnement",
  gym: "Salle",
  home: "Maison",
  outdoor: "Extérieur",
};

export const label = (key: string) => COLUMN_LABELS[key] ?? key;

// ─────────────────────────────────────────────
// Complétude
// ─────────────────────────────────────────────

/**
 * Champs sans lesquels le moteur se trompe — pas ceux sans lesquels la base
 * refuse la ligne.
 *
 * Un exercice sans `exercise_type` ne tombe dans aucun bloc et n'est jamais
 * tiré. Sans `movement_family`, il peut se retrouver enchaîné avec son propre
 * équivalent dans la même séance. Sans `locations`, il n'est praticable nulle
 * part. Ce sont des absences SILENCIEUSES : rien ne plante, l'exercice
 * n'existe simplement pas pour le générateur.
 *
 * L'exigence suit l'usage réel, sinon l'alerte devient du bruit et on cesse
 * de la lire :
 *
 *  - un échauffement et un finisher n'ont pas de rôle moteur : ils sont
 *    choisis par catégorie ;
 *  - la famille de mouvement ne sert qu'aux programmes en split, qui tirent
 *    dans push / pull / arms / legs. Les circuits composent par catégorie
 *    (complexes, explosif, conditionnement) et ne dédoublonnent pas par
 *    famille — l'exiger là-bas signalerait soixante exercices parfaitement
 *    sains.
 */

/** Catégories choisies par patron de mouvement — donc dédoublonnées. */
const SPLIT_CATEGORIES: ExerciseCategory[] = ["push", "pull", "arms", "legs"];

/** Catégories dont le rôle moteur est déduit, pas déclaré. */
const ROLE_FREE_CATEGORIES: ExerciseCategory[] = ["warmup", "finisher"];

export function missingEngineFields(exercise: Partial<Exercise>): string[] {
  const missing: string[] = [];
  const category = exercise.category;

  if (
    !exercise.exercise_type &&
    !(category && ROLE_FREE_CATEGORIES.includes(category))
  ) {
    missing.push("exercise_type");
  }
  if (
    !exercise.movement_family &&
    category &&
    SPLIT_CATEGORIES.includes(category)
  ) {
    missing.push("movement_family");
  }
  if (!exercise.locations?.length) missing.push("locations");
  if (!exercise.level) missing.push("level");
  if (!exercise.muscles_primary?.length) missing.push("muscles_primary");
  return missing;
}

// ─────────────────────────────────────────────
// Lecture et écriture
// ─────────────────────────────────────────────

/**
 * La bibliothèque telle que l'admin doit la voir.
 *
 * En mode démo, celle du bundle. En live, la table `exercises` — c'est-à-dire
 * exactement ce que le générateur Python lit, y compris les ajouts.
 */
export async function fetchExerciseLibrary(): Promise<Exercise[]> {
  if (isDemoMode()) return EXERCISES;

  const { data, error } = await supabase.from("exercises").select("*").order("id");
  if (error) throw new Error(error.message);
  return (data ?? []) as Exercise[];
}

/**
 * Identifiant suggéré pour un nouvel exercice : le préfixe de la catégorie et
 * le premier numéro libre. Modifiable — c'est une suggestion, pas une règle.
 */
export function suggestId(category: ExerciseCategory, existing: Exercise[]): string {
  const prefix = ID_PREFIX[category] ?? "CUS";
  const used = existing
    .filter((e) => e.id.startsWith(`${prefix}-`))
    .map((e) => Number(e.id.slice(prefix.length + 1)))
    .filter((n) => !Number.isNaN(n));
  const next = (used.length ? Math.max(...used) : 0) + 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

const ID_PREFIX: Record<ExerciseCategory, string> = {
  push: "PUS",
  pull: "PUL",
  arms: "ARM",
  legs: "LEG",
  core_strength: "COR",
  core_endurance: "COR",
  explosive: "EXP",
  complex: "COM",
  conditioning: "CON",
  warmup: "WAR",
  finisher: "FIN",
};

/**
 * Enregistre un exercice. Supabase uniquement — refusé ailleurs plutôt que
 * silencieusement perdu dans un stockage local que personne ne relira.
 */
export async function saveExercise(exercise: Exercise): Promise<void> {
  if (isDemoMode()) {
    throw new Error(DEMO_REASON);
  }
  const { error } = await supabase
    .from("exercises")
    .upsert({ ...exercise, is_custom: true });
  if (error) throw new Error(error.message);
}
