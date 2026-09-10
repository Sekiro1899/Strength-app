import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BlockHeader,
  Button,
  Display,
  ErrorText,
  Loading,
  MonoLabel,
  Screen,
} from "../components/ui";
import { setsLabel } from "../lib/prescription";
import { Backdrop } from "../components/Backdrop";
import { fetchSession } from "../lib/data";
import type { ExerciseBlock, WorkoutSession } from "../lib/types";

const BLOCKS: {
  field: keyof WorkoutSession;
  symbol: string;
  name: string;
}[] = [
  { field: "warmup_block", symbol: "⊹", name: "Warmup" },
  { field: "main_block", symbol: "▲", name: "Main Block" },
  { field: "core_block", symbol: "■", name: "Core" },
  { field: "finisher_block", symbol: "◆", name: "Finisher" },
];


/** "75% 1RM · Repos 90s" — le détail secondaire, en muted. */
export function detailLabel(block: ExerciseBlock): string {
  const parts: string[] = [];
  if (block.load_pct_1rm !== undefined) parts.push(`${block.load_pct_1rm}% 1RM`);
  if (block.rest_sec !== undefined) parts.push(`Repos ${block.rest_sec}s`);
  if (block.superset_with) parts.push("Superset");
  if (parts.length === 0 && block.notes) return block.notes;
  return parts.join(" · ");
}

/** Estimation grossière de la durée d'un bloc, pour l'en-tête. */
function blockMinutes(blocks: ExerciseBlock[]): number {
  const seconds = blocks.reduce((total, b) => {
    const work = b.duration_sec ?? (b.reps ?? 10) * 3;
    const rest = b.rest_sec ?? 30;
    return total + b.sets * (work + rest);
  }, 0);
  return Math.max(1, Math.round(seconds / 60));
}

export default function SessionScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    fetchSession(sessionId)
      .then((s) => active && setSession(s))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [sessionId]);

  if (loading) return <Loading label="Préparation" />;

  if (!session) {
    return (
      <Screen center>
        <ErrorText message={error ?? "Séance introuvable."} />
        <Button label="Retour au dashboard" onPress={() => router.replace("/dashboard")} />
      </Screen>
    );
  }

  const totalExercises = BLOCKS.reduce(
    (n, b) => n + ((session[b.field] as ExerciseBlock[] | null) ?? []).length,
    0,
  );
  const totalMinutes = BLOCKS.reduce(
    (n, b) => n + blockMinutes((session[b.field] as ExerciseBlock[] | null) ?? []),
    0,
  );

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <Backdrop variant="session" />
      <ScrollView
        contentContainerStyle={{ paddingVertical: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[420px] mx-auto px-5">
          {/* En-tête : bouton retour carré + titre display */}
          <View className="flex-row items-center gap-2.5 mb-2">
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel="Retour"
              className="w-8 h-8 rounded-[10px] bg-surface border border-line items-center justify-center"
            >
              <Text className="text-ink text-[18px] leading-[20px]">‹</Text>
            </Pressable>
            <Display size={22}>{session.session_label}</Display>
          </View>

          <MonoLabel className="mb-6">
            Semaine {session.week_number} · Jour {session.day_number} ·{" "}
            {totalExercises} exercices · ~{totalMinutes} min
          </MonoLabel>

          {BLOCKS.map(({ field, symbol, name }) => {
            const blocks = (session[field] as ExerciseBlock[] | null) ?? [];
            if (blocks.length === 0) return null;

            return (
              <View key={String(field)} className="mb-5">
                <BlockHeader
                  symbol={symbol}
                  name={name}
                  meta={`${blockMinutes(blocks)} min`}
                />

                {blocks.map((block, i) => (
                  <View
                    key={`${String(field)}-${i}`}
                    className="bg-surface border border-line rounded-[14px] p-3.5 mb-2"
                  >
                    <View className="flex-row justify-between items-start mb-1.5">
                      <Text
                        className="font-body-sb text-[13px] text-ink flex-1 pr-3"
                        numberOfLines={2}
                      >
                        {block.name}
                      </Text>
                      <Text className="font-mono-md text-[12px] text-accent">
                        {setsLabel(block)}
                      </Text>
                    </View>
                    <Text className="font-body text-[11px] text-muted">
                      {detailLabel(block)}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}

          <Button
            label="Commencer la séance"
            onPress={() =>
              router.push({
                pathname: "/tracking",
                params: { sessionId: session.id },
              })
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
