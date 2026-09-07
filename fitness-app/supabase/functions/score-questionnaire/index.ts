import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const PERSONA_CODES = ["SMB", "BF", "AW", "CR", "SAV"] as const;

// Tiebreak: en cas d'égalité, priorité CR > SMB > AW > BF > SAV
const TIEBREAK_ORDER: Record<string, number> = {
  CR: 0,
  SMB: 1,
  AW: 2,
  BF: 3,
  SAV: 4,
};

const PERSONA_CODE_TO_ID: Record<string, string> = {
  SMB: "persona_smb",
  BF: "persona_bf",
  AW: "persona_aw",
  CR: "persona_cr",
  SAV: "persona_sav",
};

interface Answer {
  question_id: string;
  option_ids: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type, apikey",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  // Extraire le JWT de l'utilisateur
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Valider le JWT pour obtenir le user_id
  const anonClient = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const {
    data: { user },
    error: authError,
  } = await anonClient.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
    });
  }

  const userId = user.id;

  // Lire le body
  const { answers } = (await req.json()) as { answers: Answer[] };
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return new Response(
      JSON.stringify({ error: "answers[] is required" }),
      { status: 400 }
    );
  }

  // Récupérer toutes les options sélectionnées
  const allOptionIds = answers.flatMap((a) => a.option_ids);

  const { data: options, error: optError } = await supabase
    .from("questionnaire_options")
    .select("id, question_id, value, score_smb, score_bf, score_aw, score_cr, score_sav, maps_to_objective, maps_to_duration_max, maps_to_frequency_min, maps_to_frequency_max, maps_to_environment, is_sav_exclusive_signal")
    .in("id", allOptionIds);

  if (optError || !options) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch options", detail: optError }),
      { status: 500 }
    );
  }

  // Scoring additif
  const scores: Record<string, number> = {
    SMB: 0,
    BF: 0,
    AW: 0,
    CR: 0,
    SAV: 0,
  };

  let objective: string | null = null;
  let durationMax: number | null = null;
  let frequencyMin: number | null = null;
  let frequencyMax: number | null = null;
  let environment: string | null = null;
  let experienceLevel: string | null = null;

  for (const opt of options) {
    scores.SMB += opt.score_smb ?? 0;
    scores.BF += opt.score_bf ?? 0;
    scores.AW += opt.score_aw ?? 0;
    scores.CR += opt.score_cr ?? 0;
    scores.SAV += opt.score_sav ?? 0;

    if (opt.maps_to_objective) objective = opt.maps_to_objective;
    if (opt.maps_to_duration_max) durationMax = opt.maps_to_duration_max;
    if (opt.maps_to_frequency_min) frequencyMin = opt.maps_to_frequency_min;
    if (opt.maps_to_frequency_max) frequencyMax = opt.maps_to_frequency_max;
    if (opt.maps_to_environment) environment = opt.maps_to_environment;
  }

  // Extraire le niveau d'expérience depuis q7
  const q7Answer = answers.find((a) => a.question_id === "q7");
  if (q7Answer) {
    const q7Opt = options.find((o) => q7Answer.option_ids.includes(o.id));
    if (q7Opt) experienceLevel = q7Opt.value;
  }

  // Extraire l'environnement depuis q8
  const q8Answer = answers.find((a) => a.question_id === "q8");
  if (q8Answer) {
    const q8Opts = options.filter((o) => q8Answer.option_ids.includes(o.id));
    environment = q8Opts.map((o) => o.maps_to_environment).filter(Boolean)[0] ?? environment;
  }

  // Argmax avec tiebreak
  let maxScore = -Infinity;
  let winnerCode = "CR"; // default tiebreak

  for (const code of PERSONA_CODES) {
    const s = scores[code];
    if (
      s > maxScore ||
      (s === maxScore && TIEBREAK_ORDER[code] < TIEBREAK_ORDER[winnerCode])
    ) {
      maxScore = s;
      winnerCode = code;
    }
  }

  const personaId = PERSONA_CODE_TO_ID[winnerCode];

  // Récupérer le persona pour connaître le primary_program_id
  const { data: persona, error: personaError } = await supabase
    .from("personas")
    .select("id, primary_program_id, secondary_program_id, experience_level, sessions_per_week_min")
    .eq("id", personaId)
    .single();

  if (personaError || !persona) {
    return new Response(
      JSON.stringify({ error: "Persona not found", detail: personaError }),
      { status: 500 }
    );
  }

  const programId = persona.primary_program_id;

  // Récupérer la première phase du programme
  let phaseId: string | null = null;
  let protocol: string | null = null;

  if (programId) {
    const { data: phases } = await supabase
      .from("program_phases")
      .select("id")
      .eq("program_id", programId)
      .order("phase_number")
      .limit(1);

    if (phases && phases.length > 0) {
      phaseId = phases[0].id;
    }

    const { data: prog } = await supabase
      .from("programs")
      .select("default_protocol")
      .eq("id", programId)
      .single();

    if (prog) {
      protocol = prog.default_protocol;
    }
  }

  // Mettre à jour l'utilisateur
  const { error: updateError } = await supabase
    .from("users")
    .update({
      persona_id: personaId,
      questionnaire_answers: answers,
      questionnaire_scores: scores,
      experience_level: experienceLevel,
      sessions_per_week: frequencyMin ?? persona.sessions_per_week_min,
      session_duration_target: durationMax,
      preferred_environment: environment ? [environment] : [],
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    return new Response(
      JSON.stringify({ error: "Failed to update user", detail: updateError }),
      { status: 500 }
    );
  }

  // Créer le user_programs
  let userProgramId: string | null = null;

  if (programId) {
    const { data: userProgram, error: upError } = await supabase
      .from("user_programs")
      .insert({
        user_id: userId,
        program_id: programId,
        persona_id: personaId,
        protocol: protocol,
        current_phase_id: phaseId,
        current_week: 1,
      })
      .select("id")
      .single();

    if (upError) {
      return new Response(
        JSON.stringify({ error: "Failed to create user_program", detail: upError }),
        { status: 500 }
      );
    }

    userProgramId = userProgram.id;
  }

  return new Response(
    JSON.stringify({
      persona_id: personaId,
      persona_code: winnerCode,
      scores,
      program_id: programId,
      phase_id: phaseId,
      protocol,
      user_program_id: userProgramId,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
});
