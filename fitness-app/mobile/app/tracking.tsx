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
import { Backdrop } from "../components/Backdrop";
import { ExerciseVideo } from "../components/ExerciseVideo";
import { ScalingNote } from "../components/ScalingNote";
import { formatTarget } from "../lib/prescription";
import { ACCENT_GRADIENT, COLORS, GRADIENT_DIRECTION } from "../lib/theme";
import {
  completeSession,
  exerciseVideoUrl,
  fetchDashboard,
  fetchSession,
} from "../lib/data";
import type { SetLog } from "../lib/metrics";
import type { BlockType, ExerciseBlock, WorkoutSession } from "../lib/types";

/**
 * Les deux côtés d'un mouvement unilatéral, dans l'ordre où on les enchaîne.
 * L'ordre est fixe : c'est ce qui permet de reprendre une série interrompue
 * sans se demander quel côté a déjà été fait.
 */
const SIDES = [
  { short: "G", long: "Gauche" },
  { short: "D", long: "Droite" },
] as const;

/** Index d'un second côté — celui après lequel le repos s'ouvre. */
const isSecondSide = (index: number) => index % SIDES.length === SIDES.length - 1;

/** Sur l'écran de suivi la prescription porte son unité : « 10-12 reps ». */
const targetWithUnit = (block: ExerciseBlock) => formatTarget(block, true);


const BLOCK_ORDER: { field: keyof WorkoutSession; type: BlockType; name: string }[] = [
  { field: "warmup_block", type: "warmup", name: "Warmup" },
  { field: "main_block", type: "main", name: "Main Block" },
  { field: "core_block", type: "core", name: "Core" },
  { field: "finisher_block", type: "finisher", name: "Finisher" },
];

interface FlatExercise {
  uid: string;
  blockName: string;
  /** Type machine du bloc — c'est lui qui part au journal, pas le libellé. */
  blockType: BlockType;
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
  /**
   * Le repos vient de s'écouler. État distinct de `restLeft === null`, qui
   * couvre aussi « aucun repos en cours » : sans lui le minuteur disparaissait
   * en silence et rien ne disait au pratiquant qu'une série l'attendait.
   */
  const [restDone, setRestDone] = useState(false);
  /** Demande de passage à l'exercice suivant alors qu'il reste des séries. */
  const [confirmSkip, setConfirmSkip] = useState(false);
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
    return BLOCK_ORDER.flatMap(({ field, name, type }) => {
      const blocks = (session[field] as ExerciseBlock[] | null) ?? [];
      const out: FlatExercise[] = [];
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const next = blocks[i + 1];
        // Un superset se présente comme UNE entrée : les deux mouvements
        // s'enchaînent sans repos, la série se valide une fois pour les deux.
        if (block.superset_with && next?.exercise_id === block.superset_with) {
          out.push({
            uid: `${String(field)}-${i}`,
            blockName: name,
            blockType: type,
            block,
            partner: next,
          });
          i++;
        } else {
          out.push({ uid: `${String(field)}-${i}`, blockName: name, blockType: type, block });
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
      // Un mouvement unilatéral se coche deux fois par série : un côté, puis
      // l'autre. Le côté qui attend récupère pendant que l'autre travaille.
      const count = current.block.unilateral
        ? current.block.sets * SIDES.length
        : current.block.sets;
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
      setRestDone(true);
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
    setRestDone(false);
    // Sur un mouvement unilatéral, valider le premier côté n'ouvre pas de
    // repos : on enchaîne sur l'autre jambe. Le minuteur attend la paire.
    const opensRest = !current?.block.unilateral || isSecondSide(index);
    // Valider une série lance le repos ; la dévalider l'annule.
    setRestLeft(!wasDone && opensRest && restSec ? restSec : null);
  }

  /** Changer d'exercice remet le minuteur et la confirmation à plat. */
  function goTo(index: number) {
    setRestLeft(null);
    setRestDone(false);
    setConfirmSkip(false);
    setCursor(index);
  }

  /**
   * Transcrit la saisie de l'écran en lignes de journal.
   *
   * Une seule règle non évidente : la charge saisie est la charge EXTERNE.
   * Sur une traction, le champ « kg » reçoit le lest, pas le pratiquant —
   * c'est `lib/metrics` qui ajoute le poids de corps, ce qui garde le journal
   * juste même si celui-ci change dans six mois.
   */
  function buildSetLogs(): SetLog[] {
    const logs: SetLog[] = [];
    for (const ex of exercises) {
      const rows = entries[ex.uid];
      if (!rows) continue;
      const unilat = Boolean(ex.block.unilateral);
      rows.forEach((row, i) => {
        const number = unilat ? Math.floor(i / SIDES.length) + 1 : i + 1;
        const push = (block: ExerciseBlock) =>
          logs.push({
            exercise_id: block.exercise_id,
            block_type: ex.blockType,
            set_number: number,
            reps: row.reps ? Number(row.reps) : (block.reps ?? null),
            load_kg: row.load ? Number(row.load) : null,
            rest_sec_planned: block.rest_sec ?? null,
            completed: row.done,
          });
        push(ex.block);
        // Un superset se coche une fois pour deux mouvements : le second a
        // bien été exécuté, il doit peser dans le tonnage.
        if (ex.partner) push(ex.partner);
      });
    }
    return logs;
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
        buildSetLogs(),
        userId,
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
  const unilateral = Boolean(current.block.unilateral);
  /** « S2 » en bilatéral, « S2 G » puis « S2 D » quand on travaille par côté. */
  const setLabel = (i: number) =>
    unilateral
      ? `S${Math.floor(i / SIDES.length) + 1} ${SIDES[i % SIDES.length].short}`
      : `S${i + 1}`;
  // Sur un superset le repos se prend après la paire, pas entre les deux.
  const restAfter = current.partner?.rest_sec ?? current.block.rest_sec;
  const doneCount = rows.filter((r) => r.done).length;
  const isLast = cursor === exercises.length - 1;
  const allSetsDone = rows.length > 0 && doneCount === rows.length;

  /** Numéro de série d'une ligne — les deux côtés partagent le même. */
  const setNumberOf = (i: number) =>
    unilateral ? Math.floor(i / SIDES.length) + 1 : i + 1;
  /** Première ligne non validée : la série qui attend. -1 si tout est fait. */
  const pendingIndex = rows.findIndex((r) => !r.done);
  /** Séries restantes — comptées en SÉRIES, pas en lignes : sur un mouvement
      unilatéral, deux lignes cochées ne font qu'une série faite. */
  const remainingSets = unilateral
    ? current.block.sets - Math.floor(doneCount / SIDES.length)
    : rows.length - doneCount;
  /** « Série 2 sur 4 », et le côté quand il y en a un. */
  const upNext =
    pendingIndex < 0
      ? null
      : `Série ${setNumberOf(pendingIndex)} sur ${current.block.sets}` +
        (unilateral ? ` · côté ${SIDES[pendingIndex % SIDES.length].long.toLowerCase()}` : "");

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <Backdrop variant="tracking" />
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
              <>
                {/* Une séance d'hypertrophie qui porte un exercice lourd doit
                    le dire : sinon le 5x5 passe pour une coquille. */}
                {current.block.protocol_label ? (
                  <Text className="font-mono text-[10px] uppercase tracking-label-lg text-accent mb-2.5">
                    ⚡ {current.block.protocol_label}
                  </Text>
                ) : null}
                <Display size={26} className="text-center">
                  {current.block.name}
                </Display>
              </>
            )}
            <Text className="font-mono text-[10px] uppercase tracking-label text-muted mt-2.5">
              {current.blockName}
              {` · ${current.block.sets}×${targetWithUnit(current.block)}`}
              {current.block.unilateral ? " par côté" : ""}
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

          {/* Comment monter, comment descendre — sur les mouvements où la
              prescription seule ne suffit pas (tractions, dips). */}
          {current.block.scaling ? <ScalingNote scaling={current.block.scaling} /> : null}
          {current.partner?.scaling ? <ScalingNote scaling={current.partner.scaling} /> : null}

          {/* Où on en est dans l'exercice, EN PERMANENCE.
              L'annonce était d'abord accrochée au minuteur de repos — donc
              muette sur tout l'échauffement, qui n'en a pas. C'est pourtant là
              qu'on enchaîne le plus vite, et qu'on part à l'exercice suivant
              en croyant l'avoir fini. */}
          <View
            className={`flex-row items-center justify-between rounded-xl border px-3.5 py-2.5 mb-2.5 ${
              allSetsDone ? "border-accent bg-accent/10" : "border-line bg-surface/60"
            }`}
          >
            <Text
              className={`font-mono text-[10px] uppercase tracking-label-lg ${
                allSetsDone ? "text-accent" : "text-ink"
              }`}
            >
              {allSetsDone
                ? "Toutes les séries sont faites"
                : `Série ${setNumberOf(pendingIndex)} sur ${current.block.sets}`}
            </Text>
            <Text className="font-mono text-[10px] tracking-label text-muted">
              {allSetsDone
                ? "✓"
                : unilateral
                  ? SIDES[pendingIndex % SIDES.length].long
                  : `${remainingSets} restante${remainingSets > 1 ? "s" : ""}`}
            </Text>
          </View>

          {/* Sans saisie de charge : chaque série se coche quand même, et le
              minuteur de repos part comme sur un compound. */}
          {logResults
            ? null
            : rows.map((row, i) => (
                <Pressable
                  key={i}
                  accessibilityRole="checkbox"
                  aria-checked={row.done}
                  accessibilityLabel={
                    unilateral
                      ? `Valider la série ${Math.floor(i / SIDES.length) + 1}, côté ${SIDES[i % SIDES.length].long}`
                      : `Valider la série ${i + 1}`
                  }
                  onPress={() => toggleSet(current.uid, i, restAfter)}
                  className={`flex-row items-center gap-2.5 rounded-xl border px-3.5 py-3.5 mb-2 ${
                    row.done ? "bg-accent/10 border-accent" : "bg-surface border-line"
                  }`}
                >
                  <Text className="w-9 font-mono-md text-[11px] text-accent">
                    {setLabel(i)}
                  </Text>
                  <View className="flex-1 pr-2">
                    <Text className="font-body-sb text-[14px] text-ink">
                      {current.partner
                        ? `${targetWithUnit(current.block)} + ${targetWithUnit(current.partner)}`
                        : targetWithUnit(current.block)}
                    </Text>
                    <Text className="font-body text-[11px] text-muted mt-1">
                      {unilateral
                        ? isSecondSide(i)
                          ? "Série terminée."
                          : "Enchaîne sur l'autre côté, sans pause."
                        : current.partner
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
              <Text className="w-9 font-mono-md text-[11px] text-accent">
                {setLabel(i)}
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
                aria-checked={row.done}
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

          {/* Repos écoulé : le dire, plutôt que de laisser le minuteur
              s'évaporer. C'est le moment où le pratiquant décroche. */}
          {restDone && upNext ? (
            <View className="mt-4 rounded-2xl border border-accent bg-accent/10 px-4 py-4">
              <Text className="font-mono text-[10px] uppercase tracking-label-lg text-accent text-center">
                Repos terminé
              </Text>
              <Text className="font-display text-ink text-[24px] text-center mt-1">
                {upNext.toUpperCase()}
              </Text>
              <Text className="font-body text-[12px] text-muted text-center mt-1">
                À toi. Coche la ligne dès qu'elle est passée.
              </Text>
            </View>
          ) : null}

          {/* Minuteur de repos */}
          {restLeft !== null ? (
            <LinearGradient
              colors={ACCENT_GRADIENT}
              start={GRADIENT_DIRECTION.start}
              end={GRADIENT_DIRECTION.end}
              style={{ borderRadius: 20, marginTop: 16, padding: 18 }}
            >
              <Text className="font-mono text-[10px] uppercase tracking-label-lg text-black/60 text-center">
                {upNext ? `Repos · ensuite ${upNext}` : "Repos en cours"}
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
                  onPress={() => {
                    // Écourter son repos, c'est se déclarer prêt : la série
                    // suivante doit s'annoncer, pas disparaître avec le
                    // minuteur.
                    setRestLeft(null);
                    setRestDone(true);
                  }}
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

          {/* Navigation entre exercices.

              Tant qu'il reste des séries, avancer n'est PAS l'action offerte :
              le bouton s'efface presque complètement et demande confirmation.
              Un bouton plein à cet endroit se tape sans y penser, et
              l'exercice se termine à trois séries sur quatre sans que
              personne ne s'en aperçoive. Une fois la dernière ligne cochée,
              il reprend toute sa place. */}
          <View className="mt-6 gap-2.5">
            {confirmSkip ? (
              <View className="rounded-2xl border border-line bg-surface px-4 py-4">
                <Text className="font-body-sb text-[14px] text-ink text-center">
                  Il reste {remainingSets} série{remainingSets > 1 ? "s" : ""} sur{" "}
                  {current.block.name}.
                </Text>
                <Text className="font-body text-[12px] text-muted text-center mt-1">
                  {isLast
                    ? "Terminer maintenant clôt la séance en l'état."
                    : `Passer à la suite ${remainingSets > 1 ? "les laissera" : "la laissera"} de côté.`}
                </Text>
                <View className="flex-row gap-2.5 mt-4">
                  <View className="flex-1">
                    <Button
                      label="Je continue"
                      variant="ghost"
                      onPress={() => setConfirmSkip(false)}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      label={isLast ? "Terminer" : "Passer"}
                      onPress={() => {
                        setConfirmSkip(false);
                        if (isLast) handleFinish();
                        else goTo(cursor + 1);
                      }}
                      loading={finishing}
                    />
                  </View>
                </View>
              </View>
            ) : allSetsDone ? (
              <Button
                label={isLast ? "Terminer la séance" : "Exercice suivant"}
                onPress={() => (isLast ? handleFinish() : goTo(cursor + 1))}
                loading={finishing}
              />
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isLast
                    ? "Terminer la séance sans finir les séries"
                    : "Passer à l'exercice suivant sans finir les séries"
                }
                onPress={() => setConfirmSkip(true)}
                className="py-3 items-center opacity-25 active:opacity-60"
              >
                <Text className="font-mono text-[10px] uppercase tracking-label text-muted">
                  {isLast ? "Terminer quand même" : "Passer l'exercice"}
                </Text>
              </Pressable>
            )}

            {cursor > 0 && !confirmSkip ? (
              <Button
                label="Exercice précédent"
                variant="ghost"
                onPress={() => goTo(cursor - 1)}
              />
            ) : null}
          </View>

          <View className="items-center mt-4">
            <MonoLabel>
              {unilateral
                ? `${Math.floor(doneCount / SIDES.length)}/${current.block.sets} séries validées · ${doneCount % SIDES.length ? "un côté fait" : "les deux côtés"}`
                : `${doneCount}/${rows.length} séries validées`}
            </MonoLabel>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
