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
 *
 * La FRÉQUENCE n'entre pas ici, et c'est voulu : un programme ne porte plus de
 * rythme. Il porte une nature — une structure, des fourchettes, un arc de
 * phases — et le rythme est celui que le pratiquant a déclaré. Écarter un
 * programme parce qu'il « est écrit pour trois séances » reviendrait à
 * réintroduire la contrainte qu'on vient de retirer.
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

/** Une liste de candidats, du plus pertinent au moins, pour un contexte donné. */
interface Candidates {
  order: string[];
  reason: string;
}

function candidatesFor(input: RoutingInput, equipped: boolean, pressed: boolean): Candidates {
  // ── Efficacité : peu de temps, priorité au cardio ──
  if (input.objective === "efficiency") {
    return {
      order: [PROGRAM_LACTATE, PROGRAM_ATHLETIC, NO_EQUIPMENT_PROGRAM],
      reason:
        "Tu cherches à optimiser ta santé et ton cardio en un minimum de temps : les circuits courts à repos serrés sont ce qui t'en donne le plus.",
    };
  }

  // ── Performance et polyvalence ──
  if (input.objective === "performance" || input.objective === "complete_athlete") {
    if (pressed) {
      return {
        order: [PROGRAM_LACTATE, PROGRAM_ATHLETIC],
        reason:
          "Tu vises la performance, mais tu disposes de moins de 45 minutes : un circuit dense t'en donne la densité sans la durée.",
      };
    }
    return {
      order: equipped
        ? [PROGRAM_ATHLETIC, PROGRAM_MUSCLE, PROGRAM_LACTATE]
        : [PROGRAM_ATHLETIC, NO_EQUIPMENT_PROGRAM, PROGRAM_LACTATE],
      reason:
        "Tu vises l'explosivité et le fonctionnel : complexes et travail explosif sont au cœur du programme.",
    };
  }

  // ── Force pure ──
  if (input.objective === "strength") {
    if (!equipped) {
      return {
        order: [NO_EQUIPMENT_PROGRAM, PROGRAM_STRENGTH],
        reason:
          "Tu veux soulever lourd, mais tu t'entraînes sans charges : on construit la force sur des mouvements lestables — tractions, dips.",
      };
    }
    return {
      order: [PROGRAM_STRENGTH, PROGRAM_MUSCLE, NO_EQUIPMENT_PROGRAM],
      reason:
        "Tu veux devenir fort : séries courtes et lourdes, avec des repos complets.",
    };
  }

  // ── Esthétique, et le repli par défaut ──
  if (!equipped) {
    return {
      order: [NO_EQUIPMENT_PROGRAM, PROGRAM_MUSCLE],
      reason:
        "Tu veux sculpter ton corps sans matériel : le volume se construit au poids du corps.",
    };
  }
  return {
    order: [PROGRAM_MUSCLE, PROGRAM_STRENGTH, NO_EQUIPMENT_PROGRAM],
    reason:
      input.objective === "aesthetics"
        ? "Tu veux prendre du muscle : volume et surcharge progressive."
        : "Sans objectif plus précis, on part sur le point d'entrée le plus polyvalent.",
  };
}

/**
 * Résout le programme.
 *
 * Deux étapes, et la seconde manquait : l'OBJECTIF ordonne les candidats, puis
 * la FRÉQUENCE annoncée écarte ceux qui ne savent pas l'absorber. Sans elle,
 * quelqu'un se déclarant disponible cinq fois par semaine recevait un
 * programme bâti pour trois — et l'écran lui affichait « 3×/sem », en
 * contradiction directe avec ce qu'il venait de répondre.
 *
 * Toujours une réponse : si aucun candidat n'absorbe la fréquence, on garde le
 * premier — l'objectif prime sur le rythme, et le planificateur sait de toute
 * façon étaler ou resserrer le cycle.
 */
export function resolveRouting(input: RoutingInput): Routing {
  const equipped = hasEquipment(input.environments);
  const pressed = input.sessionMinutesMax <= SHORT_SESSION_MINUTES;
  const { order, reason } = candidatesFor(input, equipped, pressed);

  return {
    programId: order[0],
    reason: `${reason} Tu le tiendras à ton rythme : ${input.sessionsPerWeek} séances par semaine, ${input.sessionMinutesMax} minutes par séance.`,
    alternatives: order.slice(1),
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
