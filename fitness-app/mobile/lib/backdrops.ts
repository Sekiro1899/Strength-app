/**
 * Photos d'ambiance affichées en fond d'écran.
 *
 * Le noir et blanc est cuit dans les fichiers, pas appliqué en CSS : le rendu
 * est donc identique sur web et sur natif, où `filter` n'existe pas. Le fondu,
 * lui, reste à l'affichage (voir components/Backdrop).
 *
 * Pour en ajouter une : dépose le fichier dans assets/backdrops/ en suivant la
 * recette du README, ajoute son `require` ici, puis donne-lui des écrans dans
 * SCREEN_BACKDROPS. Une liste vide n'est pas une erreur — le fond retombe
 * alors sur une composition géométrique.
 */

export const BACKDROPS: number[] = [
  require("../assets/backdrops/01-wraps.jpg"),
  require("../assets/backdrops/02-stack.jpg"),
  require("../assets/backdrops/03-airbike.jpg"),
  require("../assets/backdrops/04-spin.jpg"),
  require("../assets/backdrops/05-rings.jpg"),
];

/**
 * Quel écran porte quelle photo.
 *
 * Une table plutôt qu'un hachage : le hachage répartissait mal — cinq écrans
 * tombaient sur la même image et une des cinq photos n'était JAMAIS tirée.
 * Ici la couverture se lit, et deux écrans qui s'enchaînent ne montrent pas la
 * même chose.
 *
 * L'attribution n'est pas décorative : les bandes (`wraps`) vont sur les
 * écrans d'effort, la fonte (`stack`) sur le parcours, les anneaux (`rings`)
 * sur le profil.
 */
const SCREEN_BACKDROPS: Record<string, number> = {
  index: 0, // 01-wraps    — accueil
  auth: 4, // 05-rings
  questionnaire: 1, // 02-stack
  onboarding: 3, // 04-spin
  dashboard: 2, // 03-airbike
  prepare: 0, // 01-wraps
  session: 3, // 04-spin
  tracking: 0, // 01-wraps
  feedback: 2, // 03-airbike
  sessions: 1, // 02-stack   — historique
  profile: 4, // 05-rings
};

/**
 * Choisit une photo stable pour un écran donné : le dashboard garde toujours
 * la même, l'écran de séance une autre. Un fond qui change à chaque rendu
 * donnerait le tournis.
 *
 * Une clé inconnue retombe sur la première photo plutôt que sur rien : un
 * écran ajouté plus tard aura un fond, même sans passer par ici.
 */
export function backdropFor(key: string): number | null {
  if (BACKDROPS.length === 0) return null;
  const index = SCREEN_BACKDROPS[key];
  return BACKDROPS[(index ?? 0) % BACKDROPS.length];
}
