/**
 * Référentiel des règles de gestion.
 *
 * Toutes les VALEURS affichées ici sont lues dans les constantes réelles du
 * moteur (`ENGINE_TUNING`, `PLAN_TUNING`, `PROFILE_TUNING`, `METRICS_TUNING`).
 * C'est le point entier de ce module : une page de documentation recopiée à la
 * main devient fausse au premier réglage suivant, et une documentation fausse
 * est pire que pas de documentation — on la croit.
 *
 * Le texte, lui, est écrit : il explique POURQUOI la valeur est ce qu'elle est.
 * Un nombre sans sa raison ne se relit pas.
 */

import { ENGINE_TUNING } from "./engine";
import { METRICS_TUNING } from "./metrics";
import { PLAN_TUNING } from "./plan";
import { PROFILE_TUNING } from "./profile";
import { LEARNING_LOAD_PCT, LEARNING_WEEKS, TEXTBOOK_PROGRAMS } from "./textbook";
import { SCALING } from "./scaling";

export interface RuleValue {
  label: string;
  value: string;
}

export interface Rule {
  title: string;
  /** Pourquoi la règle existe. Une à trois phrases. */
  text: string;
  /** Les valeurs en vigueur, lues dans le code. */
  values?: RuleValue[];
  /** Où la règle est appliquée — pour aller la lire. */
  source: string;
}

export interface RuleSection {
  key: string;
  title: string;
  intro: string;
  rules: Rule[];
}

const s = (n: number) => `${n} s`;
const min = (n: number) => `${n} min`;

export const RULE_SECTIONS: RuleSection[] = [
  {
    key: "temps",
    title: "Temps disponible",
    intro:
      "Le créneau annoncé avant la séance est une contrainte, pas une préférence. Il prime sur le niveau d'énergie : se sentir en forme n'allonge pas la journée.",
    rules: [
      {
        title: "Le temps prime sur l'énergie",
        text: "Un pratiquant en forme mais pressé ne reçoit pas d'exercices supplémentaires. Le créneau plafonne le volume avant que l'énergie ne l'augmente.",
        values: [
          {
            label: "Je suis pressé",
            value: `${min(ENGINE_TUNING.budgetMinutes.short)} au maximum`,
          },
          {
            label: "J'ai le temps",
            value: `${min(ENGINE_TUNING.budgetMinutes.standard)} au maximum`,
          },
        ],
        source: "engine.applyTimeBudget · engine.sessionBudgetMinutes",
      },
      {
        title: "La séance est rabotée jusqu'à tenir",
        text: "Une séance assemblée qui dépasse le créneau est réduite dans cet ordre : finisher, gainage, isolations, échauffement, séries en trop, puis exercices. Un plancher protège l'essentiel — la séance n'est jamais vidée de son bloc principal.",
        values: [
          { label: "Compounds conservés au minimum", value: String(ENGINE_TUNING.minCompounds) },
          { label: "Exercices d'échauffement au minimum", value: String(ENGINE_TUNING.minWarmup) },
          {
            label: "Séries plancher sous contrainte",
            value: String(ENGINE_TUNING.minSetsUnderPressure),
          },
        ],
        source: "engine.fitSessionToBudget",
      },
      {
        title: "Le créneau du jour ne dépasse pas celui du cycle",
        text: "Répondre « j'ai le temps » un matin ne peut pas dépasser ce que le pratiquant a déclaré à l'onboarding pouvoir consacrer à une séance.",
        values: Object.entries(PROFILE_TUNING.sessionMinutes).map(([key, value]) => ({
          label: key,
          value: min(value),
        })),
        source: "profile.sessionMinutesMax · engine.sessionBudgetMinutes",
      },
    ],
  },
  {
    key: "repos",
    title: "Repos et séries",
    intro:
      "Le temps de repos n'est pas un réglage de confort : c'est lui qui décide de la filière travaillée. Quatre séries de dix tractions à soixante secondes ne sont pas un travail de force.",
    rules: [
      {
        title: "Plancher de repos sur les compounds",
        text: "Sur les gros mouvements polyarticulaires, le repos part de deux minutes. Il ne descend à quatre-vingt-dix secondes que faute de temps — et dans ce cas on retire une série plutôt que de raccourcir davantage.",
        values: [
          { label: "Compound, créneau normal", value: s(ENGINE_TUNING.restCompound) },
          { label: "Compound, pressé", value: s(ENGINE_TUNING.restCompoundShort) },
          { label: "Séries de compound quand pressé", value: String(ENGINE_TUNING.setsCompoundShort) },
          { label: "Isolation", value: s(ENGINE_TUNING.restIsolation) },
          { label: "Isolation, pressé", value: s(ENGINE_TUNING.restIsolationShort) },
          { label: "Gainage", value: s(ENGINE_TUNING.restCore) },
        ],
        source: "engine.buildMain",
      },
      {
        title: "Unilatéral : pas de repos entre les côtés",
        text: "Le côté qui attend récupère pendant que l'autre travaille. La pause se prend après la paire, jamais entre les deux — et sur une isolation unilatérale, pas du tout.",
        values: [
          {
            label: "Compound unilatéral, après la paire",
            value: s(ENGINE_TUNING.restUnilateralCompound),
          },
          {
            label: "Isolation unilatérale",
            value: ENGINE_TUNING.restUnilateralIsolation === 0
              ? "aucun"
              : s(ENGINE_TUNING.restUnilateralIsolation),
          },
        ],
        source: "engine.unilateralRest · app/tracking",
      },
      {
        title: "Plafond de séries",
        text: "Les ajustements de volume s'additionnaient et produisaient des blocs de six séries : quarante minutes de compounds à eux seuls. Le total est plafonné.",
        values: [
          { label: "Compound", value: `${ENGINE_TUNING.maxSetsCompound} séries` },
          { label: "Isolation", value: `${ENGINE_TUNING.maxSetsIsolation} séries` },
        ],
        source: "engine.fitToPool · engine.compensate",
      },
      {
        title: "Les répétitions se prescrivent en fourchette",
        text: "« 8-10 » ou « 10-12 » se lit et s'exécute ; un « 11 » sec n'est qu'une moyenne calculée. La fenêtre tourne d'une séance à l'autre pour varier le stimulus.",
        source: "engine.repWindow",
      },
    ],
  },
  {
    key: "force",
    title: "Travail de force",
    intro:
      "Le tirage sait proposer autre chose que des séries de dix. Deux niveaux : un barème de force sur un seul mouvement, ou un programme classique servi tel quel.",
    rules: [
      {
        title: "Barème de force sur un compound",
        text: "Une séance sur trois, le premier compound éligible passe sous un barème de force — le reste de la séance garde le tempo normal. Réservé aux intermédiaires et avancés : un débutant n'a pas la technique pour charger à ce niveau.",
        values: ENGINE_TUNING.strengthProtocols.map((p) => ({
          label: p.label,
          value: `${p.sets}×${p.reps} · +${p.loadDelta} pts de charge · ${s(p.rest_sec)}`,
        })),
        source: "engine.strengthPlan · engine.applyStrength",
      },
      {
        title: "Fréquence du barème de force",
        text: "Assez rare pour rester un temps fort, assez régulier pour progresser.",
        values: [
          { label: "Une séance sur", value: String(ENGINE_TUNING.strengthEvery) },
          { label: "Personas concernés", value: ENGINE_TUNING.strengthPersonas.join(", ") },
          { label: "Objectifs concernés", value: ENGINE_TUNING.strengthObjectives.join(", ") },
        ],
        source: "engine.strengthPlan",
      },
      {
        title: "Programmes classiques servis intégralement",
        text: "Starting Strength et StrongLifts sont des séances écrites : leur intérêt tient à ce qu'elles ne varient pas. Elles sont récitées, pas générées — et si le mouvement principal n'est pas praticable au lieu déclaré, le programme entier est écarté plutôt qu'amputé.",
        values: TEXTBOOK_PROGRAMS.map((p) => ({
          label: p.name,
          value: p.days.map((d) => d.label).join(" / "),
        })),
        source: "textbook.TEXTBOOK_PROGRAMS · engine.buildTextbookMain",
      },
      {
        title: "À qui ils sont proposés",
        text: "Aux profils orientés musculation qui ont répondu que transpirer n'était pas leur sujet. Plus souvent aux jeunes et aux débutants, à qui ces programmes rendent le plus service. Chez eux, le finisher saute.",
        values: [
          { label: "Probabilité de base", value: `${Math.round(ENGINE_TUNING.textbookOdds * 100)} %` },
          {
            label: "Jeune ou débutant",
            value: `${Math.round(ENGINE_TUNING.textbookOddsYoungOrNovice * 100)} %`,
          },
        ],
        source: "engine.textbookOdds · profile.strengthOriented",
      },
      {
        title: "Semaines d'apprentissage pour les débutants",
        text: "Les premières semaines servent à apprendre les mouvements, pas à charger la barre. La consigne est explicite dans la séance.",
        values: [
          { label: "Durée", value: `${LEARNING_WEEKS} semaines` },
          { label: "Charge", value: `${LEARNING_LOAD_PCT} % du 1RM` },
        ],
        source: "textbook.LEARNING_WEEKS",
      },
    ],
  },
  {
    key: "profil",
    title: "Âge, niveau, fréquence",
    intro:
      "Deux contraintes distinctes, souvent confondues : ce que les articulations encaissent (les sauts) et ce que la récupération encaisse (la répétition).",
    rules: [
      {
        title: "Allègement à haute fréquence",
        text: "À cinq séances par semaine, chacune doit peser moins qu'à trois : c'est la charge hebdomadaire cumulée qui décide de la récupération, pas celle d'une séance.",
        values: [
          {
            label: "Seuil standard",
            value: `${ENGINE_TUNING.highFrequencyThreshold} séances/semaine → −1 série`,
          },
        ],
        source: "engine.applyFrequency",
      },
      {
        title: "Entrée en charge ménagée",
        text: "Débutant, ou 45 ans et plus. On ne leur refuse pas quatre à cinq séances par semaine s'ils insistent — la motivation vaut mieux que trois séances non faites — mais chacune pèse moins.",
        values: [
          {
            label: "Seuil abaissé à",
            value: `${ENGINE_TUNING.gentleFrequencyThreshold} séances/semaine`,
          },
          { label: "Charge", value: `${ENGINE_TUNING.gentleLoadDelta} points` },
          { label: "Tranches concernées", value: PROFILE_TUNING.seniorBands.join(", ") },
        ],
        source: "profile.needsGentleProgression · engine.applyFrequency",
      },
      {
        title: "Exercices traumatiques écartés",
        text: "Après 60 ans, et pour un débutant ou une reprise après 45 ans, les sauts et réceptions au sol sont écartés au profit de variantes moins traumatisantes pour les articulations. Il leur manque les mois de pratique qui préparent les tendons, pas la volonté.",
        source: "profile.avoidsImpact · engine.selectExercises (high_impact)",
      },
      {
        title: "Variantes allégées",
        text: "Air squat, pompes sur genoux, bench dips ont leur place dans le bloc principal d'un débutant ou d'un pratiquant de plus de 60 ans : elles enseignent le mouvement. Pour les autres elles ne chargent pas assez, et restent à l'échauffement.",
        source: "profile.allowRegressions · exercises.is_regression",
      },
      {
        title: "Progression indiquée sur les mouvements au poids de corps",
        text: "Sur les tractions, chin-ups et dips, la prescription seule ne suffit pas : la séance indique comment monter (lest) et comment descendre (élastique, variante assistée), avec une démonstration.",
        values: Object.keys(SCALING).map((id) => ({ label: id, value: "indication affichée" })),
        source: "scaling.SCALING · components/ScalingNote",
      },
    ],
  },
  {
    key: "cycle",
    title: "Durée du cycle",
    intro:
      "Un programme n'a pas une durée fixe : il a un VOLUME. La durée en découle selon la disponibilité déclarée. Une séance par semaine n'est plus planifiable.",
    rules: [
      {
        title: "Programmes cardio et circuits",
        text: "Repos courts, sollicitation métabolique : le cycle est plus court et suit directement la fréquence.",
        values: Object.entries(PLAN_TUNING.circuitWeeksByFrequency).map(([freq, weeks]) => ({
          label: `${freq} séances/semaine`,
          value: `${weeks} semaines`,
        })),
        source: "plan.cycleWeeks",
      },
      {
        title: "Programmes en split",
        text: "Le nombre total de séances du cycle est constant ; c'est la durée qui s'étire ou se resserre pour le contenir.",
        values: [
          {
            label: "Référence",
            value: `durée d'origine × ${PLAN_TUNING.referenceSessionsPerWeek} séances/semaine`,
          },
          { label: "Plancher", value: `${PLAN_TUNING.minCycleWeeks} semaines` },
          { label: "Plafond", value: `${PLAN_TUNING.maxCycleWeeks} semaines` },
          {
            label: "Fréquence minimale",
            value: `${PLAN_TUNING.minSessionsPerWeek} séances/semaine`,
          },
        ],
        source: "plan.cycleWeeks",
      },
      {
        title: "Aucune phase n'est amputée",
        text: "Raccourcir un cycle comprimait les dernières phases hors du calendrier : le deload et les semaines de pic n'étaient jamais atteints. Les durées de phase sont désormais redistribuées au prorata, une semaine minimum chacune.",
        source: "plan.scalePhases",
      },
    ],
  },
  {
    key: "metriques",
    title: "Métriques",
    intro:
      "Ce qui est mesuré et ce qui est estimé, séparément. Un chiffre affiché sans sa méthode devient une promesse.",
    rules: [
      {
        title: "Poids soulevé",
        text: "Répétitions × (charge saisie + part du poids de corps que le mouvement déplace). La question n'est pas si l'exercice PEUT se faire sans charge, mais si la masse du pratiquant monte : un goblet squat demande un haltère et lève quand même le corps entier. La charge saisie reste toujours la charge externe — sur une traction, le champ « kg » reçoit le lest, jamais le pratiquant.",
        values: [
          ...Object.entries(METRICS_TUNING.carriedAlways).map(([family, fraction]) => ({
            label: `${family} — toujours`,
            value: `${Math.round(fraction * 100)} % du poids de corps`,
          })),
          ...Object.entries(METRICS_TUNING.carriedIfBodyweight).map(([family, fraction]) => ({
            label: `${family} — si sans charge`,
            value: `${Math.round(fraction * 100)} % du poids de corps`,
          })),
        ],
        source: "metrics.bodyweightFraction",
      },
      {
        title: "Dépense énergétique",
        text: "Table des METs selon la densité de la séance, et non travail mécanique : la musculation dépense l'essentiel en contraction isométrique, que la physique du déplacement ne voit pas.",
        values: METRICS_TUNING.metByRest.map((row) => ({
          label: row.maxRest === Infinity ? "repos plus longs" : `repos ≤ ${row.maxRest} s`,
          value: `MET ${row.met.toFixed(1)}`,
        })),
        source: "metrics.metForRest",
      },
      {
        title: "Puissance — estimation assumée",
        text: "Elle dépend de l'amplitude réelle du mouvement, qui varie avec la morphologie et n'est pas en base. On utilise une amplitude moyenne par famille, et on rapporte le travail au temps d'effort : allonger ses repos ne doit pas faire « baisser sa puissance ».",
        values: [
          {
            label: "Amplitude par défaut",
            value: `${METRICS_TUNING.rangeOfMotionM.squat} m (squat) · ${METRICS_TUNING.rangeOfMotionM.horizontal_push} m (poussée horizontale)`,
          },
          { label: "Durée d'une répétition", value: s(METRICS_TUNING.secondsPerRep) },
        ],
        source: "metrics.rangeOfMotion",
      },
    ],
  },
];
