import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./_layout";
import { Backdrop } from "../components/Backdrop";
import {
  Button,
  Display,
  ErrorText,
  GlassCard,
  Loading,
  MonoLabel,
  Screen,
} from "../components/ui";
import { fetchSessionHistory } from "../lib/data";
import type { SessionStatus, WorkoutSession } from "../lib/types";

const STATUS_LABEL: Record<SessionStatus, string> = {
  completed: "Terminée",
  in_progress: "En cours",
  planned: "À venir",
  skipped: "Passée",
};

const STATUS_TONE: Record<SessionStatus, string> = {
  completed: "text-accent",
  in_progress: "text-ink",
  planned: "text-muted",
  skipped: "text-muted",
};

/** "2026-09-10" -> "10 sept." */
function formatDay(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function countExercises(session: WorkoutSession): number {
  return (
    (session.warmup_block?.length ?? 0) +
    (session.main_block?.length ?? 0) +
    (session.core_block?.length ?? 0) +
    (session.finisher_block?.length ?? 0)
  );
}

export default function SessionsScreen() {
  const router = useRouter();
  const { userId } = useAuth();

  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setSessions(await fetchSessionHistory(userId));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const done = useMemo(
    () => sessions.filter((s) => s.status === "completed").length,
    [sessions],
  );

  if (loading) return <Loading label="Chargement des séances" />;

  return (
    <View className="flex-1 bg-bg">
      <Backdrop variant="sessions" />
      <Screen>
        <View className="flex-row items-center gap-3 mb-6">
          <Button label="‹" variant="glass" onPress={() => router.back()} />
        </View>

        <MonoLabel tone="accent" className="mb-2">
          Mes séances
        </MonoLabel>
        <Display size={26} className="mb-1">
          {done} terminée{done > 1 ? "s" : ""}
        </Display>
        <Text className="font-body text-[12px] text-muted mb-6">
          {sessions.length} séance{sessions.length > 1 ? "s" : ""} générée
          {sessions.length > 1 ? "s" : ""} jusqu'ici
        </Text>

        <ErrorText message={error} />

        {sessions.length === 0 ? (
          <GlassCard>
            <Text className="font-body-sb text-[14px] text-ink">
              Aucune séance pour l'instant
            </Text>
            <Text className="font-body text-[12px] text-muted mt-1">
              Lance ta première séance depuis le tableau de bord — elle
              apparaîtra ici avec son contenu.
            </Text>
          </GlassCard>
        ) : null}

        {sessions.map((session) => {
          const openable = session.status !== "planned";
          return (
            <Pressable
              key={session.id}
              accessibilityRole={openable ? "button" : undefined}
              disabled={!openable}
              onPress={() =>
                router.push({
                  pathname: "/tracking",
                  params: { sessionId: session.id },
                })
              }
              className="mb-2 active:opacity-70"
            >
              <GlassCard>
                <View className="flex-row items-center">
                  <View className="flex-1">
                    <Text className="font-body-sb text-[14px] text-ink">
                      {session.session_label ?? "Séance"}
                    </Text>
                    <Text className="font-body text-[11px] text-muted mt-0.5">
                      Jour {session.day_number} · semaine {session.week_number} ·{" "}
                      {countExercises(session)} exercices
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className={`font-mono text-[10px] uppercase tracking-label ${
                        STATUS_TONE[session.status]
                      }`}
                    >
                      {STATUS_LABEL[session.status]}
                    </Text>
                    <Text className="font-body text-[11px] text-muted mt-0.5">
                      {formatDay(session.scheduled_date)}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          );
        })}
      </Screen>
    </View>
  );
}
