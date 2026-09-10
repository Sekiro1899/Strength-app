/**
 * Fiche d'exercice — toutes les caractéristiques, y compris celles que seul le
 * moteur lit.
 *
 * Le formulaire est volontairement exigeant. Un exercice enregistré sans
 * `exercise_type` ne tombe dans aucun bloc et ne sera JAMAIS tiré ; sans
 * `movement_family`, il peut se retrouver enchaîné avec son propre équivalent.
 * Ces absences ne provoquent aucune erreur — l'exercice existe en base et
 * n'existe pas pour le générateur. C'est le pire des deux mondes, alors la
 * fiche le dit avant l'enregistrement.
 */

import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Button, MonoLabel } from "../ui";
import { COLORS } from "../../lib/theme";
import {
  CATEGORIES,
  EQUIPMENT_TAGS,
  EXERCISE_TYPES,
  INTENTS,
  LEVELS,
  LOCATIONS,
  MOVEMENT_PATTERNS,
  WARMUP_TARGETS,
  knownMovementFamilies,
  label,
  missingEngineFields,
  suggestId,
} from "../../lib/admin";
import type { Exercise } from "../../lib/types";

/** Fiche vierge — les tableaux vides plutôt que null, pour ne pas les tester. */
function blank(): Exercise {
  return {
    id: "",
    category: "push",
    name: "",
    muscles_primary: [],
    muscles_secondary: [],
    intent: [],
    level: "intermediaire",
    bodyweight_compatible: false,
    material_required: [],
    equipment_tags: [],
    locations: ["gym"],
    warmup_target: [],
    description: null,
    exercise_type: null,
    movement_pattern: null,
    movement_family: null,
    is_regression: false,
    unilateral: false,
    high_impact: false,
    video_url: null,
    image_url: null,
    target_programs: [],
    prescribed_sets: null,
    prescribed_duration_sec: null,
  } as Exercise;
}

/** Champ texte simple. */
function Field({
  label: text,
  value,
  onChange,
  placeholder,
  hint,
  numeric = false,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  numeric?: boolean;
  multiline?: boolean;
}) {
  return (
    <View className="mb-4">
      <MonoLabel className="text-[9px] mb-1.5">{text}</MonoLabel>
      <TextInput
        className="bg-bg border border-line rounded-lg px-3 py-2.5 font-body text-[13px] text-ink"
        style={{ minWidth: 0, minHeight: multiline ? 72 : undefined }}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        keyboardType={numeric ? "numeric" : "default"}
        inputMode={numeric ? "numeric" : "text"}
        multiline={multiline}
        value={value}
        onChangeText={onChange}
      />
      {hint ? (
        <Text className="font-body text-[10px] text-muted mt-1">{hint}</Text>
      ) : null}
    </View>
  );
}

/** Sélection parmi un vocabulaire fermé : une pastille par valeur. */
function Choices({
  label: text,
  options,
  selected,
  onToggle,
  hint,
  required = false,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  hint?: string;
  required?: boolean;
}) {
  const empty = required && selected.length === 0;
  return (
    <View className="mb-4">
      <View className="flex-row items-center gap-2 mb-1.5">
        <MonoLabel className="text-[9px]" tone={empty ? "accent" : undefined}>
          {text}
        </MonoLabel>
        {empty ? (
          <Text className="font-mono text-[9px] text-accent">· requis</Text>
        ) : null}
      </View>
      <View className="flex-row flex-wrap gap-1.5">
        {options.map((option) => {
          const on = selected.includes(option);
          return (
            <Pressable
              key={option}
              accessibilityRole="checkbox"
              aria-checked={on}
              onPress={() => onToggle(option)}
              className={`rounded-lg border px-2.5 py-1.5 active:opacity-70 ${
                on ? "bg-accent border-accent" : "bg-surface border-line"
              }`}
            >
              <Text
                className={`font-mono text-[10px] ${on ? "text-black" : "text-muted"}`}
              >
                {label(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {hint ? (
        <Text className="font-body text-[10px] text-muted mt-1.5">{hint}</Text>
      ) : null}
    </View>
  );
}

/** Interrupteur — les trois drapeaux que seul le moteur lit. */
function Toggle({
  label: text,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint: string;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      aria-checked={value}
      onPress={() => onChange(!value)}
      className={`flex-row items-start gap-3 rounded-xl border px-3 py-3 mb-2 active:opacity-70 ${
        value ? "bg-accent/10 border-accent" : "bg-surface border-line"
      }`}
    >
      <View
        className={`w-[22px] h-[22px] rounded-md items-center justify-center border mt-0.5 ${
          value ? "bg-accent border-accent" : "bg-bg border-line"
        }`}
      >
        <Text className={`text-[12px] ${value ? "text-black" : "text-muted"}`}>
          {value ? "✓" : "○"}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-body-sb text-[13px] text-ink">{text}</Text>
        <Text className="font-body text-[11px] text-muted mt-0.5">{hint}</Text>
      </View>
    </Pressable>
  );
}

/** « pectoraux, triceps » ↔ ["pectoraux", "triceps"] */
const toList = (raw: string) =>
  raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

export function ExerciseForm({
  exercise,
  library,
  canWrite,
  onSave,
  onCancel,
}: {
  /** Null pour une création. */
  exercise: Exercise | null;
  library: Exercise[];
  canWrite: boolean;
  onSave: (exercise: Exercise) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Exercise>(exercise ?? blank());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNew = exercise === null;

  const families = useMemo(knownMovementFamilies, []);
  const missing = missingEngineFields(draft);

  function patch(fields: Partial<Exercise>) {
    setDraft((d) => ({ ...d, ...fields }));
  }

  function toggle<K extends keyof Exercise>(key: K, value: string) {
    const current = (draft[key] as unknown as string[]) ?? [];
    patch({
      [key]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    } as unknown as Partial<Exercise>);
  }

  async function save() {
    if (!draft.id.trim() || !draft.name.trim()) {
      setError("Un identifiant et un nom sont nécessaires.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-row items-center justify-between mb-4">
        <Text className="font-display text-ink text-[20px] flex-1 pr-3">
          {isNew ? "Nouvel exercice" : draft.name || draft.id}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onCancel}
          className="w-8 h-8 rounded-[10px] bg-surface border border-line items-center justify-center"
        >
          <Text className="text-ink text-[15px]">✕</Text>
        </Pressable>
      </View>

      {/* Ce que le moteur exige, dit avant l'enregistrement plutôt qu'après. */}
      {missing.length ? (
        <View className="rounded-xl border border-accent bg-accent/10 px-3.5 py-3 mb-4">
          <Text className="font-mono text-[9px] uppercase tracking-label text-accent">
            Invisible pour le générateur
          </Text>
          <Text className="font-body text-[12px] text-ink mt-1.5">
            Il manque {missing.join(", ")}. L'exercice sera bien enregistré,
            mais le moteur ne le tirera pas : rien ne plantera, il n'existera
            simplement pas pour lui.
          </Text>
        </View>
      ) : null}

      {error ? (
        <Text className="font-body text-[12px] text-danger mb-3">{error}</Text>
      ) : null}

      {/* ── Identité ── */}
      <MonoLabel tone="accent" className="mb-2">
        Identité
      </MonoLabel>
      <Field
        label="Identifiant"
        value={draft.id}
        onChange={(id) => patch({ id })}
        placeholder="PUS-135"
        hint={
          isNew
            ? `Suggestion pour cette catégorie : ${suggestId(draft.category, library)}`
            : "Clé primaire — la modifier crée un second exercice."
        }
      />
      <Field
        label="Nom"
        value={draft.name}
        onChange={(name) => patch({ name })}
        placeholder="Incline Dumbbell Press"
      />
      <Field
        label="Description"
        value={draft.description ?? ""}
        onChange={(description) => patch({ description: description || null })}
        placeholder="Exécution, points de vigilance."
        multiline
      />

      {/* ── Classement ── */}
      <MonoLabel tone="accent" className="mb-2">
        Classement
      </MonoLabel>
      <Choices
        label="Catégorie"
        options={CATEGORIES}
        selected={[draft.category]}
        onToggle={(category) => patch({ category: category as Exercise["category"] })}
      />
      <Choices
        label="Rôle moteur"
        options={EXERCISE_TYPES}
        selected={draft.exercise_type ? [draft.exercise_type] : []}
        required
        onToggle={(t) =>
          patch({
            exercise_type: (draft.exercise_type === t
              ? null
              : t) as Exercise["exercise_type"],
          })
        }
        hint="Prime sur la catégorie : c'est lui qui décide du bloc où l'exercice tombe."
      />
      <Choices
        label="Niveau"
        options={LEVELS}
        selected={[draft.level]}
        onToggle={(level) => patch({ level: level as Exercise["level"] })}
        hint="Plafond : un exercice « avancé » n'est jamais proposé à un débutant."
      />
      <Choices
        label="Famille de mouvement"
        options={families}
        selected={draft.movement_family ? [draft.movement_family] : []}
        required
        onToggle={(f) =>
          patch({ movement_family: draft.movement_family === f ? null : f })
        }
        hint="Deux exercices de la même famille ne sont jamais servis dans la même séance. Réutilise une famille existante quand c'est possible."
      />
      <Field
        label="Autre famille"
        value={
          draft.movement_family && !families.includes(draft.movement_family)
            ? draft.movement_family
            : ""
        }
        onChange={(v) => patch({ movement_family: v || null })}
        placeholder="nouvelle famille"
        hint="À n'utiliser que si aucune famille ci-dessus ne convient."
      />
      <Choices
        label="Patron de mouvement (gainage)"
        options={MOVEMENT_PATTERNS}
        selected={draft.movement_pattern ? [draft.movement_pattern] : []}
        onToggle={(p) =>
          patch({
            movement_pattern: (draft.movement_pattern === p
              ? null
              : p) as Exercise["movement_pattern"],
          })
        }
        hint="Exercices de core uniquement — diversifie le bloc de gainage."
      />

      {/* ── Muscles et intention ── */}
      <MonoLabel tone="accent" className="mb-2">
        Muscles et intention
      </MonoLabel>
      <Field
        label="Muscles principaux"
        value={draft.muscles_primary.join(", ")}
        onChange={(v) => patch({ muscles_primary: toList(v) })}
        placeholder="pectoraux, triceps"
        hint="Séparés par des virgules."
      />
      <Field
        label="Muscles secondaires"
        value={draft.muscles_secondary.join(", ")}
        onChange={(v) => patch({ muscles_secondary: toList(v) })}
        placeholder="deltoïdes antérieurs"
      />
      <Choices
        label="Intention"
        options={INTENTS}
        selected={draft.intent}
        onToggle={(v) => toggle("intent", v)}
      />

      {/* ── Praticabilité ── */}
      <MonoLabel tone="accent" className="mb-2">
        Praticabilité
      </MonoLabel>
      <Choices
        label="Lieux"
        options={LOCATIONS}
        selected={draft.locations}
        required
        onToggle={(v) => toggle("locations", v)}
        hint="Sans lieu, l'exercice n'est praticable nulle part et n'est jamais tiré."
      />
      <Choices
        label="Matériel"
        options={EQUIPMENT_TAGS}
        selected={draft.equipment_tags}
        onToggle={(v) => toggle("equipment_tags", v)}
        hint="Vocabulaire fermé — c'est lui qui est confronté au matériel déclaré."
      />
      <Field
        label="Matériel détaillé"
        value={(draft.material_required ?? []).join(", ")}
        onChange={(v) => patch({ material_required: toList(v) })}
        placeholder="banc inclinable, haltères"
        hint="Texte libre, affiché au pratiquant."
      />
      <Choices
        label="Cible d'échauffement"
        options={WARMUP_TARGETS}
        selected={draft.warmup_target ?? []}
        onToggle={(v) => toggle("warmup_target", v)}
        hint="Exercices d'échauffement uniquement : quel mouvement ils préparent."
      />

      {/* ── Drapeaux moteur ── */}
      <MonoLabel tone="accent" className="mb-2">
        Ce que seul le moteur lit
      </MonoLabel>
      <Toggle
        label="Au poids de corps"
        value={draft.bodyweight_compatible}
        onChange={(bodyweight_compatible) => patch({ bodyweight_compatible })}
        hint="Praticable sans charge externe. Décide aussi de la part du poids de corps comptée dans le tonnage."
      />
      <Toggle
        label="Unilatéral"
        value={draft.unilateral}
        onChange={(unilateral) => patch({ unilateral })}
        hint="Un côté à la fois : l'écran de suivi dédouble chaque série et ne lance le repos qu'après la paire."
      />
      <Toggle
        label="Traumatique pour les articulations"
        value={draft.high_impact}
        onChange={(high_impact) => patch({ high_impact })}
        hint="Saut, réception au sol, barre rattrapée en mouvement. Écarté après 60 ans, et pour un débutant de plus de 45 ans."
      />
      <Toggle
        label="Variante allégée"
        value={draft.is_regression}
        onChange={(is_regression) => patch({ is_regression })}
        hint="Réservée au bloc principal des débutants et des plus de 60 ans : pour les autres, elle ne charge pas assez."
      />

      {/* ── Prescription imposée ── */}
      <View className="mt-4">
        <MonoLabel tone="accent" className="mb-2">
          Prescription imposée
        </MonoLabel>
        <Text className="font-body text-[11px] text-muted mb-3">
          À ne renseigner que si le format de l'exercice prime sur celui du
          programme : AMRAP, EMOM, circuit à tours fixes. Vide = prescription
          standard.
        </Text>
        <Field
          label="Séries imposées"
          value={draft.prescribed_sets ? String(draft.prescribed_sets) : ""}
          onChange={(v) => patch({ prescribed_sets: v ? Number(v) : null })}
          numeric
        />
        <Field
          label="Durée imposée (secondes)"
          value={
            draft.prescribed_duration_sec ? String(draft.prescribed_duration_sec) : ""
          }
          onChange={(v) => patch({ prescribed_duration_sec: v ? Number(v) : null })}
          numeric
        />
      </View>

      {/* ── Médias ── */}
      <MonoLabel tone="accent" className="mb-2">
        Démonstration
      </MonoLabel>
      <Field
        label="Vidéo"
        value={draft.video_url ?? ""}
        onChange={(v) => patch({ video_url: v || null })}
        placeholder="https://www.youtube.com/watch?v=…"
        hint="Vide : l'app propose une recherche par nom."
      />
      <Field
        label="Image"
        value={draft.image_url ?? ""}
        onChange={(v) => patch({ image_url: v || null })}
      />

      <View className="gap-2.5 mt-2">
        <Button
          label={canWrite ? "Enregistrer" : "Écriture indisponible"}
          onPress={save}
          loading={saving}
          disabled={!canWrite}
        />
        <Button label="Annuler" variant="ghost" onPress={onCancel} />
      </View>
    </ScrollView>
  );
}
