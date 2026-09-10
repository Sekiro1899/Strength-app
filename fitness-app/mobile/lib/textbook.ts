/**
 * Programmes de force classiques, servis tels quels par le randomizer.
 *
 * Un tirage compose une séance à partir de règles ; ces programmes-là, non.
 * Starting Strength et StrongLifts 5x5 SONT des séances écrites, alternant
 * deux jours, et leur intérêt tient précisément à ce qu'ils ne varient pas :
 * c'est la charge qui progresse, pas la liste des exercices. Les tirer au sort
 * chaque semaine les viderait de leur sens.
 *
 * Ils ne sont donc pas « générés » mais RÉCITÉS, et seulement à qui ils
 * s'adressent : quelqu'un qui vient chercher de la charge et de la masse, et
 * qui a répondu que transpirer n'était pas son sujet (q3 + q9). Voir
 * `Profile.strengthOriented`.
 *
 * Chaque poste liste ses candidats par ordre de préférence : le premier
 * praticable au lieu déclaré l'emporte. Si le poste principal n'a aucun
 * candidat — une barre olympique en plein air, par exemple — le programme
 * entier est écarté et la séance repasse par le tirage. Starting Strength sans
 * barre n'est pas Starting Strength.
 */

import type { TrainingLocation } from "./types";

export interface TextbookLift {
  /** Candidats par ordre de préférence ; le premier praticable gagne. */
  exerciseIds: string[];
  sets: number;
  reps: number;
  /** Charge de croisière, en % de 1RM. Les semaines d'apprentissage l'abaissent. */
  loadPct: number;
  restSec: number;
}

export interface TextbookDay {
  /** « Jour A », « Jour B » — l'alternance est le programme. */
  label: string;
  lifts: TextbookLift[];
}

export interface TextbookProgram {
  key: string;
  /** Nom affiché au pratiquant, tel qu'il le trouvera sur internet. */
  name: string;
  /** Une phrase pour dire ce que le programme cherche. */
  intent: string;
  days: TextbookDay[];
}

// Repos longs : sur du 5x5 lourd, c'est la récupération qui tient la charge.
const HEAVY_REST = 180;
const DEADLIFT_REST = 210;

export const TEXTBOOK_PROGRAMS: TextbookProgram[] = [
  {
    key: "starting_strength",
    name: "Starting Strength",
    intent:
      "Trois séries de cinq sur les mouvements de base, et un peu plus lourd à chaque séance. Le programme le plus court qui marche.",
    days: [
      {
        label: "Jour A",
        lifts: [
          { exerciseIds: ["LEG-039", "LEG-038"], sets: 3, reps: 5, loadPct: 80, restSec: HEAVY_REST },
          { exerciseIds: ["PUS-001", "PUS-002"], sets: 3, reps: 5, loadPct: 80, restSec: HEAVY_REST },
          // Le soulevé de terre ne se fait qu'en une série de travail : cinq
          // séries lourdes de hinge, personne ne les récupère.
          { exerciseIds: ["LEG-044", "LEG-045"], sets: 1, reps: 5, loadPct: 85, restSec: DEADLIFT_REST },
        ],
      },
      {
        label: "Jour B",
        lifts: [
          { exerciseIds: ["LEG-039", "LEG-038"], sets: 3, reps: 5, loadPct: 80, restSec: HEAVY_REST },
          { exerciseIds: ["PUS-006"], sets: 3, reps: 5, loadPct: 78, restSec: HEAVY_REST },
          { exerciseIds: ["LEG-044", "LEG-045"], sets: 1, reps: 5, loadPct: 85, restSec: DEADLIFT_REST },
        ],
      },
    ],
  },
  {
    key: "stronglifts",
    name: "StrongLifts 5×5",
    intent:
      "Cinq séries de cinq sur trois mouvements par séance. Plus de volume que Starting Strength, pour la même progression linéaire.",
    days: [
      {
        label: "Jour A",
        lifts: [
          { exerciseIds: ["LEG-039", "LEG-038"], sets: 5, reps: 5, loadPct: 78, restSec: HEAVY_REST },
          { exerciseIds: ["PUS-001", "PUS-002"], sets: 5, reps: 5, loadPct: 78, restSec: HEAVY_REST },
          { exerciseIds: ["PUL-020"], sets: 5, reps: 5, loadPct: 72, restSec: HEAVY_REST },
        ],
      },
      {
        label: "Jour B",
        lifts: [
          { exerciseIds: ["LEG-039", "LEG-038"], sets: 5, reps: 5, loadPct: 78, restSec: HEAVY_REST },
          { exerciseIds: ["PUS-006"], sets: 5, reps: 5, loadPct: 75, restSec: HEAVY_REST },
          { exerciseIds: ["LEG-044", "LEG-045"], sets: 1, reps: 5, loadPct: 85, restSec: DEADLIFT_REST },
        ],
      },
    ],
  },
  {
    key: "stronglifts_pullups",
    name: "StrongLifts 5×5 — variante tractions",
    intent:
      "Le même 5x5, avec les tractions au poste de tirage. Au poids de corps la charge ne monte pas d'elle-même : on ajoute la ceinture.",
    days: [
      {
        label: "Jour A",
        lifts: [
          { exerciseIds: ["LEG-039", "LEG-038"], sets: 5, reps: 5, loadPct: 78, restSec: HEAVY_REST },
          { exerciseIds: ["PUS-001", "PUS-002"], sets: 5, reps: 5, loadPct: 78, restSec: HEAVY_REST },
          { exerciseIds: ["PUL-016", "PUL-020"], sets: 5, reps: 5, loadPct: 72, restSec: HEAVY_REST },
        ],
      },
      {
        label: "Jour B",
        lifts: [
          { exerciseIds: ["LEG-039", "LEG-038"], sets: 5, reps: 5, loadPct: 78, restSec: HEAVY_REST },
          { exerciseIds: ["PUS-006"], sets: 5, reps: 5, loadPct: 75, restSec: HEAVY_REST },
          { exerciseIds: ["LEG-044", "LEG-045"], sets: 1, reps: 5, loadPct: 85, restSec: DEADLIFT_REST },
        ],
      },
    ],
  },
];

/**
 * Semaines d'apprentissage d'un débutant.
 *
 * Un débutant qui découvre le squat barre n'a pas de charge à chercher : il a
 * un mouvement à installer. Les deux premières semaines se font donc à vide ou
 * presque, et la consigne le dit explicitement — sans quoi « 3x5 à 80 % »
 * l'enverrait charger une barre qu'il ne sait pas encore porter.
 */
export const LEARNING_WEEKS = 2;
export const LEARNING_LOAD_PCT = 45;
export const LEARNING_NOTE =
  "Semaine d'apprentissage — barre à vide ou légère. L'objectif est le mouvement, pas la charge.";

/** Le premier candidat praticable au lieu déclaré, ou null. */
export function resolveLift(
  lift: TextbookLift,
  location: TrainingLocation,
  isAvailable: (id: string, location: TrainingLocation) => boolean,
): string | null {
  return lift.exerciseIds.find((id) => isAvailable(id, location)) ?? null;
}
