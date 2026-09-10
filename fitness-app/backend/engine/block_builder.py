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
    fetch_exercises_by_ids,
    _matches_location,
)
from engine.scaling import scaling_for
from engine.textbook import (
    LEARNING_LOAD_PCT,
    LEARNING_NOTE,
    LEARNING_WEEKS,
    TEXTBOOK_PROGRAMS,
)
from models.workout import ExerciseBlock


class BuildContext:
    """Tout ce dont les constructeurs de blocs ont besoin pour une séance."""

    def __init__(self, program, phase, focus, level_max, energy, location,
                 rng: random.Random, recent_ids: set[str] | None = None,
                 allow_regressions: bool = False, day_number: int = 1,
                 time_budget: str = "standard", persona_id: str | None = None,
                 user_program_id: str = "", week_number: int = 1,
                 objective: str | None = None, strength_oriented: bool = False,
                 age_band: str | None = None):
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
        # Le persona décide de l'ampleur du travail de force (voir _strength_plan).
        self.persona_id = persona_id
        # Cycle en cours : graine STABLE du programme textbook attribué, qui ne
        # doit pas changer d'une séance à l'autre.
        self.user_program_id = user_program_id
        # Semaine du cycle — décide des semaines d'apprentissage d'un débutant.
        self.week_number = week_number
        self.objective = objective
        self.age_band = age_band
        # Vient chercher de la charge et de la masse, pas de la sueur (q3 + q9).
        self.strength_oriented = strength_oriented
        self.policy = apply_time_budget(volume_for_energy(energy), time_budget)


def apply_time_budget(policy: dict, budget: str) -> dict:
    """Le créneau annoncé PRIME sur l'énergie déclarée.

    Se sentir en forme ne crée pas de temps. Un pratiquant qui annonçait trente
    minutes et une énergie de 5 recevait la séance étoffée — un compound de
    plus, une isolation de plus, une série de plus partout — donc une séance
    qu'il ne pouvait pas finir. L'énergie module la CHARGE ; c'est le temps
    disponible qui décide du VOLUME.

    Le plafond n'est jamais un plancher : annoncer un créneau court ne rallonge
    pas la séance de quelqu'un d'épuisé.
    """
    if budget != "short":
        return policy
    return {
        **policy,
        # `load_delta` n'est pas touché : être frais reste payant sur la barre.
        "sets_delta": min(policy["sets_delta"], 0),
        "compounds": min(policy["compounds"], 3),
        "isolations": min(policy["isolations"], 2),
        "core": min(policy["core"], 1),
        "warmup": min(policy["warmup"], 3),
        "with_finisher": False,
    }


# Planchers de récupération. Ce sont des PLANCHERS : une phase de force pure
# qui réclame trois minutes garde ses trois minutes. Ils n'empêchent que le cas
# inverse — une série lourde expédiée avec une minute de repos, où la charge
# s'effondre d'une série à l'autre et où la prescription ne veut plus rien dire.
COMPOUND_REST_FLOOR = 120
COMPOUND_REST_SHORT = 90
ISOLATION_REST = 75
ISOLATION_REST_SHORT = 60

# Créneau court : une série de moins sur les compounds, pas un repos de moins.
SETS_COMPOUND_SHORT = 3

CORE_REST = 45

# Repos d'un mouvement unilatéral. Le côté qui attend récupère pendant que
# l'autre travaille : une pause ENTRE les deux ne sert à rien — on change de
# jambe et on enchaîne. Reste la pause après la paire : nulle sur une isolation
# légère, courte sur tout le reste.
UNILATERAL_REST = 30
UNILATERAL_REST_ISOLATION = 0


def _unilateral_rest(exercise: dict) -> int:
    if exercise.get("exercise_type") == "isolation":
        return UNILATERAL_REST_ISOLATION
    return UNILATERAL_REST


def _rest_for(exercise: dict, base: int) -> int:
    """Repos d'un bloc : le barème unilatéral prime sur celui de la séance."""
    return _unilateral_rest(exercise) if exercise.get("unilateral") else base

# Plafond de séries, tous reports compris. Quand le pool est étroit, le volume
# perdu se reporte sur les séries (`fit_to_pool` puis `compensate`) ; les deux
# reports pouvaient se cumuler et sortir six séries par compound, soit quarante
# minutes rien que sur les compounds à deux minutes de repos.
MAX_SETS_COMPOUND = 5
MAX_SETS_ISOLATION = 4


def rep_window(rep_min: int, rep_max: int, index: int) -> tuple[int, int]:
    """Fenêtre de répétitions prescrite.

    Une plage centrée sur la moyenne de la phase tombait sur des bornes
    impaires — « 9-11 » — qu'aucun pratiquant n'a en tête. On découpe la plage
    du programme en fenêtres de deux répétitions calées sur les paliers usuels
    (8-10, 10-12, 12-14) et on en fait tourner une par séance.
    """
    if rep_max <= rep_min:
        return rep_min, rep_min
    # Une plage déjà courte EST la fenêtre : 8-10 ne se redécoupe pas.
    if rep_max - rep_min <= 3:
        return rep_min, rep_max
    windows = [(lo, lo + 2) for lo in range(rep_min, rep_max - 1, 2)]
    if not windows:
        return rep_min, rep_max
    return windows[abs(index) % len(windows)]


# Travail de force ponctuel, greffé sur une séance d'hypertrophie. Le but n'est
# PAS de produire une séance Starting Strength : c'est un programme à part
# entière, avec sa propre progression de charge. Ce qu'on greffe, c'est un
# exercice — cinq séries de cinq sur le premier mouvement lourd — pendant que
# le reste de la séance garde son tempo, trois ou quatre séries de dix.
STRENGTH_PROTOCOLS = [
    {"label": "5×5 force", "sets": 5, "reps": 5, "load_delta": 12, "rest_sec": 180},
    {"label": "3×5 Starting Strength", "sets": 3, "reps": 5, "load_delta": 17, "rest_sec": 180},
    {"label": "5×3 force maximale", "sets": 5, "reps": 3, "load_delta": 22, "rest_sec": 210},
]

# Personas orientés charge : barème complet, sur les deux premiers compounds.
STRENGTH_PERSONAS = {"persona_smb", "persona_bf"}

# Objectifs qui justifient de charger. Le 5x5 sert à prendre du muscle ET de la
# force ; sur un objectif d'efficacité ou de performance athlétique, il mange le
# temps de la séance sans servir ce qui a été demandé.
STRENGTH_OBJECTIVES = {"aesthetics", "strength", "complete_athlete"}

# Une séance sur trois porte du travail de force.
STRENGTH_EVERY = 3

# Familles qui supportent le lourd : un 5x5 sur des élévations latérales n'a
# aucun sens.
HEAVY_FAMILIES = {
    "squat", "hinge", "horizontal_push", "vertical_push",
    "horizontal_pull", "vertical_pull", "dip",
}


def _strength_plan(ctx: "BuildContext") -> dict | None:
    """Protocole de force du jour, ou None si la séance n'en porte pas."""
    # Un circuit se joue sur la densité, pas sur la charge.
    if ctx.program.get("session_structure") == "circuit":
        return None
    # Cinq séries à trois minutes de repos, c'est vingt-cinq minutes sur un
    # seul mouvement : hors de question quand le créneau est déjà compté.
    if ctx.time_budget == "short":
        return None
    # Du lourd sur un jour sans jus, c'est comme ça qu'on se blesse.
    if ctx.energy < 3:
        return None
    # Le 5x5 suppose une technique déjà en place. Un débutant a d'abord des
    # mouvements à apprendre — c'est le rôle des semaines d'apprentissage des
    # séances textbook, pas d'une série lourde greffée sur une séance ordinaire.
    if ctx.level_max == "debutant":
        return None

    dedicated = ctx.persona_id in STRENGTH_PERSONAS
    # Hors des deux personas de force, encore faut-il que la charge fasse
    # partie de ce que le pratiquant est venu chercher.
    if not dedicated and ctx.objective not in STRENGTH_OBJECTIVES:
        return None
    if ctx.day_number % STRENGTH_EVERY != 0:
        return None
    cycle = ctx.day_number // STRENGTH_EVERY
    return {
        # Ailleurs que chez les deux personas de force, on s'en tient au 5x5 :
        # c'est le schéma que tout le monde reconnaît.
        "protocol": (STRENGTH_PROTOCOLS[cycle % len(STRENGTH_PROTOCOLS)]
                     if dedicated else STRENGTH_PROTOCOLS[0]),
        "lifts": 2 if dedicated else 1,
    }


def _apply_strength(block, exercise, protocol, bodyweight_only: bool) -> bool:
    """Réécrit un bloc au barème de force.

    Retourne False si le mouvement ne s'y prête pas — le bloc garde alors sa
    prescription d'hypertrophie.
    """
    if exercise.get("movement_family") not in HEAVY_FAMILIES:
        return False
    # Le barème est écrit pour des mouvements bilatéraux chargés à la barre. Un
    # « 5x5 à 82 % » sur des pompes archer ou un soulevé de terre unijambiste
    # ne veut rien dire, et réimposerait trois minutes de repos là où la règle
    # est justement d'enchaîner les côtés.
    if exercise.get("unilateral"):
        return False

    block.sets = protocol["sets"]
    block.reps = protocol["reps"]
    # Le barème impose un nombre sec : plus de fourchette à afficher.
    block.reps_max = None
    if block.load_pct_1rm is not None:
        # 92 % reste un maximum de travail : au-delà on est sur un test de 1RM.
        block.load_pct_1rm = min(block.load_pct_1rm + protocol["load_delta"], 92)
    block.rest_sec = protocol["rest_sec"]
    block.protocol_label = protocol["label"]
    block.notes = (f"{protocol['label']} — lesté dès que la série passe propre"
                   if bodyweight_only
                   else f"{protocol['label']} — {protocol['sets']}x{protocol['reps']} lourd")
    return True


# Charge de travail par défaut, en pourcentage du 1RM. Six phases sur treize
# seulement portent une charge explicite ; les autres retombent ici.
DEFAULT_LOAD_PCT = 65


def _resolve_load_pct(phase: dict) -> int:
    return phase.get("load_pct_1rm") or DEFAULT_LOAD_PCT


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
    load = max(_resolve_load_pct(ctx.phase) + ctx.policy["load_delta"], 40)
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
            rest_sec=_rest_for(ex, rest),
            unilateral=bool(ex.get("unilateral")),
            notes="Circuit — format imposé" if imposed else f"Circuit — tour {i + 1}",
            # Un circuit au poids de corps enchaîne tractions et dips : la même
            # question de progression s'y pose qu'en séance de musculation.
            scaling=scaling_for(ex["id"]),
            log_results=True,
        ))
    return blocks


def _int32(value: int) -> int:
    """Repasse en entier signé 32 bits, comme le fait JavaScript."""
    value &= 0xFFFFFFFF
    return value - 0x100000000 if value & 0x80000000 else value


def _hash_seed(key: str) -> int:
    """FNV-1a 32 bits — miroir de `hashSeed` dans mobile/lib/engine.ts."""
    h = 0x811C9DC5
    for ch in key:
        h = _int32(h ^ ord(ch))
        h = _int32(h * 0x01000193)
    return h & 0xFFFFFFFF


def _first_random(seed: int) -> float:
    """
    Première valeur d'un mulberry32 — miroir de `createRng(seed)()`.

    Le tirage d'exercices, lui, diverge déjà entre les deux moteurs (sha256
    côté serveur, mulberry32 côté client). Ce n'est pas gênant pour un
    exercice : les deux respectent les mêmes règles. Ça le serait ici — le
    programme textbook attribué est visible et doit être LE MÊME des deux
    côtés, sinon le pratiquant change de méthode selon d'où vient sa séance.
    """
    a = (seed + 0x6D2B79F5) & 0xFFFFFFFF
    t = _int32(_int32(a ^ (a >> 15)) * _int32(1 | a))
    t = _int32(t + _int32(_int32(t ^ ((t & 0xFFFFFFFF) >> 7)) * _int32(61 | t))) ^ t
    return ((t ^ ((t & 0xFFFFFFFF) >> 14)) & 0xFFFFFFFF) / 4294967296


# Chances qu'une séance soit RÉCITÉE plutôt que tirée. Plus hautes chez les
# jeunes et les débutants : ce sont eux qui gagnent le plus à suivre un
# programme écrit, où la charge monte séance après séance, plutôt qu'un
# assemblage qui change à chaque fois.
TEXTBOOK_ODDS = 0.3
TEXTBOOK_ODDS_YOUNG_OR_NOVICE = 0.6


def _textbook_odds(ctx: BuildContext) -> float:
    if ctx.level_max == "debutant" or ctx.age_band == "18_25":
        return TEXTBOOK_ODDS_YOUNG_OR_NOVICE
    return TEXTBOOK_ODDS


def _build_textbook_main(ctx: BuildContext) -> list[ExerciseBlock] | None:
    """
    Séance de force classique, servie telle qu'elle est écrite.

    Retourne None dès qu'une condition manque — la séance repasse alors par le
    tirage. C'est vrai en particulier du matériel : un poste sans candidat
    praticable au lieu déclaré écarte le programme entier plutôt que de le
    bricoler.
    """
    # Réservé à qui vient chercher de la charge et pas de la sueur (q3 + q9).
    if not ctx.strength_oriented:
        return None
    # Trois mouvements lourds à trois minutes de repos : il faut le temps.
    if ctx.time_budget == "short":
        return None

    # Tirage à part : consulter `ctx.rng` ici décalerait toutes les séances
    # ordinaires, alors que rien n'a changé pour elles.
    roll = _first_random(_hash_seed(f"textbook#{ctx.user_program_id}#{ctx.day_number}"))
    if roll >= _textbook_odds(ctx):
        return None

    # Le programme attribué est stable sur tout le cycle : changer de méthode
    # chaque semaine, c'est n'en suivre aucune.
    program = TEXTBOOK_PROGRAMS[_hash_seed(ctx.user_program_id) % len(TEXTBOOK_PROGRAMS)]
    # L'alternance des deux jours EST le programme.
    day = program["days"][ctx.day_number % len(program["days"])]

    wanted = {i for lift in day["lifts"] for i in lift["ids"]}
    library = {e["id"]: e for e in fetch_exercises_by_ids(sorted(wanted))}

    # Un débutant qui découvre le squat barre n'a pas de charge à chercher, il
    # a un mouvement à installer.
    learning = ctx.level_max == "debutant" and ctx.week_number <= LEARNING_WEEKS

    blocks: list[ExerciseBlock] = []
    for lift in day["lifts"]:
        ex = next(
            (library[i] for i in lift["ids"]
             if i in library and _matches_location(library[i], ctx.location)),
            None,
        )
        if ex is None:
            return None
        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=lift["sets"],
            reps=lift["reps"],
            load_pct_1rm=min(lift["load"], LEARNING_LOAD_PCT) if learning else lift["load"],
            rest_sec=lift["rest"],
            protocol_label=f"{program['name']} · {day['label']}",
            notes=LEARNING_NOTE if learning else f"{lift['sets']}x{lift['reps']} — {program['name']}",
            scaling=scaling_for(ex["id"]),
            unilateral=bool(ex.get("unilateral")),
            log_results=True,
        ))
    return blocks


def textbook_label(ctx: BuildContext) -> str | None:
    """
    Nom de la séance quand elle est récitée plutôt que composée.

    Une séance textbook remplace le focus prévu au plan : l'alternance jour A /
    jour B EST le programme. Afficher « Push » au-dessus d'un squat et d'un
    soulevé de terre ferait douter du reste.
    """
    blocks = _build_textbook_main(ctx)
    return blocks[0].protocol_label if blocks else None


def build_main_block(ctx: BuildContext) -> list[ExerciseBlock]:
    """Bloc principal : compounds puis isolations, filtrés sur le programme."""
    if ctx.program.get("session_structure") == "circuit":
        return _build_circuit_main(ctx)

    # Certaines séances ne se composent pas : elles se récitent.
    textbook = _build_textbook_main(ctx)
    if textbook is not None:
        return textbook

    categories = FOCUS_CATEGORY_MAP.get(ctx.focus, ["push", "pull", "legs"])
    bodyweight_only = ctx.program.get("load_intensity") == "bodyweight"

    short = ctx.time_budget == "short"

    # Quatre séries de dix tractions à soixante secondes de repos, ce n'est pas
    # une séance dure, c'est une séance ratée : la charge s'effondre dès la
    # troisième série. Sur du compound on part de deux minutes. Quand le créneau
    # manque, on ne rogne pas le repos — on retire une série et on descend à
    # quatre-vingt-dix secondes, ce qui préserve la qualité de chaque série.
    rest = max(
        ctx.phase.get("rest_sec_min") or ctx.program.get("rest_between_sets_sec_min") or 0,
        COMPOUND_REST_SHORT if short else COMPOUND_REST_FLOOR,
    )
    rest_isolation = ISOLATION_REST_SHORT if short else ISOLATION_REST

    sets_compounds = max(2, (ctx.phase.get("sets_compounds") or 4) + ctx.policy["sets_delta"])
    if short:
        sets_compounds = min(sets_compounds, SETS_COMPOUND_SHORT)
    sets_isolation = max(2, (ctx.phase.get("sets_isolation") or 3) + ctx.policy["sets_delta"])
    rep_min = ctx.phase.get("rep_range_min") or ctx.program.get("rep_range_min") or 8
    rep_max = ctx.phase.get("rep_range_max") or ctx.program.get("rep_range_max") or 12
    load = min(
        max(_resolve_load_pct(ctx.phase) + ctx.policy["load_delta"], 40),
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
    sets_compounds = min(compensate(sets_compounds, n_compounds, len(compounds)),
                         MAX_SETS_COMPOUND)
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
    sets_isolation = min(compensate(sets_isolation, n_isolations, len(isolations)),
                         MAX_SETS_ISOLATION)
    ctx.rng.shuffle(isolations)

    # La fenêtre tourne d'une séance à l'autre à l'intérieur de la plage de la
    # phase : 8-10 cette fois, 10-12 la prochaine. L'isolation travaille deux
    # répétitions plus haut que le compound, décalée d'un cran pour que les deux
    # ne changent pas en même temps.
    reps, reps_top = rep_window(rep_min, rep_max, ctx.day_number)
    iso_reps, iso_reps_top = rep_window(rep_min + 2, rep_max + 3, ctx.day_number + 1)
    reps_max = reps_top if reps_top > reps else None
    iso_reps_max = iso_reps_top if iso_reps_top > iso_reps else None

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
            rest_sec=_rest_for(ex, rest),
            unilateral=bool(ex.get("unilateral")),
            notes=f"Compound — {sets_compounds}x{rng_label(reps, reps_max)}",
            # Sur des tractions ou des dips, la prescription seule ne suffit
            # pas : il faut dire par où monter et par où descendre.
            scaling=scaling_for(ex["id"]),
            # Seuls les compounds portent la progression.
            log_results=True,
        ))

    # Le travail de force se greffe sur les compounds de TÊTE, jamais sur toute
    # la séance : le reste garde son tempo d'hypertrophie. On vise le premier
    # mouvement ÉLIGIBLE, pas le premier tout court — viser strictement la tête
    # de séance ne déclenchait le barème qu'une fois sur deux, selon que le
    # tirage avait ouvert sur un squat ou sur du gainage.
    plan = _strength_plan(ctx)
    if plan:
        applied = 0
        for block, ex in zip(blocks, compounds):
            if applied >= plan["lifts"]:
                break
            if _apply_strength(block, ex, plan["protocol"], bodyweight_only):
                applied += 1

    isolation_blocks = []
    for ex in isolations:
        isolation_blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=sets_isolation,
            reps=iso_reps,
            reps_max=iso_reps_max,
            load_pct_1rm=None if bodyweight_only else max(load - 10, 40),
            rest_sec=_rest_for(ex, rest_isolation),
            unilateral=bool(ex.get("unilateral")),
            notes=f"Isolation — {sets_isolation}x{rng_label(iso_reps, iso_reps_max)}",
            scaling=scaling_for(ex["id"]),
            # Pas de saisie de charge sur l'isolation : on coche et on enchaîne.
            log_results=False,
        ))

    # Deux règles distinctes. L'isolation s'apparie toujours : c'est léger, les
    # familles sont déjà différentes. Le compound ne s'apparie que si le
    # créneau manque, et seulement avec un antagoniste.
    family_of = {ex["id"]: ex.get("movement_family") for ex in compounds + isolations}

    def antagonists(a, b) -> bool:
        # Une série lourde se prend seule : l'apparier reviendrait à
        # préfatiguer le mouvement même qu'on cherche à charger.
        if a.protocol_label or b.protocol_label:
            return False
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
        # Le repos de la PAIRE est le plus long des deux : apparier une
        # isolation unilatérale, qui n'a pas de repos propre, ne doit pas
        # supprimer celui que l'autre mouvement réclame.
        second.rest_sec = max(first.rest_sec or 0, second.rest_sec or 0)
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
            rest_sec=_rest_for(ex, CORE_REST),
            unilateral=bool(ex.get("unilateral")),
            notes="Gainage" if is_endurance else "Core — force",
            log_results=True,
        ))
    return blocks


def build_finisher_block(ctx: BuildContext) -> list[ExerciseBlock]:
    """Finisher / conditionnement. Aucun résultat à saisir."""
    # Ce profil a répondu que transpirer n'était pas son sujet, et qu'il
    # préférait la contraction et les temps de repos (q9). Un finisher en AMRAP
    # ne lui apporte rien qu'il soit venu chercher — on lui rend le temps.
    if ctx.strength_oriented:
        return []

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

