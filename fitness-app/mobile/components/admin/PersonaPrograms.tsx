/**
 * Programmes, routage, et personae.
 *
 * Lecture seule. Un programme n'est pas une fiche à éditer depuis un écran :
 * ses phases, ses fourchettes et sa structure sont lues par le moteur à chaque
 * séance, et une modification à chaud changerait le cycle de quelqu'un en
 * cours de route.
 *
 * Deux choses à voir ici, et la seconde était fausse jusqu'ici. La table de
 * ROUTAGE dit quelle combinaison de réponses mène à quel programme — elle est
 * dérivée du routeur lui-même, pas recopiée. Et les personae sont présentés
 * pour ce qu'ils sont devenus : des identités, sans effet sur la génération.
 */

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { MonoLabel } from "../ui";
import { PERSONAS, PROGRAMS, PROGRAM_PHASES } from "../../lib/fixtures";
import { cycleWeeks, scalePhases } from "../../lib/plan";
import { resolveRouting } from "../../lib/router";
import type { Objective } from "../../lib/profile";
import { PERSONA_COLORS } from "../../lib/theme";
import type { Program } from "../../lib/types";

/** Fréquences pour lesquelles on montre la durée résultante du cycle. */
const FREQUENCIES = [2, 3, 4, 5];

const OBJECTIVES: { key: Objective; label: string }[] = [
  { key: "aesthetics", label: "Esthétique · hypertrophie" },
  { key: "strength", label: "Force pure" },
  { key: "performance", label: "Performance · explosivité" },
  { key: "complete_athlete", label: "Athlète complet" },
  { key: "efficiency", label: "Efficacité · cardio" },
];

/** Les quatre contextes qui peuvent changer la destination. */
const CONTEXTS = [
  { label: "Salle, ≥ 60 min", environments: ["gym"], minutes: 60 },
  { label: "Salle, ≤ 45 min", environments: ["gym"], minutes: 45 },
  { label: "Sans matériel, ≥ 60 min", environments: ["home"], minutes: 60 },
  { label: "Sans matériel, ≤ 45 min", environments: ["home"], minutes: 45 },
];

const programName = (id: string) => PROGRAMS.find((p) => p.id === id)?.name ?? id;

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
  const [open, setOpen] = useState(false);
  const phases = PROGRAM_PHASES.filter((p) => p.program_id === program.id);

  // Les objectifs qui mènent ici, en salle et sans contrainte de temps.
  const entryPoints = OBJECTIVES.filter(
    ({ key }) =>
      resolveRouting({
        objective: key,
        sessionsPerWeek: 3,
        sessionMinutesMax: 60,
        environments: ["gym"],
      }).programId === program.id,
  );

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
            <Text className="font-display text-ink text-[19px]">{program.name}</Text>
            {program.tagline ? (
              <Text className="font-body text-[11px] text-muted mt-0.5">
                {program.tagline}
              </Text>
            ) : null}
          </View>
          <Text className="font-mono text-[14px] text-muted">{open ? "−" : "+"}</Text>
        </View>
      </Pressable>

      <View className="flex-row flex-wrap gap-1.5 mt-2.5">
        {entryPoints.length ? (
          entryPoints.map((o) => (
            <View key={o.key} className="rounded bg-accent/15 px-2 py-0.5">
              <Text className="font-mono text-[9px] text-accent">{o.label}</Text>
            </View>
          ))
        ) : (
          <View className="rounded bg-line/40 px-2 py-0.5">
            <Text className="font-mono text-[9px] text-muted">
              par redirection uniquement
            </Text>
          </View>
        )}
      </View>

      {open ? (
        <>
          <View className="mt-3">
            <Row label="Identifiant" value={program.id} />
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
              value={range(
                program.session_duration_min,
                program.session_duration_max,
                "min",
              )}
            />
            <Row
              label="Répétitions"
              value={
                program.rep_range_min
                  ? `${program.rep_range_min} à ${program.rep_range_max}`
                  : "—"
              }
            />
            <Row
              label="Bloc de gainage"
              value={program.has_core_block ? "oui" : "non"}
            />
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
        </>
      ) : null}
    </View>
  );
}

/** La table de routage, calculée en direct par le routeur. */
function RoutingTable() {
  return (
    <View className="rounded-2xl border border-line bg-surface/60 px-4 py-4 mb-4">
      <MonoLabel className="text-[9px] mb-1.5" tone="accent">
        Quelles réponses mènent où
      </MonoLabel>
      <Text className="font-body text-[11px] text-muted mb-3 leading-4">
        Calculé en direct par le routeur : cette table ne peut pas décrire un
        comportement que le code n'a plus.
      </Text>

      {OBJECTIVES.map((objective) => (
        <View key={objective.key} className="mb-3">
          <Text className="font-body-sb text-[12px] text-ink mb-1.5">
            {objective.label}
          </Text>
          {CONTEXTS.map((context) => {
            const routing = resolveRouting({
              objective: objective.key,
              sessionsPerWeek: 3,
              sessionMinutesMax: context.minutes,
              environments: context.environments,
            });
            return (
              <View
                key={context.label}
                className="flex-row items-baseline justify-between py-1"
              >
                <Text className="font-mono text-[9px] text-muted flex-1 pr-3">
                  {context.label}
                </Text>
                <Text className="font-body text-[11px] text-ink text-right">
                  {programName(routing.programId)}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function PersonaPrograms() {
  return (
    <View>
      <Text className="font-body text-[12px] text-muted mb-4">
        Le programme se déduit des réponses au questionnaire. La durée affichée
        n'est pas celle de la fiche programme : c'est celle que le planificateur
        produit réellement, fréquence par fréquence.
      </Text>

      <RoutingTable />

      <MonoLabel className="text-[9px] mb-2">Les cinq programmes</MonoLabel>
      {PROGRAMS.map((program) => (
        <ProgramCard key={program.id} program={program} />
      ))}

      {/* Les personae, pour ce qu'ils sont devenus. */}
      <View className="rounded-2xl border border-line bg-surface/60 px-4 py-4 mt-2">
        <MonoLabel className="text-[9px] mb-1.5">Personae</MonoLabel>
        <Text className="font-body text-[11px] text-muted mb-3 leading-4">
          Ils sont toujours calculés à partir du questionnaire et affichés au
          pratiquant — « Brut Force » dit quelque chose que « max_strength » ne
          dit pas. Mais ils ne pilotent plus rien : ni le programme, ni le
          barème de force. Leurs champs « séances par semaine », « durée de
          séance » et « niveau visé » doublonnaient le questionnaire et
          n'étaient lus par aucune ligne du moteur.
        </Text>
        {PERSONAS.map((persona) => {
          const accent = PERSONA_COLORS[persona.code];
          return (
            <View
              key={persona.id}
              className="flex-row items-baseline justify-between py-2 border-b border-line/40"
            >
              <View className="flex-1 pr-3">
                <Text
                  className="font-body-sb text-[12px]"
                  style={accent ? { color: accent } : undefined}
                >
                  {persona.name}
                </Text>
                {persona.tagline ? (
                  <Text className="font-body text-[10px] text-muted mt-0.5">
                    {persona.tagline}
                  </Text>
                ) : null}
              </View>
              <Text className="font-mono text-[9px] text-muted">{persona.code}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
