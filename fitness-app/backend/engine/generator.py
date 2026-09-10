"""
Workout Generator — Orchestrateur principal.
Assemble les 4 blocs (warmup, main, core, finisher) en une séance complète.
"""

from database import supabase
from engine.block_builder import (
    fit_session_to_budget,
    session_budget_minutes,
    textbook_label,
    BuildContext,
    build_core_block,
    build_finisher_block,
    build_main_block,
    build_warmup_block,
)
from engine.exercise_selector import session_rng
from models.workout import WorkoutRequest, WorkoutResponse


# ─── Mapping protocole → focus par jour ───

PROTOCOL_SCHEDULE = {
    "full_body": ["full_body"],
    "upper_lower": ["upper", "lower"],
    "push_pull": ["push", "pull"],
    "push_pull_leg": ["push", "pull", "legs"],
}

LEVEL_MAP = {
    "beginner": "debutant",
    "beginner_intermediate": "intermediaire",
    "intermediate": "intermediaire",
    "intermediate_advanced": "avance",
    "advanced": "avance",
}


async def generate_workout(request: WorkoutRequest) -> WorkoutResponse:
    """Point d'entrée principal — génère une séance complète."""

    program = _fetch_program(request.program_id)
    phase = _fetch_phase(request.phase_id, program)
    persona = _fetch_persona(request.persona_id)

    # Résoudre le protocole
    protocol = request.protocol or program.get("default_protocol", "full_body")

    # Résoudre le focus
    focus = request.focus or _resolve_focus(protocol, request.day_number)

    # Le profil du pratiquant prime sur celui du persona : le persona dit une
    # motivation, le questionnaire dit un niveau réel (q7) et un âge (q1).
    # Miroir de mobile/lib/profile.ts.
    profile = _fetch_profile(request.user_id, persona)
    level_max = profile["level"]

    # Générer le label de séance
    session_label = _build_session_label(protocol, focus)

    # Exercices vus lors des dernières séances : la sélection les évite en
    # priorité, ce qui fait varier le contenu d'une séance à l'autre.
    recent_ids = _recent_exercise_ids(request.user_program_id, request.day_number)

    ctx = BuildContext(
        program=program,
        phase=phase,
        focus=focus,
        level_max=level_max,
        energy=request.energy_level,
        location=request.location,
        rng=session_rng(request.user_program_id, request.day_number),
        recent_ids=recent_ids,
        allow_regressions=profile["allow_regressions"],
        day_number=request.day_number,
        time_budget=request.time_budget,
        persona_id=request.persona_id,
        user_program_id=request.user_program_id,
        week_number=request.week_number,
        objective=profile["objective"],
        strength_oriented=profile["strength_oriented"],
        age_band=profile["age_band"],
        session_minutes_max=profile["session_minutes_max"],
        sessions_per_week=profile["sessions_per_week"],
        avoids_impact=profile["avoids_impact"],
        needs_gentle_progression=profile["needs_gentle_progression"],
    )

    # ── Construire les 4 blocs ──
    # Les quatre blocs sont composés indépendamment ; c'est une fois
    # assemblés qu'on sait si la séance tient dans le créneau annoncé.
    blocks = fit_session_to_budget(
        {
            "warmup": build_warmup_block(ctx),
            "main": build_main_block(ctx),
            "core": build_core_block(ctx),
            "finisher": build_finisher_block(ctx),
        },
        session_budget_minutes(ctx),
    )
    warmup, main = blocks["warmup"], blocks["main"]
    core, finisher = blocks["core"], blocks["finisher"]
    # Une séance récitée porte le nom de son programme : le focus prévu au plan
    # ne décrit plus ce qu'elle contient.
    session_label = textbook_label(ctx) or session_label

    # ── Persister dans la table sessions ──
    session_row = {
        "user_id": request.user_id,
        "user_program_id": request.user_program_id,
        "phase_id": phase.get("id"),
        "week_number": request.week_number,
        "day_number": request.day_number,
        "session_label": session_label,
        "protocol": protocol,
        "focus": focus,
        "status": "planned",
        "energy_level": request.energy_level,
        "location": request.location,
        "warmup_block": [b.model_dump(exclude_none=True) for b in warmup],
        "main_block": [b.model_dump(exclude_none=True) for b in main],
        "core_block": [b.model_dump(exclude_none=True) for b in core],
        "finisher_block": [b.model_dump(exclude_none=True) for b in finisher],
    }

    insert_result = supabase.table("sessions").insert(session_row).execute()
    if not insert_result.data:
        raise ValueError("Erreur lors de la persistence de la séance")

    session_id = insert_result.data[0]["id"]

    return WorkoutResponse(
        session_id=session_id,
        program_id=request.program_id,
        phase_id=phase.get("id"),
        protocol=protocol,
        focus=focus,
        session_label=session_label,
        warmup_block=warmup,
        main_block=main,
        core_block=core,
        finisher_block=finisher,
    )


# ─── Helpers ───


ROTATION_WINDOW = 2


# Temps par seance (q5) et frequence (q6) — miroir de mobile/lib/profile.ts.
SESSION_MINUTES = {"under_45min": 45, "60min": 60, "unlimited": 120}
SESSIONS_PER_WEEK = {"1_2_sessions": 2, "3_4_sessions": 4, "5_plus_sessions": 5}


def _fetch_profile(user_id: str, persona: dict) -> dict:
    """
    Niveau et tolérance aux régressions, lus dans les réponses au
    questionnaire. Miroir exact de mobile/lib/profile.ts — toute divergence
    ferait générer deux séances différentes pour le même pratiquant.
    """
    result = (
        supabase.table("users")
        .select("questionnaire_answers")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    answers = (result.data or {}).get("questionnaire_answers") or {}

    def one(key: str):
        value = answers.get(key)
        if isinstance(value, list):
            return value[0] if value else None
        return value

    level = LEVEL_MAP.get(one("q7") or "", None)
    if level is None:
        # Sans réponse exploitable, on retombe sur le persona.
        level = LEVEL_MAP.get(persona.get("experience_level", ""), "intermediaire")
    age_band = one("q1")
    objective = one("q3")
    intensity_style = one("q9")
    session_time = one("q5")
    frequency = one("q6")

    return {
        "level": level,
        "age_band": age_band,
        # Un débutant apprend le mouvement ; après 60 ans, l'entrée en charge
        # se fait plus progressivement. La régression a sa place.
        "allow_regressions": level == "debutant" or age_band == "60_plus",
        "objective": objective,
        "intensity_style": intensity_style,
        # Vient chercher de la charge et de la masse, pas de la sueur : un
        # objectif de musculation (q3) ET un refus de l'intensité cardio (q9).
        # À ce profil, un finisher en AMRAP n'apporte rien qu'il ait demandé.
        "strength_oriented": (
            objective in ("aesthetics", "strength")
            and intensity_style == "prefers_strength_style"
        ),
        # Temps annonce pour UNE seance (q5) : plafond du cycle, distinct du
        # creneau du jour. Repondre « j'ai le temps » un matin ne peut pas
        # depasser ce qu'on a dit pouvoir y consacrer.
        "session_minutes_max": SESSION_MINUTES.get(session_time or "", 60),
        # Seances par semaine (q6), borne haute : le rythme a planifier.
        "sessions_per_week": SESSIONS_PER_WEEK.get(frequency or "", 3),
        # Articulations a menager. Apres 60 ans, l'impact repete ne se
        # recupere plus de la meme facon ; et un debutant apres 45 ans n'a pas
        # encore les tendons pour amortir des sauts — il lui manque les mois
        # de pratique qui les preparent, pas la volonte.
        "avoids_impact": (
            age_band == "60_plus"
            or (level == "debutant" and age_band in ("45_60", "60_plus"))
        ),
        # Entrée en charge à ménager : la répétition use plus vite ici.
        "needs_gentle_progression": (
            level == "debutant" or age_band in ("45_60", "60_plus")
        ),
    }


def _recent_exercise_ids(user_program_id: str, day_number: int) -> set[str]:
    """Exercices des dernières séances du programme, tous blocs confondus."""
    result = (
        supabase.table("sessions")
        .select("warmup_block, main_block, core_block, finisher_block")
        .eq("user_program_id", user_program_id)
        .lt("day_number", day_number)
        .order("day_number", desc=True)
        .limit(ROTATION_WINDOW)
        .execute()
    )
    ids: set[str] = set()
    for row in result.data or []:
        for key in ("warmup_block", "main_block", "core_block", "finisher_block"):
            for block in row.get(key) or []:
                if block.get("exercise_id"):
                    ids.add(block["exercise_id"])
    return ids


def _fetch_program(program_id: str) -> dict:
    result = supabase.table("programs").select("*").eq("id", program_id).execute()
    if not result.data:
        raise ValueError(f"Programme introuvable : {program_id}")
    return result.data[0]


def _fetch_phase(phase_id: str | None, program: dict) -> dict:
    if not phase_id:
        # Prendre la première phase du programme
        result = (
            supabase.table("program_phases")
            .select("*")
            .eq("program_id", program["id"])
            .order("phase_number")
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]
        # Programme sans phases (ex: Lactate Focus) → utiliser le programme comme phase
        return _program_as_phase(program)

    result = supabase.table("program_phases").select("*").eq("id", phase_id).execute()
    if not result.data:
        return _program_as_phase(program)
    return result.data[0]


def _fetch_persona(persona_id: str) -> dict:
    result = supabase.table("personas").select("*").eq("id", persona_id).execute()
    if not result.data:
        raise ValueError(f"Persona introuvable : {persona_id}")
    return result.data[0]


def _program_as_phase(program: dict) -> dict:
    """Fallback pour programmes sans phases (Lactate Focus)."""
    return {
        "id": None,
        "program_id": program["id"],
        "phase_number": 1,
        "name": program["name"],
        "rep_range_min": program.get("rep_range_min"),
        "rep_range_max": program.get("rep_range_max"),
        "sets_compounds": 4,
        "sets_isolation": 3,
        "rest_sec_min": program.get("rest_between_sets_sec_min"),
        "rest_sec_max": program.get("rest_between_sets_sec_max"),
        "superset_level": program.get("superset_level"),
        "has_emom": program.get("has_emom_finisher", False),
        "load_pct_1rm": None,
        "load_pct_1rm_start": program.get("load_pct_1rm_min"),
        "load_pct_1rm_end": program.get("load_pct_1rm_max"),
    }


def _resolve_focus(protocol: str, day_number: int) -> str:
    """Détermine le focus du jour selon le protocole et le numéro du jour."""
    schedule = PROTOCOL_SCHEDULE.get(protocol, ["full_body"])
    index = (day_number - 1) % len(schedule)
    return schedule[index]


def _build_session_label(protocol: str, focus: str) -> str:
    """Génère un label lisible pour la séance."""
    focus_labels = {
        "push": "Push",
        "pull": "Pull",
        "legs": "Legs",
        "upper": "Upper Body",
        "lower": "Lower Body",
        "full_body": "Full Body",
    }
    return focus_labels.get(focus, focus.replace("_", " ").title())
