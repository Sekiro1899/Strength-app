/**
 * Liens de démonstration vidéo.
 *
 * `exercises.video_url` accepte n'importe quelle forme d'URL YouTube (watch,
 * youtu.be, embed, shorts) ou l'identifiant nu : le mapping se remplit en
 * collant le lien tel qu'il a été copié, sans le normaliser à la main.
 *
 * Tant qu'un exercice n'a pas de lien indexé, on renvoie vers une RECHERCHE
 * YouTube sur son nom. C'est moins direct qu'une vidéo choisie, mais toujours
 * pertinent — là où un identifiant inventé donnerait un lecteur cassé, ou pire,
 * la mauvaise démonstration présentée comme la bonne.
 */

/** Un identifiant YouTube fait 11 caractères de l'alphabet base64-url. */
const ID = /^[A-Za-z0-9_-]{11}$/;

const PATTERNS = [
  /[?&]v=([A-Za-z0-9_-]{11})/, // youtube.com/watch?v=ID
  /youtu\.be\/([A-Za-z0-9_-]{11})/, // youtu.be/ID
  /\/embed\/([A-Za-z0-9_-]{11})/, // youtube.com/embed/ID
  /\/shorts\/([A-Za-z0-9_-]{11})/, // youtube.com/shorts/ID
  /\/live\/([A-Za-z0-9_-]{11})/, // youtube.com/live/ID
];

/** Extrait l'identifiant d'un lien YouTube, ou null si ce n'en est pas un. */
export function youtubeId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (ID.test(value)) return value;
  for (const pattern of PATTERNS) {
    const match = value.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * URL du lecteur intégrable.
 * `youtube-nocookie` évite de déposer un cookie de suivi tant que le
 * pratiquant n'a pas lancé la lecture.
 */
export function embedUrl(raw: string | null | undefined): string | null {
  const id = youtubeId(raw);
  if (!id) return null;
  // rel=0 garde les suggestions de fin dans la même chaîne, playsinline
  // empêche le passage en plein écran forcé sur iOS.
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
}

/** URL à ouvrir hors de l'app (natif, ou repli si l'intégration est refusée). */
export function watchUrl(raw: string | null | undefined): string | null {
  const id = youtubeId(raw);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

/** Recherche YouTube sur le nom de l'exercice — le repli sans lien indexé. */
export function searchUrl(exerciseName: string): string {
  const query = `${exerciseName} exercise form technique`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
