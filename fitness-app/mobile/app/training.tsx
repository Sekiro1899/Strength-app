/**
 * « Mes entraînements » — ce que le corps a réellement encaissé.
 *
 * Deux horizons, volontairement : la SEMAINE, qui se remet à zéro le lundi et
 * donne un objectif atteignable, et le CUMUL depuis la première séance, qui ne
 * fait que monter et récompense l'assiduité. L'un motive à court terme, l'autre
 * console les semaines creuses.
 *
 * Les chiffres viennent tous de lib/metrics — cet écran met en forme, il ne
 * calcule pas.
 */

import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./_layout";
import {
  Body,
  Button,
  Display,
  ErrorText,
  GlassCard,
  GlassIconButton,
  GradientCard,
  Loading,
  MonoLabel,
  Screen,
} from "../components/ui";
import { BodyWeightCard } from "../components/BodyWeightCard";
import { fetchTrainingHistory, updateBodyWeight } from "../lib/data";
import type { TrainingHistory } from "../lib/data";
import { ACCENT_GRADIENT } from "../lib/theme";
import { formatTonnage, tonnageLandmark } from "../lib/metrics";
import type { TrainingStats } from "../lib/metrics";

/** « 12 sept. 2026 » */
function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Espace fine insécable entre les milliers : « 12 480 ». */
function formatInt(value: number): string {
  return Math.round(value).toLocaleString("fr-FR");
}

/** Une métrique : valeur en display, unité discrète, libellé en mono. */
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
      <Text
        className={`font-display text-[24px] ${accent ? "text-accent" : "text-ink"}`}
      >
        {value}
        {unit ? <Text className="font-body text-[12px] text-muted"> {unit}</Text> : null}
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

function StatsGrid({ stats }: { stats: TrainingStats }) {
  return (
    <>
      <View className="flex-row mt-2">
        <Metric
          value={formatTonnage(stats.tonnageKg)}
          label="Poids total soulevé"
          accent
        />
        <View className="w-px bg-line mx-3" />
        <Metric value={formatInt(stats.kcal)} unit="kcal" label="Dépense estimée" />
      </View>
      <View className="flex-row mt-4">
        <Metric
          value={formatInt(stats.watts)}
          unit="W"
          label="Puissance moyenne"
          hint="estimation"
        />
        <View className="w-px bg-line mx-3" />
        <Metric value={formatInt(stats.reps)} label="Répétitions" />
      </View>

      {/* Un « 0 kg » à côté de quatre-vingts répétitions passe pour un bug.
          C'en est un, d'une autre nature : la charge n'a pas été notée. */}
      {stats.reps > 0 && stats.tonnageKg === 0 ? (
        <Text className="font-body text-[11px] text-muted mt-3 leading-4">
          Aucune charge n'a été saisie sur ces séances, et aucun des mouvements
          ne déplace le poids du corps. Note tes kilos pendant la séance pour
          que le total compte.
        </Text>
      ) : null}
    </>
  );
}

export default function TrainingScreen() {
  const router = useRouter();
  const { userId } = useAuth();

  const [history, setHistory] = useState<TrainingHistory | null>(null);
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

  if (loading) return <Loading label="Chargement de tes chiffres" />;

  const week = history?.week;
  const allTime = history?.allTime;
  const landmark = allTime ? tonnageLandmark(allTime.tonnageKg) : null;
  const weekLandmark = week ? tonnageLandmark(week.tonnageKg) : null;
  const nothingYet = !allTime || allTime.sessions === 0;

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
      <Body className="text-[12px] mb-6">
        Chaque série validée compte. Les tractions et les dips aussi — ton poids
        de corps est de la charge.
      </Body>

      <ErrorText message={error} />

      {/* Sans poids de corps, la moitié des chiffres est fausse : on le
          demande avant de les montrer, pas après. */}
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
          {/* Infographie — un tonnage est un nombre abstrait tant qu'on ne
              l'a pas posé à côté de quelque chose de connu. */}
          {landmark ? (
            <View className="mb-3">
            <GradientCard colors={ACCENT_GRADIENT}>
              <Text className="font-mono text-[10px] uppercase tracking-label-lg text-black/60">
                Depuis le début
              </Text>
              <Text className="text-[40px] mt-1">{landmark.emoji}</Text>
              <Text className="font-display text-black text-[30px] mt-1">
                {landmark.count.toLocaleString("fr-FR")} {landmark.label}
              </Text>
              <Text className="font-body-sb text-[13px] text-black/70 mt-2">
                {formatTonnage(allTime.tonnageKg)} cumulés sur{" "}
                {allTime.sessions} séance{allTime.sessions > 1 ? "s" : ""}
                {history?.since ? `, depuis le ${formatDay(history.since)}` : ""}.
              </Text>
            </GradientCard>
            </View>
          ) : null}

          {/* Semaine en cours */}
          <GlassCard className="mb-3">
            <View className="flex-row items-baseline justify-between">
              <MonoLabel className="text-[9px]" tone="accent">
                Cette semaine
              </MonoLabel>
              <Text className="font-mono text-[10px] tracking-label text-muted">
                {week!.sessions} séance{week!.sessions > 1 ? "s" : ""}
              </Text>
            </View>
            {week!.sessions === 0 ? (
              <Text className="font-body text-[12px] text-muted mt-2">
                La semaine est encore vierge. Elle se remet à zéro chaque lundi.
              </Text>
            ) : (
              <>
                <StatsGrid stats={week!} />
                {weekLandmark ? (
                  <Text className="font-body text-[12px] text-ink mt-4">
                    {weekLandmark.emoji} {weekLandmark.sentence}
                  </Text>
                ) : null}
              </>
            )}
          </GlassCard>

          {/* Cumul */}
          <GlassCard className="mb-3">
            <View className="flex-row items-baseline justify-between">
              <MonoLabel className="text-[9px]">Depuis le début</MonoLabel>
              <Text className="font-mono text-[10px] tracking-label text-muted">
                {formatInt(allTime.sets)} séries
              </Text>
            </View>
            <StatsGrid stats={allTime} />
          </GlassCard>

          {/* La transparence sur ce qui est mesuré et ce qui est estimé.
              Un chiffre affiché sans sa méthode devient une promesse. */}
          <GlassCard>
            <MonoLabel className="text-[9px]">Comment c'est calculé</MonoLabel>
            <Text className="font-body text-[11px] text-muted mt-2 leading-4">
              <Text className="text-ink">Poids soulevé</Text> — répétitions ×
              (charge saisie + part du poids de corps que le mouvement déplace).
              La question n'est pas si l'exercice peut se faire sans charge,
              mais si ton corps monte : un goblet squat demande un haltère et
              lève quand même l'essentiel de ton poids. Un développé couché,
              non — là seule la barre compte.
            </Text>
            <Text className="font-body text-[11px] text-muted mt-2 leading-4">
              <Text className="text-ink">Dépense</Text> — table des METs, selon
              la densité de la séance et ton poids. Pas le travail mécanique :
              il ignore la contraction isométrique, qui coûte l'essentiel.
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
