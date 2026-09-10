"""
Programmes de force classiques, servis tels quels par le randomizer.

Miroir de mobile/lib/textbook.ts — les deux doivent rester identiques.

Un tirage compose une séance à partir de règles ; ces programmes-là, non.
Starting Strength et StrongLifts 5x5 SONT des séances écrites, alternant deux
jours, et leur intérêt tient précisément à ce qu'ils ne varient pas : c'est la
charge qui progresse, pas la liste des exercices.

Chaque poste liste ses candidats par ordre de préférence : le premier
praticable au lieu déclaré l'emporte. Si un poste n'a aucun candidat — une
barre olympique en plein air — le programme entier est écarté et la séance
repasse par le tirage. Starting Strength sans barre n'est pas Starting Strength.
"""

# Repos longs : sur du 5x5 lourd, c'est la récupération qui tient la charge.
HEAVY_REST = 180
DEADLIFT_REST = 210

TEXTBOOK_PROGRAMS = [
    {
        "key": "starting_strength",
        "name": "Starting Strength",
        "days": [
            {
                "label": "Jour A",
                "lifts": [
                    {"ids": ["LEG-039", "LEG-038"], "sets": 3, "reps": 5, "load": 80, "rest": HEAVY_REST},
                    {"ids": ["PUS-001", "PUS-002"], "sets": 3, "reps": 5, "load": 80, "rest": HEAVY_REST},
                    # Le soulevé de terre ne se fait qu'en une série de travail :
                    # cinq séries lourdes de hinge, personne ne les récupère.
                    {"ids": ["LEG-044", "LEG-045"], "sets": 1, "reps": 5, "load": 85, "rest": DEADLIFT_REST},
                ],
            },
            {
                "label": "Jour B",
                "lifts": [
                    {"ids": ["LEG-039", "LEG-038"], "sets": 3, "reps": 5, "load": 80, "rest": HEAVY_REST},
                    {"ids": ["PUS-006"], "sets": 3, "reps": 5, "load": 78, "rest": HEAVY_REST},
                    {"ids": ["LEG-044", "LEG-045"], "sets": 1, "reps": 5, "load": 85, "rest": DEADLIFT_REST},
                ],
            },
        ],
    },
    {
        "key": "stronglifts",
        "name": "StrongLifts 5×5",
        "days": [
            {
                "label": "Jour A",
                "lifts": [
                    {"ids": ["LEG-039", "LEG-038"], "sets": 5, "reps": 5, "load": 78, "rest": HEAVY_REST},
                    {"ids": ["PUS-001", "PUS-002"], "sets": 5, "reps": 5, "load": 78, "rest": HEAVY_REST},
                    {"ids": ["PUL-020"], "sets": 5, "reps": 5, "load": 72, "rest": HEAVY_REST},
                ],
            },
            {
                "label": "Jour B",
                "lifts": [
                    {"ids": ["LEG-039", "LEG-038"], "sets": 5, "reps": 5, "load": 78, "rest": HEAVY_REST},
                    {"ids": ["PUS-006"], "sets": 5, "reps": 5, "load": 75, "rest": HEAVY_REST},
                    {"ids": ["LEG-044", "LEG-045"], "sets": 1, "reps": 5, "load": 85, "rest": DEADLIFT_REST},
                ],
            },
        ],
    },
    {
        "key": "stronglifts_pullups",
        "name": "StrongLifts 5×5 — variante tractions",
        "days": [
            {
                "label": "Jour A",
                "lifts": [
                    {"ids": ["LEG-039", "LEG-038"], "sets": 5, "reps": 5, "load": 78, "rest": HEAVY_REST},
                    {"ids": ["PUS-001", "PUS-002"], "sets": 5, "reps": 5, "load": 78, "rest": HEAVY_REST},
                    {"ids": ["PUL-016", "PUL-020"], "sets": 5, "reps": 5, "load": 72, "rest": HEAVY_REST},
                ],
            },
            {
                "label": "Jour B",
                "lifts": [
                    {"ids": ["LEG-039", "LEG-038"], "sets": 5, "reps": 5, "load": 78, "rest": HEAVY_REST},
                    {"ids": ["PUS-006"], "sets": 5, "reps": 5, "load": 75, "rest": HEAVY_REST},
                    {"ids": ["LEG-044", "LEG-045"], "sets": 1, "reps": 5, "load": 85, "rest": DEADLIFT_REST},
                ],
            },
        ],
    },
]

# Semaines d'apprentissage d'un débutant. Un débutant qui découvre le squat
# barre n'a pas de charge à chercher : il a un mouvement à installer. La
# consigne le dit explicitement — sans quoi « 3x5 à 80 % » l'enverrait charger
# une barre qu'il ne sait pas encore porter.
LEARNING_WEEKS = 2
LEARNING_LOAD_PCT = 45
LEARNING_NOTE = (
    "Semaine d'apprentissage — barre à vide ou légère. "
    "L'objectif est le mouvement, pas la charge."
)
