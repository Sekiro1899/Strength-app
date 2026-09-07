import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "./_layout";
import {
  Body,
  Button,
  Card,
  Chip,
  Display,
  ErrorText,
  GradientCard,
  Loading,
  MonoLabel,
  ProgressBar,
  Screen,
} from "../components/ui";
import {
  COLORS,
  GRADIENT_DIRECTION,
  initialsFromEmail,
  personaGradient,
} from "../lib/theme";
import { fetchDashboard, signOut, startSession } from "../lib/data";
import type { DashboardData } from "../lib/types";

/** energy_level pilote le volume et la charge côté moteur (Pydantic : 1..5). */
const ENERGY_LABELS = ["Épuisé", "Fatigué", "Normal", "En forme", "Au top"];

export default function DashboardScreen() {
  const router = useRouter();
  const { userId, email, isLoading: authLoading, refresh } = useAuth();

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

  if (loading || authLoading) return <Loading label="Chargement" />;

  if (!data) {
    return (
      <Screen center>
        <View className="items-center mb-8">
          <MonoLabel tone="accent" className="mb-3">
            Aucun programme
          </MonoLabel>
          <Display size={28} className="text-center">
            Rien à{"\n"}l'entraînement
          </Display>
          <Body className="text-center mt-3">
            Complète le questionnaire pour recevoir ton programme.
          </Body>
        </View>
        <View className="gap-2.5">
          <Button
            label="Faire le questionnaire"
            onPress={() => router.replace("/questionnaire")}
          />
          <Button label="Se déconnecter" variant="ghost" onPress={handleSignOut} />
        </View>
      </Screen>
    );
  }

  const {
    program,
    phase,
    userProgram,
    nextSession,
    streak,
    completedCount,
    previewExercises,
  } = data;
  const gradient = personaGradient(
    userProgram.persona_id?.replace("persona_", "").toUpperCase(),
  );
  const totalWeeks = program.duration_weeks;
  const progress = totalWeeks
    ? Math.min(1, userProgram.current_week / totalWeeks)
    : 0;

  const sessionMinutes =
    program.session_duration_min === program.session_duration_max
      ? `~ ${program.session_duration_min} min`
      : `~ ${program.session_duration_min}-${program.session_duration_max} min`;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        contentContainerStyle={{ paddingVertical: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
            progressBackgroundColor={COLORS.surface}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        <View className="w-full max-w-[420px] mx-auto px-5">
          {/* Salutation + avatar */}
          <View className="flex-row justify-between items-center mb-5">
            <View>
              <Body className="text-[12px]">Salut,</Body>
              <Display size={22}>{(email ?? "athlète").split("@")[0]}</Display>
            </View>
            <Pressable onPress={handleSignOut} accessibilityLabel="Se déconnecter">
              <LinearGradient
                colors={gradient}
                start={GRADIENT_DIRECTION.start}
                end={GRADIENT_DIRECTION.end}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text className="font-body-sb text-[13px] text-white">
                  {initialsFromEmail(email)}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          <ErrorText message={error} />

          {/* Streak */}
          <Card className="flex-row justify-between items-center mb-4 py-3.5">
            <View>
              <MonoLabel className="text-[9px]">Série actuelle</MonoLabel>
              <Text className="font-display text-accent text-[24px] mt-0.5">
                {streak} {streak > 1 ? "jours" : "jour"}
              </Text>
            </View>
            <Text className="text-[30px]">🔥</Text>
          </Card>

          {/* Programme en cours */}
          <View className="mb-4">
            <GradientCard colors={gradient}>
              <View className="self-start bg-black/25 rounded-lg px-2.5 py-1 mb-3">
                <Text className="font-mono text-[9px] uppercase tracking-label text-white">
                  Phase {phase?.phase_number ?? 1}
                  {phase?.name ? ` · ${phase.name}` : ""}
                </Text>
              </View>
              <Text className="font-display text-white uppercase text-[18px] mb-1">
                {program.name}
              </Text>
              <Text className="font-body text-[12px] text-white/85 mb-3.5">
                {totalWeeks
                  ? `Semaine ${userProgram.current_week} sur ${totalWeeks}`
                  : `Semaine ${userProgram.current_week}`}
                {" · "}
                {completedCount} séance{completedCount > 1 ? "s" : ""} complétée
                {completedCount > 1 ? "s" : ""}
              </Text>
              <View className="h-1.5 bg-black/25 rounded-full overflow-hidden">
                <View
                  className="h-full bg-white rounded-full"
                  style={{ width: `${Math.max(progress * 100, 3)}%` }}
                />
              </View>
            </GradientCard>
          </View>

          {/* Prochaine séance */}
          <Card className="mb-3">
            <MonoLabel tone="accent" className="mb-2">
              Prochaine séance · Jour {nextSession.day_number}
            </MonoLabel>
            <Display size={22} className="mb-1.5">
              {nextSession.session_label}
            </Display>
            <Body className="text-[12px] mb-3.5">
              {sessionMinutes} · Focus {nextSession.focus.replace(/_/g, " ")}
            </Body>

            {previewExercises.length > 0 ? (
              <View className="flex-row flex-wrap gap-1.5 mb-4">
                {previewExercises.map((name) => (
                  <Chip key={name} label={name} />
                ))}
                <Chip label="+ …" />
              </View>
            ) : null}

            <Button
              label="Démarrer la séance"
              onPress={handleStart}
              loading={starting}
            />
          </Card>

          {/* Niveau d'énergie */}
          <Card className="mb-3">
            <MonoLabel className="mb-3">Niveau d'énergie aujourd'hui</MonoLabel>
            <View className="flex-row gap-1.5">
              {[1, 2, 3, 4, 5].map((level) => {
                const active = level <= energy;
                return (
                  <Pressable
                    key={level}
                    onPress={() => setEnergy(level)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: energy === level }}
                    accessibilityLabel={ENERGY_LABELS[level - 1]}
                    className={`flex-1 h-7 rounded-lg border ${
                      active ? "bg-accent border-accent" : "bg-bg border-line"
                    }`}
                  />
                );
              })}
            </View>
            <Text className="font-mono text-[9px] uppercase tracking-label text-muted mt-2.5">
              {ENERGY_LABELS[energy - 1]} · ajuste volume et charge
            </Text>
          </Card>

          {completedCount > 0 ? (
            <Pressable
              onPress={() => router.push("/feedback")}
              className="py-3 items-center"
            >
              <MonoLabel tone="accent">Donner mon feedback →</MonoLabel>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
