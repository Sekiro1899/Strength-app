"""
Sélection d'exercices depuis la bibliothèque.

Deux colonnes de la bibliothèque pilotent tout :
  - `target_programs` : à quels programmes l'exercice appartient.
    Vide = universel (warmups et finishers servent tous les programmes).
  - `exercise_type`   : compound | isolation | core | cardio.
    C'est lui, et non la catégorie, qui décide dans quel bloc l'exercice tombe.
"""

import hashlib
import random

from database import supabase

# ─── Mappings focus → catégories (programmes en structure « split ») ───

# Sur un split PPL, le travail de bras suit le patron moteur : les triceps
# poussent, les biceps tirent. Sans `arms` ici, un jour push d'un programme
# d'hypertrophie ne disposait que d'UNE isolation — donc toujours la même.
FOCUS_CATEGORY_MAP = {
    "push": ["push", "arms"],
    "pull": ["pull", "arms"],
    "legs": ["legs"],
    "upper": ["push", "pull", "arms"],
    "lower": ["legs"],
    "full_body": ["push", "pull", "legs", "arms"],
}

FOCUS_WARMUP_TARGET_MAP = {
    "push": ["push", "bench", "ohp"],
    "pull": ["pull", "deadlift"],
    "legs": ["leg", "squat", "single_leg"],
    "upper": ["push", "pull", "bench", "ohp"],
    "lower": ["leg", "squat", "deadlift", "single_leg"],
    "full_body": ["all"],
}

# Programmes en structure « circuit » : pas de découpage par patron moteur,
# la séance est un enchaînement de complexes / explosif / conditionnement.
CIRCUIT_CATEGORIES = ["complex", "explosive", "conditioning"]

LEVEL_ORDER = {"debutant": 0, "intermediaire": 1, "avance": 2}


def arm_group(ex: dict) -> str:
    """Extenseurs du coude = jour push ; tout le reste des bras = jour pull."""
    muscles = ex.get("muscles_primary") or []
    return "triceps" if any("triceps" in m.lower() for m in muscles) else "biceps"


def _fetch_all() -> list[dict]:
    """La bibliothèque tient en 109 lignes : un seul fetch, filtré en mémoire."""
    result = supabase.table("exercises").select("*").execute()
    return result.data or []


def _matches_program(ex: dict, program_id: str, allow_universal: bool) -> bool:
    targets = ex.get("target_programs") or []
    if not targets:
        # Exercice sans programme cible = universel (warmup / finisher).
        return allow_universal
    return program_id in targets


def _matches_location(ex: dict, location: str) -> bool:
    """Le lieu déclaré en début de séance décide du matériel disponible."""
    return location in (ex.get("locations") or ["gym"])


def fetch_exercises_by_ids(ids: list[str]) -> list[dict]:
    """
    Récupère des exercices NOMMÉMENT, hors de toute règle de sélection.

    Les séances textbook désignent leurs mouvements par identifiant : il ne
    s'agit pas de choisir dans un pool mais de servir un programme écrit.
    """
    if not ids:
        return []
    result = supabase.table("exercises").select("*").in_("id", ids).execute()
    return result.data or []


def session_rng(user_program_id: str, day_number: int) -> random.Random:
    """
    Tirage reproductible par séance.

    Une progression arithmétique sur l'index faisait resservir les mêmes
    exercices d'une séance à l'autre ; on seede un vrai générateur sur le
    couple (programme, jour) et on mélange.
    """
    key = f"{user_program_id}#{day_number}".encode()
    seed = int.from_bytes(hashlib.sha256(key).digest()[:8], "big")
    return random.Random(seed)


def select_exercises(
    program_id: str,
    *,
    categories: list[str] | None = None,
    exercise_types: list[str] | None = None,
    level_max: str = "avance",
    bodyweight_only: bool = False,
    location: str = "gym",
    warmup_targets: list[str] | None = None,
    intents: list[str] | None = None,
    allow_universal: bool = False,
    exclude_ids: set[str] | None = None,
    arm_group_only: str | None = None,
    exclude_regressions: bool = False,
    exclude_high_impact: bool = False,
    warmup_pool: bool = False,
) -> list[dict]:
    """Retourne les exercices de la bibliothèque satisfaisant tous les critères."""
    exclude_ids = exclude_ids or set()
    max_level = LEVEL_ORDER.get(level_max, 2)
    pool = []

    for ex in _fetch_all():
        if ex["id"] in exclude_ids:
            continue
        if not _matches_program(ex, program_id, allow_universal):
            continue
        if warmup_pool:
            # Pool d'échauffement : la catégorie `warmup`, plus tout exercice
            # portant une cible d'échauffement. L'Air Squat sert d'abord à ça.
            if ex.get("category") != "warmup" and not (ex.get("warmup_target") or []):
                continue
        elif categories and ex.get("category") not in categories:
            continue
        # Une variante allégée n'a sa place dans le bloc principal que chez un
        # débutant ou un pratiquant âgé.
        if exclude_regressions and ex.get("is_regression"):
            continue
        # Saut, réception au sol ou barre rattrapée en mouvement : écarté
        # quand les articulations sont à ménager. Ce n'est pas un plafond de
        # difficulté — un squat lourd reste proposé : c'est la réception qui
        # abîme, pas la charge.
        if exclude_high_impact and ex.get("high_impact"):
            continue
        # Restreint la catégorie `arms` à un seul groupe (jours push / pull).
        if arm_group_only and ex.get("category") == "arms" \
                and arm_group(ex) != arm_group_only:
            continue
        if exercise_types and ex.get("exercise_type") not in exercise_types:
            continue
        if LEVEL_ORDER.get(ex.get("level"), 0) > max_level:
            continue
        if bodyweight_only and not ex.get("bodyweight_compatible"):
            continue
        if intents and not set(intents) & set(ex.get("intent") or []):
            continue
        if warmup_targets:
            targets = ex.get("warmup_target") or []
            # "all" convient à toutes les séances.
            if not (set(warmup_targets) & set(targets) or "all" in targets):
                continue
        if not _matches_location(ex, location):
            continue
        pool.append(ex)

    return pool


def order_by_freshness(
    pool: list[dict],
    rng: random.Random,
    recent_ids: set[str] | None = None,
) -> list[dict]:
    """
    Ordonne un pool : ceux qui n'ont pas servi récemment d'abord, mélangés
    à l'intérieur de chaque strate. On n'interdit jamais un exercice — sur un
    pool étroit il faut bien réutiliser.
    """
    recent_ids = recent_ids or set()
    fresh = [e for e in pool if e["id"] not in recent_ids]
    stale = [e for e in pool if e["id"] in recent_ids]
    rng.shuffle(fresh)
    rng.shuffle(stale)
    return fresh + stale


def pick(
    pool: list[dict],
    count: int,
    rng: random.Random,
    recent_ids: set[str] | None = None,
) -> list[dict]:
    """Tirage simple, quand le pool n'a pas de sous-groupes à équilibrer."""
    if not pool or count <= 0:
        return []
    return order_by_freshness(pool, rng, recent_ids)[:count]


def group_by(pool: list[dict], key) -> list[tuple[str, list[dict]]]:
    """Répartit un pool en sous-groupes ; les exercices sans clé sont écartés."""
    groups: dict[str, list[dict]] = {}
    for ex in pool:
        k = key(ex)
        if not k:
            continue
        groups.setdefault(k, []).append(ex)
    return list(groups.items())


def pick_balanced(
    groups: list[tuple[str, list[dict]]],
    count: int,
    rng: random.Random,
    recent_ids: set[str] | None = None,
    priority_key: str | None = None,
    strict_families: bool = False,
) -> list[dict]:
    """
    Tire `count` exercices en gardant chaque sous-groupe représenté.

    C'est la règle qui manquait : un tirage à plat sur un focus `upper` mélange
    push, pull et arms dans le même sac et peut rendre quatre compounds de push
    et zéro pull — aléatoire, mais faux. On sert donc les sous-groupes en
    tourniquet, chacun dans son propre ordre fraîcheur-d'abord.
    """
    if count <= 0:
        return []
    # L'ordre de passage des groupes est lui-même tiré : sinon le premier
    # sous-groupe serait toujours servi en premier.
    ordered = [(k, items) for k, items in groups if items]
    rng.shuffle(ordered)
    if priority_key:
        # Le compound en trop d'une séance chargée revient au groupe mis en
        # avant ce jour-là : deux push aujourd'hui, deux pull la prochaine fois.
        ordered.sort(key=lambda g: g[0] != priority_key)
    queues = [order_by_freshness(items, rng, recent_ids) for _, items in ordered]

    out: list[dict] = []
    taken: set[str] = set()
    families: set[str] = set()

    def drain(strict: bool) -> None:
        progress = True
        while len(out) < count and progress:
            progress = False
            for queue in queues:
                if len(out) >= count:
                    break
                index = None
                for i, ex in enumerate(queue):
                    if ex["id"] in taken:
                        continue
                    fam = ex.get("movement_family")
                    if strict and fam and fam in families:
                        continue
                    index = i
                    break
                if index is None:
                    continue
                chosen = queue.pop(index)
                taken.add(chosen["id"])
                if chosen.get("movement_family"):
                    families.add(chosen["movement_family"])
                out.append(chosen)
                progress = True

    # `strict` interdit deux exercices de la même famille de mouvement — c'est
    # ce qui évite d'enchaîner tractions et tractions négatives.
    drain(True)
    # Sur le bloc principal la contrainte ne se relâche pas : mieux vaut un
    # exercice de moins (compensé en séries) que deux fois le même patron.
    if not strict_families:
        drain(False)
    return out


def compensate(sets: int, wanted: int, actual: int) -> int:
    """Reporte sur les séries le volume perdu quand un exercice manque."""
    if actual >= wanted or actual < 1:
        return sets
    return min(-(-sets * wanted // actual), sets + 3)


# ─── Élargissement du plafond de niveau ───

# En dessous de ce rapport pool/tirage, la rotation ne peut plus varier.
POOL_VARIETY_FACTOR = 2

LEVEL_LADDER = ["debutant", "intermediaire", "avance"]


def select_varied(program_id: str, count: int, **opts) -> list[dict]:
    """
    Sélectionne en élargissant le plafond de niveau si le pool est trop étroit.

    Le plafond vient du persona, et il est parfois plus serré que la
    bibliothèque ne le permet : un Corporate Rusher plafonné à `intermediaire`
    n'avait que 7 complexes éligibles pour 5 tirés par séance — le même jeu
    revenait forcément. Mieux vaut lui proposer un mouvement avancé de temps en
    temps que la même séance chaque fois. On ne descend jamais en dessous du
    plafond demandé : on ne fait que l'élargir quand il étouffe le tirage.
    """
    level_max = opts.pop("level_max", "avance")
    pool = select_exercises(program_id, level_max=level_max, **opts)
    try:
        start = LEVEL_LADDER.index(level_max)
    except ValueError:
        return pool
    for wider_level in LEVEL_LADDER[start + 1:]:
        if len(pool) >= count * POOL_VARIETY_FACTOR:
            break
        wider = select_exercises(program_id, level_max=wider_level, **opts)
        if len(wider) > len(pool):
            pool = wider
    return pool


def fit_to_pool(pool_size: int, wanted: int, sets: int) -> tuple[int, int]:
    """
    Ajuste le nombre d'exercices à ce que le pool peut réellement faire varier,
    et reporte le volume perdu sur les séries.

    Tirer 7 exercices dans une réserve de 8 ne produit pas une séance variée :
    elle contient presque tout le pool, donc la suivante aussi. Mieux vaut moins
    de mouvements et plus de tours — la charge de travail est conservée, et deux
    séances consécutives cessent d'être la même liste réordonnée.
    """
    capacity = pool_size // POOL_VARIETY_FACTOR
    if capacity < 1 or capacity >= wanted:
        return wanted, sets
    # Le report est plafonné : au-delà, la séance devient interminable.
    return capacity, min(-(-sets * wanted // capacity), sets + 3)


# ─── Énergie → charge et volume ───

VOLUME_BY_ENERGY = {
    1: {"load_delta": -15, "sets_delta": -1, "compounds": 2, "isolations": 1,
        "core": 1, "warmup": 5, "with_finisher": False},
    2: {"load_delta": -10, "sets_delta": -1, "compounds": 3, "isolations": 1,
        "core": 2, "warmup": 5, "with_finisher": False},
    3: {"load_delta": 0, "sets_delta": 0, "compounds": 3, "isolations": 2,
        "core": 2, "warmup": 4, "with_finisher": True},
    4: {"load_delta": 0, "sets_delta": 0, "compounds": 4, "isolations": 3,
        "core": 3, "warmup": 4, "with_finisher": True},
    5: {"load_delta": 5, "sets_delta": 1, "compounds": 4, "isolations": 3,
        "core": 3, "warmup": 3, "with_finisher": True},
}


def volume_for_energy(energy: int) -> dict:
    """L'énergie déclarée module la charge ET le volume de la séance."""
    return VOLUME_BY_ENERGY[max(1, min(5, int(energy)))]
