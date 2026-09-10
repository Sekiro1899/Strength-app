/**
 * Photos d'ambiance affichées en fond d'écran.
 *
 * Elles sont désaturées et fondues à l'affichage (voir components/Backdrop),
 * donc les originaux en couleur conviennent.
 *
 * POUR LES ACTIVER : dépose les fichiers dans assets/backdrops/ (voir le
 * README qui s'y trouve) puis décommente les lignes ci-dessous. Tant que la
 * liste est vide, le fond retombe sur une composition géométrique — l'app
 * fonctionne dans les deux cas, aucun `require` ne pointe vers un fichier
 * absent, ce qui casserait le bundle.
 */
export const BACKDROPS: number[] = [
  // require("../assets/backdrops/01-wraps.jpg"),
  // require("../assets/backdrops/02-stack.jpg"),
  // require("../assets/backdrops/03-airbike.jpg"),
  // require("../assets/backdrops/04-spin.jpg"),
  // require("../assets/backdrops/05-rings.jpg"),
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
