/**
 * Déclaration du poids de corps.
 *
 * Vit dans un composant et pas dans un écran parce qu'il se présente à deux
 * endroits : dans le profil, comme une donnée parmi d'autres, et en tête de
 * « Mes entraînements » tant qu'il manque — là, aucune métrique n'a de sens
 * sans lui. Une traction, un dip, une pompe ne portent aucune charge saisie :
 * sans le poids du pratiquant, une séance de tirage pèse zéro kilo.
 */

import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Button, GlassCard, MonoLabel } from "./ui";
import { COLORS } from "../lib/theme";

/** Bornes de saisie. Au-delà, c'est une faute de frappe, pas un pratiquant. */
const MIN_KG = 30;
const MAX_KG = 250;

export function BodyWeightCard({
  value,
  onSave,
  /** Mise en avant quand la donnée manque et qu'un écran en dépend. */
  emphasis = false,
}: {
  value: number | null;
  onSave: (kg: number | null) => Promise<void> | void;
  emphasis?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value !== null ? String(value) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const kg = Number(draft.replace(",", "."));
    if (!draft.trim() || Number.isNaN(kg) || kg < MIN_KG || kg > MAX_KG) {
      setError(`Un poids entre ${MIN_KG} et ${MAX_KG} kg.`);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(Math.round(kg * 10) / 10);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <GlassCard className={emphasis ? "mb-3 border border-accent" : "mb-3"}>
        <MonoLabel className="text-[9px]" tone={emphasis ? "accent" : undefined}>
          Poids de corps
        </MonoLabel>
        {value !== null ? (
          <View className="flex-row items-baseline justify-between mt-2">
            <Text className="font-display text-ink text-[26px]">
              {String(value).replace(".", ",")}
              <Text className="font-body text-[13px] text-muted"> kg</Text>
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setDraft(String(value));
                setEditing(true);
              }}
              className="active:opacity-60"
            >
              <Text className="font-mono text-[10px] uppercase tracking-label text-accent">
                Modifier
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text className="font-body text-[12px] text-muted mt-2">
              Sans lui, une séance de tractions et de dips pèse zéro kilo : la
              charge saisie ne compte que le lest. C'est la seule donnée qui
              rende le tonnage et les calories honnêtes.
            </Text>
            <View className="mt-3">
              <Button label="Renseigner mon poids" onPress={() => setEditing(true)} />
            </View>
          </>
        )}
      </GlassCard>
    );
  }

  return (
    <GlassCard className="mb-3">
      <MonoLabel className="text-[9px]">Poids de corps</MonoLabel>
      <View className="flex-row items-center gap-2.5 mt-2">
        <TextInput
          className="flex-1 bg-bg border border-line rounded-lg px-3 py-2.5 font-mono text-[15px] text-ink text-center"
          style={{ minWidth: 0 }}
          placeholder="kg"
          placeholderTextColor={COLORS.muted}
          keyboardType="numeric"
          inputMode="decimal"
          autoFocus
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={save}
        />
        <View className="w-[110px]">
          <Button label="Enregistrer" onPress={save} loading={saving} />
        </View>
      </View>
      {error ? (
        <Text className="font-body text-[11px] text-danger mt-2">{error}</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setEditing(false);
          setError(null);
        }}
        className="mt-2 active:opacity-60"
      >
        <Text className="font-mono text-[10px] uppercase tracking-label text-muted">
          Annuler
        </Text>
      </Pressable>
    </GlassCard>
  );
}
