/**
 * Bibliothèque d'exercices en colonnes.
 *
 * L'axe de regroupement se commute : rôle moteur, catégorie musculaire, lieu.
 * Ce n'est pas de la coquetterie — chaque axe répond à une question différente.
 * Le rôle moteur montre ce que le générateur voit ; la catégorie montre la
 * salle ; le lieu montre les trous de couverture (l'extérieur manque
 * d'isolations, et ça se lit d'un coup d'œil).
 *
 * Pas de glisser-déposer : sur un tableau tactile qui défile dans les deux
 * sens, le geste se déclenche par accident et reclasse un exercice sans qu'on
 * s'en aperçoive. On ouvre la fiche et on change le champ — l'intention est
 * explicite.
 */

import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MonoLabel } from "../ui";
import { COLORS } from "../../lib/theme";
import {
  KANBAN_AXES,
  columnsFor,
  kanbanColumns,
  label,
  missingEngineFields,
} from "../../lib/admin";
import type { KanbanAxis } from "../../lib/admin";
import type { Exercise } from "../../lib/types";

const COLUMN_WIDTH = 224;

/** Une carte d'exercice — assez pour reconnaître, pas assez pour noyer. */
function ExerciseCard({
  exercise,
  onPress,
}: {
  exercise: Exercise;
  onPress: () => void;
}) {
  const missing = missingEngineFields(exercise);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${exercise.name}`}
      onPress={onPress}
      className={`rounded-xl border px-3 py-2.5 mb-2 active:opacity-70 ${
        missing.length ? "bg-surface border-accent/50" : "bg-surface border-line"
      }`}
    >
      <Text className="font-body-sb text-[12px] text-ink" numberOfLines={2}>
        {exercise.name}
      </Text>
      <Text className="font-mono text-[9px] text-muted mt-1">
        {exercise.id} · {exercise.level}
      </Text>
      <View className="flex-row flex-wrap gap-1 mt-1.5">
        {exercise.unilateral ? <Tag text="unilatéral" /> : null}
        {exercise.high_impact ? <Tag text="impact" /> : null}
        {exercise.is_regression ? <Tag text="allégé" /> : null}
        {exercise.bodyweight_compatible ? <Tag text="poids du corps" /> : null}
      </View>
      {missing.length ? (
        <Text className="font-mono text-[9px] text-accent mt-1.5">
          ⚠ manque {missing.length === 1 ? missing[0] : `${missing.length} champs`}
        </Text>
      ) : null}
    </Pressable>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <View className="rounded bg-bg border border-line px-1.5 py-0.5">
      <Text className="font-mono text-[8px] text-muted">{text}</Text>
    </View>
  );
}

export function ExerciseKanban({
  library,
  onOpen,
  onCreate,
  canWrite,
}: {
  library: Exercise[];
  onOpen: (exercise: Exercise) => void;
  onCreate: () => void;
  canWrite: boolean;
}) {
  const [axis, setAxis] = useState<KanbanAxis>("role");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return library;
    return library.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        (e.movement_family ?? "").toLowerCase().includes(q) ||
        e.muscles_primary.some((m) => m.toLowerCase().includes(q)),
    );
  }, [library, query]);

  const columns = useMemo(() => {
    const keys = kanbanColumns(axis);
    const buckets = new Map<string, Exercise[]>(keys.map((k) => [k, []]));
    for (const exercise of filtered) {
      for (const key of columnsFor(exercise, axis)) {
        // Une colonne inattendue vaut mieux qu'un exercice escamoté.
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key)!.push(exercise);
      }
    }
    return [...buckets.entries()];
  }, [filtered, axis]);

  const incomplete = filtered.filter((e) => missingEngineFields(e).length).length;
  const axisHint = KANBAN_AXES.find((a) => a.key === axis)!.hint;

  return (
    <View className="flex-1">
      {/* Axe de regroupement */}
      <View className="flex-row gap-1.5 mb-2">
        {KANBAN_AXES.map((a) => (
          <Pressable
            key={a.key}
            accessibilityRole="tab"
            aria-selected={axis === a.key}
            onPress={() => setAxis(a.key)}
            className={`rounded-lg border px-3 py-2 active:opacity-70 ${
              axis === a.key ? "bg-accent border-accent" : "bg-surface border-line"
            }`}
          >
            <Text
              className={`font-mono text-[10px] ${
                axis === a.key ? "text-black" : "text-muted"
              }`}
            >
              {a.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text className="font-body text-[10px] text-muted mb-3">{axisHint}</Text>

      {/* Recherche et création */}
      <View className="flex-row gap-2 mb-3">
        <TextInput
          className="flex-1 bg-bg border border-line rounded-lg px-3 py-2.5 font-body text-[13px] text-ink"
          style={{ minWidth: 0 }}
          placeholder="Chercher un nom, un identifiant, un muscle…"
          placeholderTextColor={COLORS.muted}
          value={query}
          onChangeText={setQuery}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajouter un exercice"
          onPress={onCreate}
          disabled={!canWrite}
          className={`rounded-lg border px-3.5 items-center justify-center ${
            canWrite ? "bg-accent border-accent" : "bg-surface border-line opacity-40"
          }`}
        >
          <Text
            className={`font-mono text-[11px] ${canWrite ? "text-black" : "text-muted"}`}
          >
            + Ajouter
          </Text>
        </Pressable>
      </View>

      <View className="flex-row items-center gap-3 mb-2">
        <Text className="font-mono text-[10px] text-muted">
          {filtered.length} exercice{filtered.length > 1 ? "s" : ""}
        </Text>
        {incomplete ? (
          <Text className="font-mono text-[10px] text-accent">
            · {incomplete} incomplet{incomplete > 1 ? "s" : ""} pour le moteur
          </Text>
        ) : null}
      </View>

      {/* Le tableau. Défilement horizontal pour les colonnes, vertical dans
          chacune : c'est ce qui rend un Kanban lisible sur un téléphone. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View className="flex-row gap-2.5 pb-4">
          {columns.map(([key, items]) => (
            <View key={key} style={{ width: COLUMN_WIDTH }}>
              <View className="flex-row items-baseline justify-between mb-2 px-1">
                <MonoLabel className="text-[9px]">{label(key)}</MonoLabel>
                <Text className="font-mono text-[10px] text-muted">
                  {items.length}
                </Text>
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 460 }}
              >
                {items.length === 0 ? (
                  <View className="rounded-xl border border-dashed border-line px-3 py-4">
                    <Text className="font-body text-[11px] text-muted text-center">
                      Aucun exercice
                    </Text>
                  </View>
                ) : (
                  items.map((exercise) => (
                    <ExerciseCard
                      key={`${key}-${exercise.id}`}
                      exercise={exercise}
                      onPress={() => onOpen(exercise)}
                    />
                  ))
                )}
              </ScrollView>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
