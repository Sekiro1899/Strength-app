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

# ─── Matériel → tags, puis tags → lieux praticables ───
#
# La colonne Material Required est du texte libre ("barre olympique, banc plat,
# rack"). On la réduit à un vocabulaire fermé, seul exploitable par le moteur
# pour filtrer selon le lieu d'entraînement.
EQUIPMENT_PATTERNS = [
    ("barbell", ["barre olympique", "barre ez", "barre droite", "barre légère",
                 "barre vide", "trap bar", "hex bar", "landmine", "barre angled"]),
    ("plate", ["disque"]),
    ("rack", ["rack"]),
    ("cable", ["câble"]),
    ("machine", ["machine", "roman chair", "captain's chair"]),
    ("bench", ["banc"]),
    ("dumbbell", ["haltère"]),
    ("kettlebell", ["kettlebell"]),
    ("pullup_bar", ["barre de traction", "barre fixe", "barres parallèles", "barre basse"]),
    ("rings", ["anneaux", "trx", "sangles"]),
    ("band", ["bande élastique", "élastique"]),
    ("box", ["box", "plateforme", "step", "marche", "chaise"]),
    ("rope", ["corde", "battle rope"]),
    ("wheel", ["ab wheel"]),
    ("ball", ["médecine ball", "swiss ball", "medecine ball"]),
    ("mat", ["tapis", "foam roller", "pad"]),
    # "barre" seul en dernier : trop générique pour primer sur les autres
    ("barbell", ["barre"]),
]

# Où chaque matériel est disponible.
#   gym     : salle équipée
#   home    : maison, matériel minimal
#   outdoor : plein air, parc
TAG_LOCATIONS = {
    "barbell": {"gym"},
    "plate": {"gym"},
    "rack": {"gym"},
    "cable": {"gym"},
    "machine": {"gym"},
    "bench": {"gym", "home"},
    "dumbbell": {"gym", "home"},
    "box": {"gym", "home"},
    "wheel": {"gym", "home"},
    "kettlebell": {"gym", "home", "outdoor"},
    "pullup_bar": {"gym", "home", "outdoor"},
    "rings": {"gym", "home", "outdoor"},
    "band": {"gym", "home", "outdoor"},
    "rope": {"gym", "home", "outdoor"},
    "ball": {"gym", "home", "outdoor"},
    "mat": {"gym", "home", "outdoor"},
}

ALL_LOCATIONS = ["gym", "home", "outdoor"]


def equipment_tags(materials: list[str]) -> list[str]:
    tags: list[str] = []
    for raw in materials:
        low = raw.lower()
        for tag, needles in EQUIPMENT_PATTERNS:
            if any(n in low for n in needles):
                if tag not in tags:
                    tags.append(tag)
                break
    return tags


def locations_for(tags: list[str], bodyweight: bool) -> list[str]:
    """Un exercice est praticable là où TOUT son matériel est disponible."""
    if not tags:
        return list(ALL_LOCATIONS)
    allowed = set(ALL_LOCATIONS)
    for tag in tags:
        allowed &= TAG_LOCATIONS.get(tag, {"gym"})
    # Un mouvement au poids du corps reste faisable partout, le matériel
    # listé n'étant qu'une facilité (banc, tapis...).
    if bodyweight:
        allowed |= {"outdoor", "home"}
    return [loc for loc in ALL_LOCATIONS if loc in allowed]


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


# ─── Patron de mouvement (exercices de core) ───

# Le moteur tire un patron différent par exercice de core, pour éviter deux
# gainages d'affilée. La feuille ne porte pas cette information : elle est
# maintenue ici, indexée par id.
MOVEMENT_PATTERNS = {
    # Anti-extension : résister à l'ouverture du tronc
    "COR-057": "anti_extension", "COR-110": "anti_extension",
    "COR-111": "anti_extension", "COR-112": "anti_extension",
    "COR-121": "anti_extension", "COR-065": "anti_extension",
    "COR-067": "anti_extension",
    # Flexion du rachis
    "COR-059": "flexion", "COR-113": "flexion", "COR-114": "flexion",
    "COR-115": "flexion", "COR-062": "flexion", "COR-066": "flexion",
    # Plan transverse : rotation ET anti-rotation
    "COR-116": "rotation", "COR-117": "rotation",
    "COR-058": "rotation", "COR-063": "rotation",
    # Anti-flexion latérale
    "COR-118": "anti_lateral_flexion", "COR-119": "anti_lateral_flexion",
    # Flexion de hanche
    "COR-055": "hip_flexion", "COR-056": "hip_flexion",
    "COR-120": "hip_flexion", "COR-061": "hip_flexion", "COR-064": "hip_flexion",
    # Extension / chaîne postérieure
    "COR-060": "extension",
}


# ─── Formats imposés par l'exercice ───

# Un benchmark porte son propre format : 20 minutes d'AMRAP ne se découpent pas
# en séries standard. (tours, durée en secondes)
PRESCRIPTIONS = {
    "CON-084": (1, 600),    # Burpee Pull-up → Jump Squat → Push-up (AMRAP)
    "CON-131": (1, 1200),   # Cindy — AMRAP 20 min
    "CON-132": (3, 180),    # Circuit 3 tours
    "CON-133": (1, 1800),   # Chelsea — EMOM 30 min
    "CON-134": (4, 200),    # Circuit Spiderman 4 tours
}


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

    materials = split_list(cell(row, C_MAT), ",")
    bodyweight = "oui" in cell(row, C_BW).lower()
    tags = equipment_tags(materials)

    return {
        "id": cell(row, C_ID),
        "category": category,
        "name": cell(row, C_NAME),
        "muscles_primary": split_list(cell(row, C_PRIM), ","),
        "muscles_secondary": split_list(cell(row, C_SEC), ","),
        "intent": [slug(i) for i in split_list(cell(row, C_INTENT), "|")],
        "level": LEVELS.get(cell(row, C_LEVEL).lower(), "debutant"),
        "bodyweight_compatible": bodyweight,
        "material_required": materials,
        "equipment_tags": tags,
        "locations": locations_for(tags, bodyweight),
        "description": cell(row, C_DESC) or None,
        # Vide = universel : les warmups/finishers servent tous les programmes.
        "target_programs": targets,
        "exercise_type": TYPES.get(cell(row, C_TYPE).lower()),
        "movement_pattern": MOVEMENT_PATTERNS.get(cell(row, C_ID)),
        "prescribed_sets": PRESCRIPTIONS.get(cell(row, C_ID), (None, None))[0],
        "prescribed_duration_sec": PRESCRIPTIONS.get(cell(row, C_ID), (None, None))[1],
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

    # La feuille n'est pas la seule source : certains exercices ont été ajoutés
    # directement au JSON (les 12 core orientés séries). Un import les
    # écraserait ; on les conserve, ainsi que les champs enrichis hors feuille.
    kept = 0
    if OUT.exists():
        previous = json.loads(OUT.read_text(encoding="utf-8"))
        by_id = {e["id"]: e for e in exercises}
        for old in previous:
            if old["id"] in by_id:
                # image_url est rempli par un script séparé : ne pas le perdre.
                if old.get("image_url") and not by_id[old["id"]].get("image_url"):
                    by_id[old["id"]]["image_url"] = old["image_url"]
                # video_url est maintenu dans data/09_exercise_videos.json.
                if old.get("video_url") and not by_id[old["id"]].get("video_url"):
                    by_id[old["id"]]["video_url"] = old["video_url"]
            else:
                exercises.append(old)
                kept += 1

    exercises.sort(key=lambda e: e["id"])

    OUT.write_text(json.dumps(exercises, ensure_ascii=False, indent=2) + "\n",
                   encoding="utf-8")
    print(f"OK  {len(exercises)} exercices  "
          f"({skipped} séparateurs ignorés, {kept} conservés hors feuille)")
    print(f"->  {OUT}")


if __name__ == "__main__":
    main()
