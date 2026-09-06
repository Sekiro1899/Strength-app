import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "./_layout";
import {
  Button,
  Card,
  ErrorText,
  Label,
  Loading,
  Pill,
  Stat,
  Title,
} from "../components/ui";
import { fetchDashboard, signOut, startSession } from "../lib/data";
import type { DashboardData } from "../lib/types";

/** energy_level pilote le volume et la charge côté moteur (Pydantic : 1..5). */
const ENERGY_LEVELS = [
  { value: 1, icon: "🪫", label: "Épuisé" },
  { value: 2, icon: "😮‍💨", label: "Fatigué" },
  { value: 3, icon: "🙂", label: "Normal" },
  { value: 4, icon: "💪", label: "En forme" },
  { value: 5, icon: "🔥", label: "Au top" },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { userId, isLoading: authLoading, refresh } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [energy, setEnergy] = useState(3);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setData(await fetchDashboard(userId, new Date()));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    }
  }, [userId]);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.replace("/login");
      return;
    }
    load().finally(() => setLoading(false));
  }, [userId, authLoading, load, router]);

  // Recharge au retour de l'écran séance pour refléter la séance terminée.
  useFocusEffect(
    useCallback(() => {
      if (!loading) load();
    }, [load, loading]),
  );

  async function handleStart() {
    if (!data || !userId) return;
    setError(null);
    setStarting(true);
    try {
      const workout = await startSession(userId, data, energy);
      router.push({
        pathname: "/session",
        params: { sessionId: workout.session_id },
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? `Génération impossible — ${e.message}`
          : "Génération impossible.",
      );
    } finally {
      setStarting(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    refresh();
    router.replace("/login");
  }

  if (loading || authLoading) return <Loading label="Chargement de votre programme…" />;

  if (!data) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center px-8">
        <Text className="text-5xl mb-4">🎯</Text>
        <Title>Aucun programme actif</Title>
        <Text className="text-sm text-slate-500 text-center mt-2 mb-6">
          Complétez le questionnaire pour recevoir votre programme personnalisé.
        </Text>
        <View className="w-full max-w-[320px] gap-3">
          <Button
            label="Faire le questionnaire"
            onPress={() => router.replace("/questionnaire")}
          />
          <Button label="Se déconnecter" variant="ghost" onPress={handleSignOut} />
        </View>
      </SafeAreaView>
    );
  }

  const { program, phase, userProgram, nextSession, streak, completedCount } = data;
  const tint = program.color ?? "#1565C0";
  const totalWeeks = program.duration_weeks;
  const progress = totalWeeks ? Math.min(1, userProgram.current_week / totalWeeks) : null;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{ paddingVertical: 24, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        <View className="w-full max-w-[520px] mx-auto px-6">
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1">
              <Label>Mon programme</Label>
              <Title>{program.name}</Title>
            </View>
            <Pressable onPress={handleSignOut} className="p-2 -mr-2">
              <Text className="text-xs text-slate-400">Déconnexion</Text>
            </Pressable>
          </View>

          <ErrorText message={error} />

          {/* Programme + phase */}
          <Card tint={tint} className="mb-4">
            <View className="flex-row items-center mb-4">
              <Text className="text-3xl mr-3">{program.icon}</Text>
              <View className="flex-1">
                <Text className="text-base font-bold text-slate-900">
                  {phase?.name ?? program.tagline ?? program.name}
                </Text>
                {phase?.objective ? (
                  <Text className="text-xs text-slate-600 mt-0.5">
                    {phase.objective}
                  </Text>
                ) : null}
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2">
              <Pill label="Phase" value={phase?.phase_number ?? 1} />
              <Pill
                label="Semaine"
                value={totalWeeks ? `${userProgram.current_week}/${totalWeeks}` : userProgram.current_week}
              />
              <Pill label="Protocole" value={nextSession.protocol.replace(/_/g, " ")} />
            </View>

            {progress !== null ? (
              <View className="h-1.5 bg-white/60 rounded-full overflow-hidden mt-4">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${progress * 100}%`, backgroundColor: tint }}
                />
              </View>
            ) : null}
          </Card>

          {/* Prochaine séance */}
          <Card className="mb-4">
            <Label>Prochaine séance</Label>
            <View className="flex-row items-baseline mt-2 mb-1">
              <Text className="text-xl font-bold text-slate-900">
                {nextSession.session_label}
              </Text>
              <Text className="text-xs text-slate-400 ml-2">
                jour {nextSession.day_number}
              </Text>
            </View>
            <Text className="text-sm text-slate-500 mb-4">
              Focus : {nextSession.focus.replace(/_/g, " ")}
            </Text>

            <Label>Niveau d'énergie</Label>
            <View className="flex-row gap-2 mt-2">
              {ENERGY_LEVELS.map((level) => {
                const active = energy === level.value;
                return (
                  <Pressable
                    key={level.value}
                    onPress={() => setEnergy(level.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={level.label}
                    className={`flex-1 items-center py-2 rounded-xl border-2 ${
                      active ? "border-blue-600 bg-blue-50" : "border-slate-200"
                    }`}
                  >
                    <Text className="text-lg">{level.icon}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text className="text-[11px] text-slate-400 mt-2">
              {ENERGY_LEVELS.find((l) => l.value === energy)?.label} — ajuste le
              volume et la charge de la séance.
            </Text>
          </Card>

          {/* Stats */}
          <View className="flex-row gap-3 mb-5">
            <Stat icon="🔥" value={streak} caption="Jours d'affilée" />
            <Stat icon="✅" value={completedCount} caption="Séances faites" />
            <Stat
              icon="📅"
              value={`${program.frequency_per_week_min}×`}
              caption="Par semaine"
            />
          </View>

          <Button
            label="Démarrer la séance"
            onPress={handleStart}
            loading={starting}
            color={tint}
          />

          {completedCount > 0 ? (
            <View className="mt-3">
              <Button
                label="Donner mon feedback sur le programme"
                variant="ghost"
                onPress={() => router.push("/feedback")}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
