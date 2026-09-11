/**
 * Volume dans le temps — barres verticales.
 *
 * Une seule série : pas de légende, le titre la nomme. Pas non plus de
 * catégorielle ici — la couleur ne distingue rien, elle ne fait que marquer la
 * donnée, donc c'est l'accent de l'app qui sert.
 *
 * Sur mobile il n'y a pas de survol : la barre se TOUCHE, et la valeur
 * s'affiche en clair au-dessus du graphique plutôt qu'en bulle. Poser une
 * étiquette sur chaque barre les rendrait toutes illisibles ; on n'en montre
 * qu'une, celle qu'on a choisie.
 */

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { COLORS } from "../../lib/theme";
import { formatTonnage } from "../../lib/metrics";
import type { Bucket } from "../../lib/metrics";

const CHART_HEIGHT = 132;
/** Hauteur minimale d'une barre non nulle : sinon un petit jour disparaît. */
const MIN_BAR = 3;
/**
 * Largeur maximale d'une colonne.
 *
 * Sans plafond, une période qui ne compte qu'une semaine produit une barre
 * large de toute la carte : un aplat, qui ne se lit plus comme une mesure.
 * Les colonnes restent donc fines et calées à gauche, et l'espace vide à
 * droite dit lui-même qu'il n'y a qu'un point.
 */
const MAX_BAR_WIDTH = 44;

export function VolumeBars({ buckets }: { buckets: Bucket[] }) {
  const [selected, setSelected] = useState<number | null>(null);

  const max = Math.max(...buckets.map((b) => b.tonnageKg), 0);
  const total = buckets.reduce((sum, b) => sum + b.tonnageKg, 0);

  if (total === 0) {
    return (
      <View className="h-[132px] items-center justify-center rounded-xl border border-dashed border-line">
        <Text className="font-body text-[12px] text-muted">
          Aucun volume enregistré sur cette période.
        </Text>
      </View>
    );
  }

  const active = selected !== null ? buckets[selected] : null;
  // Le pic de la période sert de référence quand rien n'est sélectionné :
  // une échelle sans repère chiffré ne se lit pas.
  const peak = buckets.reduce((best, b) => (b.tonnageKg > best.tonnageKg ? b : best));

  return (
    <View>
      <View className="flex-row items-baseline justify-between mb-2">
        <Text className="font-body-sb text-[13px] text-ink">
          {active ? formatTonnage(active.tonnageKg) : formatTonnage(peak.tonnageKg)}
        </Text>
        <Text className="font-body text-[11px] text-muted">
          {active
            ? `${active.full}${active.sessions ? ` · ${active.sessions} séance${active.sessions > 1 ? "s" : ""}` : " · repos"}`
            : `pic — ${peak.full}`}
        </Text>
      </View>

      <View
        style={{ height: CHART_HEIGHT }}
        className="flex-row items-end justify-start gap-[3px]"
      >
        {buckets.map((bucket, i) => {
          const ratio = max > 0 ? bucket.tonnageKg / max : 0;
          const height = bucket.tonnageKg > 0 ? Math.max(MIN_BAR, ratio * CHART_HEIGHT) : 2;
          const on = selected === i;
          return (
            <Pressable
              key={`${bucket.label}-${i}`}
              accessibilityRole="button"
              accessibilityLabel={`${bucket.full} : ${formatTonnage(bucket.tonnageKg)}`}
              onPress={() => setSelected(on ? null : i)}
              className="flex-1 justify-end"
              // La cible tactile couvre toute la colonne, pas la seule barre :
              // viser 3 px de haut un jour de repos est intenable.
              style={{ height: CHART_HEIGHT, maxWidth: MAX_BAR_WIDTH }}
            >
              <View
                style={{
                  height,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  backgroundColor:
                    bucket.tonnageKg > 0
                      ? on
                        ? COLORS.accent
                        : `${COLORS.accent}b3`
                      : COLORS.line,
                }}
              />
            </Pressable>
          );
        })}
      </View>

      {/* Ligne de base : discrète, elle ancre les barres sans les concurrencer. */}
      <View className="h-px bg-line mt-1" />

      <View className="flex-row justify-start gap-[3px] mt-1.5">
        {buckets.map((bucket, i) => (
          <Text
            key={`label-${bucket.label}-${i}`}
            numberOfLines={1}
            style={{ maxWidth: MAX_BAR_WIDTH }}
            className={`flex-1 text-center font-mono text-[9px] ${
              selected === i ? "text-accent" : "text-muted"
            }`}
          >
            {bucket.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
