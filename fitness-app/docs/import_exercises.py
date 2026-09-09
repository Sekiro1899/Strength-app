#!/usr/bin/env python3
"""
Importe la bibliothèque d'exercices (xlsx) vers docs/data/08_exercises.json.

La feuille source contient des lignes de séparation visuelle (« ▌ PUSH ») et
encode plusieurs champs avec des emojis. Ce script normalise tout en valeurs
machine, alignées sur les CHECK constraints de docs/schema.sql.

Usage :  python3 docs/import_exercises.py <fichier.xlsx>
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

import openpyxl

OUT = Path(__file__).parent / "data" / "08_exercises.json"

# Colonnes de la feuille (index 0-based)
C_ID, C_CAT, C_NAME, C_PRIM, C_SEC, C_INTENT, C_LEVEL = 0, 1, 2, 3, 4, 5, 6
C_BW, C_MAT, C_DESC, C_WARMUP, C_VIDEO, C_TYPE, C_TARGET = 7, 8, 9, 10, 11, 12, 13

CATEGORIES = {
    "push": "push", "pull": "pull", "arms": "arms", "legs": "legs",
    "core - force": "core_strength", "core - endurance": "core_endurance",
    "explosive": "explosive", "complex": "complex",
    "conditioning": "conditioning", "warmup": "warmup", "finisher": "finisher",
}

LEVELS = {"débutant": "debutant", "intermédiaire": "intermediaire", "avancé": "avance"}

# Type d'Exercice pilote la composition des blocs :
#   compound/isolation -> main block, core -> core block, cardio -> finisher
TYPES = {"compound": "compound", "isolation": "isolation",
         "core": "core", "cardio": "cardio"}

PROGRAMS = {
    "muscle building focus": "program_muscle_building",
    "strength focus": "program_strength",
    "body weight focus": "program_bodyweight",
    "préparation athlétique": "program_athletic",
    "lactate focus": "program_lactate",
}

EMPTY = {"", "—", "-", "none", "n/a"}


def strip_emoji(text: str) -> str:
    """Retire les pictogrammes ; la bibliothèque encode Intent en « 💪 Hypertrophie »."""
    return "".join(
        ch for ch in text
        if unicodedata.category(ch) not in ("So", "Sk", "Cf")
    ).strip()


def slug(text: str) -> str:
    text = strip_emoji(text).lower().strip()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "_", text).strip("_")


def cell(row, idx) -> str:
    v = row[idx]
    if v is None:
        return ""
    v = str(v).strip()
    return "" if v.lower() in EMPTY else v


def split_list(raw: str, sep: str) -> list[str]:
    return [p.strip() for p in raw.split(sep) if p.strip()]


def is_separator(row) -> bool:
    """Les lignes « ▌ PUSH » structurent le tableur, ce ne sont pas des exercices."""
    return not cell(row, C_NAME) or "▌" in str(row[C_ID] or "")


def convert(row) -> dict:
    raw_cat = cell(row, C_CAT).lower()
    category = CATEGORIES.get(raw_cat)
    if not category:
        raise ValueError(f"Catégorie inconnue : {raw_cat!r} (ligne {row[C_ID]})")

    targets = []
    for name in split_list(cell(row, C_TARGET), ","):
        pid = PROGRAMS.get(name.lower())
        if not pid:
            raise ValueError(f"Programme inconnu : {name!r} (ligne {row[C_ID]})")
        targets.append(pid)

    return {
        "id": cell(row, C_ID),
        "category": category,
        "name": cell(row, C_NAME),
        "muscles_primary": split_list(cell(row, C_PRIM), ","),
        "muscles_secondary": split_list(cell(row, C_SEC), ","),
        "intent": [slug(i) for i in split_list(cell(row, C_INTENT), "|")],
        "level": LEVELS.get(cell(row, C_LEVEL).lower(), "debutant"),
        "bodyweight_compatible": "oui" in cell(row, C_BW).lower(),
        "material_required": split_list(cell(row, C_MAT), ","),
        "description": cell(row, C_DESC) or None,
        # Vide = universel : les warmups/finishers servent tous les programmes.
        "target_programs": targets,
        "exercise_type": TYPES.get(cell(row, C_TYPE).lower()),
        "warmup_target": [slug(w) for w in split_list(cell(row, C_WARMUP), ",")],
        "video_url": cell(row, C_VIDEO) or None,
        "image_url": None,  # rempli par docs/fetch_exercise_images.py
    }


def main() -> None:
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "")
    if not src.exists():
        sys.exit(f"Fichier introuvable : {src}")

    ws = openpyxl.load_workbook(src, data_only=True)["Exercises"]
    rows = list(ws.iter_rows(min_row=2, values_only=True))

    exercises, skipped = [], 0
    for row in rows:
        if not row or not row[C_ID]:
            continue
        if is_separator(row):
            skipped += 1
            continue
        exercises.append(convert(row))

    ids = [e["id"] for e in exercises]
    if len(ids) != len(set(ids)):
        sys.exit("IDs dupliqués dans la bibliothèque")

    OUT.write_text(json.dumps(exercises, ensure_ascii=False, indent=2) + "\n",
                   encoding="utf-8")
    print(f"OK  {len(exercises)} exercices  ({skipped} séparateurs ignorés)")
    print(f"->  {OUT}")


if __name__ == "__main__":
    main()
