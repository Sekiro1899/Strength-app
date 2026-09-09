"""
Workout Generator — Orchestrateur principal.
Assemble les 4 blocs (warmup, main, core, finisher) en une séance complète.
"""

from database import supabase
from engine.block_builder import (
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

    # Résoudre le niveau max selon le persona
    exp_level = persona.get("experience_level", "intermediate")
    level_max = LEVEL_MAP.get(exp_level, "intermediaire")

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
    )

    # ── Construire les 4 blocs ──
    warmup = build_warmup_block(ctx)
    main = build_main_block(ctx)
    core = build_core_block(ctx)
    finisher = build_finisher_block(ctx)

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
