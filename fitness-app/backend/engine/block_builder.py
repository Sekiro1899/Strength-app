"""
Construit les 4 blocs d'une séance.

Structure imposée :
  1. Warmup   — jamais de saisie de résultats
  2. Main     — compound puis isolation (ou circuit selon le programme)
  3. Core     — seulement si le programme le déclare (has_core_block)
  4. Finisher — jamais de saisie de résultats

Le contexte porte les deux réponses données en début de séance :
l'énergie (charge et volume) et le lieu (matériel disponible).
"""

import random

from engine.exercise_selector import (
    CIRCUIT_CATEGORIES,
    FOCUS_CATEGORY_MAP,
    FOCUS_WARMUP_TARGET_MAP,
    group_by,
    pick,
    pick_balanced,
    select_exercises,
    fit_to_pool,
    select_varied,
    volume_for_energy,
)
from models.workout import ExerciseBlock


class BuildContext:
    """Tout ce dont les constructeurs de blocs ont besoin pour une séance."""

    def __init__(self, program, phase, focus, level_max, energy, location,
                 rng: random.Random, recent_ids: set[str] | None = None):
        self.program = program
        self.phase = phase or {}
        self.focus = focus
        self.level_max = level_max
        self.energy = energy
        self.location = location
        self.rng = rng
        # Exercices vus lors des dernières séances — évités en priorité.
        self.recent_ids = recent_ids or set()
        self.policy = volume_for_energy(energy)


def _resolve_load_pct(phase: dict, program: dict) -> int:
    for key in ("load_pct_1rm", "load_pct_1rm_start"):
        if phase.get(key):
            return phase[key]
    return program.get("load_pct_1rm_min") or 65


def build_warmup_block(ctx: BuildContext) -> list[ExerciseBlock]:
    """Activation + mobilité. Aucun résultat à saisir."""
    count = ctx.policy["warmup"]

    pool = select_exercises(
        ctx.program["id"],
        categories=["warmup"],
        warmup_targets=FOCUS_WARMUP_TARGET_MAP.get(ctx.focus, ["all"]),
        location=ctx.location,
        allow_universal=True,
    )
    if len(pool) < count:
        pool = select_exercises(
            ctx.program["id"],
            categories=["warmup"],
            location=ctx.location,
            allow_universal=True,
        )

    # Règle d'échauffement : on mobilise avant d'activer. Le tirage est libre
    # À L'INTÉRIEUR de chaque temps, l'ordre des deux temps ne l'est pas.
    def is_pure_mobility(ex: dict) -> bool:
        intent = set(ex.get("intent") or [])
        return "mobilite" in intent and not (intent & {"stabilite", "endurance"})

    def by_target(ex: dict) -> str:
        return (ex.get("warmup_target") or ["all"])[0] or "all"

    mobility = pick_balanced(
        group_by([e for e in pool if is_pure_mobility(e)], by_target),
        count // 2, ctx.rng, ctx.recent_ids,
    )
    taken = {e["id"] for e in mobility}
    activation = pick_balanced(
        group_by(
            [e for e in pool if not is_pure_mobility(e) and e["id"] not in taken],
            by_target,
        ),
        count - len(mobility), ctx.rng, ctx.recent_ids,
    )

    # L'étiquette suit le TEMPS où l'exercice est placé, la prescription suit sa
    # NATURE : un mouvement tenu se compte en secondes même en phase d'activation.
    blocks = []
    for ex, tier in [(e, "Mobilité") for e in mobility] + \
                    [(e, "Activation musculaire") for e in activation]:
        is_held = "mobilite" in (ex.get("intent") or [])
        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=2 if is_held else 1,
            reps=None if is_held else 10,
            duration_sec=30 if is_held else None,
            notes=tier,
            log_results=False,
        ))
    return blocks


def _build_circuit_main(ctx: BuildContext) -> list[ExerciseBlock]:
    """
    Programmes en circuit (Préparation Athlétique, Lactate Focus).

    Ces programmes n'ont aucun exercice push/pull/legs : la séance est un
    enchaînement de complexes lestés, d'explosif et de conditionnement.
    """
    count = ctx.policy["compounds"] + ctx.policy["isolations"]
    pool = select_varied(
        ctx.program["id"],
        count,
        categories=CIRCUIT_CATEGORIES,
        level_max=ctx.level_max,
        location=ctx.location,
    )
    reps = round(
        ((ctx.phase.get("rep_range_min") or 8) + (ctx.phase.get("rep_range_max") or 10)) / 2
    )
    rest = ctx.phase.get("rest_sec_min") or 60
    load = max(_resolve_load_pct(ctx.phase, ctx.program) + ctx.policy["load_delta"], 40)
    count, sets = fit_to_pool(len(pool), count, max(2, 3 + ctx.policy["sets_delta"]))

    blocks = []
    selection = pick_balanced(
        group_by(pool, lambda e: e.get("category")),
        count, ctx.rng, ctx.recent_ids,
    )
    for i, ex in enumerate(selection):
        is_cardio = ex.get("exercise_type") == "cardio"
        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=sets,
            reps=None if is_cardio else reps,
            duration_sec=40 if is_cardio else None,
            load_pct_1rm=None if is_cardio else load,
            rest_sec=rest,
            notes=f"Circuit — tour {i + 1}",
            log_results=True,
        ))
    return blocks


def build_main_block(ctx: BuildContext) -> list[ExerciseBlock]:
    """Bloc principal : compounds puis isolations, filtrés sur le programme."""
    if ctx.program.get("session_structure") == "circuit":
        return _build_circuit_main(ctx)

    categories = FOCUS_CATEGORY_MAP.get(ctx.focus, ["push", "pull", "legs"])
    bodyweight_only = ctx.program.get("load_intensity") == "bodyweight"

    sets_compounds = max(2, (ctx.phase.get("sets_compounds") or 4) + ctx.policy["sets_delta"])
    sets_isolation = max(2, (ctx.phase.get("sets_isolation") or 3) + ctx.policy["sets_delta"])
    rep_min = ctx.phase.get("rep_range_min") or ctx.program.get("rep_range_min") or 8
    rep_max = ctx.phase.get("rep_range_max") or ctx.program.get("rep_range_max") or 12
    rest = ctx.phase.get("rest_sec_min") or ctx.program.get("rest_between_sets_sec_min") or 90
    load = min(
        max(_resolve_load_pct(ctx.phase, ctx.program) + ctx.policy["load_delta"], 40),
        100,
    )

    common = dict(level_max=ctx.level_max, location=ctx.location)
    if ctx.focus in ("push", "pull"):
        common["arm_group_only"] = "triceps" if ctx.focus == "push" else "biceps"

    by_category = lambda e: e.get("category")

    # Chaque catégorie du focus doit être représentée avant qu'une seule ne
    # soit servie deux fois — d'où le tirage en tourniquet plutôt qu'à plat.
    compound_pool = select_varied(ctx.program["id"], ctx.policy["compounds"],
                                  categories=categories, exercise_types=["compound"], **common)
    n_compounds, sets_compounds = fit_to_pool(
        len(compound_pool), ctx.policy["compounds"], sets_compounds
    )
    compounds = pick_balanced(
        group_by(compound_pool, by_category),
        n_compounds, ctx.rng, ctx.recent_ids,
    )
    ctx.rng.shuffle(compounds)
    used = {e["id"] for e in compounds}

    isolation_pool = select_varied(ctx.program["id"], ctx.policy["isolations"],
                                   categories=categories, exercise_types=["isolation"],
                                   exclude_ids=used, **common)
    n_isolations, sets_isolation = fit_to_pool(
        len(isolation_pool), ctx.policy["isolations"], sets_isolation
    )
    isolations = pick_balanced(
        group_by(isolation_pool, by_category),
        n_isolations, ctx.rng, ctx.recent_ids,
    )
    ctx.rng.shuffle(isolations)

    reps = round((rep_min + rep_max) / 2)
    iso_reps = min(reps + 2, rep_max + 2)
    blocks = []

    for ex in compounds:
        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=sets_compounds,
            reps=reps,
            load_pct_1rm=None if bodyweight_only else load,
            rest_sec=rest,
            notes=f"Compound — {sets_compounds}x{reps}",
            log_results=True,
        ))

    for ex in isolations:
        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=sets_isolation,
            reps=iso_reps,
            load_pct_1rm=None if bodyweight_only else max(load - 10, 40),
            rest_sec=max(rest - 15, 30),
            notes=f"Isolation — {sets_isolation}x{iso_reps}",
            log_results=True,
        ))

    superset_level = ctx.phase.get("superset_level") or ctx.program.get("superset_level") or "none"
    if superset_level in ("moderate", "heavy") and len(blocks) >= 4:
        blocks = _apply_supersets(blocks)

    return blocks


def build_core_block(ctx: BuildContext) -> list[ExerciseBlock]:
    """Bloc core — uniquement sur les programmes qui le déclarent."""
    if not ctx.program.get("has_core_block"):
        return []

    pool = select_varied(
        ctx.program["id"],
        ctx.policy["core"],
        exercise_types=["core"],
        level_max=ctx.level_max,
        location=ctx.location,
    )
    n_core, sets = fit_to_pool(
        len(pool), ctx.policy["core"], max(2, 3 + ctx.policy["sets_delta"])
    )

    # Deux exercices de core tirés à plat, c'est deux gainages d'affilée. On
    # tire un patron de mouvement différent par exercice tant qu'il en reste.
    selection = pick_balanced(
        group_by(pool, lambda e: e.get("movement_pattern")),
        n_core, ctx.rng, ctx.recent_ids,
    )

    blocks = []
    for ex in selection:
        is_endurance = ex.get("category") == "core_endurance"
        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=sets,
            reps=None if is_endurance else 12,
            duration_sec=40 if is_endurance else None,
            rest_sec=45,
            notes="Gainage" if is_endurance else "Core — force",
            log_results=True,
        ))
    return blocks


def build_finisher_block(ctx: BuildContext) -> list[ExerciseBlock]:
    """Finisher / conditionnement. Aucun résultat à saisir."""
    # Énergie au plus bas : on supprime le finisher plutôt que de le bâcler.
    if not ctx.policy["with_finisher"]:
        return []

    pool = select_varied(
        ctx.program["id"],
        2,
        categories=["finisher"],
        level_max=ctx.level_max,
        location=ctx.location,
        allow_universal=True,
    )

    blocks = []
    for ex in pick(pool, 2, ctx.rng, ctx.recent_ids):
        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=1,
            duration_sec=180,
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
