/**
 * Choix du programme, à partir des réponses au questionnaire.
 *
 * Le programme se déduisait du PERSONA, via une matrice d'éligibilité. Le
 * persona reste une identité utile — « Brut Force » dit quelque chose que
 * « max_strength » ne dit pas — mais c'était un détour : il naît lui-même d'un
 * score sur les mêmes réponses, et portait en chemin des contraintes
 * (séances par semaine, durée de séance, niveau d'expérience) qui doublonnaient
 * le questionnaire sans jamais être lues par le moteur.
 *
 * Ici les quatre réponses qui décident le font directement, et la décision
 * s'explique en une phrase affichable au pratiquant :
 *
 *   q3 objectif     — ce qu'il vient chercher. C'est le critère premier.
 *   q8 lieu         — sans salle, un programme à la barre est inapplicable.
 *   q5 durée        — quarante-cinq minutes excluent les séances longues.
 *   q6 fréquence    — sert d'arbitrage quand deux programmes conviennent.
 *
 * Le persona garde son rôle d'identité : il est scoré, affiché, et n'a plus
 * aucun pouvoir sur la génération.
 */

import type { Objective, Profile } from "./profile";
import type { Program } from "./types";

/** Programmes praticables sans barre ni charges. */
const NO_EQUIPMENT_PROGRAM = "program_bodyweight";

const PROGRAM_STRENGTH = "program_strength";
const PROGRAM_MUSCLE = "program_muscle_building";
const PROGRAM_ATHLETIC = "program_athletic";
const PROGRAM_LACTATE = "program_lactate";

/**
 * Environnements où l'on dispose de charges. « flexible » compte : le
 * pratiquant a dit pouvoir s'adapter, donc aller en salle.
 */
const LOADED_ENVIRONMENTS = new Set(["gym", "flexible"]);

/** Au-delà de ce créneau, les programmes à repos longs deviennent tenables. */
const SHORT_SESSION_MINUTES = 45;

export interface Routing {
  programId: string;
  /** Pourquoi ce programme — une phrase, affichable telle quelle. */
  reason: string;
  /** Les autres programmes qui conviendraient aussi, par ordre de pertinence. */
  alternatives: string[];
}

export interface RoutingInput {
  objective: Objective | null;
  sessionsPerWeek: number;
  sessionMinutesMax: number;
  /** Réponses à q8 — vide vaut « salle », le cas le plus courant. */
  environments: string[];
}

export function routingInputFromProfile(
  profile: Profile,
  environments: string[],
): RoutingInput {
  return {
    objective: profile.objective,
    sessionsPerWeek: profile.sessionsPerWeek,
    sessionMinutesMax: profile.sessionMinutesMax,
    environments,
  };
}

function hasEquipment(environments: string[]): boolean {
  if (environments.length === 0) return true;
  return environments.some((e) => LOADED_ENVIRONMENTS.has(e));
}

/**
 * Résout le programme. Toujours une réponse : l'absence d'objectif déclaré
 * retombe sur l'hypertrophie, qui est le cas le plus fréquent et le moins
 * spécialisé — pas sur une erreur, qui bloquerait l'onboarding.
 */
export function resolveRouting(input: RoutingInput): Routing {
  const equipped = hasEquipment(input.environments);
  const pressed = input.sessionMinutesMax <= SHORT_SESSION_MINUTES;

  // ── Efficacité : peu de temps, priorité au cardio ──
  if (input.objective === "efficiency") {
    return {
      programId: PROGRAM_LACTATE,
      reason:
        "Tu cherches à optimiser ta santé et ton cardio en un minimum de temps : Lactate Focus travaille en circuits courts, à repos serrés.",
      alternatives: [PROGRAM_ATHLETIC, NO_EQUIPMENT_PROGRAM],
    };
  }

  // ── Performance et polyvalence : circuits et explosivité ──
  if (input.objective === "performance" || input.objective === "complete_athlete") {
    // Un créneau de quarante-cinq minutes s'accommode mieux d'un circuit
    // dense que d'une préparation athlétique complète.
    if (pressed) {
      return {
        programId: PROGRAM_LACTATE,
        reason:
          "Tu vises la performance, mais tu disposes de moins de 45 minutes : Lactate Focus t'en donne la densité sans la durée.",
        alternatives: [PROGRAM_ATHLETIC],
      };
    }
    return {
      programId: PROGRAM_ATHLETIC,
      reason:
        "Tu vises l'explosivité et le fonctionnel : Préparation Athlétique enchaîne complexes et travail explosif.",
      alternatives: [PROGRAM_LACTATE, PROGRAM_MUSCLE],
    };
  }

  // ── Force pure ──
  if (input.objective === "strength") {
    if (!equipped) {
      return {
        programId: NO_EQUIPMENT_PROGRAM,
        reason:
          "Tu veux soulever lourd, mais tu t'entraînes sans charges : Body weight Focus construit la force sur des mouvements lestables — tractions, dips.",
        alternatives: [PROGRAM_STRENGTH],
      };
    }
    return {
      programId: PROGRAM_STRENGTH,
      reason:
        "Tu veux devenir fort : Strength Focus travaille en séries courtes et lourdes, avec des repos complets.",
      alternatives: [PROGRAM_MUSCLE, NO_EQUIPMENT_PROGRAM],
    };
  }

  // ── Esthétique, et le repli par défaut ──
  if (!equipped) {
    return {
      programId: NO_EQUIPMENT_PROGRAM,
      reason:
        "Tu veux sculpter ton corps sans matériel : Body weight Focus fait monter le volume au poids du corps.",
      alternatives: [PROGRAM_MUSCLE],
    };
  }
  return {
    programId: PROGRAM_MUSCLE,
    reason:
      input.objective === "aesthetics"
        ? "Tu veux prendre du muscle : Muscle Building Focus tient le volume et la surcharge progressive."
        : "Sans objectif plus précis, Muscle Building Focus est le point de départ le plus polyvalent.",
    alternatives: [PROGRAM_STRENGTH, NO_EQUIPMENT_PROGRAM],
  };
}

/**
 * Les programmes réellement praticables pour ce profil, le choisi en tête.
 *
 * Sert à l'écran de résultat et au panneau admin : voir ce qui a été écarté
 * vaut mieux que de lire un seul nom sans savoir ce qu'il y avait d'autre.
 */
export function eligiblePrograms(input: RoutingInput, programs: Program[]): Program[] {
  const routing = resolveRouting(input);
  const order = [routing.programId, ...routing.alternatives];
  return order
    .map((id) => programs.find((p) => p.id === id))
    .filter((p): p is Program => Boolean(p));
}
