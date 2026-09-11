/**
 * Répartition du volume par famille de travail.
 *
 * Barres HORIZONTALES et non un camembert : cinq parts dont deux se
 * ressemblent ne se comparent pas à l'œil sur un disque, et l'étiquette d'une
 * part fine n'a nulle part où tenir. En ligne, chaque famille porte son nom en
 * clair et sa valeur à droite — l'identité ne repose jamais sur la seule
 * couleur.
 *
 * L'ordre des familles est FIXE : une famille qui tombe à zéro garde sa
 * couleur, et la suivante ne récupère pas la sienne.
 */

import { Text, View } from "react-native";
import { CHART_COLORS } from "../../lib/theme";
import { formatTonnage } from "../../lib/metrics";
import type { GroupShare } from "../../lib/metrics";

export function GroupShares({ groups }: { groups: GroupShare[] }) {
  const total = groups.reduce((sum, g) => sum + g.tonnageKg, 0);

  if (total === 0) {
    return (
      <Text className="font-body text-[12px] text-muted">
        Rien à répartir pour l'instant.
      </Text>
    );
  }

  const max = Math.max(...groups.map((g) => g.tonnageKg));

  return (
    <View>
      {/* Barre d'ensemble : la proportion de chacun, d'un seul regard. Un
          intervalle de 2 px sépare les segments — sans lui, deux familles
          voisines se lisent comme une seule. */}
      <View className="flex-row h-2.5 mb-4 gap-[2px]">
        {groups
          .filter((g) => g.share > 0)
          .map((g, i) => (
            <View
              key={g.key}
              style={{
                flex: g.share,
                backgroundColor: CHART_COLORS[groups.indexOf(g) % CHART_COLORS.length],
                borderRadius: 3,
              }}
            />
          ))}
      </View>

      {groups.map((g, i) => {
        const color = CHART_COLORS[i % CHART_COLORS.length];
        const ratio = max > 0 ? g.tonnageKg / max : 0;
        return (
          <View key={g.key} className="mb-2.5">
            <View className="flex-row items-baseline justify-between mb-1">
              <View className="flex-row items-center gap-2 flex-1 pr-3">
                <View
                  style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }}
                />
                <Text className="font-body text-[12px] text-ink">{g.label}</Text>
              </View>
              <Text className="font-mono text-[11px] text-muted">
                {g.tonnageKg > 0 ? formatTonnage(g.tonnageKg) : "—"}
                {g.share > 0 ? (
                  <Text className="text-muted/70">
                    {"  "}
                    {Math.round(g.share * 100)} %
                  </Text>
                ) : null}
              </Text>
            </View>
            <View className="h-1.5 rounded-sm bg-line/40 overflow-hidden">
              <View
                style={{
                  width: `${Math.max(ratio * 100, g.tonnageKg > 0 ? 2 : 0)}%`,
                  backgroundColor: color,
                  borderRadius: 3,
                  height: "100%",
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
