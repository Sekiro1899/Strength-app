/**
 * Contrat d'interface — types miroir exact du backend.
 *
 * Sources de vérité :
 *  - Tables/enums  : fitness-app/docs/schema.sql
 *  - Payload API   : fitness-app/backend/models/workout.py
 *
 * Toute divergence ici est un bug. Ne pas "améliorer" les noms de champs :
 * ils doivent correspondre littéralement aux colonnes Postgres / champs Pydantic.
 */

// ─────────────────────────────────────────────
// Enums (CHECK constraints de schema.sql)
// ─────────────────────────────────────────────

export type PersonaCode = "SMB" | "BF" | "AW" | "CR" | "SAV";

/** generator.py → PROTOCOL_SCHEDULE. Attention : "push_pull_leg" au singulier. */
export type Protocol = "full_body" | "upper_lower" | "push_pull" | "push_pull_leg";

export type Focus = "push" | "pull" | "legs" | "upper" | "lower" | "full_body";

export type SessionStatus = "planned" | "in_progress" | "completed" | "skipped";

export type UserProgramStatus = "active" | "completed" | "paused" | "abandoned";

export type BlockType = "warmup" | "main" | "core" | "finisher";

export type EligibilityRank = "primary" | "secondary" | "tertiary" | "excluded";

export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "scale_1_5"
  | "qcm_with_subscale";

export type FeedbackFactor =
  | "difficulty"
  | "time"
  | "boredom"
  | "equipment"
  | "recovery"
  | "nothing";

export type SatisfactionTier = "very_satisfied" | "moderate" | "unsatisfied";

// ─────────────────────────────────────────────
// Tables de référence (seed, lecture publique)
// ─────────────────────────────────────────────

export interface Program {
  id: string;
  code: string;
  name: string;
  slug: string;
  tagline: string | null;
  objective: string;
  duration_weeks: number | null;
  /** true pour program_lactate — pas de date de fin. */
  is_continuous: boolean | null;
  frequency_per_week_min: number;
  frequency_per_week_max: number;
  session_duration_min: number;
  session_duration_max: number;
  rep_range_min: number | null;
  rep_range_max: number | null;
  available_protocols: Protocol[] | null;
  default_protocol: Protocol | null;
  /** split : découpage PPL / Upper-Lower / Full Body. circuit : complexes full body. */
  session_structure: SessionStructure;
  has_core_block: boolean;
  color: string | null;
  icon: string | null;
}

export interface ProgramPhase {
  id: string;
  program_id: string;
  phase_number: number;
  name: string;
  duration_weeks: number;
  objective: string | null;
  approach: string | null;
  rep_range_min: number | null;
  rep_range_max: number | null;
  sets_compounds: number | null;
  sets_isolation: number | null;
  load_pct_1rm: number | null;
  rest_sec_min: number | null;
  rest_sec_max: number | null;
  progression_rule: string | null;
  notes: string | null;
}

export interface Persona {
  id: string;
  code: PersonaCode;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  objective: string;
  objective_label: string | null;
  experience_level: string | null;
  sessions_per_week_min: number | null;
  sessions_per_week_max: number | null;
  session_duration_min_min: number | null;
  session_duration_min_max: number | null;
  /** null pour SAV — le programme se résout via persona_program_eligibility. */
  primary_program_id: string | null;
  secondary_program_id: string | null;
  tertiary_program_id: string | null;
  color: string | null;
  icon: string | null;
}

export interface PersonaProgramEligibility {
  id: string;
  persona_id: string;
  program_id: string;
  eligibility_rank: EligibilityRank;
  rank_order: number | null;
  rationale: string | null;
  sav_rotation_day: string | null;
}

export interface QuestionnaireQuestion {
  id: string;
  questionnaire_id: string;
  question_number: number;
  text: string;
  type: QuestionType;
  segmentation_role: string | null;
  note: string | null;
}

export interface QuestionnaireOption {
  id: string;
  question_id: string;
  label: string;
  value: string;
  maps_to_objective: string | null;
  maps_to_duration_max: number | null;
  maps_to_frequency_min: number | null;
  maps_to_frequency_max: number | null;
  maps_to_environment: string | null;
  score_smb: number;
  score_bf: number;
  score_aw: number;
  score_cr: number;
  score_sav: number;
  has_malus: boolean | null;
  /** q8_d "Flexible" — désélectionne les autres choix. */
  is_exclusive: boolean | null;
  is_sav_exclusive_signal: boolean | null;
}

export type ExerciseCategory =
  | "push"
  | "pull"
  | "arms"
  | "legs"
  | "core_strength"
  | "core_endurance"
  | "explosive"
  | "complex"
  | "conditioning"
  | "warmup"
  | "finisher";

export type ExerciseLevel = "debutant" | "intermediaire" | "avance";

export type SessionStructure = "split" | "circuit";

/** Lieu déclaré en début de séance — décide du matériel disponible. */
export type TrainingLocation = "gym" | "home" | "outdoor";

/**
 * Temps annoncé en début de séance. Le superset n'est pas une norme : il sert
 * à tenir la séance dans le créneau disponible, et n'apparaît donc que quand
 * ce créneau est contraint.
 */
/**
 * Créneau annoncé avant la séance. Deux réponses suffisent : soit on est
 * pressé, soit non. Un troisième palier « large » ne changeait rien à la
 * composition — il ne faisait qu'ajouter une question sans conséquence.
 */
export type TimeBudget = "short" | "standard";

/** Décide dans quel bloc l'exercice tombe — prime sur la catégorie. */
export type ExerciseType = "compound" | "isolation" | "core" | "cardio";

/**
 * Patron de mouvement — renseigné sur les exercices de core uniquement.
 * Sert à tirer un bloc varié plutôt que deux gainages d'affilée.
 */
export type MovementPattern =
  | "anti_extension"
  | "flexion"
  | "extension"
  | "rotation"
  | "anti_lateral_flexion"
  | "hip_flexion";

export interface Exercise {
  id: string;
  category: ExerciseCategory;
  name: string;
  muscles_primary: string[];
  muscles_secondary: string[];
  intent: string[];
  level: ExerciseLevel;
  bodyweight_compatible: boolean;
  material_required: string[] | null;
  /** Vocabulaire fermé dérivé de material_required à l'import. */
  equipment_tags: string[];
  /** Lieux où l'exercice est praticable. */
  locations: TrainingLocation[];
  warmup_target: string[] | null;
  description: string | null;
  exercise_type: ExerciseType | null;
  /** Non-null sur les exercices de core — pilote la diversité du bloc. */
  movement_pattern: MovementPattern | null;
  /**
   * Famille de mouvement : deux exercices de la même famille sont équivalents
   * (tractions et tractions négatives), on ne les enchaîne pas dans une séance.
   */
  movement_family: string | null;
  /**
   * Variante allégée d'un mouvement. Sa place est dans le bloc principal d'un
   * débutant ou d'un pratiquant âgé ; pour les autres elle ne charge pas assez.
   */
  is_regression: boolean;
  /** Démonstration YouTube. Null = repli sur une recherche par nom. */
  video_url: string | null;
  /**
   * Format imposé par l'exercice lui-même — un AMRAP 20 min ou un EMOM 30 ne
   * se découpe pas en séries standard. Null = prescription du programme.
   */
  prescribed_sets: number | null;
  prescribed_duration_sec: number | null;
  /** Vide = universel (warmups et finishers servent tous les programmes). */
  target_programs: string[];
  image_url: string | null;
}

export interface FeedbackPollQuestion {
  id: string;
  poll_id: string;
  question_number: number;
  text: string;
  type: QuestionType;
  stores_as: string | null;
  stores_factor_as: string | null;
  scoring_rule: string | null;
  /** Présent uniquement sur fp_q2 — échelle d'impact 1..3. */
  subscale: {
    text: string;
    options: { value: number; label: string; sublabel: string | null }[];
  } | null;
}

export interface FeedbackPollOption {
  id: string;
  question_id: string;
  value: string;
  label: string;
  sublabel: string | null;
  numeric_value: number | null;
  has_subscale: boolean;
  fixed_score: number | null;
  maps_to_variant: string[];
  maps_to_program_id: string | null;
  triggers_alternative_pitch: boolean;
}

export interface FeedbackAnswers {
  score_q1: number;
  q2_factor: FeedbackFactor;
  q2_subscale: number | null;
  q3_new_objective: string;
}

export interface FeedbackOutcome {
  score_global: number;
  satisfaction_tier: SatisfactionTier;
  applied_variant_ids: string[];
  redirected_program_id: string | null;
}

// ─────────────────────────────────────────────
// Tables runtime (RLS user-scoped)
// ─────────────────────────────────────────────

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  persona_id: string | null;
  questionnaire_answers: Record<string, string | string[]> | null;
  questionnaire_scores: PersonaScores | null;
  experience_level: string | null;
  sessions_per_week: number | null;
  session_duration_target: number | null;
  onboarding_completed: boolean;
}

export interface UserProgram {
  id: string;
  user_id: string;
  program_id: string;
  persona_id: string;
  protocol: Protocol | null;
  status: UserProgramStatus;
  current_phase_id: string | null;
  current_week: number;
  start_date: string;
  total_sessions_planned: number | null;
  total_sessions_completed: number;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  user_program_id: string;
  phase_id: string | null;
  week_number: number;
  day_number: number;
  session_label: string | null;
  protocol: Protocol | null;
  focus: Focus | null;
  status: SessionStatus;
  energy_level: number | null;
  location: TrainingLocation | null;
  time_budget: TimeBudget | null;
  warmup_block: ExerciseBlock[] | null;
  main_block: ExerciseBlock[] | null;
  core_block: ExerciseBlock[] | null;
  finisher_block: ExerciseBlock[] | null;
  scheduled_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  actual_duration_min: number | null;
}

// ─────────────────────────────────────────────
// Payload FastAPI — models/workout.py
// ─────────────────────────────────────────────

/**
 * Miroir de models.workout.ExerciseBlock.
 * Le backend sérialise avec `model_dump(exclude_none=True)` : tout champ null
 * est ABSENT du JSON, d'où les `?` plutôt que `| null`.
 */
export interface ExerciseBlock {
  exercise_id: string;
  name: string;
  sets: number;
  reps?: number;
  /** Borne haute quand la prescription est une plage (10-12 plutôt que 11). */
  reps_max?: number;
  /** Exclusif avec `reps` — gainage, EMOM, conditionnement. */
  duration_sec?: number;
  load_pct_1rm?: number;
  rest_sec?: number;
  superset_with?: string;
  notes?: string;
  /** False sur warmup et finisher : pas de saisie de résultats côté client. */
  log_results?: boolean;
  /**
   * Nom du protocole de force quand la prescription en suit un (5x5, 3x5).
   * Purement informatif : la charge et les séries sont déjà dans le bloc.
   */
  protocol_label?: string;
  /** Comment monter ou descendre en difficulté — voir lib/scaling.ts. */
  scaling?: ExerciseScaling;
}

/**
 * Progression d'un exercice au poids de corps : ce qu'on fait quand les
 * répétitions demandées sont trop faciles, et quand elles sont hors d'atteinte.
 */
export interface ExerciseScaling {
  /** Vers le haut — ceinture lestée, gilet. */
  harder: string;
  /** Vers le bas — élastique, variante assistée. */
  easier: string;
  /** Démonstration de la variante allégée. */
  video_url?: string | null;
  /** Terme de recherche vidéo quand aucun lien n'est encore indexé. */
  video_query: string;
}

/** Miroir de models.workout.WorkoutRequest (defaults Pydantic inclus). */
export interface WorkoutRequest {
  user_id: string;
  user_program_id: string;
  persona_id: string;
  program_id: string;
  phase_id?: string | null;
  week_number?: number;
  day_number?: number;
  protocol?: Protocol | null;
  focus?: Focus | null;
  /** Contrainte Pydantic : ge=1, le=5. */
  energy_level?: number;
  available_equipment?: string[];
  /** Lieu d'entraînement du jour. */
  location?: TrainingLocation;
  /** Créneau annoncé — décide de la mise en superset. */
  time_budget?: TimeBudget;
}

/** Miroir de models.workout.WorkoutResponse. */
export interface WorkoutResponse {
  session_id: string;
  program_id: string;
  phase_id: string | null;
  protocol: Protocol;
  focus: Focus;
  session_label: string;
  warmup_block: ExerciseBlock[];
  main_block: ExerciseBlock[];
  core_block: ExerciseBlock[];
  finisher_block: ExerciseBlock[];
}

// ─────────────────────────────────────────────
// Scoring persona
// ─────────────────────────────────────────────

export type PersonaScores = Record<PersonaCode, number>;

export interface ScoringResult {
  winner: PersonaCode;
  scores: PersonaScores;
  /** true si départagé par la règle CR > SMB > AW > BF > SAV. */
  tied: boolean;
}

// ─────────────────────────────────────────────
// Vues composées consommées par les écrans
// ─────────────────────────────────────────────

export interface OnboardingResult {
  persona: Persona;
  program: Program;
  scores: PersonaScores;
}

export interface DashboardData {
  userProgram: UserProgram;
  program: Program;
  phase: ProgramPhase | null;
  nextSession: NextSessionPreview;
  streak: number;
  completedCount: number;
  /** Quelques noms d'exercices du focus à venir, pour l'aperçu du dashboard. */
  previewExercises: string[];
  /** Nombre total de séances du cycle. */
  totalPlanned: number;
  /** Toutes les séances sont faites -> écran de fin de cycle + feedback. */
  cycleComplete: boolean;
  /** Séances dont la date est passée sans avoir été réalisées. */
  overdue: number;
}

/** Prochaine séance dérivée de user_programs — pas encore générée en base. */
export interface NextSessionPreview {
  day_number: number;
  week_number: number;
  focus: Focus;
  session_label: string;
  protocol: Protocol;
  /** Date planifiée (YYYY-MM-DD), null si le cycle est terminé. */
  scheduled_date: string | null;
}
