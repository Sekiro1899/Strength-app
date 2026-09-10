import { Linking, Pressable, Text, View } from "react-native";
import type { ExerciseScaling } from "../lib/types";
import { searchUrl, watchUrl } from "../lib/video";

/**
 * « À adapter selon le niveau » — la prescription à deux issues.
 *
 * Sur des tractions, « 4x8 » ne veut rien dire tout seul : c'est un
 * échauffement pour l'un, hors d'atteinte pour l'autre, et le moteur n'a aucun
 * moyen de trancher. Plutôt que de deviner, on affiche les deux sorties : par
 * où lester quand ça passe trop bien, par où alléger quand ça ne passe pas.
 *
 * Le lien vidéo porte sur la variante ALLÉGÉE : le mouvement lui-même a déjà
 * sa démonstration au-dessus, et c'est le montage de l'élastique qui se voit
 * mal en texte.
 */
export function ScalingNote({ scaling }: { scaling: ExerciseScaling }) {
  const open = () => {
    const target = watchUrl(scaling.video_url) ?? searchUrl(scaling.video_query);
    Linking.openURL(target).catch(() => {
      /* Aucun navigateur disponible : rien de mieux à proposer. */
    });
  };

  return (
    <View className="mb-6 rounded-card border border-line bg-panel/70 px-4 py-3.5">
      <Text className="font-mono text-[10px] uppercase tracking-label text-accent mb-2.5">
        À adapter selon le niveau
      </Text>

      <Row arrow="↑" text={scaling.harder} />
      <Row arrow="↓" text={scaling.easier} />

      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Voir la variante allégée en vidéo"
        onPress={open}
        className="mt-1 flex-row items-center gap-2 active:opacity-70"
      >
        <Text className="text-accent text-[11px]">▶</Text>
        <Text className="font-mono text-[10px] uppercase tracking-label text-muted">
          Voir la variante allégée
        </Text>
      </Pressable>
    </View>
  );
}

function Row({ arrow, text }: { arrow: string; text: string }) {
  return (
    <View className="flex-row gap-2.5 mb-2.5">
      <Text className="w-3.5 text-accent text-[12px] leading-[18px]">{arrow}</Text>
      <Text className="flex-1 text-ink/80 text-[12px] leading-[18px]">{text}</Text>
    </View>
  );
}
