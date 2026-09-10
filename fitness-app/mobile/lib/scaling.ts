/**
 * Progression sur les mouvements au poids de corps.
 *
 * Sur un développé couché, la prescription se règle avec la charge : 4x8 à
 * 70 % veut dire quelque chose pour tout le monde. Sur des tractions, non —
 * « 4x8 » est un échauffement pour l'un et hors d'atteinte pour l'autre, et le
 * moteur n'a aucun moyen de savoir lequel. La seule prescription honnête est
 * donc double : comment monter, comment descendre.
 *
 * Le lien vidéo porte sur la VARIANTE ALLÉGÉE, pas sur le mouvement lui-même :
 * l'exercice a déjà sa démonstration dans le bloc, et c'est l'installation de
 * l'élastique qui se voit mal en texte.
 *
 * `video_url` reste à null tant que le lien n'a pas été vérifié — l'app bascule
 * alors sur une recherche `video_query`. Un identifiant inventé donnerait un
 * lecteur cassé, ou pire, la mauvaise démonstration présentée comme la bonne.
 */

import type { ExerciseScaling } from "./types";

const WEIGHTED = "Ceinture lestée ou gilet : ajoute 2,5 kg dès que tu tiens la borne haute sur toutes les séries.";

export const SCALING: Record<string, ExerciseScaling> = {
  // Tractions pronation
  "PUL-016": {
    harder: WEIGHTED,
    easier:
      "Banded Pull-ups : élastique accroché à la barre, pied ou genou dedans. Passe à une section plus fine à mesure que ça vient.",
    video_url: null,
    video_query: "banded pull up progression setup",
  },
  // Tractions supination
  "PUL-017": {
    harder: WEIGHTED,
    easier:
      "Banded Chin-ups : même montage qu'en pronation, paumes vers toi. Les biceps aidant, l'élastique peut être plus fin qu'en pronation.",
    video_url: null,
    video_query: "banded chin up progression setup",
  },
  // Dips aux barres parallèles
  "PUS-004": {
    harder: WEIGHTED,
    easier:
      "Banded Dips : élastique tendu entre les deux barres, genoux posés dessus. Sinon, dips aux pieds posés au sol.",
    video_url: null,
    video_query: "banded dips assistance setup",
  },
  // Dips à la barre droite
  "PUS-005": {
    harder: WEIGHTED,
    easier:
      "Élastique passé sur la barre, genou dedans. Garde le buste penché en avant : à la barre droite, c'est ce qui protège l'épaule.",
    video_url: null,
    video_query: "straight bar dip banded progression",
  },
  // Dips aux anneaux
  "PUS-003": {
    harder: WEIGHTED,
    easier:
      "Anneaux réglés bas, pieds au sol pour alléger. Verrouille les anneaux contre les hanches en haut avant de chercher à lester.",
    video_url: null,
    video_query: "ring dips progression feet assisted",
  },
};

/** Renvoie la progression d'un exercice, ou null s'il n'en demande pas. */
export function scalingFor(exerciseId: string): ExerciseScaling | null {
  return SCALING[exerciseId] ?? null;
}
