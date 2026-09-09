"""
Construit les 4 blocs d'une séance.

Structure imposée :
  1. Warmup   — jamais de saisie de résultats
  2. Main     — compound puis isolation (ou circuit selon le programme)
  3. Core     — seulement si le programme le déclare (has_core_block)
  4. Finisher — jamais de saisie de résultats

`log_results` porte cette règle jusqu'au client : l'écran de suivi n'affiche
de lignes de séries que pour les blocs où il vaut True.
"""

import random

from engine.exercise_selector import (
    CIRCUIT_CATEGORIES,
    FOCUS_CATEGORY_MAP,
    FOCUS_WARMUP_TARGET_MAP,
    pick,
    select_exercises,
)
from models.workout import ExerciseBlock

WARMUP_COUNT = {"very_light": 2, "light": 3, "moderate": 4, "heavy": 5}


def _resolve_load_pct(phase: dict, program: dict) -> int:
    for key in ("load_pct_1rm", "load_pct_1rm_start"):
        if phase.get(key):
            return phase[key]
    return program.get("load_pct_1rm_min") or 65


def build_warmup_block(
    focus: str,
    program: dict,
    available_equipment: list[str],
    energy_level: int,
) -> list[ExerciseBlock]:
    """Activation + mobilité. Aucun résultat à saisir."""
    count = WARMUP_COUNT.get(program.get("warmup_focus", "moderate"), 3)
    if energy_level <= 2:
        count = min(count + 1, 5)

    targets = FOCUS_WARMUP_TARGET_MAP.get(focus, ["all"])
    pool = select_exercises(
        program["id"],
        categories=["warmup"],
        warmup_targets=targets,
        available_equipment=available_equipment,
        allow_universal=True,
    )
    if len(pool) < count:
        pool += select_exercises(
            program["id"],
            categories=["warmup"],
            available_equipment=available_equipment,
            allow_universal=True,
            exclude_ids={e["id"] for e in pool},
        )

    blocks = []
    for ex in pick(pool, count):
        is_mobility = "mobilite" in (ex.get("intent") or [])
        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=2 if is_mobility else 1,
            reps=None if is_mobility else 10,
            duration_sec=30 if is_mobility else None,
            notes="Mobilité" if is_mobility else "Activation musculaire",
            log_results=False,
        ))
    return blocks


def _build_circuit_main(
    program: dict,
    phase: dict,
    available_equipment: list[str],
    energy_level: int,
    level_max: str,
) -> list[ExerciseBlock]:
    """
    Programmes en circuit (Préparation Athlétique, Lactate Focus).

    Ces programmes n'ont aucun exercice push/pull/legs : la séance est un
    enchaînement de complexes lestés, d'explosif et de conditionnement.
    """
    pool = select_exercises(
        program["id"],
        categories=CIRCUIT_CATEGORIES,
        level_max=level_max,
        available_equipment=available_equipment,
    )
    count = 5 if energy_level >= 3 else 4
    reps = random.randint(
        phase.get("rep_range_min") or 8,
        phase.get("rep_range_max") or 10,
    )
    rest = phase.get("rest_sec_min") or 60
    load_pct = _resolve_load_pct(phase, program)
    if energy_level <= 2:
        load_pct = max(load_pct - 10, 40)

    blocks = []
    for i, ex in enumerate(pick(pool, count)):
        is_cardio = ex.get("exercise_type") == "cardio"
        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=3,
            reps=None if is_cardio else reps,
            duration_sec=40 if is_cardio else None,
            load_pct_1rm=None if is_cardio else load_pct,
            rest_sec=rest,
            notes=f"Circuit — tour {i + 1}",
            log_results=True,
        ))
    return blocks


def build_main_block(
    focus: str,
    phase: dict,
    program: dict,
    available_equipment: list[str],
    energy_level: int,
    level_max: str,
) -> list[ExerciseBlock]:
    """Bloc principal : compounds puis isolations, filtrés sur le programme."""
    if program.get("session_structure") == "circuit":
        return _build_circuit_main(
            program, phase, available_equipment, energy_level, level_max
        )

    categories = FOCUS_CATEGORY_MAP.get(focus, ["push", "pull", "legs"])
    bodyweight_only = program.get("load_intensity") == "bodyweight"

    sets_compounds = phase.get("sets_compounds") or 4
    sets_isolation = phase.get("sets_isolation") or 3
    rep_min = phase.get("rep_range_min") or program.get("rep_range_min") or 8
    rep_max = phase.get("rep_range_max") or program.get("rep_range_max") or 12
    rest_min = phase.get("rest_sec_min") or program.get("rest_between_sets_sec_min") or 60
    rest_max = phase.get("rest_sec_max") or program.get("rest_between_sets_sec_max") or 90
    load_pct = _resolve_load_pct(phase, program)

    if energy_level <= 2:
        load_pct = max(load_pct - 10, 40)
        sets_compounds = max(sets_compounds - 1, 2)
    elif energy_level >= 5:
        load_pct = min(load_pct + 5, 100)

    common = dict(
        level_max=level_max,
        bodyweight_only=bodyweight_only,
        available_equipment=available_equipment,
    )

    compounds = select_exercises(
        program["id"], categories=categories, exercise_types=["compound"], **common
    )
    picked = pick(compounds, min(len(categories) + 1, 4))
    used = {e["id"] for e in picked}

    isolations = select_exercises(
        program["id"],
        categories=categories,
        exercise_types=["isolation"],
        exclude_ids=used,
        **common,
    )
    isolation_picks = pick(isolations, min(len(categories), 3))

    reps = random.randint(rep_min, rep_max)
    rest = random.randint(rest_min, rest_max)
    blocks = []

    for ex in picked:
        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=sets_compounds,
            reps=reps,
            load_pct_1rm=None if bodyweight_only else load_pct,
            rest_sec=rest,
            notes=f"Compound — {sets_compounds}x{reps}",
            log_results=True,
        ))

    iso_reps = min(reps + 2, rep_max + 2)
    for ex in isolation_picks:
        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=sets_isolation,
            reps=iso_reps,
            load_pct_1rm=None if bodyweight_only else max(load_pct - 10, 40),
            rest_sec=max(rest - 15, 30),
            notes=f"Isolation — {sets_isolation}x{iso_reps}",
            log_results=True,
        ))

    superset_level = phase.get("superset_level") or program.get("superset_level") or "none"
    if superset_level in ("moderate", "heavy") and len(blocks) >= 4:
        blocks = _apply_supersets(blocks)

    return blocks


def build_core_block(
    program: dict,
    available_equipment: list[str],
    energy_level: int,
    level_max: str,
) -> list[ExerciseBlock]:
    """Bloc core — uniquement sur les programmes qui le déclarent."""
    if not program.get("has_core_block"):
        return []

    pool = select_exercises(
        program["id"],
        exercise_types=["core"],
        level_max=level_max,
        available_equipment=available_equipment,
    )
    count = 3 if energy_level >= 3 else 2

    blocks = []
    for ex in pick(pool, count):
        is_endurance = ex.get("category") == "core_endurance"
        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=3,
            reps=None if is_endurance else 12,
            duration_sec=40 if is_endurance else None,
            rest_sec=45,
            notes="Gainage" if is_endurance else "Core — force",
            log_results=True,
        ))
    return blocks


def build_finisher_block(
    program: dict,
    available_equipment: list[str],
    energy_level: int,
    level_max: str,
) -> list[ExerciseBlock]:
    """Finisher / conditionnement. Aucun résultat à saisir."""
    if energy_level <= 1:
        return []

    pool = select_exercises(
        program["id"],
        categories=["finisher"],
        level_max=level_max,
        available_equipment=available_equipment,
        allow_universal=True,
    )
    duration = program.get("emom_duration_min") or 6

    blocks = []
    for ex in pick(pool, 2):
        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=1,
            duration_sec=min(duration, 10) * 60 // 2,
            notes="Finisher",
            log_results=False,
        ))
    return blocks


def _apply_supersets(blocks: list[ExerciseBlock]) -> list[ExerciseBlock]:
    """Apparie les exercices deux à deux pour densifier la séance."""
    for i in range(0, len(blocks) - 1, 2):
        blocks[i].superset_with = blocks[i + 1].exercise_id
        blocks[i].notes = f"{blocks[i].notes} [Superset]"
    return blocks
