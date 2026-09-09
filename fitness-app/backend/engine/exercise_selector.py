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

FOCUS_CATEGORY_MAP = {
    "push": ["push"],
    "pull": ["pull"],
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
        if categories and ex.get("category") not in categories:
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


def pick(
    pool: list[dict],
    count: int,
    rng: random.Random,
    recent_ids: set[str] | None = None,
) -> list[dict]:
    """
    Tire `count` exercices en privilégiant ceux qui n'ont pas servi récemment.
    On ne les interdit pas : sur un pool étroit il faut bien réutiliser.
    """
    recent_ids = recent_ids or set()
    fresh = [e for e in pool if e["id"] not in recent_ids]
    stale = [e for e in pool if e["id"] in recent_ids]
    rng.shuffle(fresh)
    rng.shuffle(stale)
    return (fresh + stale)[:count]


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
