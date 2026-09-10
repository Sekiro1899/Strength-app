/**
 * Personae et programmes affiliés.
 *
 * Lecture seule, y compris quand l'écriture est ouverte ailleurs. Un persona
 * n'est pas une fiche de données mais le résultat d'un scoring de
 * questionnaire : le modifier depuis un écran, sans toucher aux questions qui
 * y mènent, produirait un persona que personne ne peut plus obtenir.
 *
 * Ce que la vue montre, en revanche, c'est le chaînage complet — persona →
 * programmes éligibles par rang → durée réelle du cycle selon la fréquence.
 * C'est là que se lisent les incohérences.
 */

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { MonoLabel } from "../ui";
import {
  PERSONAS,
  PERSONA_PROGRAM_ELIGIBILITY,
  PROGRAMS,
  PROGRAM_PHASES,
} from "../../lib/fixtures";
import { cycleWeeks, scalePhases } from "../../lib/plan";
import { PERSONA_COLORS } from "../../lib/theme";
import type { Persona, Program } from "../../lib/types";

/** Fréquences pour lesquelles on montre la durée résultante du cycle. */
const FREQUENCIES = [2, 3, 4, 5];

const RANK_LABELS: Record<string, string> = {
  primary: "Principal",
  secondary: "Secondaire",
  tertiary: "Tertiaire",
  eligible: "Éligible",
  excluded: "Écarté",
};

/** « 45 à 60 min », mais « 60 min » quand les deux bornes se rejoignent. */
function range(min: number, max: number, unit = ""): string {
  return (min === max ? `${min} ${unit}` : `${min} à ${max} ${unit}`).trim();
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline justify-between py-2 border-b border-line/50">
      <Text className="font-mono text-[9px] uppercase tracking-label text-muted">
        {label}
      </Text>
      <Text className="font-body-sb text-[12px] text-ink text-right flex-1 ml-4">
        {value}
      </Text>
    </View>
  );
}

/** Le tableau qui manquait : combien de semaines, à quelle fréquence. */
function CycleTable({ program }: { program: Program }) {
  return (
    <View className="mt-3">
      <MonoLabel className="text-[9px] mb-1.5">Durée réelle du cycle</MonoLabel>
      <View className="flex-row gap-1.5">
        {FREQUENCIES.map((frequency) => {
          const weeks = cycleWeeks(program, frequency);
          const phases = PROGRAM_PHASES.filter((p) => p.program_id === program.id);
          const scaled = scalePhases(phases, program.duration_weeks ?? weeks, weeks);
          return (
            <View
              key={frequency}
              className="flex-1 rounded-lg border border-line bg-bg px-2 py-2 items-center"
            >
              <Text className="font-mono text-[9px] text-muted">{frequency}/sem</Text>
              <Text className="font-display text-ink text-[18px] mt-0.5">{weeks}</Text>
              <Text className="font-mono text-[8px] text-muted">semaines</Text>
              <Text className="font-mono text-[8px] text-muted mt-0.5">
                {scaled.length} phase{scaled.length > 1 ? "s" : ""}
              </Text>
            </View>
          );
        })}
      </View>
      <Text className="font-body text-[10px] text-muted mt-1.5">
        {program.session_structure === "circuit"
          ? "Structure en circuit : la durée suit directement la fréquence."
          : "Structure en split : le nombre total de séances reste constant, la durée s'ajuste."}
      </Text>
    </View>
  );
}

function ProgramCard({ program }: { program: Program }) {
  const phases = PROGRAM_PHASES.filter((p) => p.program_id === program.id);
  return (
    <View className="rounded-xl border border-line bg-surface px-3.5 py-3 mb-2">
      <Text className="font-body-sb text-[13px] text-ink">{program.name}</Text>
      {program.tagline ? (
        <Text className="font-body text-[11px] text-muted mt-0.5">
          {program.tagline}
        </Text>
      ) : null}
      <View className="mt-2">
        <Row label="Objectif" value={program.objective} />
        <Row label="Structure" value={program.session_structure} />
        <Row
          label="Durée de référence"
          value={`${program.duration_weeks ?? "—"} semaines`}
        />
        <Row
          label="Fréquence"
          value={range(
            program.frequency_per_week_min,
            program.frequency_per_week_max,
            "par semaine",
          )}
        />
        <Row
          label="Séance"
          value={range(program.session_duration_min, program.session_duration_max, "min")}
        />
        <Row
          label="Répétitions"
          value={
            program.rep_range_min
              ? `${program.rep_range_min} à ${program.rep_range_max}`
              : "—"
          }
        />
        <Row label="Bloc de gainage" value={program.has_core_block ? "oui" : "non"} />
      </View>

      <CycleTable program={program} />

      {phases.length ? (
        <View className="mt-3">
          <MonoLabel className="text-[9px] mb-1.5">Phases</MonoLabel>
          {phases.map((phase) => (
            <View key={phase.id} className="flex-row items-baseline gap-2 py-1">
              <Text className="font-mono text-[9px] text-accent w-4">
                {phase.phase_number}
              </Text>
              <Text className="font-body text-[11px] text-ink flex-1">
                {phase.name}
                <Text className="text-muted"> · {phase.duration_weeks} sem.</Text>
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function PersonaBlock({ persona }: { persona: Persona }) {
  const [open, setOpen] = useState(false);
  const accent = PERSONA_COLORS[persona.code];
  const eligibility = PERSONA_PROGRAM_ELIGIBILITY.filter(
    (e) => e.persona_id === persona.id,
  ).sort((a, b) => (a.rank_order ?? 99) - (b.rank_order ?? 99));

  return (
    <View className="rounded-2xl border border-line bg-surface/60 px-4 py-4 mb-3">
      <Pressable
        accessibilityRole="button"
        aria-expanded={open}
        onPress={() => setOpen((v) => !v)}
        className="active:opacity-70"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text
              className="font-display text-[20px]"
              style={accent ? { color: accent } : undefined}
            >
              {persona.name}
            </Text>
            {persona.tagline ? (
              <Text className="font-body text-[11px] text-muted mt-0.5">
                {persona.tagline}
              </Text>
            ) : null}
          </View>
          <Text className="font-mono text-[14px] text-muted">{open ? "−" : "+"}</Text>
        </View>
      </Pressable>

      <View className="mt-2">
        <Row label="Identifiant" value={persona.id} />
        <Row label="Objectif" value={persona.objective_label ?? persona.objective} />
        <Row label="Niveau visé" value={persona.experience_level ?? "—"} />
        <Row
          label="Séances/semaine"
          value={
            persona.sessions_per_week_min !== null && persona.sessions_per_week_max !== null
              ? range(persona.sessions_per_week_min, persona.sessions_per_week_max, "")
              : "—"
          }
        />
        <Row
          label="Durée de séance"
          value={
            persona.session_duration_min_min !== null &&
            persona.session_duration_min_max !== null
              ? range(persona.session_duration_min_min, persona.session_duration_min_max, "min")
              : "—"
          }
        />
        <Row label="Programmes éligibles" value={String(eligibility.length)} />
      </View>

      {open ? (
        <View className="mt-3">
          {eligibility.map((row) => {
            const program = PROGRAMS.find((p) => p.id === row.program_id);
            if (!program) return null;
            return (
              <View key={row.id}>
                <View className="flex-row items-center gap-2 mt-3 mb-1.5">
                  <View className="rounded bg-accent/15 px-2 py-0.5">
                    <Text className="font-mono text-[9px] text-accent">
                      {RANK_LABELS[row.eligibility_rank] ?? row.eligibility_rank}
                    </Text>
                  </View>
                  {row.rationale ? (
                    <Text className="font-body text-[10px] text-muted flex-1">
                      {row.rationale}
                    </Text>
                  ) : null}
                </View>
                <ProgramCard program={program} />
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export function PersonaPrograms() {
  return (
    <View>
      <Text className="font-body text-[12px] text-muted mb-4">
        Cinq personae, et les programmes auxquels chacun donne accès. La durée
        affichée n'est pas celle de la fiche programme : c'est celle que le
        planificateur produit réellement, fréquence par fréquence.
      </Text>
      {PERSONAS.map((persona) => (
        <PersonaBlock key={persona.id} persona={persona} />
      ))}
    </View>
  );
}
