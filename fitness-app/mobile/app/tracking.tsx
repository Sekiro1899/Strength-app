import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "./_layout";
import {
  Button,
  Display,
  ErrorText,
  Loading,
  MonoLabel,
  ProgressBar,
  Screen,
} from "../components/ui";
import { ExerciseVideo } from "../components/ExerciseVideo";
import { ACCENT_GRADIENT, COLORS, GRADIENT_DIRECTION } from "../lib/theme";
import {
  completeSession,
  exerciseVideoUrl,
  fetchDashboard,
  fetchSession,
} from "../lib/data";
import type { BlockType, ExerciseBlock, WorkoutSession } from "../lib/types";

const BLOCK_ORDER: { field: keyof WorkoutSession; type: BlockType; name: string }[] = [
  { field: "warmup_block", type: "warmup", name: "Warmup" },
  { field: "main_block", type: "main", name: "Main Block" },
  { field: "core_block", type: "core", name: "Core" },
  { field: "finisher_block", type: "finisher", name: "Finisher" },
];

interface FlatExercise {
  uid: string;
  blockName: string;
  block: ExerciseBlock;
  /** Second mouvement quand l'entrée est un superset. */
  partner?: ExerciseBlock;
}

/** Une ligne de série saisie par l'utilisateur. */
interface SetEntry {
  load: string;
  reps: string;
  done: boolean;
}

/** Prescription lisible : une plage plutôt qu'un nombre sec. */
function formatTarget(block: ExerciseBlock): string {
  if (block.duration_sec !== undefined) return `${block.duration_sec}s`;
  if (block.reps === undefined) return "—";
  return block.reps_max && block.reps_max !== block.reps
    ? `${block.reps}-${block.reps_max} reps`
    : `${block.reps} reps`;
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TrackingScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [cursor, setCursor] = useState(0);
  const [entries, setEntries] = useState<Record<string, SetEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Minuteur de repos
  const [restLeft, setRestLeft] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const exercises = useMemo<FlatExercise[]>(() => {
    if (!session) return [];
    return BLOCK_ORDER.flatMap(({ field, name }) => {
      const blocks = (session[field] as ExerciseBlock[] | null) ?? [];
      const out: FlatExercise[] = [];
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const next = blocks[i + 1];
        // Un superset se présente comme UNE entrée : les deux mouvements
        // s'enchaînent sans repos, la série se valide une fois pour les deux.
        if (block.superset_with && next?.exercise_id === block.superset_with) {
          out.push({ uid: `${String(field)}-${i}`, blockName: name, block, partner: next });
          i++;
        } else {
          out.push({ uid: `${String(field)}-${i}`, blockName: name, block });
        }
      }
      return out;
    });
  }, [session]);

  const current = exercises[cursor];

  // Initialise les lignes de séries au premier affichage de l'exercice.
  // Toute prescription a ses séries : sans saisie de charge, on coche quand
  // même chaque série et le minuteur de repos se déclenche.
  useEffect(() => {
    if (!current) return;
    setEntries((prev) => {
      if (prev[current.uid]) return prev;
      const count = current.block.sets;
      const rows: SetEntry[] = Array.from({ length: count }, () => ({
        load: "",
        reps: current.block.reps !== undefined ? String(current.block.reps) : "",
        done: false,
      }));
      return { ...prev, [current.uid]: rows };
    });
  }, [current]);

  // Décompte du repos
  useEffect(() => {
    if (restLeft === null) return;
    if (restLeft <= 0) {
      setRestLeft(null);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRestLeft((v) => (v === null ? null : v - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [restLeft]);

  const updateSet = useCallback(
    (uid: string, index: number, patch: Partial<SetEntry>) => {
      setEntries((prev) => {
        const rows = prev[uid] ?? [];
        return {
          ...prev,
          [uid]: rows.map((r, i) => (i === index ? { ...r, ...patch } : r)),
        };
      });
    },
    [],
  );

  function toggleSet(uid: string, index: number, restSec?: number) {
    const rows = entries[uid] ?? [];
    const wasDone = rows[index]?.done;
    updateSet(uid, index, { done: !wasDone });
    // Valider une série lance le repos ; la dévalider l'annule.
    setRestLeft(!wasDone && restSec ? restSec : null);
  }

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

  if (loading) return <Loading label="Chargement" />;

  if (!session || !current) {
    return (
      <Screen center>
        <ErrorText message={error ?? "Séance introuvable."} />
        <Button label="Retour" onPress={() => router.replace("/dashboard")} />
      </Screen>
    );
  }

  const rows = entries[current.uid] ?? [];
  const logResults = current.block.log_results !== false;
  // Sur un superset le repos se prend après la paire, pas entre les deux.
  const restAfter = current.partner?.rest_sec ?? current.block.rest_sec;
  const doneCount = rows.filter((r) => r.done).length;
  const isLast = cursor === exercises.length - 1;
  const allSetsDone = rows.length > 0 && doneCount === rows.length;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-[420px] mx-auto px-5">
          {/* Barre de progression globale */}
          <View className="flex-row items-center gap-3 mb-6">
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel="Quitter la séance"
              className="w-8 h-8 rounded-[10px] bg-surface border border-line items-center justify-center"
            >
              <Text className="text-ink text-[18px] leading-[20px]">‹</Text>
            </Pressable>
            <View className="flex-1">
              <ProgressBar value={(cursor + 1) / exercises.length} />
            </View>
            <Text className="font-mono text-[10px] tracking-label text-muted">
              {cursor + 1}/{exercises.length}
            </Text>
          </View>

          <ErrorText message={error} />

          {/* Exercice courant */}
          <View className="items-center mb-6">
            {current.partner ? (
              <>
                <Text className="font-mono text-[10px] uppercase tracking-label-lg text-accent mb-2.5">
                  ⇄ Superset
                </Text>
                <Display size={21} className="text-center">
                  {current.block.name}
                </Display>
                <Text className="font-mono text-[11px] text-muted my-1">+</Text>
                <Display size={21} className="text-center">
                  {current.partner.name}
                </Display>
              </>
            ) : (
              <Display size={26} className="text-center">
                {current.block.name}
              </Display>
            )}
            <Text className="font-mono text-[10px] uppercase tracking-label text-muted mt-2.5">
              {current.blockName}
              {` · ${current.block.sets}×${formatTarget(current.block)}`}
              {current.block.load_pct_1rm !== undefined
                ? ` · ${current.block.load_pct_1rm}% 1RM`
                : ""}
            </Text>
          </View>

          {/* Démonstration : la forme du mouvement avant de le charger. */}
          <ExerciseVideo
            name={current.block.name}
            videoUrl={exerciseVideoUrl(current.block.exercise_id)}
          />
          {current.partner ? (
            <ExerciseVideo
              name={current.partner.name}
              videoUrl={exerciseVideoUrl(current.partner.exercise_id)}
            />
          ) : null}

          {/* Sans saisie de charge : chaque série se coche quand même, et le
              minuteur de repos part comme sur un compound. */}
          {logResults
            ? null
            : rows.map((row, i) => (
                <Pressable
                  key={i}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: row.done }}
                  accessibilityLabel={`Valider la série ${i + 1}`}
                  onPress={() => toggleSet(current.uid, i, restAfter)}
                  className={`flex-row items-center gap-2.5 rounded-xl border px-3.5 py-3.5 mb-2 ${
                    row.done ? "bg-accent/10 border-accent" : "bg-surface border-line"
                  }`}
                >
                  <Text className="w-7 font-mono-md text-[11px] text-accent">
                    S{i + 1}
                  </Text>
                  <View className="flex-1 pr-2">
                    <Text className="font-body-sb text-[14px] text-ink">
                      {current.partner
                        ? `${formatTarget(current.block)} + ${formatTarget(current.partner)}`
                        : formatTarget(current.block)}
                    </Text>
                    <Text className="font-body text-[11px] text-muted mt-1">
                      {current.partner
                        ? "Enchaîne les deux, repos après la paire."
                        : "Rien à noter — coche quand c'est fait."}
                    </Text>
                  </View>
                  <View
                    className={`w-[26px] h-[26px] rounded-lg items-center justify-center border ${
                      row.done ? "bg-accent border-accent" : "bg-bg border-line"
                    }`}
                  >
                    <Text className={`text-[13px] ${row.done ? "text-black" : "text-muted"}`}>
                      {row.done ? "✓" : "○"}
                    </Text>
                  </View>
                </Pressable>
              ))}

          {/* Lignes de séries — uniquement quand il y a des résultats à noter */}
          {logResults && rows.map((row, i) => (
            <View
              key={i}
              className={`flex-row items-center gap-2.5 rounded-xl border px-3.5 py-3 mb-2 ${
                row.done ? "bg-accent/10 border-accent" : "bg-surface border-line"
              }`}
            >
              <Text className="w-7 font-mono-md text-[11px] text-accent">
                S{i + 1}
              </Text>

              {/* minWidth:0 — sur react-native-web le <input> a une largeur
                  intrinsèque que flex-1 seul ne peut pas réduire, ce qui
                  faisait déborder la ligne et rognait la case à cocher. */}
              <TextInput
                className="flex-1 bg-bg border border-line rounded-lg px-2 py-2 font-mono text-[13px] text-ink text-center"
                style={{ minWidth: 0 }}
                placeholder="kg"
                placeholderTextColor={COLORS.muted}
                keyboardType="numeric"
                inputMode="numeric"
                value={row.load}
                onChangeText={(v) => updateSet(current.uid, i, { load: v })}
              />

              <TextInput
                className="flex-1 bg-bg border border-line rounded-lg px-2 py-2 font-mono text-[13px] text-ink text-center"
                style={{ minWidth: 0 }}
                placeholder={
                  current.block.duration_sec !== undefined
                    ? "sec"
                    : current.block.reps_max
                      ? `${current.block.reps}-${current.block.reps_max}`
                      : "reps"
                }
                placeholderTextColor={COLORS.muted}
                keyboardType="numeric"
                inputMode="numeric"
                value={row.reps}
                onChangeText={(v) => updateSet(current.uid, i, { reps: v })}
              />

              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: row.done }}
                accessibilityLabel={`Valider la série ${i + 1}`}
                onPress={() => toggleSet(current.uid, i, restAfter)}
                className={`w-[26px] h-[26px] rounded-lg items-center justify-center border ${
                  row.done ? "bg-accent border-accent" : "bg-bg border-line"
                }`}
              >
                <Text
                  className={`text-[13px] ${row.done ? "text-black" : "text-muted"}`}
                >
                  {row.done ? "✓" : "○"}
                </Text>
              </Pressable>
            </View>
          ))}

          {/* Minuteur de repos */}
          {restLeft !== null ? (
            <LinearGradient
              colors={ACCENT_GRADIENT}
              start={GRADIENT_DIRECTION.start}
              end={GRADIENT_DIRECTION.end}
              style={{ borderRadius: 20, marginTop: 16, padding: 18 }}
            >
              <Text className="font-mono text-[10px] uppercase tracking-label-lg text-black/60 text-center">
                Repos en cours
              </Text>
              <Text className="font-display text-black text-[42px] text-center mt-1">
                {formatClock(restLeft)}
              </Text>
              <View className="flex-row gap-2 mt-3">
                <Pressable
                  onPress={() => setRestLeft((v) => Math.max(0, (v ?? 0) - 15))}
                  className="flex-1 bg-black/15 rounded-[10px] py-2 items-center"
                >
                  <Text className="font-mono-md text-[11px] text-black">−15 s</Text>
                </Pressable>
                <Pressable
                  onPress={() => setRestLeft(null)}
                  className="flex-1 bg-black/15 rounded-[10px] py-2 items-center"
                >
                  <Text className="font-mono-md text-[11px] text-black">PASSER</Text>
                </Pressable>
                <Pressable
                  onPress={() => setRestLeft((v) => (v ?? 0) + 15)}
                  className="flex-1 bg-black/15 rounded-[10px] py-2 items-center"
                >
                  <Text className="font-mono-md text-[11px] text-black">+15 s</Text>
                </Pressable>
              </View>
            </LinearGradient>
          ) : null}

          {/* Navigation entre exercices */}
          <View className="mt-6 gap-2.5">
            {isLast ? (
              <Button
                label={
                  allSetsDone ? "Terminer la séance" : "Terminer quand même"
                }
                onPress={handleFinish}
                loading={finishing}
              />
            ) : (
              <Button
                label="Exercice suivant"
                onPress={() => {
                  setRestLeft(null);
                  setCursor((c) => c + 1);
                }}
              />
            )}

            {cursor > 0 ? (
              <Button
                label="Exercice précédent"
                variant="ghost"
                onPress={() => {
                  setRestLeft(null);
                  setCursor((c) => c - 1);
                }}
              />
            ) : null}
          </View>

          <View className="items-center mt-4">
            <MonoLabel>
              {`${doneCount}/${rows.length} séries validées`}
            </MonoLabel>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
