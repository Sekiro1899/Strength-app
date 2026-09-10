import { createElement, useState } from "react";
import { Linking, Platform, Pressable, Text, View } from "react-native";
import { embedUrl, searchUrl, watchUrl } from "../lib/video";

/**
 * Démonstration vidéo d'un exercice.
 *
 * Web    : lecteur YouTube intégré, chargé seulement après un appui — un
 *          iframe par exercice ferait autant de requêtes tierces au montage.
 * Natif  : ouvre l'app YouTube. L'intégration réclamerait react-native-webview,
 *          une dépendance de plus dont le web n'a pas besoin.
 *
 * Sans lien indexé, le bouton renvoie vers une recherche sur le nom de
 * l'exercice : jamais cassé, quel que soit l'état du mapping.
 */
export function ExerciseVideo({
  name,
  videoUrl,
}: {
  name: string;
  videoUrl: string | null | undefined;
}) {
  const [playing, setPlaying] = useState(false);
  const embed = embedUrl(videoUrl);
  const indexed = embed !== null;

  const open = () => {
    const target = watchUrl(videoUrl) ?? searchUrl(name);
    Linking.openURL(target).catch(() => {
      /* Aucun navigateur disponible : rien de mieux à proposer. */
    });
  };

  if (playing && embed) {
    return (
      <View className="mb-6 overflow-hidden rounded-card border border-line bg-panel">
        <View className="w-full" style={{ aspectRatio: 16 / 9 }}>
          {/*
            react-native-web rend du DOM : un iframe passe directement.
            createElement plutôt que du JSX, pour ne pas dépendre des types
            DOM dans un projet dont la cible principale est native.
          */}
          {createElement("iframe", {
            src: `${embed}&autoplay=1`,
            title: `Démonstration — ${name}`,
            allow: "accelerometer; clipboard-write; encrypted-media; picture-in-picture; fullscreen",
            allowFullScreen: true,
            frameBorder: "0",
            style: { width: "100%", height: "100%", border: "none" },
          })}
        </View>
        <Pressable onPress={() => setPlaying(false)} className="px-4 py-3">
          <Text className="font-mono text-[10px] uppercase tracking-label text-muted">
            Fermer la vidéo
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        indexed ? `Voir la démonstration de ${name}` : `Chercher une démonstration de ${name}`
      }
      onPress={() => {
        if (indexed && Platform.OS === "web") setPlaying(true);
        else open();
      }}
      className="mb-6 flex-row items-center justify-center gap-2.5 rounded-xl border border-line bg-panel px-4 py-3.5 active:opacity-70"
    >
      <Text className="text-accent text-[13px]">▶</Text>
      <Text className="font-mono text-[10px] uppercase tracking-label text-muted">
        {indexed ? "Voir la démonstration" : "Chercher une démonstration"}
      </Text>
    </Pressable>
  );
}
