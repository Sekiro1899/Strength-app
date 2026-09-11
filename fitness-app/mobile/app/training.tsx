/**
 * « Mes entraînements » — le tableau de bord de ce que le corps a encaissé.
 *
 * Absorbe l'ancien écran « Mes séances » : les deux montraient la même chose
 * sous deux angles, et on ne savait pas lequel ouvrir. Ici l'historique est en
 * bas, après les chiffres qu'il produit.
 *
 * Un seul filtre gouverne toute la page — semaine, cycle en cours, tout
 * l'historique. Le journal est chargé une fois ; changer d'horizon recalcule
 * en mémoire, sans aller-retour réseau, pour que la bascule soit instantanée.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./_layout";
import {
  Body,
  Button,
  Display,
  ErrorText,
  GlassCard,
  GlassIconButton,
  Loading,
  MonoLabel,
  Screen,
} from "../components/ui";
import { BodyWeightCard } from "../components/BodyWeightCard";
import { VolumeBars } from "../components/charts/VolumeBars";
import { GroupShares } from "../components/charts/GroupShares";
import { Pictogram } from "../components/charts/Pictogram";
import { fetchTrainingHistory, updateBodyWeight } from "../lib/data";
import type { TrainingHistory } from "../lib/data";
import { EXERCISES } from "../lib/fixtures";
import {
  DEFAULT_BODY_WEIGHT_KG,
  HORIZONS,
  bucketTonnage,
  caloriesLandmark,
  computeStats,
  formatTonnage,
  logsInHorizon,
  tonnageByGroup,
  tonnageLandmark,
} from "../lib/metrics";
import type { Horizon } from "../lib/metrics";

/** « jeu. 11 sept. » */
function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatInt(value: number): string {
  return Math.round(value).toLocaleString("fr-FR");
}

/** Une métrique de tête. */
function Metric({
  value,
  unit,
  label,
  hint,
  accent = false,
}: {
  value: string;
  unit?: string;
  label: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <View className="flex-1">
      <Text className={`font-display text-[22px] ${accent ? "text-accent" : "text-ink"}`}>
        {value}
        {unit ? <Text className="font-body text-[11px] text-muted"> {unit}</Text> : null}
      </Text>
      <Text className="font-mono text-[9px] uppercase tracking-label text-muted mt-1">
        {label}
      </Text>
      {hint ? (
        <Text className="font-body text-[10px] text-muted/70 mt-0.5">{hint}</Text>
      ) : null}
    </View>
  );
}

export default function TrainingScreen() {
  const router = useRouter();
  const { userId } = useAuth();

  const [history, setHistory] = useState<TrainingHistory | null>(null);
  const [horizon, setHorizon] = useState<Horizon>("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setHistory(await fetchTrainingHistory(userId, new Date()));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    }
  }, [userId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const byId = useMemo(() => new Map(EXERCISES.map((e) => [e.id, e])), []);

  // Tout se recalcule ici : le filtre ne déclenche aucun chargement.
  const view = useMemo(() => {
    if (!history) return null;
    const now = new Date();
    const weight = history.bodyWeightKg ?? DEFAULT_BODY_WEIGHT_KG;
    const logs = logsInHorizon(history.logs, horizon, now, history.programStart);
    return {
      stats: computeStats(logs, byId, weight),
      buckets: bucketTonnage(logs, byId, weight, horizon, now, history.programStart),
      groups: tonnageByGroup(logs, byId, weight),
    };
  }, [history, horizon, byId]);

  if (loading) return <Loading label="Chargement de tes chiffres" />;

  const nothingYet = !history || history.logs.length === 0;
  const stats = view?.stats;
  const weightLandmark = stats ? tonnageLandmark(stats.tonnageKg) : null;
  const foodLandmark = stats ? caloriesLandmark(stats.kcal) : null;
  const horizonLabel =
    HORIZONS.find((h) => h.key === horizon)?.label.toLowerCase() ?? "";

  return (
    <Screen
      backdrop="training"
      footer={
        <Button
          label="Retour au tableau de bord"
          variant="glass"
          onPress={() => router.replace("/dashboard")}
        />
      }
    >
      <View className="flex-row items-center mb-6">
        <GlassIconButton icon="‹" label="Retour" onPress={() => router.back()} />
      </View>

      <MonoLabel tone="accent" className="mb-2">
        Mes entraînements
      </MonoLabel>
      <Display size={30} className="mb-1">
        Ce que tu as déplacé
      </Display>
      <Body className="text-[12px] mb-5">
        Chaque série validée compte. Les tractions et les dips aussi — ton poids
        de corps est de la charge.
      </Body>

      <ErrorText message={error} />

      {history && history.bodyWeightKg === null ? (
        <BodyWeightCard
          value={null}
          emphasis
          onSave={async (kg) => {
            if (!userId) return;
            await updateBodyWeight(userId, kg);
            await load();
          }}
        />
      ) : null}

      {nothingYet ? (
        <GlassCard>
          <MonoLabel className="text-[9px]">Rien à compter</MonoLabel>
          <Text className="font-body text-[13px] text-ink mt-2">
            Tes chiffres démarrent à ta prochaine séance terminée.
          </Text>
          <Text className="font-body text-[11px] text-muted mt-2">
            Le tonnage se calcule à partir des séries que tu coches et des
            charges que tu saisis pendant la séance. Les séances passées avant
            aujourd'hui n'ont pas été archivées : elles ne peuvent pas être
            rattrapées.
          </Text>
        </GlassCard>
      ) : (
        <>
          {/* Le filtre gouverne toute la page — il est donc au-dessus de tout
              ce qu'il gouverne, et nulle part ailleurs. */}
          <View className="flex-row gap-1.5 mb-4">
            {HORIZONS.map((h) => {
              const on = horizon === h.key;
              const usable = h.key !== "program" || history?.programStart;
              if (!usable) return null;
              return (
                <Pressable
                  key={h.key}
                  accessibilityRole="tab"
                  aria-selected={on}
                  onPress={() => setHorizon(h.key)}
                  className={`flex-1 rounded-lg border py-2 items-center active:opacity-70 ${
                    on ? "bg-accent border-accent" : "bg-surface border-line"
                  }`}
                >
                  <Text
                    numberOfLines={1}
                    className={`font-mono text-[10px] ${on ? "text-black" : "text-muted"}`}
                  >
                    {h.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Chiffres de tête */}
          <GlassCard className="mb-3">
            <View className="flex-row items-baseline justify-between">
              <MonoLabel className="text-[9px]" tone="accent">
                {HORIZONS.find((h) => h.key === horizon)?.label}
              </MonoLabel>
              <Text className="font-mono text-[10px] tracking-label text-muted">
                {stats!.sessions} séance{stats!.sessions > 1 ? "s" : ""} ·{" "}
                {formatInt(stats!.sets)} séries
              </Text>
            </View>
            <View className="flex-row mt-3">
              <Metric
                value={formatTonnage(stats!.tonnageKg)}
                label="Poids total soulevé"
                accent
              />
              <View className="w-px bg-line mx-3" />
              <Metric
                value={formatInt(stats!.kcal)}
                unit="kcal"
                label="Dépense estimée"
              />
            </View>
            <View className="flex-row mt-4">
              <Metric
                value={formatInt(stats!.watts)}
                unit="W"
                label="Puissance moyenne"
                hint="estimation"
              />
              <View className="w-px bg-line mx-3" />
              <Metric value={formatInt(stats!.reps)} label="Répétitions" />
            </View>
            {stats!.reps > 0 && stats!.tonnageKg === 0 ? (
              <Text className="font-body text-[11px] text-muted mt-3 leading-4">
                Aucune charge n'a été saisie sur ces séances, et aucun des
                mouvements ne déplace le poids du corps. Note tes kilos pendant
                la séance pour que le total compte.
              </Text>
            ) : null}
          </GlassCard>

          {/* Data viz 1 — le volume dans le temps */}
          <GlassCard className="mb-3">
            <MonoLabel className="text-[9px] mb-3">
              {horizon === "week" ? "Volume par jour" : "Volume par semaine"}
            </MonoLabel>
            <VolumeBars buckets={view!.buckets} />
            <Text className="font-body text-[10px] text-muted mt-2">
              Touche une barre pour voir le détail.
            </Text>
          </GlassCard>

          {/* Data viz 2 — l'équilibre du travail */}
          <GlassCard className="mb-3">
            <MonoLabel className="text-[9px] mb-3">Répartition du volume</MonoLabel>
            <GroupShares groups={view!.groups} />
          </GlassCard>

          {/* L'aspect palpable, sous les graphiques */}
          {weightLandmark ? (
            <GlassCard className="mb-3">
              <MonoLabel className="text-[9px] mb-3">
                Ce que ça représente
              </MonoLabel>
              <Pictogram
                landmark={weightLandmark}
                caption={`${formatTonnage(stats!.tonnageKg)} soulevés ${horizonLabel === "cette semaine" ? "cette semaine" : `sur « ${horizonLabel} »`}.`}
              />
              {foodLandmark ? (
                <View className="mt-5 pt-5 border-t border-line/60">
                  <Pictogram
                    landmark={foodLandmark}
                    caption={`${formatInt(stats!.kcal)} kcal estimées — de quoi les remettre au menu.`}
                  />
                </View>
              ) : null}
            </GlassCard>
          ) : null}

          {/* L'historique, fusionné depuis l'ancien écran « Mes séances ». */}
          {history!.sessions.length ? (
            <GlassCard className="mb-3">
              <MonoLabel className="text-[9px] mb-3">
                Séances terminées · {history!.sessions.length}
              </MonoLabel>
              {history!.sessions.slice(0, 12).map((session) => (
                <View
                  key={session.id}
                  className="flex-row items-baseline justify-between py-2 border-b border-line/40"
                >
                  <View className="flex-1 pr-3">
                    <Text className="font-body-sb text-[12px] text-ink">
                      {session.session_label ?? "Séance"}
                    </Text>
                    <Text className="font-mono text-[9px] text-muted mt-0.5">
                      Semaine {session.week_number} · jour {session.day_number}
                    </Text>
                  </View>
                  <Text className="font-mono text-[10px] text-muted">
                    {session.completed_at ? formatDay(session.completed_at) : "—"}
                  </Text>
                </View>
              ))}
              {history!.sessions.length > 12 ? (
                <Text className="font-body text-[11px] text-muted mt-2.5">
                  + {history!.sessions.length - 12} séance
                  {history!.sessions.length - 12 > 1 ? "s" : ""} plus ancienne
                  {history!.sessions.length - 12 > 1 ? "s" : ""}.
                </Text>
              ) : null}
            </GlassCard>
          ) : null}

          {/* Ce qui est mesuré, ce qui est estimé. */}
          <GlassCard>
            <MonoLabel className="text-[9px]">Comment c'est calculé</MonoLabel>
            <Text className="font-body text-[11px] text-muted mt-2 leading-4">
              <Text className="text-ink">Poids soulevé</Text> — répétitions ×
              (charge saisie + part du poids de corps que le mouvement déplace).
              La question n'est pas si l'exercice peut se faire sans charge, mais
              si ton corps monte : un goblet squat demande un haltère et lève
              quand même l'essentiel de ton poids. Un développé couché, non — là
              seule la barre compte.
            </Text>
            <Text className="font-body text-[11px] text-muted mt-2 leading-4">
              <Text className="text-ink">Dépense</Text> — table des METs selon la
              densité de la séance et ton poids. Pas le travail mécanique : il
              ignore la contraction isométrique, qui coûte l'essentiel.
            </Text>
            <Text className="font-body text-[11px] text-muted mt-2 leading-4">
              <Text className="text-ink">Puissance</Text> — estimation. Elle
              dépend de l'amplitude réelle du mouvement, qui varie avec la
              morphologie ; on utilise une amplitude moyenne par famille et on
              rapporte le travail au temps d'effort, repos exclus.
            </Text>
          </GlassCard>
        </>
      )}
    </Screen>
  );
}
