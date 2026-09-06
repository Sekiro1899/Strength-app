import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "./_layout";
import { Button, Card, ErrorText, Label, Loading, Title } from "../components/ui";
import { completeSession, fetchDashboard, fetchSession } from "../lib/data";
import type { BlockType, ExerciseBlock, WorkoutSession } from "../lib/types";

const BLOCK_META: { key: BlockType; field: keyof WorkoutSession; title: string; icon: string }[] = [
  { key: "warmup", field: "warmup_block", title: "Échauffement", icon: "🔆" },
  { key: "main", field: "main_block", title: "Bloc principal", icon: "🏋️" },
  { key: "core", field: "core_block", title: "Gainage", icon: "🧱" },
  { key: "finisher", field: "finisher_block", title: "Finisher", icon: "🔥" },
];

/** "4 × 10 · 75 % 1RM · repos 90 s" — n'affiche que ce que le moteur a renvoyé. */
function describe(block: ExerciseBlock): string {
  const parts: string[] = [];
  if (block.reps !== undefined) parts.push(`${block.sets} × ${block.reps}`);
  else if (block.duration_sec !== undefined)
    parts.push(`${block.sets} × ${block.duration_sec} s`);
  else parts.push(`${block.sets} série${block.sets > 1 ? "s" : ""}`);

  if (block.load_pct_1rm !== undefined) parts.push(`${block.load_pct_1rm} % 1RM`);
  if (block.rest_sec !== undefined) parts.push(`repos ${block.rest_sec} s`);
  return parts.join(" · ");
}

export default function SessionScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
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

  const allBlocks = useMemo(() => {
    if (!session) return [];
    return BLOCK_META.flatMap(({ key, field }) => {
      const blocks = (session[field] as ExerciseBlock[] | null) ?? [];
      return blocks.map((b, i) => ({ uid: `${key}-${i}`, block: b }));
    });
  }, [session]);

  const completedCount = allBlocks.filter((b) => done[b.uid]).length;
  const progress = allBlocks.length ? completedCount / allBlocks.length : 0;

  async function handleFinish() {
    if (!session || !userId) return;
    setFinishing(true);
    setError(null);
    try {
      const dashboard = await fetchDashboard(userId, new Date());
      await completeSession(
        session.id,
        session.user_program_id,
        dashboard?.completedCount ?? 0,
        new Date(),
      );
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
      setFinishing(false);
    }
  }

  if (loading) return <Loading label="Préparation de la séance…" />;

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center px-8">
        <ErrorText message={error ?? "Séance introuvable."} />
        <Button label="Retour au dashboard" onPress={() => router.replace("/dashboard")} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ paddingVertical: 20, paddingBottom: 32 }}>
        <View className="w-full max-w-[520px] mx-auto px-6">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1">
              <Label>
                Semaine {session.week_number} · Jour {session.day_number}
              </Label>
              <Title>{session.session_label}</Title>
              <Text className="text-sm text-slate-500 mt-1">
                Focus : {session.focus?.replace(/_/g, " ")}
              </Text>
            </View>
            <Pressable onPress={() => router.back()} className="p-2 -mr-2">
              <Text className="text-xs text-slate-400">Fermer</Text>
            </Pressable>
          </View>

          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden mr-3">
              <View
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${progress * 100}%` }}
              />
            </View>
            <Text className="text-xs text-slate-500">
              {completedCount}/{allBlocks.length}
            </Text>
          </View>

          <ErrorText message={error} />

          {BLOCK_META.map(({ key, field, title, icon }) => {
            const blocks = (session[field] as ExerciseBlock[] | null) ?? [];
            if (blocks.length === 0) return null;

            return (
              <View key={key} className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Text className="text-base mr-2">{icon}</Text>
                  <Text className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    {title}
                  </Text>
                  <Text className="text-xs text-slate-400 ml-2">
                    {blocks.length} exercice{blocks.length > 1 ? "s" : ""}
                  </Text>
                </View>

                {blocks.map((block, i) => {
                  const uid = `${key}-${i}`;
                  const checked = Boolean(done[uid]);
                  return (
                    <Pressable
                      key={uid}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                      onPress={() => setDone((d) => ({ ...d, [uid]: !d[uid] }))}
                      className={`flex-row items-start rounded-xl border p-4 mb-2 ${
                        checked
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <View
                        className={`w-5 h-5 rounded-md border-2 mr-3 mt-0.5 items-center justify-center ${
                          checked
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-slate-300"
                        }`}
                      >
                        {checked ? (
                          <Text className="text-white text-[11px] font-bold">✓</Text>
                        ) : null}
                      </View>

                      <View className="flex-1">
                        <Text
                          className={`text-[15px] font-semibold ${
                            checked
                              ? "text-emerald-900 line-through"
                              : "text-slate-900"
                          }`}
                        >
                          {block.name}
                        </Text>
                        <Text className="text-xs text-slate-500 mt-1">
                          {describe(block)}
                        </Text>
                        {block.superset_with ? (
                          <View className="self-start bg-violet-100 rounded px-2 py-0.5 mt-1.5">
                            <Text className="text-[10px] text-violet-700 font-semibold">
                              SUPERSET
                            </Text>
                          </View>
                        ) : null}
                        {block.notes ? (
                          <Text className="text-[11px] text-slate-400 mt-1 italic">
                            {block.notes}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}

          <Card className="mb-4">
            <Text className="text-xs text-slate-500 leading-4">
              Cochez les exercices au fur et à mesure. Terminer la séance
              incrémente votre compteur et votre streak sur le dashboard.
            </Text>
          </Card>

          <Button
            label={
              completedCount === allBlocks.length
                ? "Terminer la séance"
                : `Terminer (${completedCount}/${allBlocks.length})`
            }
            onPress={handleFinish}
            loading={finishing}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
