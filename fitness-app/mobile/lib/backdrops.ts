/**
 * Photos d'ambiance affichées en fond d'écran.
 *
 * Le noir et blanc est cuit dans les fichiers, pas appliqué en CSS : le rendu
 * est donc identique sur web et sur natif, où `filter` n'existe pas. Le fondu,
 * lui, reste à l'affichage (voir components/Backdrop).
 *
 * Pour en ajouter une : dépose le fichier dans assets/backdrops/ en suivant la
 * recette du README, puis ajoute son `require` ici. Une liste vide n'est pas
 * une erreur — le fond retombe alors sur une composition géométrique.
 */
export const BACKDROPS: number[] = [
  require("../assets/backdrops/01-wraps.jpg"),
  require("../assets/backdrops/02-stack.jpg"),
  require("../assets/backdrops/03-airbike.jpg"),
  require("../assets/backdrops/04-spin.jpg"),
  require("../assets/backdrops/05-rings.jpg"),
];

/**
 * Choisit une photo stable pour un écran donné : le dashboard garde toujours
 * la même, l'écran de séance une autre. Un fond qui change à chaque rendu
 * donnerait le tournis.
 */
export function backdropFor(key: string): number | null {
  if (BACKDROPS.length === 0) return null;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return BACKDROPS[hash % BACKDROPS.length];
}
