import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "./_layout";
import {
  Body,
  Button,
  Card,
  Display,
  ErrorText,
  Loading,
  MonoLabel,
  Screen,
} from "../components/ui";
import { startSession } from "../lib/data";
import { volumeForEnergy } from "../lib/engine";
import type { DashboardData, TimeBudget, TrainingLocation } from "../lib/types";

/**
 * Écran de préparation, posé avant chaque séance.
 *
 * Deux réponses conditionnent la génération :
 *   énergie -> charge ET volume (nombre d'exercices, de séries, finisher)
 *   lieu    -> matériel disponible, donc exercices éligibles
 *
 * Le dashboard ne fait que passer les données déjà chargées, pour éviter un
 * second aller-retour avant de générer.
 */

const ENERGY_LEVELS = [
  { value: 1, label: "Épuisé", detail: "Séance minimale, charges allégées" },
  { value: 2, label: "Fatigué", detail: "Volume réduit, pas de finisher" },
  { value: 3, label: "Normal", detail: "Séance de référence" },
  { value: 4, label: "En forme", detail: "Volume complet" },
  { value: 5, label: "Au top", detail: "Volume complet, charges majorées" },
];

const LOCATIONS: {
  value: TrainingLocation;
  label: string;
  detail: string;
}[] = [
  { value: "gym", label: "Salle", detail: "Barres, rack, câbles, machines" },
  { value: "home", label: "Maison", detail: "Haltères, bandes, barre de traction" },
  { value: "outdoor", label: "Plein air", detail: "Poids du corps, bandes, barres fixes" },
];

/**
 * Le créneau annoncé décide de la mise en superset des compounds. Sur du
 * lourd, le superset coûte en charge : on ne le paie que pour tenir dans le
 * temps. Les isolations, elles, s'enchaînent dans tous les cas.
 */
const TIME_BUDGETS: { value: TimeBudget; label: string; detail: string }[] = [
  {
    value: "short",
    label: "Je suis pressé",
    detail: "30 à 45 min — une série de moins, compounds en superset antagoniste",
  },
  {
    value: "standard",
    label: "J'ai le temps",
    detail: "45 à 60 min — séries droites et repos complets",
  },
];

/** Ligne à cocher — même rendu pour le lieu et pour le créneau. */
function RadioRow({
  label,
  detail,
  active,
  onPress,
}: {
  label: string;
  detail: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      className={`flex-row items-center gap-3 rounded-[14px] border px-4 py-3.5 mb-2 ${
        active ? "bg-accent border-accent" : "bg-surface border-line"
      }`}
    >
      <View
        className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
          active ? "border-black" : "border-muted"
        }`}
      >
        {active ? <View className="w-2.5 h-2.5 rounded-full bg-black" /> : null}
      </View>
      <View className="flex-1">
        <Text className={`font-body-sb text-[14px] ${active ? "text-black" : "text-ink"}`}>
          {label}
        </Text>
        <Text
          className={`font-body text-[11px] mt-0.5 ${active ? "text-black/60" : "text-muted"}`}
        >
          {detail}
        </Text>
      </View>
    </Pressable>
  );
}

export default function PrepareScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const params = useLocalSearchParams<{ payload?: string }>();

  const [energy, setEnergy] = useState(3);
  const [location, setLocation] = useState<TrainingLocation>("gym");
  const [timeBudget, setTimeBudget] = useState<TimeBudget>("standard");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dashboard: DashboardData | null = params.payload
    ? (JSON.parse(params.payload) as DashboardData)
    : null;

  if (!dashboard) return <Loading label="Préparation" />;

  const policy = volumeForEnergy(energy);
  const exerciseCount =
    policy.compounds + policy.isolations + policy.core + policy.warmup +
    (policy.withFinisher ? 2 : 0);

  async function handleGenerate() {
    if (!userId || !dashboard) return;
    setError(null);
    setStarting(true);
    try {
      const workout = await startSession(
        userId,
        dashboard,
        energy,
        location,
        timeBudget,
      );
      router.replace({
        pathname: "/session",
        params: { sessionId: workout.session_id },
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? `Génération impossible — ${e.message}`
          : "Génération impossible.",
      );
      setStarting(false);
    }
  }

  return (
    <Screen
      backdrop="prepare"
      footer={
        <Button
          label="Générer ma séance"
          onPress={handleGenerate}
          loading={starting}
        />
      }
    >
      <View className="flex-row items-center gap-2.5 mb-2">
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Retour"
          className="w-8 h-8 rounded-[10px] bg-surface border border-line items-center justify-center"
        >
          <Text className="text-ink text-[18px] leading-[20px]">‹</Text>
        </Pressable>
        <Display size={22}>{dashboard.nextSession.session_label}</Display>
      </View>
      <MonoLabel className="mb-7">
        Séance {dashboard.nextSession.day_number} / {dashboard.totalPlanned}
      </MonoLabel>

      <ErrorText message={error} />

      {/* A — énergie */}
      <MonoLabel tone="accent" className="mb-3">
        Ton niveau d'énergie
      </MonoLabel>
      <View className="flex-row gap-1.5 mb-2">
        {ENERGY_LEVELS.map((level) => {
          const active = energy === level.value;
          return (
            <Pressable
              key={level.value}
              onPress={() => setEnergy(level.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={level.label}
              className={`flex-1 items-center py-3 rounded-xl border ${
                active ? "bg-accent border-accent" : "bg-surface border-line"
              }`}
            >
              <Text
                className={`font-display text-[18px] ${
                  active ? "text-black" : "text-muted"
                }`}
              >
                {level.value}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Body className="text-[12px] mb-2">
        {ENERGY_LEVELS[energy - 1].label} — {ENERGY_LEVELS[energy - 1].detail}
      </Body>

      <Card className="mb-7">
        <MonoLabel className="mb-2">Séance ajustée</MonoLabel>
        <Text className="font-body text-[12px] text-ink leading-5">
          {exerciseCount} exercices · {policy.compounds} compound
          {policy.compounds > 1 ? "s" : ""} · {policy.isolations} isolation
          {policy.isolations > 1 ? "s" : ""}
          {policy.core > 0 ? ` · ${policy.core} core` : ""}
          {policy.withFinisher ? " · finisher" : " · sans finisher"}
        </Text>
        <Text className="font-mono text-[10px] uppercase tracking-label text-muted mt-2">
          Charge {policy.loadDelta === 0 ? "de référence" : `${policy.loadDelta > 0 ? "+" : ""}${policy.loadDelta} % 1RM`}
          {policy.setsDelta !== 0
            ? ` · ${policy.setsDelta > 0 ? "+" : ""}${policy.setsDelta} série`
            : ""}
        </Text>
      </Card>

      {/* B — lieu et matériel */}
      <MonoLabel tone="accent" className="mb-3">
        Où t'entraînes-tu ?
      </MonoLabel>
      {LOCATIONS.map((loc) => (
        <RadioRow
          key={loc.value}
          label={loc.label}
          detail={loc.detail}
          active={location === loc.value}
          onPress={() => setLocation(loc.value)}
        />
      ))}

      {/* C — créneau disponible */}
      <MonoLabel tone="accent" className="mb-3 mt-6">
        Combien de temps as-tu ?
      </MonoLabel>
      {TIME_BUDGETS.map((slot) => (
        <RadioRow
          key={slot.value}
          label={slot.label}
          detail={slot.detail}
          active={timeBudget === slot.value}
          onPress={() => setTimeBudget(slot.value)}
        />
      ))}
      <Text className="font-body text-[11px] text-muted mt-1.5">
        Les isolations sont enchaînées en superset dans tous les cas. Sur un
        créneau court, les compounds le sont aussi — un tirage apparié à une
        poussée, jamais deux fois la même chaîne.
      </Text>
    </Screen>
  );
}
