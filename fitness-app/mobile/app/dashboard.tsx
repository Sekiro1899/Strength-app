import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "./_layout";
import { Backdrop } from "../components/Backdrop";
import {
  Body,
  Button,
  Card,
  Chip,
  Display,
  ErrorText,
  GlassBanner,
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
import { fetchDashboard, signOut } from "../lib/data";
import type { DashboardData } from "../lib/types";

/** "2026-09-14" -> "lun. 14 sept." */
function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function DashboardScreen() {
  const router = useRouter();
  const { userId, email, isLoading: authLoading, refresh } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  // Énergie et lieu sont demandés sur /prepare, juste avant la génération.
  function handleStart() {
    if (!data) return;
    router.push({
      pathname: "/prepare",
      params: { payload: JSON.stringify(data) },
    });
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
    totalPlanned,
    cycleComplete,
    overdue,
  } = data;
  const gradient = personaGradient(
    userProgram.persona_id?.replace("persona_", "").toUpperCase(),
  );
  // La durée du CYCLE PLANIFIÉ, pas la durée de référence du programme :
  // à cinq séances par semaine un cycle de « 14 semaines » en compte huit,
  // et la barre de progression n'atteignait jamais son terme.
  const totalWeeks = data.cycleWeeks;
  const progress = totalWeeks
    ? Math.min(1, userProgram.current_week / totalWeeks)
    : 0;

  // Le créneau du PRATIQUANT, pas celui de la fiche programme.
  const sessionMinutes = `~ ${data.sessionMinutesMax} min`;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <Backdrop variant="dashboard" />
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

          {/* Série et avancement du cycle */}
          <Card className="flex-row mb-4 py-3.5">
            <View className="flex-1">
              <MonoLabel className="text-[9px]">Série actuelle</MonoLabel>
              <Text className="font-display text-accent text-[24px] mt-0.5">
                {streak}
                <Text className="font-body text-[12px] text-muted">
                  {" "}
                  {streak > 1 ? "jours" : "jour"}
                </Text>
              </Text>
            </View>
            <View className="w-px bg-line mx-4" />
            <View className="flex-1">
              <MonoLabel className="text-[9px]">Cycle</MonoLabel>
              <Text className="font-display text-ink text-[24px] mt-0.5">
                {completedCount}
                <Text className="font-body text-[12px] text-muted">
                  {" "}
                  / {totalPlanned}
                </Text>
              </Text>
            </View>
          </Card>

          {/* Accès au profil et à l'historique — un compte existe forcément
              ici, l'écran n'est atteignable qu'une fois connecté. */}
          <View className="gap-2 mb-4">
            <GlassBanner
              label="Mon profil"
              detail="Persona, niveau, ce qui pilote mes séances"
              onPress={() => router.push("/profile")}
            />
            <GlassBanner
              label="Mes entraînements"
              detail={`Poids soulevé, dépense, répartition · ${completedCount} séance${completedCount > 1 ? "s" : ""}`}
              onPress={() => router.push("/training")}
            />
          </View>

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

          {cycleComplete ? (
            /* Toutes les séances du plan sont faites : on bascule sur le bilan. */
            <Card className="mb-3">
              <MonoLabel tone="accent" className="mb-2">
                Cycle terminé
              </MonoLabel>
              <Display size={22} className="mb-1.5">
                {totalPlanned} séances{"\n"}bouclées
              </Display>
              <Body className="text-[12px] mb-4">
                Ton bilan va calibrer le prochain cycle.
              </Body>
              <Button
                label="Faire le bilan"
                onPress={() => router.push("/feedback")}
              />
            </Card>
          ) : (
          /* Prochaine séance */
          <Card className="mb-3">
            <MonoLabel tone="accent" className="mb-2">
              Séance {nextSession.day_number} / {totalPlanned}
              {nextSession.scheduled_date
                ? ` · ${formatDate(nextSession.scheduled_date)}`
                : ""}
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
            />
          </Card>
          )}


          {overdue > 0 && !cycleComplete ? (
            <View className="items-center py-3">
              <MonoLabel>
                {overdue} séance{overdue > 1 ? "s" : ""} en retard
              </MonoLabel>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
