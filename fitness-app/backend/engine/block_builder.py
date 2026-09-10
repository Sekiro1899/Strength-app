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
    compensate,
    fit_to_pool,
    select_varied,
    volume_for_energy,
)
from models.workout import ExerciseBlock


class BuildContext:
    """Tout ce dont les constructeurs de blocs ont besoin pour une séance."""

    def __init__(self, program, phase, focus, level_max, energy, location,
                 rng: random.Random, recent_ids: set[str] | None = None,
                 allow_regressions: bool = False, day_number: int = 1,
                 time_budget: str = "standard"):
        self.program = program
        self.phase = phase or {}
        self.focus = focus
        self.level_max = level_max
        self.energy = energy
        self.location = location
        self.rng = rng
        # Exercices vus lors des dernières séances — évités en priorité.
        self.recent_ids = recent_ids or set()
        # Profil du pratiquant : les variantes allégées ne servent que les
        # débutants et les 60+, et le numéro de séance fait tourner l'accent.
        self.allow_regressions = allow_regressions
        self.day_number = day_number
        # Créneau annoncé : sur du lourd le superset coûte en charge, on ne le
        # paie que pour tenir dans le temps.
        self.time_budget = time_budget
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
        warmup_pool=True,
        warmup_targets=FOCUS_WARMUP_TARGET_MAP.get(ctx.focus, ["all"]),
        location=ctx.location,
        allow_universal=True,
    )
    if len(pool) < count:
        pool = select_exercises(
            ctx.program["id"],
            warmup_pool=True,
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
        # Un benchmark porte son propre format : 20 min d'AMRAP ne se découpent
        # pas en 4 séries de 40 s.
        imposed = ex.get("prescribed_duration_sec")
        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=(ex.get("prescribed_sets") or 1) if imposed else sets,
            reps=None if (is_cardio or imposed) else reps,
            duration_sec=imposed if imposed else (40 if is_cardio else None),
            load_pct_1rm=None if (is_cardio or imposed) else load,
            rest_sec=rest,
            notes="Circuit — format imposé" if imposed else f"Circuit — tour {i + 1}",
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

    common = dict(
        level_max=ctx.level_max,
        location=ctx.location,
        # Pour les autres qu'un débutant ou un 60+ : goblet squat ou barre,
        # pas d'air squat ni de pompes sur genoux dans le bloc principal.
        exclude_regressions=not ctx.allow_regressions,
    )
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
    compound_groups = group_by(compound_pool, by_category)
    # Quand l'énergie autorise un compound de plus, il ne doit pas retomber
    # toujours sur le même patron : l'accent tourne avec le numéro de séance.
    rotation = sorted(k for k, _ in compound_groups)
    emphasis = rotation[ctx.day_number % len(rotation)] if rotation else None
    compounds = pick_balanced(
        compound_groups,
        n_compounds, ctx.rng, ctx.recent_ids,
        priority_key=emphasis, strict_families=True,
    )
    sets_compounds = compensate(sets_compounds, n_compounds, len(compounds))
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
        strict_families=True,
    )
    sets_isolation = compensate(sets_isolation, n_isolations, len(isolations))
    ctx.rng.shuffle(isolations)

    # Une prescription centrée sur 11 se lit mal : on rend la plage dont 11 est
    # le milieu. Une phase qui impose un nombre sec (5x5) n'est pas élargie.
    spread = 1 if rep_max > rep_min else 0
    mid = round((rep_min + rep_max) / 2)
    reps = max(rep_min, mid - spread)
    reps_max = min(rep_max, mid + spread) if spread else None
    iso_mid = min(mid + 2, rep_max + 2)
    iso_reps = iso_mid - spread
    iso_reps_max = iso_mid + spread if spread else None

    def rng_label(lo, hi):
        return f"{lo}-{hi}" if hi and hi != lo else f"{lo}"

    blocks = []

    for ex in compounds:
        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=sets_compounds,
            reps=reps,
            reps_max=reps_max,
            load_pct_1rm=None if bodyweight_only else load,
            rest_sec=rest,
            notes=f"Compound — {sets_compounds}x{rng_label(reps, reps_max)}",
            # Seuls les compounds portent la progression.
            log_results=True,
        ))

    isolation_blocks = []
    for ex in isolations:
        isolation_blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=sets_isolation,
            reps=iso_reps,
            reps_max=iso_reps_max,
            load_pct_1rm=None if bodyweight_only else max(load - 10, 40),
            rest_sec=max(rest - 15, 30),
            notes=f"Isolation — {sets_isolation}x{rng_label(iso_reps, iso_reps_max)}",
            # Pas de saisie de charge sur l'isolation : on coche et on enchaîne.
            log_results=False,
        ))

    # Deux règles distinctes. L'isolation s'apparie toujours : c'est léger, les
    # familles sont déjà différentes. Le compound ne s'apparie que si le
    # créneau manque, et seulement avec un antagoniste.
    family_of = {ex["id"]: ex.get("movement_family") for ex in compounds + isolations}

    def antagonists(a, b) -> bool:
        fa, fb = family_of.get(a.exercise_id), family_of.get(b.exercise_id)
        return (fa in PUSH_FAMILIES and fb in PULL_FAMILIES) or \
               (fa in PULL_FAMILIES and fb in PUSH_FAMILIES)

    if ctx.time_budget == "short":
        blocks = apply_supersets(blocks, antagonists)
    blocks.extend(apply_supersets(isolation_blocks, lambda a, b: True))

    return blocks


# Chaînes antagonistes : on n'apparie qu'un tirage avec une poussée. Deux
# squats enchaînés ne feraient qu'épuiser les mêmes jambes.
PUSH_FAMILIES = {"horizontal_push", "vertical_push", "dip", "muscle_up"}
PULL_FAMILIES = {"vertical_pull", "horizontal_pull", "pullover"}


def apply_supersets(blocks, can_pair):
    """
    Apparie les blocs deux à deux et les rend ADJACENTS : l'écran de séance
    reconnaît un superset en regardant le bloc suivant. Le repos passe après
    la paire, il n'y en a pas entre les deux mouvements.
    """
    remaining = list(blocks)
    out = []
    while remaining:
        first = remaining.pop(0)
        index = next((i for i, b in enumerate(remaining) if can_pair(first, b)), None)
        if index is None:
            out.append(first)
            continue
        second = remaining.pop(index)
        first.superset_with = second.exercise_id
        second.rest_sec = first.rest_sec
        first.rest_sec = 0
        out.extend([first, second])
    return out


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
        exclude_regressions=not ctx.allow_regressions,
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

