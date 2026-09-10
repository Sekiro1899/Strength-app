#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mapping exercice → démonstration YouTube.

Le fichier data/09_exercise_videos.json liste les 134 exercices avec leur nom,
et une `url` à remplir. N'importe quelle forme de lien YouTube convient (watch,
youtu.be, embed, shorts) ou l'identifiant nu : lib/video.ts les normalise.

    python3 docs/exercise_videos.py        # régénère le fichier + applique

Régénérer préserve les URL déjà saisies et ajoute les exercices apparus depuis.
Appliquer recopie les URL dans data/08_exercises.json (champ video_url).
Un exercice sans URL retombe côté app sur une recherche YouTube par nom.
"""
import json
import re
import sys
from pathlib import Path

DATA = Path(__file__).parent / "data"
LIBRARY = DATA / "08_exercises.json"
MAPPING = DATA / "09_exercise_videos.json"

# Même grammaire que lib/video.ts — un identifiant fait 11 caractères.
PATTERNS = [
    r"[?&]v=([A-Za-z0-9_-]{11})",
    r"youtu\.be/([A-Za-z0-9_-]{11})",
    r"/embed/([A-Za-z0-9_-]{11})",
    r"/shorts/([A-Za-z0-9_-]{11})",
    r"/live/([A-Za-z0-9_-]{11})",
]


def youtube_id(raw):
    if not raw:
        return None
    value = str(raw).strip()
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", value):
        return value
    for pattern in PATTERNS:
        m = re.search(pattern, value)
        if m:
            return m.group(1)
    return None


def main() -> None:
    library = json.loads(LIBRARY.read_text(encoding="utf-8"))

    existing = {}
    if MAPPING.exists():
        previous = json.loads(MAPPING.read_text(encoding="utf-8"))
        existing = {k: v.get("url") for k, v in previous.get("videos", {}).items()}

    videos, filled, invalid = {}, 0, []
    for ex in library:
        url = existing.get(ex["id"])
        videos[ex["id"]] = {"name": ex["name"], "url": url}
        if url:
            if youtube_id(url):
                filled += 1
            else:
                invalid.append((ex["id"], url))

    if invalid:
        for eid, url in invalid:
            print(f"  lien illisible  {eid}  {url!r}", file=sys.stderr)
        sys.exit(f"{len(invalid)} lien(s) non reconnu(s) comme URL YouTube")

    MAPPING.write_text(
        json.dumps(
            {
                "_comment": (
                    "Colle une URL YouTube dans `url` pour indexer la "
                    "démonstration d'un exercice, puis relance "
                    "python3 docs/exercise_videos.py. Sans URL, l'app propose "
                    "une recherche YouTube sur le nom de l'exercice."
                ),
                "videos": videos,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    for ex in library:
        ex["video_url"] = videos[ex["id"]]["url"]
    LIBRARY.write_text(
        json.dumps(library, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print(f"OK  {len(videos)} exercices, {filled} avec démonstration indexée")
    print(f"->  {MAPPING}")
    print(f"->  {LIBRARY}")
    print("    puis : cd fitness-app/mobile && python3 scripts/gen_fixtures.py")


if __name__ == "__main__":
    main()
