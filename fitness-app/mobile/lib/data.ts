/**
 * Façade de données — SEULE porte d'entrée des écrans vers le backend.
 *
 * Aucun écran n'importe `supabase` ou `fetch` directement. Ça permet :
 *  - de basculer live ↔ démo sans toucher aux écrans
 *  - de garder les noms de colonnes confinés à cette couche
 *  - de tester les écrans sans réseau
 *
 * Répartition (contrainte projet) :
 *  - Supabase SDK  → auth + CRUD standard
 *  - FastAPI       → /workout/generate et /feedback/redirect uniquement
 */

import { generateWorkout } from "./api";
import * as demo from "./demoStore";
import {
  EXERCISES,
  FEEDBACK_POLL_OPTIONS,
  FEEDBACK_POLL_QUESTIONS,
  PERSONAS,
  PERSONA_PROGRAM_ELIGIBILITY,
  PROGRAMS,
  PROGRAM_PHASES,
  QUESTIONNAIRE_OPTIONS,
  QUESTIONNAIRE_QUESTIONS,
} from "./fixtures";
import { FOCUS_CATEGORY_MAP, buildSessionLabel, resolveFocus } from "./protocol";
import { overdueCount } from "./plan";
import {
  DEFAULT_BODY_WEIGHT_KG,
  computeStats,
  logsThisWeek,
} from "./metrics";
import type { SessionLog, SetLog, TrainingStats } from "./metrics";
import type { PlannedSession } from "./plan";
import { profileFromUser } from "./profile";
import type { Profile } from "./profile";
import { computeStreak, resolveProgramId } from "./scoring";
import { isDemoMode, supabase } from "./supabase";
import type {
  AppUser,
  DashboardData,
  FeedbackAnswers,
  FeedbackOutcome,
  FeedbackPollOption,
  FeedbackPollQuestion,
  NextSessionPreview,
  OnboardingResult,
  Persona,
  PersonaScores,
  Program,
  ProgramPhase,
  Protocol,
  QuestionnaireOption,
  TimeBudget,
  TrainingLocation,
  QuestionnaireQuestion,
  UserProgram,
  WorkoutResponse,
  WorkoutSession,
} from "./types";

export { isDemoMode };

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────

export interface AuthResult {
  userId: string;
  email: string;
  onboardingCompleted: boolean;
}

export async function signUp(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (isDemoMode()) {
    const user = demo.demoSignUp(email);
    return { userId: user.id, email, onboardingCompleted: false };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Inscription impossible — aucun utilisateur renvoyé.");

  // La ligne `users` double la table auth.users : elle porte le persona et
  // les réponses du questionnaire.
  const { error: upsertError } = await supabase
    .from("users")
    .upsert({ id: data.user.id, email, onboarding_completed: false });
  if (upsertError) throw new Error(upsertError.message);

  return { userId: data.user.id, email, onboardingCompleted: false };
}

export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (isDemoMode()) {
    const user = demo.demoSignIn(email);
    return {
      userId: user.id,
      email,
      onboardingCompleted: user.onboarding_completed,
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);

  const profile = await getCurrentUser(data.user.id);
  return {
    userId: data.user.id,
    email,
    onboardingCompleted: profile?.onboarding_completed ?? false,
  };
}

export async function signOut(): Promise<void> {
  if (isDemoMode()) {
    demo.demoSignOut();
    return;
  }
  await supabase.auth.signOut();
}

export async function getCurrentUser(userId: string): Promise<AppUser | null> {
  if (isDemoMode()) return demo.demoCurrentUser();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as AppUser) ?? null;
}

// ─────────────────────────────────────────────
// Questionnaire (tables de référence, lecture publique)
// ─────────────────────────────────────────────

export async function fetchQuestionnaire(): Promise<{
  questions: QuestionnaireQuestion[];
  options: QuestionnaireOption[];
}> {
  if (isDemoMode()) {
    return {
      questions: QUESTIONNAIRE_QUESTIONS,
      options: QUESTIONNAIRE_OPTIONS,
    };
  }

  const [qRes, oRes] = await Promise.all([
    supabase
      .from("questionnaire_questions")
      .select("*")
      .order("question_number"),
    supabase.from("questionnaire_options").select("*"),
  ]);
  if (qRes.error) throw new Error(qRes.error.message);
  if (oRes.error) throw new Error(oRes.error.message);

  return {
    questions: (qRes.data ?? []) as QuestionnaireQuestion[],
    options: (oRes.data ?? []) as QuestionnaireOption[],
  };
}

/**
 * Persiste le résultat du questionnaire et crée le programme actif.
 *
 * Le persona SAV a `primary_program_id = null` (il tourne sur les 5 programmes) ;
 * `resolveProgramId` retombe alors sur la matrice d'éligibilité, sinon l'insert
 * échouerait sur la contrainte NOT NULL de user_programs.program_id.
 */
export async function submitQuestionnaire(
  userId: string,
  answers: Record<string, string | string[]>,
  scores: PersonaScores,
  personaId: string,
): Promise<OnboardingResult> {
  if (isDemoMode()) {
    const { userProgram } = demo.demoCompleteOnboarding(
      answers,
      scores,
      personaId,
      new Date(),
    );
    return {
      persona: PERSONAS.find((p) => p.id === personaId)!,
      program: PROGRAMS.find((p) => p.id === userProgram.program_id)!,
      scores,
    };
  }

  const { data: persona, error: personaError } = await supabase
    .from("personas")
    .select("*")
    .eq("id", personaId)
    .single();
  if (personaError) throw new Error(personaError.message);

  const { data: eligibility, error: eligError } = await supabase
    .from("persona_program_eligibility")
    .select("*")
    .eq("persona_id", personaId);
  if (eligError) throw new Error(eligError.message);

  const programId = resolveProgramId(persona as Persona, eligibility ?? []);
  if (!programId) {
    throw new Error(`Aucun programme éligible pour le persona ${personaId}.`);
  }

  const { data: program, error: programError } = await supabase
    .from("programs")
    .select("*")
    .eq("id", programId)
    .single();
  if (programError) throw new Error(programError.message);

  const { data: firstPhase } = await supabase
    .from("program_phases")
    .select("id")
    .eq("program_id", programId)
    .order("phase_number")
    .limit(1)
    .maybeSingle();

  const { error: userError } = await supabase.from("users").upsert({
    id: userId,
    persona_id: personaId,
    questionnaire_answers: answers,
    questionnaire_scores: scores,
    onboarding_completed: true,
  });
  if (userError) throw new Error(userError.message);

  // Un seul programme actif à la fois.
  await supabase
    .from("user_programs")
    .update({ status: "abandoned" })
    .eq("user_id", userId)
    .eq("status", "active");

  const { error: programInsertError } = await supabase
    .from("user_programs")
    .insert({
      user_id: userId,
      program_id: programId,
      persona_id: personaId,
      protocol: (program as Program).default_protocol,
      status: "active",
      current_phase_id: firstPhase?.id ?? null,
      current_week: 1,
      total_sessions_completed: 0,
    });
  if (programInsertError) throw new Error(programInsertError.message);

  return {
    persona: persona as Persona,
    program: program as Program,
    scores,
  };
}

// ─────────────────────────────────────────────
// Onboarding result
// ─────────────────────────────────────────────

export async function fetchOnboardingResult(
  userId: string,
): Promise<OnboardingResult | null> {
  if (isDemoMode()) {
    const user = demo.demoCurrentUser();
    const up = demo.demoActiveProgram();
    if (!user?.persona_id || !up) return null;
    return {
      persona: PERSONAS.find((p) => p.id === user.persona_id)!,
      program: PROGRAMS.find((p) => p.id === up.program_id)!,
      scores: user.questionnaire_scores ?? { SMB: 0, BF: 0, AW: 0, CR: 0, SAV: 0 },
    };
  }

  const user = await getCurrentUser(userId);
  if (!user?.persona_id) return null;

  const [personaRes, upRes] = await Promise.all([
    supabase.from("personas").select("*").eq("id", user.persona_id).single(),
    supabase
      .from("user_programs")
      .select("program_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
  ]);
  if (personaRes.error) throw new Error(personaRes.error.message);
  if (!upRes.data) return null;

  const { data: program, error } = await supabase
    .from("programs")
    .select("*")
    .eq("id", upRes.data.program_id)
    .single();
  if (error) throw new Error(error.message);

  return {
    persona: personaRes.data as Persona,
    program: program as Program,
    scores: user.questionnaire_scores ?? { SMB: 0, BF: 0, AW: 0, CR: 0, SAV: 0 },
  };
}

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────

/** Aperçu de la prochaine séance, lu dans le plan du cycle. */
function previewFromPlan(
  planned: PlannedSession | null,
  userProgram: UserProgram,
  program: Program,
): NextSessionPreview {
  const protocol: Protocol =
    userProgram.protocol ?? program.default_protocol ?? "full_body";
  if (planned) {
    return {
      day_number: planned.day_number,
      week_number: planned.week_number,
      focus: planned.focus,
      session_label: planned.session_label,
      protocol: planned.protocol,
      scheduled_date: planned.scheduled_date,
    };
  }
  // Plan épuisé : le cycle est terminé.
  const focus = resolveFocus(protocol, userProgram.total_sessions_completed + 1);
  return {
    day_number: userProgram.total_sessions_completed + 1,
    week_number: userProgram.current_week,
    focus,
    session_label: buildSessionLabel(focus),
    protocol,
    scheduled_date: null,
  };
}

const PREVIEW_COUNT = 3;

/** Noms d'exercices affichés en puces sur la carte « prochaine séance ». */
async function previewExerciseNames(
  focus: string,
  programId: string,
): Promise<string[]> {
  const categories = FOCUS_CATEGORY_MAP[focus as keyof typeof FOCUS_CATEGORY_MAP] ?? [];
  if (categories.length === 0) return [];

  if (isDemoMode()) {
    // On montre les compounds : ce sont eux qui ouvrent la séance.
    return EXERCISES.filter(
      (e) =>
        categories.includes(e.category) &&
        e.exercise_type === "compound" &&
        (e.target_programs.length === 0 || e.target_programs.includes(programId)),
    )
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, PREVIEW_COUNT)
      .map((e) => e.name);
  }

  const { data } = await supabase
    .from("exercises")
    .select("name")
    .in("category", categories)
    .eq("exercise_type", "compound")
    .contains("target_programs", [programId])
    .order("id")
    .limit(PREVIEW_COUNT);

  return (data ?? []).map((e: { name: string }) => e.name);
}

export async function fetchDashboard(
  userId: string,
  now: Date,
): Promise<DashboardData | null> {
  if (isDemoMode()) {
    const up = demo.demoProgram();
    if (!up) return null;
    const program = PROGRAMS.find((p) => p.id === up.program_id)!;
    const phase =
      PROGRAM_PHASES.find((ph) => ph.id === up.current_phase_id) ?? null;
    const sessions = demo.demoSessions();
    const completed = sessions.filter((s) => s.status === "completed");
    const plan = demo.demoPlan();
    const done = demo.demoCompletedDayNumbers();
    const nextSession = previewFromPlan(demo.demoNextPlanned(), up, program);
    return {
      userProgram: up,
      program,
      phase,
      nextSession,
      streak: computeStreak(
        completed.map((s) => s.completed_at),
        now,
      ),
      completedCount: up.total_sessions_completed,
      previewExercises: await previewExerciseNames(nextSession.focus, program.id),
      totalPlanned: plan.length,
      cycleComplete: demo.demoCycleComplete(),
      overdue: overdueCount(plan, done, now),
    };
  }

  const { data: up, error } = await supabase
    .from("user_programs")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!up) return null;

  const userProgram = up as UserProgram;

  const [programRes, phaseRes, sessionsRes] = await Promise.all([
    supabase.from("programs").select("*").eq("id", userProgram.program_id).single(),
    userProgram.current_phase_id
      ? supabase
          .from("program_phases")
          .select("*")
          .eq("id", userProgram.current_phase_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("sessions")
      .select("completed_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false }),
  ]);
  if (programRes.error) throw new Error(programRes.error.message);

  const program = programRes.data as Program;
  const nextSession = previewFromPlan(null, userProgram, program);

  return {
    userProgram,
    program,
    // program_lactate n'a aucune phase — le moteur retombe sur le programme.
    phase: (phaseRes.data as ProgramPhase) ?? null,
    nextSession,
    streak: computeStreak(
      (sessionsRes.data ?? []).map((s: { completed_at: string | null }) => s.completed_at),
      now,
    ),
    completedCount: userProgram.total_sessions_completed,
    previewExercises: await previewExerciseNames(nextSession.focus, program.id),
    totalPlanned: userProgram.total_sessions_planned ?? 0,
    cycleComplete: userProgram.status === "completed",
    overdue: 0,
  };
}

// ─────────────────────────────────────────────
// Séance — FastAPI (/workout/generate)
// ─────────────────────────────────────────────

export async function startSession(
  userId: string,
  dashboard: DashboardData,
  energyLevel: number,
  location: TrainingLocation,
  timeBudget: TimeBudget,
): Promise<WorkoutResponse> {
  const request = {
    user_id: userId,
    user_program_id: dashboard.userProgram.id,
    persona_id: dashboard.userProgram.persona_id,
    program_id: dashboard.userProgram.program_id,
    phase_id: dashboard.userProgram.current_phase_id,
    week_number: dashboard.nextSession.week_number,
    day_number: dashboard.nextSession.day_number,
    protocol: dashboard.nextSession.protocol,
    energy_level: energyLevel,
    location,
    time_budget: timeBudget,
    available_equipment: [] as string[],
  };

  if (isDemoMode()) return demo.demoGenerateWorkout(request);
  return generateWorkout(request);
}

/** Vue composée de l'écran profil. */
export interface ProfileView {
  user: AppUser;
  persona: Persona | null;
  program: Program | null;
  profile: Profile;
  completedCount: number;
  totalPlanned: number;
  streak: number;
}

export async function fetchProfile(
  userId: string,
  now: Date,
): Promise<ProfileView | null> {
  if (isDemoMode()) {
    const user = demo.demoCurrentUser();
    if (!user) return null;
    const up = demo.demoProgram();
    const sessions = demo.demoSessions();
    const completed = sessions.filter((s) => s.status === "completed");
    return {
      user,
      persona: PERSONAS.find((p) => p.id === user.persona_id) ?? null,
      program: PROGRAMS.find((p) => p.id === up?.program_id) ?? null,
      profile: profileFromUser(user),
      completedCount: completed.length,
      totalPlanned: demo.demoPlan().length,
      streak: computeStreak(
        completed.map((s) => s.completed_at).filter(Boolean) as string[],
        now,
      ),
    };
  }

  const user = await getCurrentUser(userId);
  if (!user) return null;

  const [{ data: up }, { data: sessions }] = await Promise.all([
    supabase
      .from("user_programs")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("sessions")
      .select("status, completed_at")
      .eq("user_id", userId),
  ]);

  const completed = (sessions ?? []).filter((s) => s.status === "completed");
  const program = up
    ? ((await supabase.from("programs").select("*").eq("id", up.program_id).maybeSingle())
        .data as Program | null)
    : null;

  return {
    user,
    persona: PERSONAS.find((p) => p.id === user.persona_id) ?? null,
    program,
    profile: profileFromUser(user),
    completedCount: completed.length,
    totalPlanned: up?.total_sessions_planned ?? 0,
    streak: computeStreak(
      completed.map((s) => s.completed_at).filter(Boolean) as string[],
      now,
    ),
  };
}

/** Historique des séances, la plus récente d'abord. */
export async function fetchSessionHistory(
  userId: string,
): Promise<WorkoutSession[]> {
  if (isDemoMode()) {
    return [...demo.demoSessions()].sort((a, b) => b.day_number - a.day_number);
  }
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .order("day_number", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as WorkoutSession[]) ?? [];
}

/**
 * Lien de démonstration d'un exercice, s'il en a un d'indexé.
 *
 * Lu dans les fixtures et non en base : la bibliothèque d'exercices est de la
 * donnée de référence, livrée avec l'app et identique dans les deux modes.
 * Ça évite un aller-retour réseau par exercice pendant une séance.
 */
export function exerciseVideoUrl(exerciseId: string): string | null {
  return EXERCISES.find((e) => e.id === exerciseId)?.video_url ?? null;
}

export async function fetchSession(
  sessionId: string,
): Promise<WorkoutSession | null> {
  if (isDemoMode()) return demo.demoGetSession(sessionId);

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as WorkoutSession) ?? null;
}

/**
 * Clôt une séance ET archive les séries réalisées.
 *
 * Les deux ensemble, volontairement : jusqu'ici les charges saisies pendant la
 * séance vivaient dans l'état React de l'écran de suivi et disparaissaient au
 * démontage. Aucun tonnage n'était donc calculable, quelle que soit
 * l'assiduité du pratiquant. `sets` peut être vide (séance sans saisie), mais
 * il n'est plus jamais perdu.
 */
export async function completeSession(
  sessionId: string,
  userProgramId: string,
  completedCountBefore: number,
  now: Date,
  sets: SetLog[] = [],
  userId?: string,
): Promise<void> {
  const completedAt = now.toISOString();

  if (isDemoMode()) {
    demo.demoSaveSessionLog(sessionId, completedAt, sets);
    demo.demoCompleteSession(sessionId, completedAt);
    return;
  }

  const { error } = await supabase
    .from("sessions")
    .update({ status: "completed", completed_at: completedAt })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);

  if (sets.length && userId) {
    // Rejouer une clôture ne doit pas doubler le tonnage de la semaine.
    await supabase.from("session_logs").delete().eq("session_id", sessionId);
    const { error: logError } = await supabase.from("session_logs").insert(
      sets.map((set) => ({
        session_id: sessionId,
        user_id: userId,
        exercise_id: set.exercise_id,
        block_type: set.block_type,
        set_number: set.set_number,
        reps_completed: set.reps,
        load_kg_completed: set.load_kg,
        rest_sec_planned: set.rest_sec_planned,
        completed: set.completed,
        logged_at: completedAt,
      })),
    );
    // Une séance faite reste une séance faite : perdre le journal ne doit pas
    // faire échouer la clôture, on remonte l'erreur sans annuler.
    if (logError) console.warn("session_logs :", logError.message);
  }

  const { error: upError } = await supabase
    .from("user_programs")
    .update({ total_sessions_completed: completedCountBefore + 1 })
    .eq("id", userProgramId);
  if (upError) throw new Error(upError.message);
}

// ─────────────────────────────────────────────
// Historique d'entraînement
// ─────────────────────────────────────────────

/** Ce que l'écran « Mes entraînements » affiche. */
export interface TrainingHistory {
  /** Semaine calendaire en cours, lundi → dimanche. */
  week: TrainingStats;
  /** Depuis la toute première séance, tous programmes confondus. */
  allTime: TrainingStats;
  /** Poids de corps utilisé pour le calcul — null s'il n'est pas renseigné. */
  bodyWeightKg: number | null;
  /** Date de la première séance archivée, pour dater le cumul. */
  since: string | null;
}

export async function fetchTrainingHistory(
  userId: string,
  now: Date,
): Promise<TrainingHistory> {
  const user = await getCurrentUser(userId);
  const declared = user?.body_weight_kg ?? null;
  const weight = declared ?? DEFAULT_BODY_WEIGHT_KG;
  const byId = new Map(EXERCISES.map((e) => [e.id, e]));

  const logs = isDemoMode()
    ? demo.demoSessionLogs()
    : await fetchSessionLogs(userId);

  const sorted = [...logs].sort((a, b) =>
    a.completed_at.localeCompare(b.completed_at),
  );

  return {
    week: computeStats(logsThisWeek(sorted, now), byId, weight),
    allTime: computeStats(sorted, byId, weight),
    bodyWeightKg: declared,
    since: sorted[0]?.completed_at ?? null,
  };
}

/** Lignes `session_logs` regroupées par séance. */
async function fetchSessionLogs(userId: string): Promise<SessionLog[]> {
  const { data, error } = await supabase
    .from("session_logs")
    .select(
      "session_id, exercise_id, block_type, set_number, reps_completed, load_kg_completed, rest_sec_planned, completed, logged_at",
    )
    .eq("user_id", userId)
    .order("logged_at");
  if (error) throw new Error(error.message);

  const bySession = new Map<string, SessionLog>();
  for (const row of data ?? []) {
    const existing = bySession.get(row.session_id);
    const log =
      existing ??
      ({ session_id: row.session_id, completed_at: row.logged_at, sets: [] } as SessionLog);
    log.sets.push({
      exercise_id: row.exercise_id,
      block_type: row.block_type,
      set_number: row.set_number ?? 1,
      reps: row.reps_completed,
      load_kg: row.load_kg_completed,
      rest_sec_planned: row.rest_sec_planned,
      completed: row.completed ?? false,
    });
    if (!existing) bySession.set(row.session_id, log);
  }
  return [...bySession.values()];
}

/**
 * Déclare le poids de corps. Recalcule tout l'historique au passage : le
 * tonnage des tractions passées est réévalué au nouveau poids, ce qui est
 * volontaire — c'est la meilleure estimation disponible, pas un archivage.
 */
export async function updateBodyWeight(
  userId: string,
  kg: number | null,
): Promise<void> {
  if (isDemoMode()) {
    demo.demoSetBodyWeight(kg);
    return;
  }
  const { error } = await supabase
    .from("users")
    .update({ body_weight_kg: kg })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────
// Feedback poll
// ─────────────────────────────────────────────

export async function fetchFeedbackPoll(): Promise<{
  questions: FeedbackPollQuestion[];
  options: FeedbackPollOption[];
}> {
  if (isDemoMode()) {
    return {
      questions: FEEDBACK_POLL_QUESTIONS,
      options: FEEDBACK_POLL_OPTIONS,
    };
  }

  const [qRes, oRes] = await Promise.all([
    supabase
      .from("feedback_poll_questions")
      .select("*")
      .order("question_number"),
    supabase.from("feedback_poll_options").select("*"),
  ]);
  if (qRes.error) throw new Error(qRes.error.message);
  if (oRes.error) throw new Error(oRes.error.message);

  return {
    questions: (qRes.data ?? []) as FeedbackPollQuestion[],
    options: (oRes.data ?? []) as FeedbackPollOption[],
  };
}

/**
 * Score du feedback — 05_feedback_poll.json :
 *   scoring_formula : (score_q1 + score_q2) / 2
 *   score_q2        : 5 si "nothing", sinon 5 - sub_scale_value
 */
export function scoreFeedback(
  answers: FeedbackAnswers,
  options: FeedbackPollOption[],
): FeedbackOutcome {
  const scoreQ2 =
    answers.q2_factor === "nothing" ? 5 : 5 - (answers.q2_subscale ?? 0);
  const scoreGlobal = (answers.score_q1 + scoreQ2) / 2;

  const tier =
    scoreGlobal >= 4 ? "very_satisfied" : scoreGlobal >= 3 ? "moderate" : "unsatisfied";

  const factorOption = options.find(
    (o) => o.question_id === "fp_q2" && o.value === answers.q2_factor,
  );
  const objectiveOption = options.find(
    (o) => o.question_id === "fp_q3" && o.value === answers.q3_new_objective,
  );

  return {
    score_global: scoreGlobal,
    satisfaction_tier: tier,
    applied_variant_ids: factorOption?.maps_to_variant ?? [],
    redirected_program_id: objectiveOption?.maps_to_program_id ?? null,
  };
}
