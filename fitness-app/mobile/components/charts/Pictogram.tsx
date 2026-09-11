/**
 * Isotype — un nombre rendu en objets qu'on peut compter.
 *
 * « 3,2 tonnes » ne dit rien au corps. Trois voitures et un bout de voiture,
 * si. C'est un graphique à part entière : chaque icône vaut une unité, la
 * dernière est tronquée à la proportion réelle, et le compte exact reste écrit
 * en toutes lettres — l'image donne l'échelle, le texte donne la précision.
 *
 * Au-delà d'une trentaine d'icônes, la grille cesse de se compter d'un coup
 * d'œil : on s'arrête et on écrit le reste.
 */

import { Text, View } from "react-native";
import type { Landmark } from "../../lib/metrics";

const MAX_ICONS = 24;

export function Pictogram({
  landmark,
  caption,
}: {
  landmark: Landmark;
  /** Le chiffre brut — l'image donne l'échelle, pas la mesure. */
  caption: string;
}) {
  const whole = Math.floor(landmark.count);
  const shown = Math.min(whole, MAX_ICONS);
  const remainder = landmark.count - whole;
  const overflow = whole - shown;

  return (
    <View>
      <View className="flex-row flex-wrap items-center gap-1">
        {Array.from({ length: shown }, (_, i) => (
          <Text key={i} className="text-[24px]">
            {landmark.emoji}
          </Text>
        ))}

        {/* La fraction restante, rendue par une icône rognée : elle dit « et
            un peu plus » sans prétendre à une unité entière. */}
        {overflow === 0 && remainder > 0.05 ? (
          <View style={{ width: 24 * remainder, overflow: "hidden" }}>
            <Text className="text-[24px] opacity-60">{landmark.emoji}</Text>
          </View>
        ) : null}

        {overflow > 0 ? (
          <Text className="font-mono-md text-[13px] text-muted ml-1">
            + {overflow}
          </Text>
        ) : null}
      </View>

      <Text className="font-body-sb text-[14px] text-ink mt-2.5">
        {landmark.sentence}
      </Text>
      <Text className="font-body text-[11px] text-muted mt-0.5">{caption}</Text>
    </View>
  );
}
