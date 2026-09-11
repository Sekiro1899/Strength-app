/**
 * Tokens de la direction artistique — miroir de tailwind.config.js.
 *
 * Tailwind couvre tout ce qui est statique via className. Ce fichier existe
 * pour les valeurs qu'on ne peut PAS écrire en classe : dégradés passés à
 * <LinearGradient>, couleurs injectées dans des props natives
 * (ActivityIndicator, RefreshControl, StatusBar).
 *
 * Référence visuelle : docs/ui-prototype.html
 */

import type { PersonaCode } from "./types";

export const COLORS = {
  bg: "#0a0a0f",
  panel: "#13131c",
  surface: "#1c1c28",
  line: "#2a2a3a",
  ink: "#f4f4f5",
  muted: "#8b8b9a",
  accent: "#e3ff5c",
  danger: "#ff4d3d",
} as const;

/**
 * Couleurs persona retravaillées pour le fond charbon.
 *
 * On n'utilise PAS `personas.color` de la base : ces valeurs (#E91E8C,
 * #1565C0, #2E7D32…) ont été choisies pour un fond clair et deviennent
 * illisibles sur #0a0a0f. La base reste la source de vérité pour l'identité
 * du persona ; l'affichage est une décision de design.
 */
export const PERSONA_COLORS: Record<PersonaCode, string> = {
  SMB: "#ff5fa8",
  BF: "#ff3d3d",
  AW: "#2a8fff",
  CR: "#4ade80",
  SAV: "#a855f7",
};

/** Dégradés des cartes persona / programme (135°, comme le prototype). */
export const PERSONA_GRADIENTS: Record<PersonaCode, [string, string]> = {
  SMB: ["#ff5fa8", "#ff3d8b"],
  BF: ["#ff3d3d", "#c81e1e"],
  AW: ["#2a8fff", "#1668d6"],
  CR: ["#4ade80", "#22a35c"],
  SAV: ["#a855f7", "#7c2fd4"],
};

export const ACCENT_GRADIENT: [string, string] = ["#e3ff5c", "#c4e045"];

/**
 * Palette catégorielle des graphiques.
 *
 * Les couleurs de marque (lime #e3ff5c, rose #ff5fa8, vert #4ade80) ne
 * conviennent PAS à cet usage : elles sont trop claires pour le fond des
 * cartes et deux d'entre elles deviennent indistinguables en vision
 * deutéranope. Ces cinq-là sont les mêmes teintes ramenées dans la bande de
 * clarté du mode sombre (OKLCH L ∈ [0,48 ; 0,67]).
 *
 * Vérifiées : bande de clarté, plancher de chroma, séparation daltonienne
 * (ΔE ≥ 10 sur les paires voisines), lisibilité en vision normale, contraste
 * contre la surface #1c1c28. L'ORDRE EST FIXE — une série garde sa couleur
 * quand une autre disparaît du filtre.
 */
export const CHART_COLORS: string[] = [
  "#037ef0", // bleu
  "#e40087", // magenta
  "#798b01", // olive
  "#a538ff", // violet
  "#0290a4", // cyan
];

/** Angle 135° en coordonnées LinearGradient. */
export const GRADIENT_DIRECTION = {
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
} as const;

const FALLBACK: PersonaCode = "AW";

export function personaColor(code: string | null | undefined): string {
  return PERSONA_COLORS[(code as PersonaCode) ?? FALLBACK] ?? PERSONA_COLORS[FALLBACK];
}

export function personaGradient(code: string | null | undefined): [string, string] {
  return (
    PERSONA_GRADIENTS[(code as PersonaCode) ?? FALLBACK] ??
    PERSONA_GRADIENTS[FALLBACK]
  );
}

/** Lettre affichée dans la pastille d'une option de questionnaire (A, B, C…). */
export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

/** Initiales pour l'avatar du dashboard. */
export function initialsFromEmail(email: string | null | undefined): string {
  if (!email) return "··";
  const name = email.split("@")[0];
  const parts = name.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Photo d'ambiance du fond d'écran. Laissée vide : aucun hébergeur d'images
 * n'est joignable depuis l'environnement de build, et embarquer une photo
 * dans le dépôt pose une question de licence. Renseigne une URL ici et le
 * fond géométrique cède la place à la photo, assombrie et dégradée.
 */
export const GYM_PHOTO_URL: string | null = null;
