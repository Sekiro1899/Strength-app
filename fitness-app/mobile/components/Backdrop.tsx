import { Image, Platform, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { backdropFor } from "../lib/backdrops";
import { COLORS, GYM_PHOTO_URL } from "../lib/theme";

/**
 * Fond d'écran — ambiance de salle, deviné plutôt que montré.
 *
 * Par ordre de préférence :
 *   1. une photo locale de assets/backdrops (voir lib/backdrops.ts),
 *   2. `GYM_PHOTO_URL` si une URL distante est renseignée,
 *   3. sinon une composition géométrique, pour qu'il y ait toujours un fond.
 *
 * Les photos sont déjà en noir et blanc dans le dépôt ; ici on les fond vers
 * le fond : elles doivent se deviner, jamais concurrencer le texte.
 *
 * Le fond COUVRE l'écran. Il a d'abord été posé sur une bande de 460 px ancrée
 * en haut : sur une fenêtre large, la photo étant au format portrait, `cover`
 * n'en montrait qu'un bandeau d'un cinquième, et tout ce qui était sous la
 * bande retombait sur un aplat. En pleine hauteur, le recadrage est centré et
 * le dégradé suffit à rendre le texte lisible jusqu'en bas.
 *
 * `variant` fixe quelle photo revient sur quel écran : le dashboard garde
 * toujours la sienne, un fond qui change à chaque rendu donnerait le tournis.
 *
 * Purement décoratif : jamais d'interaction, jamais lu par un lecteur d'écran.
 */
export function Backdrop({ variant = "default" }: { variant?: string }) {
  const photo = backdropFor(variant);

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {photo || GYM_PHOTO_URL ? (
        <Image
          source={photo ?? { uri: GYM_PHOTO_URL as string }}
          resizeMode="cover"
          // Le noir et blanc vient du fichier lui-même, pas d'un filtre CSS :
          // identique sur web et sur natif, et sans coût au rendu.
          //
          // L'opacité se lit avec le dégradé ci-dessous, pas seule : à 0,52
          // sous un voile de 0,30 en haut, la photo ressort à ~0,36 — assez
          // pour reconnaître la salle, assez peu pour que le texte tienne.
          style={{ width: "100%", height: "100%", opacity: 0.52 }}
        />
      ) : (
        <GeometricGym />
      )}

      {/*
        Le voile s'épaissit vers le bas : la photo se donne à voir en haut, là
        où il n'y a qu'un titre, et disparaît sous les cartes et les listes.
        Il ne devient jamais tout à fait opaque — un fond qui s'arrête net
        trahit le montage.
      */}
      <LinearGradient
        colors={[
          "rgba(10,10,15,0.30)",
          "rgba(10,10,15,0.64)",
          "rgba(10,10,15,0.93)",
        ]}
        locations={[0, 0.45, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
    </View>
  );
}

/** Disques de fonte et barre, à peine visibles — la salle suggérée. */
function GeometricGym() {
  const plate = (
    size: number,
    top: number,
    left: number,
    opacity: number,
  ) => (
    <View
      style={{
        position: "absolute",
        top,
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: size * 0.17,
        borderColor: COLORS.ink,
        opacity,
      }}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.panel, overflow: "hidden" }}>
      <LinearGradient
        colors={[COLORS.surface, COLORS.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {plate(240, -60, -70, 0.07)}
      {plate(150, 40, 210, 0.05)}
      {plate(300, 180, 130, 0.045)}
      {plate(110, 250, -30, 0.06)}
      {/* La barre : une diagonale qui traverse les disques. */}
      <View
        style={{
          position: "absolute",
          top: 150,
          left: -40,
          right: -40,
          height: 10,
          backgroundColor: COLORS.accent,
          opacity: 0.05,
          transform: [{ rotate: "-14deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 300,
          left: -40,
          right: -40,
          height: 4,
          backgroundColor: COLORS.ink,
          opacity: 0.04,
          transform: [{ rotate: "-14deg" }],
        }}
      />
    </View>
  );
}

/**
 * Surface vitrée : translucide, bordure claire, flou du fond sur le web.
 * `backdropFilter` n'existe pas côté natif — la teinte translucide y suffit.
 */
export const glassStyle = {
  backgroundColor: "rgba(255,255,255,0.055)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.13)",
  ...Platform.select({
    web: { backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" },
    default: {},
  }),
} as const;
