/**
 * Fixtures du mode démo — GÉNÉRÉ, NE PAS ÉDITER À LA MAIN.
 *
 * Extrait littéralement de fitness-app/docs/data/*.json (les mêmes fichiers que
 * seed.py injecte en base). Le mode démo fait donc tourner le vrai scoring sur
 * les vraies données, sans Supabase ni FastAPI.
 *
 * Régénérer : voir scripts/gen_fixtures.py
 */

import type {
  Exercise,
  FeedbackPollOption,
  FeedbackPollQuestion,
  Persona,
  PersonaProgramEligibility,
  Program,
  ProgramPhase,
  QuestionnaireOption,
  QuestionnaireQuestion,
} from "./types";

export const PERSONAS: Persona[] = [
  {
    "id": "persona_smb",
    "code": "SMB",
    "name": "Summer Muscle Builder",
    "slug": "summer-muscle-builder",
    "tagline": "Construire du muscle pour un horizon moyen (3 mois)",
    "description": "Objectif esthétique prioritaire. Recherche hypertrophie musculaire visible, amélioration de l'apparence. Disponibilité modérée, accès salle préféré.",
    "objective": "aesthetics",
    "objective_label": "Sculpter mon corps et privilégier l'aspect esthétique (Hypertrophie)",
    "experience_level": "beginner_intermediate",
    "sessions_per_week_min": 3,
    "sessions_per_week_max": 5,
    "session_duration_min_min": 45,
    "session_duration_min_max": 60,
    "primary_program_id": "program_muscle_building",
    "secondary_program_id": "program_bodyweight",
    "tertiary_program_id": null,
    "color": "#E91E8C",
    "icon": "💪"
  },
  {
    "id": "persona_bf",
    "code": "BF",
    "name": "Brut Force",
    "slug": "brut-force",
    "tagline": "Devenir extrêmement fort(e) et soulever lourd",
    "description": "Objectif force pure. Cherche des charges maximales, progressions lourdes, peu de cardio. Accès salle obligatoire pour charges lourdes.",
    "objective": "strength",
    "objective_label": "Devenir extrêmement fort(e) et soulever lourd (Force pure)",
    "experience_level": "intermediate_advanced",
    "sessions_per_week_min": 3,
    "sessions_per_week_max": 4,
    "session_duration_min_min": 60,
    "session_duration_min_max": 90,
    "primary_program_id": "program_strength",
    "secondary_program_id": "program_muscle_building",
    "tertiary_program_id": null,
    "color": "#B71C1C",
    "icon": "🏋️"
  },
  {
    "id": "persona_aw",
    "code": "AW",
    "name": "Athlete Wannabe",
    "slug": "athlete-wannabe",
    "tagline": "Gagner en explosivité, être athlétique et fonctionnel",
    "description": "Objectif performance athlétique. Cherche explosivité, cardio, mobilité, musculation fonctionnelle. Flexible sur l'environnement.",
    "objective": "athletic_performance",
    "objective_label": "Gagner en explosivité, être athlétique et fonctionnel (Performance)",
    "experience_level": "intermediate_advanced",
    "sessions_per_week_min": 3,
    "sessions_per_week_max": 5,
    "session_duration_min_min": 60,
    "session_duration_min_max": 70,
    "primary_program_id": "program_athletic",
    "secondary_program_id": "program_lactate",
    "tertiary_program_id": "program_bodyweight",
    "color": "#1565C0",
    "icon": "⚡"
  },
  {
    "id": "persona_cr",
    "code": "CR",
    "name": "Corporate Rusher",
    "slug": "corporate-rusher",
    "tagline": "Optimiser ma santé et mon cardio en un minimum de temps",
    "description": "Temps très limité. Cherche efficacité maximale, séances courtes et denses. Équipement flexible (salle, maison, plein air). Inclut les profils féminins orientés santé/cardio.",
    "objective": "efficiency",
    "objective_label": "Optimiser ma santé et mon cardio en un minimum de temps (Efficacité)",
    "experience_level": "beginner_intermediate",
    "sessions_per_week_min": 2,
    "sessions_per_week_max": 3,
    "session_duration_min_min": 30,
    "session_duration_min_max": 45,
    "primary_program_id": "program_lactate",
    "secondary_program_id": "program_bodyweight",
    "tertiary_program_id": null,
    "color": "#2E7D32",
    "icon": "⏱️"
  },
  {
    "id": "persona_sav",
    "code": "SAV",
    "name": "Savage",
    "slug": "savage",
    "tagline": "Être un athlète complet : fort, endurant et musclé",
    "description": "Polyvalence totale. 5+ séances/semaine, accès complet équipement. Cherche à développer tous les systèmes énergétiques : force, hypertrophie, cardio, performance athlétique, mobilité.",
    "objective": "complete_athlete",
    "objective_label": "Être un athlète complet : fort, endurant et musclé (Polyvalence)",
    "experience_level": "advanced",
    "sessions_per_week_min": 5,
    "sessions_per_week_max": 6,
    "session_duration_min_min": 45,
    "session_duration_min_max": 90,
    "primary_program_id": null,
    "secondary_program_id": null,
    "tertiary_program_id": null,
    "color": "#6A1B9A",
    "icon": "🔥"
  }
];

export const PROGRAMS: Program[] = [
  {
    "id": "program_muscle_building",
    "code": "MBF",
    "name": "Muscle Building Focus",
    "slug": "muscle-building-focus",
    "tagline": "Construire du muscle via surcharge progressive et volume élevé",
    "objective": "hypertrophy",
    "duration_weeks": 10,
    "is_continuous": false,
    "frequency_per_week_min": 4,
    "frequency_per_week_max": 5,
    "session_duration_min": 60,
    "session_duration_max": 60,
    "rep_range_min": 8,
    "rep_range_max": 12,
    "available_protocols": [
      "full_body",
      "push_pull_leg",
      "upper_lower"
    ],
    "default_protocol": "upper_lower",
    "color": "#E91E8C",
    "icon": "💪"
  },
  {
    "id": "program_bodyweight",
    "code": "BWF",
    "name": "Body weight Focus",
    "slug": "bodyweight-focus",
    "tagline": "Maximiser l'output avec poids du corps uniquement",
    "objective": "bodyweight_hypertrophy",
    "duration_weeks": 9,
    "is_continuous": false,
    "frequency_per_week_min": 3,
    "frequency_per_week_max": 4,
    "session_duration_min": 45,
    "session_duration_max": 60,
    "rep_range_min": 8,
    "rep_range_max": 12,
    "available_protocols": [
      "full_body",
      "push_pull"
    ],
    "default_protocol": "full_body",
    "color": "#FF6F00",
    "icon": "🤸"
  },
  {
    "id": "program_strength",
    "code": "STF",
    "name": "Strength Focus",
    "slug": "strength-focus",
    "tagline": "Développer la force maximale via charges lourdes et progressions structurées",
    "objective": "max_strength",
    "duration_weeks": 14,
    "is_continuous": false,
    "frequency_per_week_min": 3,
    "frequency_per_week_max": 3,
    "session_duration_min": 60,
    "session_duration_max": 90,
    "rep_range_min": 5,
    "rep_range_max": 6,
    "available_protocols": [
      "full_body"
    ],
    "default_protocol": "full_body",
    "color": "#B71C1C",
    "icon": "🏋️"
  },
  {
    "id": "program_athletic",
    "code": "PAF",
    "name": "Préparation Athlétique",
    "slug": "preparation-athletique",
    "tagline": "Performance athlétique : explosivité, cardio, mobilité, musculation fonctionnelle",
    "objective": "athletic_performance",
    "duration_weeks": 8,
    "is_continuous": false,
    "frequency_per_week_min": 3,
    "frequency_per_week_max": 3,
    "session_duration_min": 60,
    "session_duration_max": 70,
    "rep_range_min": 3,
    "rep_range_max": 5,
    "available_protocols": [
      "full_body",
      "upper_lower"
    ],
    "default_protocol": "full_body",
    "color": "#1565C0",
    "icon": "⚡"
  },
  {
    "id": "program_lactate",
    "code": "LCF",
    "name": "Lactate Focus",
    "slug": "lactate-focus",
    "tagline": "Efficacité cardiovasculaire et circulation sanguine en temps très limité",
    "objective": "cardio_efficiency",
    "duration_weeks": null,
    "is_continuous": true,
    "frequency_per_week_min": 3,
    "frequency_per_week_max": 5,
    "session_duration_min": 30,
    "session_duration_max": 45,
    "rep_range_min": 8,
    "rep_range_max": 10,
    "available_protocols": [
      "full_body"
    ],
    "default_protocol": "full_body",
    "color": "#2E7D32",
    "icon": "🫀"
  }
];

export const PROGRAM_PHASES: ProgramPhase[] = [
  {
    "id": "mbf_phase_1",
    "program_id": "program_muscle_building",
    "phase_number": 1,
    "name": "Neuro-Activation & Pattern Learning",
    "duration_weeks": 1,
    "objective": "Apprendre les mouvements, préparer le système nerveux",
    "approach": "Volume modéré, technique parfaite",
    "rep_range_min": 8,
    "rep_range_max": 12,
    "sets_compounds": 3,
    "sets_isolation": 2,
    "load_pct_1rm": 65,
    "rest_sec_min": 60,
    "rest_sec_max": 90,
    "progression_rule": "Focus on form, no weight increase this week",
    "notes": "Establish baseline, groove movement patterns"
  },
  {
    "id": "mbf_phase_2",
    "program_id": "program_muscle_building",
    "phase_number": 2,
    "name": "Progressive Overload",
    "duration_weeks": 7,
    "objective": "Augmenter progressivement le poids/volume chaque semaine",
    "approach": "Augmentation linéaire de la charge",
    "rep_range_min": 8,
    "rep_range_max": 12,
    "sets_compounds": 4,
    "sets_isolation": 3,
    "load_pct_1rm": null,
    "rest_sec_min": 60,
    "rest_sec_max": 90,
    "progression_rule": "+2.5kg upper / +5kg lower per week",
    "notes": "Week 1 = baseline load, Week 7 = ~15kg increase on main lifts"
  },
  {
    "id": "mbf_phase_3",
    "program_id": "program_muscle_building",
    "phase_number": 3,
    "name": "Peak Performance",
    "duration_weeks": 2,
    "objective": "Tester les maxima, consolider les gains",
    "approach": "Charge plus lourde, moins de reps",
    "rep_range_min": 6,
    "rep_range_max": 8,
    "sets_compounds": 4,
    "sets_isolation": 3,
    "load_pct_1rm": 85,
    "rest_sec_min": 90,
    "rest_sec_max": 120,
    "progression_rule": "Max weight for rep range, test PRs",
    "notes": "Reduce volume, increase intensity"
  },
  {
    "id": "bwf_phase_1",
    "program_id": "program_bodyweight",
    "phase_number": 1,
    "name": "Progressive Overload",
    "duration_weeks": 6,
    "objective": "Augmenter le nombre de reps ou la difficulté",
    "approach": "Progression linéaire sur mouvements bodyweight",
    "rep_range_min": 8,
    "rep_range_max": 12,
    "sets_compounds": 3,
    "sets_isolation": 2,
    "load_pct_1rm": null,
    "rest_sec_min": 60,
    "rest_sec_max": 90,
    "progression_rule": "+1-2 reps per week, or progress to harder variation",
    "notes": "Week 1=3x8 pullups, Week 6=3x12 pullups"
  },
  {
    "id": "bwf_phase_2",
    "program_id": "program_bodyweight",
    "phase_number": 2,
    "name": "PR, Weight Belt & Learn New Figures",
    "duration_weeks": 3,
    "objective": "Tester les maxima, apprendre nouvelles figures",
    "approach": "Weighted bodyweight (ceinture de lest), nouvelles progressions",
    "rep_range_min": 5,
    "rep_range_max": 8,
    "sets_compounds": 5,
    "sets_isolation": 3,
    "load_pct_1rm": null,
    "rest_sec_min": 90,
    "rest_sec_max": 120,
    "progression_rule": "5x5 weighted dips/pullups with belt",
    "notes": "Phase de dépassement — weighted ceinture obligatoire"
  },
  {
    "id": "stf_phase_1",
    "program_id": "program_strength",
    "phase_number": 1,
    "name": "Progressive Overload Foundation",
    "duration_weeks": 2,
    "objective": "Établir les bases, préparer le SNC aux charges lourdes",
    "approach": "Volume modéré, augmentation progressive de la charge",
    "rep_range_min": 10,
    "rep_range_max": 12,
    "sets_compounds": 4,
    "sets_isolation": 2,
    "load_pct_1rm": 70,
    "rest_sec_min": 120,
    "rest_sec_max": 180,
    "progression_rule": "+5kg per session on main lifts",
    "notes": "Phase de transition — habituer le corps aux mouvements de force"
  },
  {
    "id": "stf_phase_2",
    "program_id": "program_strength",
    "phase_number": 2,
    "name": "Strength Peaking",
    "duration_weeks": 12,
    "objective": "Maximiser la force en progressions lourdes",
    "approach": "5x5, 3x5, ou 4x6+1 sur compounds lourds",
    "rep_range_min": 5,
    "rep_range_max": 5,
    "sets_compounds": null,
    "sets_isolation": null,
    "load_pct_1rm": 85,
    "rest_sec_min": 180,
    "rest_sec_max": 300,
    "progression_rule": "+2.5kg upper / +5kg lower per session",
    "notes": "Starting Strength / StrongLifts logic — échec = retour 10% charge"
  },
  {
    "id": "paf_phase_1",
    "program_id": "program_athletic",
    "phase_number": 1,
    "name": "Learn Complexes",
    "duration_weeks": 1,
    "objective": "Apprendre les complexes lestés et mouvements explosifs",
    "approach": "Technique prioritaire, charge légère",
    "rep_range_min": 3,
    "rep_range_max": 5,
    "sets_compounds": 3,
    "sets_isolation": null,
    "load_pct_1rm": 50,
    "rest_sec_min": 90,
    "rest_sec_max": 120,
    "progression_rule": "Master technique before adding load",
    "notes": "Squat Box Jump, Hexbar Deadlift Jump — technique only week"
  },
  {
    "id": "paf_phase_2",
    "program_id": "program_athletic",
    "phase_number": 2,
    "name": "Progressive Intensity + Peak",
    "duration_weeks": 5,
    "objective": "Augmenter progressivement l'intensité des complexes",
    "approach": "Augmentation de la charge hebdomadaire",
    "rep_range_min": 3,
    "rep_range_max": 5,
    "sets_compounds": 4,
    "sets_isolation": null,
    "load_pct_1rm": null,
    "rest_sec_min": 60,
    "rest_sec_max": 90,
    "progression_rule": "+5-10% load per week on complexes",
    "notes": "Conditioning athlétique + complexes lestés + core"
  },
  {
    "id": "paf_phase_3",
    "program_id": "program_athletic",
    "phase_number": 3,
    "name": "Deload",
    "duration_weeks": 2,
    "objective": "Récupération active, consolidation des acquis",
    "approach": "Charge réduite, focus mobilité et technique",
    "rep_range_min": 5,
    "rep_range_max": 8,
    "sets_compounds": 3,
    "sets_isolation": null,
    "load_pct_1rm": 60,
    "rest_sec_min": 60,
    "rest_sec_max": 90,
    "progression_rule": "Reduce load by 30-40%, maintain movement quality",
    "notes": "Active recovery week — mobility heavy, intensity low"
  }
];

export const PERSONA_PROGRAM_ELIGIBILITY: PersonaProgramEligibility[] = [
  {
    "id": "elig_smb_mbf",
    "persona_id": "persona_smb",
    "program_id": "program_muscle_building",
    "eligibility_rank": "primary",
    "rank_order": 1,
    "rationale": "Hypertrophie musculaire = objectif principal SMB. Volume élevé 4-5x/sem = optimal. Durée 60 min = raisonnable.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_smb_bwf",
    "persona_id": "persona_smb",
    "program_id": "program_bodyweight",
    "eligibility_rank": "secondary",
    "rank_order": 2,
    "rationale": "Fallback si équipement indisponible ou jour sans accès salle. Compatible SMB.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_smb_stf",
    "persona_id": "persona_smb",
    "program_id": "program_strength",
    "eligibility_rank": "excluded",
    "rank_order": null,
    "rationale": "Force pure ≠ esthétique. Trop peu de volume (3x/sem), trop de repos entre séries. SMB préfère densité.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_smb_paf",
    "persona_id": "persona_smb",
    "program_id": "program_athletic",
    "eligibility_rank": "excluded",
    "rank_order": null,
    "rationale": "Explosivité + cardio ≠ hypertrophie. Complexes lestés ≠ isolation musculaire.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_smb_lcf",
    "persona_id": "persona_smb",
    "program_id": "program_lactate",
    "eligibility_rank": "excluded",
    "rank_order": null,
    "rationale": "Cardio intense + peu de muscle. Contraire à l'objectif d'hypertrophie.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_bf_stf",
    "persona_id": "persona_bf",
    "program_id": "program_strength",
    "eligibility_rank": "primary",
    "rank_order": 1,
    "rationale": "Force pure = objectif principal BF. 3 séances/sem = optimal pour récupération force. Durée 60-90 min = nécessaire.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_bf_mbf",
    "persona_id": "persona_bf",
    "program_id": "program_muscle_building",
    "eligibility_rank": "secondary",
    "rank_order": 2,
    "rationale": "Hypertrophie = complément à la force (plus de muscle = plus de force potentielle). Peut alterner avec Strength.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_bf_bwf",
    "persona_id": "persona_bf",
    "program_id": "program_bodyweight",
    "eligibility_rank": "excluded",
    "rank_order": null,
    "rationale": "Poids du corps insuffisant pour progresser en force. BF a besoin de charges lourdes.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_bf_paf",
    "persona_id": "persona_bf",
    "program_id": "program_athletic",
    "eligibility_rank": "excluded",
    "rank_order": null,
    "rationale": "Explosivité + complexes ≠ force pure. Trop de cardio.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_bf_lcf",
    "persona_id": "persona_bf",
    "program_id": "program_lactate",
    "eligibility_rank": "excluded",
    "rank_order": null,
    "rationale": "EXCLUSION ABSOLUE — Repos courts (45s), cardio intense, supersets = contraire à la force. Contre-productif.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_aw_paf",
    "persona_id": "persona_aw",
    "program_id": "program_athletic",
    "eligibility_rank": "primary",
    "rank_order": 1,
    "rationale": "Performance athlétique = objectif principal AW. Explosivité + cardio + mobilité = parfait.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_aw_lcf",
    "persona_id": "persona_aw",
    "program_id": "program_lactate",
    "eligibility_rank": "secondary",
    "rank_order": 2,
    "rationale": "Cardio intense = complément athlétique. Peut faire 1-2 séances Lactate + 3 Athlétique.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_aw_bwf",
    "persona_id": "persona_aw",
    "program_id": "program_bodyweight",
    "eligibility_rank": "tertiary",
    "rank_order": 3,
    "rationale": "Fallback si équipement indisponible. Compatible avec objectif athlétique.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_aw_stf",
    "persona_id": "persona_aw",
    "program_id": "program_strength",
    "eligibility_rank": "excluded",
    "rank_order": null,
    "rationale": "Force pure ≠ performance athlétique. Trop peu de cardio, trop de repos.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_aw_mbf",
    "persona_id": "persona_aw",
    "program_id": "program_muscle_building",
    "eligibility_rank": "excluded",
    "rank_order": null,
    "rationale": "Esthétique ≠ performance. Trop peu d'explosivité et de cardio.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_cr_lcf",
    "persona_id": "persona_cr",
    "program_id": "program_lactate",
    "eligibility_rank": "primary",
    "rank_order": 1,
    "rationale": "Efficacité maximale = objectif principal CR. Durée 30-45 min = PARFAIT. Densité maximale.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_cr_bwf",
    "persona_id": "persona_cr",
    "program_id": "program_bodyweight",
    "eligibility_rank": "secondary",
    "rank_order": 2,
    "rationale": "Fallback si équipement indisponible. 45-60 min peut dépasser le temps idéal CR mais acceptable.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_cr_stf",
    "persona_id": "persona_cr",
    "program_id": "program_strength",
    "eligibility_rank": "excluded",
    "rank_order": null,
    "rationale": "Durée 60-90 min = trop long. Repos longs = inefficace pour temps limité.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_cr_mbf",
    "persona_id": "persona_cr",
    "program_id": "program_muscle_building",
    "eligibility_rank": "excluded",
    "rank_order": null,
    "rationale": "Durée 60 min + 4-5x/sem = trop de temps pour CR.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_cr_paf",
    "persona_id": "persona_cr",
    "program_id": "program_athletic",
    "eligibility_rank": "excluded",
    "rank_order": null,
    "rationale": "Durée 60-70 min = trop long. Pas besoin de performance athlétique.",
    "sav_rotation_day": null
  },
  {
    "id": "elig_sav_mbf",
    "persona_id": "persona_sav",
    "program_id": "program_muscle_building",
    "eligibility_rank": "primary",
    "rank_order": 3,
    "rationale": "SAV = athlète complet. Muscle Building dans rotation polyvalente.",
    "sav_rotation_day": "mercredi"
  },
  {
    "id": "elig_sav_stf",
    "persona_id": "persona_sav",
    "program_id": "program_strength",
    "eligibility_rank": "primary",
    "rank_order": 1,
    "rationale": "SAV = athlète complet. Strength dans rotation polyvalente.",
    "sav_rotation_day": "lundi"
  },
  {
    "id": "elig_sav_paf",
    "persona_id": "persona_sav",
    "program_id": "program_athletic",
    "eligibility_rank": "primary",
    "rank_order": 4,
    "rationale": "SAV = athlète complet. Préparation Athlétique dans rotation.",
    "sav_rotation_day": "jeudi"
  },
  {
    "id": "elig_sav_lcf",
    "persona_id": "persona_sav",
    "program_id": "program_lactate",
    "eligibility_rank": "primary",
    "rank_order": 2,
    "rationale": "SAV = athlète complet. Lactate x2/sem pour cardio dans rotation.",
    "sav_rotation_day": "mardi_samedi"
  },
  {
    "id": "elig_sav_bwf",
    "persona_id": "persona_sav",
    "program_id": "program_bodyweight",
    "eligibility_rank": "primary",
    "rank_order": 5,
    "rationale": "SAV = athlète complet. Bodyweight pour mobilité et figures dans rotation.",
    "sav_rotation_day": "vendredi"
  }
];

export const QUESTIONNAIRE_QUESTIONS: QuestionnaireQuestion[] = [
  {
    "id": "q1",
    "questionnaire_id": "initial_profiling_v3",
    "question_number": 1,
    "text": "Quel est votre âge ?",
    "type": "single_choice",
    "segmentation_role": "primary",
    "note": null
  },
  {
    "id": "q2",
    "questionnaire_id": "initial_profiling_v3",
    "question_number": 2,
    "text": "Quel est votre genre ?",
    "type": "single_choice",
    "segmentation_role": "primary",
    "note": null
  },
  {
    "id": "q3",
    "questionnaire_id": "initial_profiling_v3",
    "question_number": 3,
    "text": "Quel est votre objectif principal ?",
    "type": "single_choice",
    "segmentation_role": "major_differentiator",
    "note": "Question introduite en V3 pour forcer la décision entre personas"
  },
  {
    "id": "q4",
    "questionnaire_id": "initial_profiling_v3",
    "question_number": 4,
    "text": "Quel type d'activités pratiquez-vous le plus ou avez-vous pratiqué dans le passé ?",
    "type": "multiple_choice",
    "segmentation_role": "secondary",
    "note": null
  },
  {
    "id": "q5",
    "questionnaire_id": "initial_profiling_v3",
    "question_number": 5,
    "text": "Combien de temps pouvez-vous consacrer à CHAQUE séance d'entraînement ?",
    "type": "single_choice",
    "segmentation_role": "constraint",
    "note": null
  },
  {
    "id": "q6",
    "questionnaire_id": "initial_profiling_v3",
    "question_number": 6,
    "text": "Combien de séances par semaine êtes-vous prêt(e) à réaliser avec certitude ?",
    "type": "single_choice",
    "segmentation_role": "constraint",
    "note": null
  },
  {
    "id": "q7",
    "questionnaire_id": "initial_profiling_v3",
    "question_number": 7,
    "text": "Quel est votre niveau d'expérience en musculation/entraînement physique ?",
    "type": "single_choice",
    "segmentation_role": "secondary",
    "note": null
  },
  {
    "id": "q8",
    "questionnaire_id": "initial_profiling_v3",
    "question_number": 8,
    "text": "Où souhaitez-vous vous entraîner en priorité ?",
    "type": "multiple_choice",
    "segmentation_role": "constraint",
    "note": "Option D (Flexible) exclusive — ne peut pas être combinée"
  },
  {
    "id": "q9",
    "questionnaire_id": "initial_profiling_v3",
    "question_number": 9,
    "text": "Quand tu penses à une séance intense (transpirer, essoufflement, muscles qui brûlent), tu te dis...",
    "type": "single_choice",
    "segmentation_role": "psychological_differentiator",
    "note": null
  }
];

export const QUESTIONNAIRE_OPTIONS: QuestionnaireOption[] = [
  {
    "id": "q1_a",
    "question_id": "q1",
    "label": "18-25 ans",
    "value": "18_25",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 0,
    "score_bf": 0,
    "score_aw": 1,
    "score_cr": 0,
    "score_sav": 1,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q1_b",
    "question_id": "q1",
    "label": "26-45 ans",
    "value": "26_45",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 1,
    "score_bf": 1,
    "score_aw": 0,
    "score_cr": 0,
    "score_sav": 0,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q1_c",
    "question_id": "q1",
    "label": "45-60 ans",
    "value": "45_60",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 1,
    "score_bf": 0,
    "score_aw": 0,
    "score_cr": 1,
    "score_sav": 0,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q1_d",
    "question_id": "q1",
    "label": "60+ ans",
    "value": "60_plus",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 0,
    "score_bf": 0,
    "score_aw": 0,
    "score_cr": 1,
    "score_sav": 0,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q2_a",
    "question_id": "q2",
    "label": "Homme",
    "value": "male",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 0,
    "score_bf": 1,
    "score_aw": 0,
    "score_cr": 0,
    "score_sav": 0,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q2_b",
    "question_id": "q2",
    "label": "Femme",
    "value": "female",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 0,
    "score_bf": -2,
    "score_aw": 0,
    "score_cr": 1,
    "score_sav": 0,
    "has_malus": true,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q3_a",
    "question_id": "q3",
    "label": "Sculpter mon corps et privilégier l'aspect esthétique (Hypertrophie)",
    "value": "aesthetics",
    "maps_to_objective": "aesthetics",
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 4,
    "score_bf": 1,
    "score_aw": 0,
    "score_cr": 0,
    "score_sav": 0,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q3_b",
    "question_id": "q3",
    "label": "Devenir extrêmement fort(e) et soulever lourd (Force pure)",
    "value": "strength",
    "maps_to_objective": "strength",
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 0,
    "score_bf": 4,
    "score_aw": 0,
    "score_cr": 0,
    "score_sav": 1,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q3_c",
    "question_id": "q3",
    "label": "Gagner en explosivité, être athlétique et fonctionnel (Performance)",
    "value": "performance",
    "maps_to_objective": "athletic_performance",
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 0,
    "score_bf": 0,
    "score_aw": 4,
    "score_cr": 0,
    "score_sav": 1,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q3_d",
    "question_id": "q3",
    "label": "Optimiser ma santé et mon cardio en un minimum de temps (Efficacité)",
    "value": "efficiency",
    "maps_to_objective": "efficiency",
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 0,
    "score_bf": 0,
    "score_aw": 0,
    "score_cr": 4,
    "score_sav": 0,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q3_e",
    "question_id": "q3",
    "label": "Être un athlète complet : fort, endurant et musclé (Polyvalence)",
    "value": "complete_athlete",
    "maps_to_objective": "complete_athlete",
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 0,
    "score_bf": 0,
    "score_aw": 1,
    "score_cr": 0,
    "score_sav": 4,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q4_a",
    "question_id": "q4",
    "label": "Renforcement musculaire (haltères, machines)",
    "value": "weight_training",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 2,
    "score_bf": 3,
    "score_aw": 0,
    "score_cr": 0,
    "score_sav": 1,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q4_b",
    "question_id": "q4",
    "label": "Cardio (course, vélo, elliptique)",
    "value": "cardio",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 0,
    "score_bf": 0,
    "score_aw": 2,
    "score_cr": 2,
    "score_sav": 0,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q4_c",
    "question_id": "q4",
    "label": "Course (running, trail)",
    "value": "running",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 0,
    "score_bf": 0,
    "score_aw": 3,
    "score_cr": 1,
    "score_sav": 0,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q4_d",
    "question_id": "q4",
    "label": "Yoga/Pilates (flexibilité, mobilité)",
    "value": "yoga_pilates",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 0,
    "score_bf": 0,
    "score_aw": 2,
    "score_cr": 1,
    "score_sav": 0,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q4_e",
    "question_id": "q4",
    "label": "HIIT (entraînement par intervalles)",
    "value": "hiit",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 0,
    "score_bf": 0,
    "score_aw": 3,
    "score_cr": 2,
    "score_sav": 1,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q4_f",
    "question_id": "q4",
    "label": "Sports collectifs (foot, basket, volley)",
    "value": "team_sports",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 0,
    "score_bf": 0,
    "score_aw": 4,
    "score_cr": 0,
    "score_sav": 1,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q4_g",
    "question_id": "q4",
    "label": "Autres",
    "value": "other",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 0,
    "score_bf": 0,
    "score_aw": 0,
    "score_cr": 0,
    "score_sav": 0,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q5_a",
    "question_id": "q5",
    "label": "Moins de 45 minutes — Je dois être ultra-efficace",
    "value": "under_45min",
    "maps_to_objective": null,
    "maps_to_duration_max": 45,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 0,
    "score_bf": -2,
    "score_aw": 0,
    "score_cr": 4,
    "score_sav": 0,
    "has_malus": true,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q5_b",
    "question_id": "q5",
    "label": "Environ 1 heure — C'est mon créneau idéal",
    "value": "60min",
    "maps_to_objective": null,
    "maps_to_duration_max": 60,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 3,
    "score_bf": 0,
    "score_aw": 2,
    "score_cr": 1,
    "score_sav": 0,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q5_c",
    "question_id": "q5",
    "label": "Pas de limite réelle — Je prends le temps qu'il faut",
    "value": "unlimited",
    "maps_to_objective": null,
    "maps_to_duration_max": 120,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 1,
    "score_bf": 3,
    "score_aw": 0,
    "score_cr": 0,
    "score_sav": 3,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q6_a",
    "question_id": "q6",
    "label": "1 à 2 séances — Mon emploi du temps est chargé",
    "value": "1_2_sessions",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": 2,
    "maps_to_environment": null,
    "score_smb": 0,
    "score_bf": 0,
    "score_aw": 0,
    "score_cr": 4,
    "score_sav": 0,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q6_b",
    "question_id": "q6",
    "label": "3 à 4 séances — C'est un bon rythme pour moi",
    "value": "3_4_sessions",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": 3,
    "maps_to_frequency_max": 4,
    "maps_to_environment": null,
    "score_smb": 3,
    "score_bf": 2,
    "score_aw": 2,
    "score_cr": 0,
    "score_sav": 0,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q6_c",
    "question_id": "q6",
    "label": "5 séances et plus — Je suis totalement dédié(e)",
    "value": "5_plus_sessions",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": 5,
    "maps_to_frequency_max": 7,
    "maps_to_environment": null,
    "score_smb": -1,
    "score_bf": -1,
    "score_aw": 0,
    "score_cr": 0,
    "score_sav": 5,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": true
  },
  {
    "id": "q7_a",
    "question_id": "q7",
    "label": "Débutant(e) — Je découvre ou reprends après une pause",
    "value": "beginner",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 1,
    "score_bf": 0,
    "score_aw": 0,
    "score_cr": 3,
    "score_sav": 0,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q7_b",
    "question_id": "q7",
    "label": "Intermédiaire — Je connais les mouvements de base",
    "value": "intermediate",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 2,
    "score_bf": 1,
    "score_aw": 2,
    "score_cr": 0,
    "score_sav": 0,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q7_c",
    "question_id": "q7",
    "label": "Avancé(e) — J'ai un solide historique sportif",
    "value": "advanced",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 0,
    "score_bf": 3,
    "score_aw": 2,
    "score_cr": 0,
    "score_sav": 3,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q8_a",
    "question_id": "q8",
    "label": "À la salle de sport — J'ai accès à tous les équipements",
    "value": "gym",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": "gym",
    "score_smb": 2,
    "score_bf": 3,
    "score_aw": 0,
    "score_cr": 0,
    "score_sav": 1,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q8_b",
    "question_id": "q8",
    "label": "En plein air — Je préfère les mouvements fonctionnels",
    "value": "outdoor",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": "outdoor",
    "score_smb": 0,
    "score_bf": 0,
    "score_aw": 3,
    "score_cr": 2,
    "score_sav": 0,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q8_c",
    "question_id": "q8",
    "label": "À la maison — Équipement minimal (poids du corps, bandes)",
    "value": "home",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": "home",
    "score_smb": 1,
    "score_bf": 0,
    "score_aw": 0,
    "score_cr": 3,
    "score_sav": 0,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q8_d",
    "question_id": "q8",
    "label": "Flexible — Je peux m'adapter à tous les environnements",
    "value": "flexible",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": "flexible",
    "score_smb": 0,
    "score_bf": 0,
    "score_aw": 2,
    "score_cr": 1,
    "score_sav": 2,
    "has_malus": false,
    "is_exclusive": true,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q9_a",
    "question_id": "q9",
    "label": "\"Ouais ! C'est ça que j'aime !\" — J'adore cette sensation",
    "value": "loves_intensity",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": -2,
    "score_bf": 0,
    "score_aw": 3,
    "score_cr": 2,
    "score_sav": 0,
    "has_malus": true,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q9_b",
    "question_id": "q9",
    "label": "\"Pourquoi pas, si c'est utile\" — Je l'accepte si c'est complet",
    "value": "accepts_intensity",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 0,
    "score_bf": 0,
    "score_aw": 1,
    "score_cr": 0,
    "score_sav": 2,
    "has_malus": false,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  },
  {
    "id": "q9_c",
    "question_id": "q9",
    "label": "\"Pas vraiment mon truc\" — Je préfère la contraction pure et les temps de repos",
    "value": "prefers_strength_style",
    "maps_to_objective": null,
    "maps_to_duration_max": null,
    "maps_to_frequency_min": null,
    "maps_to_frequency_max": null,
    "maps_to_environment": null,
    "score_smb": 3,
    "score_bf": 3,
    "score_aw": -2,
    "score_cr": 0,
    "score_sav": 0,
    "has_malus": true,
    "is_exclusive": false,
    "is_sav_exclusive_signal": false
  }
];

export const EXERCISES: Exercise[] = [
  {
    "id": "ex_push_001",
    "category": "push",
    "name": "Barbell Bench Press",
    "muscles_primary": [
      "Pectoraux",
      "Deltoïde antérieur"
    ],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "Banc plat",
      "Rack"
    ],
    "warmup_target": null,
    "description": "Allongé sur le banc, barre saisie en prise large. Descente contrôlée jusqu'au sternum, coudes à 45-75°. Poussée explosive en expirant."
  },
  {
    "id": "ex_push_002",
    "category": "push",
    "name": "Dumbbell Bench Press",
    "muscles_primary": [
      "Pectoraux",
      "Deltoïde antérieur"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères",
      "Banc plat"
    ],
    "warmup_target": null,
    "description": "Même schéma que la barre mais amplitude plus grande. Permet une rotation naturelle des poignets. Instabilité utile pour activation stabilisatrice."
  },
  {
    "id": "ex_push_003",
    "category": "push",
    "name": "Ring Dips",
    "muscles_primary": [
      "Pectoraux inférieurs",
      "Triceps"
    ],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "avance",
    "bodyweight_compatible": true,
    "material_required": [
      "Anneaux de gymnastique"
    ],
    "warmup_target": null,
    "description": "Dips sur anneaux — instabilité maximale. Corps légèrement incliné vers l'avant pour cibler pectoraux. Anneaux tournés vers l'extérieur en haut."
  },
  {
    "id": "ex_push_004",
    "category": "push",
    "name": "Dips",
    "muscles_primary": [
      "Pectoraux inférieurs",
      "Triceps"
    ],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": true,
    "material_required": [
      "Barres parallèles"
    ],
    "warmup_target": null,
    "description": "Barres parallèles. Descente jusqu'à 90° de coude minimum. Variation triceps : corps vertical. Variation pec : légère inclinaison avant."
  },
  {
    "id": "ex_push_005",
    "category": "push",
    "name": "Straight Bar Dips",
    "muscles_primary": [
      "Pectoraux inférieurs",
      "Triceps"
    ],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "avance",
    "bodyweight_compatible": true,
    "material_required": [
      "Barre fixe ou barres parallèles"
    ],
    "warmup_target": null,
    "description": "Barre fixe basse ou parallèles. Mouvement de bascule vers l'avant, pression sur la barre en prise pronation. Transition vers muscle-up possible."
  },
  {
    "id": "ex_push_006",
    "category": "push",
    "name": "Overhead Press (Barbell)",
    "muscles_primary": [
      "Deltoïdes",
      "Triceps"
    ],
    "intent": [
      "force"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "Rack"
    ],
    "warmup_target": null,
    "description": "Barre au niveau de la clavicule, prise légèrement plus large que les épaules. Pousser verticalement, tête en arrière au passage, verrouillage en haut."
  },
  {
    "id": "ex_push_007",
    "category": "push",
    "name": "Push-ups (Endurance Reps)",
    "muscles_primary": [
      "Pectoraux",
      "Deltoïdes antérieurs"
    ],
    "intent": [
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": null,
    "description": "Appuis au sol, mains à largeur d'épaules. Séries longues (20-50 reps), rythme constant. Gainage actif tout au long. Objectif : densité de reps."
  },
  {
    "id": "ex_push_008",
    "category": "push",
    "name": "Close Grip Bench Press",
    "muscles_primary": [
      "Triceps"
    ],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "Banc plat",
      "Rack"
    ],
    "warmup_target": null,
    "description": "Prise serrée (~30 cm), coudes près du corps. Focus sur extension triceps. Moins de mobilisation pectorale que bench classique."
  },
  {
    "id": "ex_push_009",
    "category": "push",
    "name": "Close Grip Push-ups",
    "muscles_primary": [
      "Triceps"
    ],
    "intent": [
      "hypertrophie",
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": null,
    "description": "Mains sous les épaules, coudes plaqués au corps. Variante accessible du close grip bench. Bon finisher ou exercice de remplissage."
  },
  {
    "id": "ex_push_010",
    "category": "push",
    "name": "Ring Negative Muscle-ups (Band)",
    "muscles_primary": [
      "Grand dorsal",
      "Pectoraux",
      "Triceps"
    ],
    "intent": [
      "force"
    ],
    "level": "avance",
    "bodyweight_compatible": true,
    "material_required": [
      "Anneaux de gymnastique",
      "Bande élastique"
    ],
    "warmup_target": null,
    "description": "Descente lente depuis la position de support sur anneaux vers le bas du pull. Bande élastique sous les pieds pour assistance. Temps de descente : 4-6s."
  },
  {
    "id": "ex_push_011",
    "category": "push",
    "name": "Negative Muscle-ups",
    "muscles_primary": [
      "Grand dorsal",
      "Pectoraux",
      "Triceps"
    ],
    "intent": [
      "force"
    ],
    "level": "avance",
    "bodyweight_compatible": true,
    "material_required": [
      "Barre fixe ou anneaux"
    ],
    "warmup_target": null,
    "description": "Même mouvement sans assistance. Point de départ : support au-dessus de la barre. Descente excentrique maximale. Renforce le schéma moteur complet."
  },
  {
    "id": "ex_push_012",
    "category": "push",
    "name": "Ring Support Hold",
    "muscles_primary": [
      "Épaules",
      "Triceps"
    ],
    "intent": [
      "stabilite"
    ],
    "level": "avance",
    "bodyweight_compatible": true,
    "material_required": [
      "Anneaux de gymnastique"
    ],
    "warmup_target": null,
    "description": "Position de support statique sur anneaux, bras tendus, anneaux tournés vers l'extérieur. Gainage total. Base des progressions aux anneaux."
  },
  {
    "id": "ex_push_013",
    "category": "push",
    "name": "Knee Push-ups",
    "muscles_primary": [
      "Pectoraux",
      "Deltoïdes antérieurs"
    ],
    "intent": [
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": null,
    "description": "Version allégée du push-up. Genou au sol, corps en ligne droite de genou à tête. Idéal débutant ou récupération active."
  },
  {
    "id": "ex_push_014",
    "category": "push",
    "name": "Lateral Raises (Incline Posture)",
    "muscles_primary": [
      "Deltoïde latéral"
    ],
    "intent": [
      "hypertrophie",
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères",
      "Banc incliné"
    ],
    "warmup_target": null,
    "description": "Buste incliné à ~30° vers l'avant sur banc incliné pour pré-étirer le faisceau latéral. Élévations strictes, sans élan. Isole mieux que la version debout droite."
  },
  {
    "id": "ex_pull_001",
    "category": "pull",
    "name": "Pull-over (DB)",
    "muscles_primary": [
      "Grand dorsal"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltère",
      "Banc"
    ],
    "warmup_target": null,
    "description": "Allongé perpendiculaire au banc, haltère tenu à deux mains. Arc de cercle de la poitrine vers l'arrière de la tête. Étirement max du dorsal. Coudes légèrement fléchis."
  },
  {
    "id": "ex_pull_002",
    "category": "pull",
    "name": "Pull-ups (Pronation)",
    "muscles_primary": [
      "Grand dorsal",
      "Biceps"
    ],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": true,
    "material_required": [
      "Barre de traction"
    ],
    "warmup_target": null,
    "description": "Prise pronation (paumes en avant), mains ~1.5× largeur épaules. Tirer coudes vers les hanches. Chin au-dessus de la barre. Descente contrôlée."
  },
  {
    "id": "ex_pull_003",
    "category": "pull",
    "name": "Chin-ups (Supination)",
    "muscles_primary": [
      "Grand dorsal",
      "Biceps"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [
      "Barre de traction"
    ],
    "warmup_target": null,
    "description": "Prise supination (paumes vers soi). Plus de recrutement biceps. Facilite la connexion esprit-muscle sur le dorsal pour débutants."
  },
  {
    "id": "ex_pull_004",
    "category": "pull",
    "name": "Negative Pull-ups",
    "muscles_primary": [
      "Grand dorsal",
      "Biceps"
    ],
    "intent": [
      "force"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [
      "Barre de traction"
    ],
    "warmup_target": null,
    "description": "Monter en sautant ou sur une box, puis descente excentrique lente (4-6s). Construit la force nécessaire avant les tractions complètes."
  },
  {
    "id": "ex_pull_005",
    "category": "pull",
    "name": "Scapular Pull-ups",
    "muscles_primary": [
      "Rhomboïdes",
      "Trapèze inférieur"
    ],
    "intent": [
      "stabilite",
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [
      "Barre de traction"
    ],
    "warmup_target": null,
    "description": "En dead hang, rétraction scapulaire pure sans fléchir les coudes. Activation des fixateurs de l'omoplate. Base de santé épaule / posture."
  },
  {
    "id": "ex_pull_006",
    "category": "pull",
    "name": "Barbell Rows",
    "muscles_primary": [
      "Grand dorsal",
      "Rhomboïdes"
    ],
    "intent": [
      "force"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "Disques"
    ],
    "warmup_target": null,
    "description": "Pendlay ou Yates row. Buste ~45°, barre tirée vers le bas du sternum. Rétraction scapulaire en fin de mouvement. Base du programme de force."
  },
  {
    "id": "ex_pull_007",
    "category": "pull",
    "name": "T-Bar / Landmine Rows",
    "muscles_primary": [
      "Grand dorsal",
      "Rhomboïdes"
    ],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre",
      "Support landmine ou angle de mur",
      "Poignée V-bar optionnelle"
    ],
    "warmup_target": null,
    "description": "Barre insérée dans un angle ou support landmine. Position légèrement plus upright que le barbell row. Prise neutre si poignée V-bar."
  },
  {
    "id": "ex_pull_008",
    "category": "pull",
    "name": "Australian Pull-ups / TRX Rows",
    "muscles_primary": [
      "Grand dorsal",
      "Rhomboïdes"
    ],
    "intent": [
      "endurance",
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [
      "Barre basse ou TRX / sangles de suspension"
    ],
    "warmup_target": null,
    "description": "Corps quasi horizontal sous barre fixe ou TRX. Tire la poitrine vers la barre. Régression utile avant pull-ups. Volume élevé possible."
  },
  {
    "id": "ex_pull_009",
    "category": "pull",
    "name": "Single Arm Dumbbell Row",
    "muscles_primary": [
      "Grand dorsal",
      "Rhomboïdes"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltère",
      "Banc"
    ],
    "warmup_target": null,
    "description": "Appui sur un banc, bras libre tire l'haltère vers la hanche. Focus sur rétraction finale et légère rotation du torse. Amplitude maximale."
  },
  {
    "id": "ex_pull_010",
    "category": "pull",
    "name": "Face Pulls",
    "muscles_primary": [
      "Deltoïde postérieur",
      "Trapèze"
    ],
    "intent": [
      "endurance",
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Câble avec corde ou bande élastique"
    ],
    "warmup_target": null,
    "description": "Câble à hauteur des yeux ou plus. Tirer vers le visage en ouvrant les coudes. Rotation externe en fin de mouvement. Santé épaule prioritaire."
  },
  {
    "id": "ex_pull_011",
    "category": "pull",
    "name": "Y Raises & W Raises (Plates)",
    "muscles_primary": [
      "Trapèze inférieur",
      "Deltoïde postérieur"
    ],
    "intent": [
      "endurance",
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Disques légers 2.5-5 kg",
      "Banc incliné"
    ],
    "warmup_target": null,
    "description": "Allongé face contre banc incliné. Y : bras en V vers le haut. W : coudes fléchis, rotation externe. Disques très légers. Référence physiothérapie épaule."
  },
  {
    "id": "ex_pull_012",
    "category": "pull",
    "name": "Prone Paddle Simulator",
    "muscles_primary": [
      "Érecteurs",
      "Deltoïde postérieur"
    ],
    "intent": [
      "endurance",
      "stabilite"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": true,
    "material_required": [
      "Tapis de sol (Swiss ball optionnel)"
    ],
    "warmup_target": null,
    "description": "Sur tapis, position prone. Simulation du mouvement de paddle surf : bras alternés en arc horizontal, torse légèrement soulevé. Pour surfeurs."
  },
  {
    "id": "ex_pull_013",
    "category": "pull",
    "name": "Straight Arm Lat Pulldown",
    "muscles_primary": [
      "Grand dorsal",
      "Serratus"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Câble haut ou bande élastique"
    ],
    "warmup_target": null,
    "description": "Câble ou élastique haut, bras tendus (légère flexion coude). Descendre les bras vers les hanches en gardant les coudes fixes. Isole le dorsal sans biceps."
  },
  {
    "id": "ex_arms_001",
    "category": "arms",
    "name": "Biceps Curls (Barbell)",
    "muscles_primary": [
      "Biceps brachii"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre droite ou EZ",
      "Disques"
    ],
    "warmup_target": null,
    "description": "Barre droite ou EZ, prise supination. Flexion pure, sans balancement. Poignets neutres. Coudes fixes contre le torse."
  },
  {
    "id": "ex_arms_002",
    "category": "arms",
    "name": "Alternate Biceps Curls (DB)",
    "muscles_primary": [
      "Biceps brachii"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères"
    ],
    "warmup_target": null,
    "description": "Haltères en alternance, supination en cours de mouvement. Active le chef long du biceps sur la torsion."
  },
  {
    "id": "ex_arms_003",
    "category": "arms",
    "name": "EZ Bar Curls (Alternating Width)",
    "muscles_primary": [
      "Biceps brachii",
      "Brachialis"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre EZ",
      "Disques"
    ],
    "warmup_target": null,
    "description": "Chaque set alterne entre prise serrée et large sur la barre EZ. Prise serrée : chef long. Prise large : chef court."
  },
  {
    "id": "ex_arms_004",
    "category": "arms",
    "name": "Hammer Curls",
    "muscles_primary": [
      "Brachialis",
      "Brachioradialis"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères"
    ],
    "warmup_target": null,
    "description": "Prise neutre (paumes face à face). Cible le brachialis et avant-bras. Peut se faire alterné ou simultané."
  },
  {
    "id": "ex_arms_005",
    "category": "arms",
    "name": "Zottman Curls",
    "muscles_primary": [
      "Biceps (montée)",
      "Brachioradialis (descente)"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères"
    ],
    "warmup_target": null,
    "description": "Montée en supination puis rotation du poignet en pronation avant la descente. Double stimulation : concentrique biceps, excentrique avant-bras."
  },
  {
    "id": "ex_arms_006",
    "category": "arms",
    "name": "Triceps Pushdown (Cable)",
    "muscles_primary": [
      "Triceps (chef latéral)"
    ],
    "intent": [
      "hypertrophie",
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Câble",
      "Barre droite ou corde"
    ],
    "warmup_target": null,
    "description": "Câble haut, barre droite ou corde. Coudes fixes, extension complète. Prise pronation standard. Fort volume possible."
  },
  {
    "id": "ex_arms_007",
    "category": "arms",
    "name": "Triceps Overhead (Cable)",
    "muscles_primary": [
      "Triceps (chef long)"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Câble",
      "Corde"
    ],
    "warmup_target": null,
    "description": "Câble derrière la tête, prise supination ou corde. Étirement complet du chef long en position haute. Coudes proches des oreilles."
  },
  {
    "id": "ex_arms_008",
    "category": "arms",
    "name": "Triceps Pushdown (Pronation Grip)",
    "muscles_primary": [
      "Triceps (chef latéral, médial)"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Câble",
      "Barre angled ou droite"
    ],
    "warmup_target": null,
    "description": "Même que pushdown mais prise inversée ou barre angled. Variation pour changer l'angle de force."
  },
  {
    "id": "ex_arms_009",
    "category": "arms",
    "name": "Skullcrushers (EZ Bar)",
    "muscles_primary": [
      "Triceps"
    ],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre EZ",
      "Disques",
      "Banc plat"
    ],
    "warmup_target": null,
    "description": "Allongé sur banc, barre EZ. Descente vers le front ou au-dessus du crâne, coudes fixes. Extension complète. Charge modérée, contrôle strict."
  },
  {
    "id": "ex_arms_010",
    "category": "arms",
    "name": "Bench Dips",
    "muscles_primary": [
      "Triceps"
    ],
    "intent": [
      "endurance",
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [
      "Banc ou chaise stable"
    ],
    "warmup_target": null,
    "description": "Mains sur un banc derrière soi, pieds au sol ou surélevés. Descente en fléchissant les coudes. Attention contrainte épaule en rotation interne."
  },
  {
    "id": "ex_legs_001",
    "category": "legs",
    "name": "Goblet Squat",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers"
    ],
    "intent": [
      "hypertrophie",
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Kettlebell ou haltère"
    ],
    "warmup_target": null,
    "description": "Haltère ou KB tenu en coupe devant la poitrine. Descente profonde, coudes entre les genoux. Excellent pour la mobilité de hanche et la technique squat."
  },
  {
    "id": "ex_legs_002",
    "category": "legs",
    "name": "Barbell Squat",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers"
    ],
    "intent": [
      "force"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "Rack",
      "Disques"
    ],
    "warmup_target": null,
    "description": "Barre en high bar ou low bar. Descente sous parallèle, genoux dans l'axe des orteils. Montée explosive. Fondateur Starting Strength."
  },
  {
    "id": "ex_legs_003",
    "category": "legs",
    "name": "Single Leg Romanian Deadlift",
    "muscles_primary": [
      "Ischio-jambiers",
      "Fessiers"
    ],
    "intent": [
      "hypertrophie",
      "stabilite"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères ou kettlebells"
    ],
    "warmup_target": null,
    "description": "Sur une jambe, haltères dans les mains. Charnière de hanche, dos plat. Torse parallèle au sol en bas. Charge excentrique ischio. Référence KOT."
  },
  {
    "id": "ex_legs_004",
    "category": "legs",
    "name": "Goblet Sumo Squat",
    "muscles_primary": [
      "Adducteurs",
      "Fessiers"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Kettlebell ou haltère"
    ],
    "warmup_target": null,
    "description": "Pieds larges en sumo, orteils à 45°. Haltère en coupe. Descente profonde. Cible adducteurs et fessiers plus que le goblet classique."
  },
  {
    "id": "ex_legs_005",
    "category": "legs",
    "name": "Barbell Sumo Squat",
    "muscles_primary": [
      "Adducteurs",
      "Fessiers",
      "Quadriceps"
    ],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "Rack",
      "Disques"
    ],
    "warmup_target": null,
    "description": "Écartement large, barre en position haute. Bon pour la mobilité de hanche et les adducteurs sous charge lourde."
  },
  {
    "id": "ex_legs_006",
    "category": "legs",
    "name": "Hip Thrust (Barbell)",
    "muscles_primary": [
      "Fessiers"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "Banc",
      "Disques",
      "Pad de protection"
    ],
    "warmup_target": null,
    "description": "Dos appuyé sur banc, barre sur les hanches. Extension complète de hanche en haut, contraction isométrique finale. Référence Bret Contreras."
  },
  {
    "id": "ex_legs_007",
    "category": "legs",
    "name": "Deadlift (Conventional)",
    "muscles_primary": [
      "Ischio-jambiers",
      "Fessiers",
      "Érecteurs"
    ],
    "intent": [
      "force"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "Disques",
      "Plateforme"
    ],
    "warmup_target": null,
    "description": "Pieds dans la largeur des hanches, barre au-dessus des mid-foot. Prise mixte ou crochet. Dos neutre. Starting Strength fondamental."
  },
  {
    "id": "ex_legs_008",
    "category": "legs",
    "name": "Sumo Deadlift",
    "muscles_primary": [
      "Adducteurs",
      "Fessiers",
      "Ischio-jambiers"
    ],
    "intent": [
      "force"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "Disques",
      "Plateforme"
    ],
    "warmup_target": null,
    "description": "Écartement très large, barre entre les jambes, prise pronation. Torse plus vertical. Bonne alternative pour morphologies courtes de buste."
  },
  {
    "id": "ex_legs_009",
    "category": "legs",
    "name": "Suitcase Deadlift",
    "muscles_primary": [
      "Carré des lombes",
      "Obliques"
    ],
    "intent": [
      "force",
      "stabilite"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltère ou kettlebell"
    ],
    "warmup_target": null,
    "description": "Haltère sur le côté (comme une valise). Anti-flexion latérale du core. Asymétrie utile pour corriger déséquilibres gauche/droite."
  },
  {
    "id": "ex_legs_010",
    "category": "legs",
    "name": "Zercher Squat",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers",
      "Core"
    ],
    "intent": [
      "force"
    ],
    "level": "avance",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "Rack",
      "Pad de coude optionnel"
    ],
    "warmup_target": null,
    "description": "Barre dans le creux des coudes, bras fléchis. Position très verticale du torse. Fort engagement du core. Référence Westside / Ed Coan."
  },
  {
    "id": "ex_legs_011",
    "category": "legs",
    "name": "Landmine Deadlift",
    "muscles_primary": [
      "Fessiers",
      "Ischio-jambiers",
      "Érecteurs"
    ],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre",
      "Support landmine ou angle de mur"
    ],
    "warmup_target": null,
    "description": "Barre insérée dans angle landmine. Mouvement en arc vers le haut. Axe de traction différent du DL classique, moins de stress lombaire."
  },
  {
    "id": "ex_legs_012",
    "category": "legs",
    "name": "Bulgarian Split Squat",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers"
    ],
    "intent": [
      "hypertrophie",
      "endurance"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères",
      "Banc"
    ],
    "warmup_target": null,
    "description": "Pied arrière surélevé sur banc, pied avant avancé. Descente verticale. Fort volume possible. Référence Jeremy Ethier unilatéral."
  },
  {
    "id": "ex_legs_013",
    "category": "legs",
    "name": "Seated Calf Raises",
    "muscles_primary": [
      "Soléaire"
    ],
    "intent": [
      "hypertrophie",
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Machine seated calf ou haltères + banc + step"
    ],
    "warmup_target": null,
    "description": "Genou à 90°. Le soléaire est plus actif en position fléchie. Amplitude complète : descente profonde, contraction max en haut."
  },
  {
    "id": "ex_legs_014",
    "category": "legs",
    "name": "Calf Raises (Standing)",
    "muscles_primary": [
      "Gastrocnémiens"
    ],
    "intent": [
      "hypertrophie",
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Machine standing ou haltères + step / marche"
    ],
    "warmup_target": null,
    "description": "Debout sur une marche. Descente lente (3-4s), montée explosive. Amplitude totale. Possible avec sac à dos lesté si pas de machine."
  },
  {
    "id": "ex_legs_015",
    "category": "legs",
    "name": "Single Leg Bridges",
    "muscles_primary": [
      "Fessiers"
    ],
    "intent": [
      "endurance",
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": null,
    "description": "Au sol, une jambe tendue, l'autre fléchie. Extension de hanche unilatérale. Régression du hip thrust. Bon pour activation pré-workout."
  },
  {
    "id": "ex_legs_016",
    "category": "legs",
    "name": "Frog Hip Thrust",
    "muscles_primary": [
      "Fessiers (fibres profondes)"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": null,
    "description": "Pieds joints plante contre plante (position grenouille). Flexion externe de hanche maximale. Cible différemment les fessiers. Référence Ben Patrick / KOT."
  },
  {
    "id": "ex_legs_017",
    "category": "legs",
    "name": "Side Leg Raises",
    "muscles_primary": [
      "Abducteurs",
      "TFL"
    ],
    "intent": [
      "endurance",
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": null,
    "description": "Allongé sur le côté ou debout. Élévation latérale contrôlée. Stabilisation bassin. Compatible rééducation genou."
  },
  {
    "id": "ex_core_f_001",
    "category": "core_strength",
    "name": "Leg Raises (Roman Chair)",
    "muscles_primary": [
      "Abdominaux",
      "Fléchisseurs hanches"
    ],
    "intent": [
      "force"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Roman chair / Captain's chair"
    ],
    "warmup_target": null,
    "description": "Bras appuyés sur les supports. Jambes tendues ou fléchies montées jusqu'à l'horizontale. Contrôle du balancement. Focus bas du ventre."
  },
  {
    "id": "ex_core_f_002",
    "category": "core_strength",
    "name": "Leg Raises (Bar)",
    "muscles_primary": [
      "Abdominaux",
      "Fléchisseurs hanches"
    ],
    "intent": [
      "force"
    ],
    "level": "avance",
    "bodyweight_compatible": true,
    "material_required": [
      "Barre de traction"
    ],
    "warmup_target": null,
    "description": "En suspension à la barre. Jambes tendues montées à 90° ou plus. Forte composante stabilisation épaule. Version avancée : L-sit hang."
  },
  {
    "id": "ex_core_f_003",
    "category": "core_strength",
    "name": "Ab Wheel Rollout",
    "muscles_primary": [
      "Rectus abdominis",
      "Serratus"
    ],
    "intent": [
      "force",
      "endurance"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Ab wheel"
    ],
    "warmup_target": null,
    "description": "Sur genoux ou debout (avancé). Roulement vers l'avant, extension maximale sans toucher le sol. Retour contrôlé. Fort activation core en allongement."
  },
  {
    "id": "ex_core_f_004",
    "category": "core_strength",
    "name": "Landmine Twists",
    "muscles_primary": [
      "Obliques"
    ],
    "intent": [
      "force",
      "explosivite"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre",
      "Support landmine ou angle de mur"
    ],
    "warmup_target": null,
    "description": "Barre tenue à bout de bras. Rotation du torse d'un côté à l'autre. Charge progressive possible. Utile pour sports de rotation (surf, raquette)."
  },
  {
    "id": "ex_core_f_005",
    "category": "core_strength",
    "name": "Kneeling Cable Crunch",
    "muscles_primary": [
      "Rectus abdominis"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Câble haut",
      "Corde"
    ],
    "warmup_target": null,
    "description": "À genoux face au câble, corde derrière la nuque. Flexion du torse vers le bas, coudes vers les genoux. Résistance constante. Pas de balancement."
  },
  {
    "id": "ex_core_f_006",
    "category": "core_strength",
    "name": "Seated Good Morning",
    "muscles_primary": [
      "Érecteurs",
      "Ischio-jambiers"
    ],
    "intent": [
      "force",
      "endurance"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre légère",
      "Banc"
    ],
    "warmup_target": null,
    "description": "Assis sur un banc, barre légère sur les épaules. Flexion de hanche vers l'avant, dos plat. Renforcement lombaire et mobilité."
  },
  {
    "id": "ex_core_f_007",
    "category": "core_strength",
    "name": "Hip Flexor KB Raises",
    "muscles_primary": [
      "Iliopsoas",
      "Rectus femoris"
    ],
    "intent": [
      "force",
      "endurance"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Kettlebell",
      "Banc ou chaise stable"
    ],
    "warmup_target": null,
    "description": "Assis ou en suspension, KB fixé sur le pied ou cheville. Élévation du genou contre résistance. Référence KOT / Ben Patrick."
  },
  {
    "id": "ex_core_e_001",
    "category": "core_endurance",
    "name": "Starfish Crunch",
    "muscles_primary": [
      "Rectus abdominis",
      "Obliques"
    ],
    "intent": [
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": null,
    "description": "Allongé, bras et jambes en étoile. Crunch en ramenant coude opposé au genou opposé. Enchaînement bilatéral en rythme HIIT. Référence Jeff Cavalière / AthleanX."
  },
  {
    "id": "ex_core_e_002",
    "category": "core_endurance",
    "name": "Russian Twist (HIIT)",
    "muscles_primary": [
      "Obliques"
    ],
    "intent": [
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [
      "Médecine ball ou haltère léger (optionnel)"
    ],
    "warmup_target": null,
    "description": "Assis à 45°, pieds levés. Rotation du torse alternée gauche-droite en rythme rapide. Mode HIIT : 30-45s non-stop."
  },
  {
    "id": "ex_core_e_003",
    "category": "core_endurance",
    "name": "Mountain Climbers",
    "muscles_primary": [
      "Core",
      "Fléchisseurs hanches"
    ],
    "intent": [
      "endurance",
      "cardio"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": null,
    "description": "Position de push-up, genoux amenés alternativement vers la poitrine en rythme rapide. Transition parfaite core → cardio."
  },
  {
    "id": "ex_core_e_004",
    "category": "core_endurance",
    "name": "Plank to Downward Dog",
    "muscles_primary": [
      "Core",
      "Épaules"
    ],
    "intent": [
      "endurance",
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": null,
    "description": "Alterné entre position planche et V inversé. Mobilité thoracique + gainage. Rythme lent pour contrôle ou rapide pour cardio."
  },
  {
    "id": "ex_core_e_005",
    "category": "core_endurance",
    "name": "Bicycle Crunches",
    "muscles_primary": [
      "Obliques",
      "Rectus abdominis"
    ],
    "intent": [
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": null,
    "description": "Allongé, pédalage alterné avec rotation coude-genou opposé. Rythme contrôlé cible mieux les obliques que rythme rapide."
  },
  {
    "id": "ex_core_e_006",
    "category": "core_endurance",
    "name": "Bear Crawl",
    "muscles_primary": [
      "Core global",
      "Épaules"
    ],
    "intent": [
      "endurance",
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": null,
    "description": "À quatre pattes, genoux à 5 cm du sol. Avancée alternée bras/jambe opposé sur 10-20 m. Gainage complet en mouvement."
  },
  {
    "id": "ex_exp_001",
    "category": "explosive",
    "name": "EMOM KB Swings",
    "muscles_primary": [
      "Fessiers",
      "Ischio-jambiers",
      "Core"
    ],
    "intent": [
      "explosivite",
      "endurance"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Kettlebell 16-24 kg"
    ],
    "warmup_target": null,
    "description": "Protocole EMOM. Swing bilatéral, hanches = moteur. Charge légère, vitesse > charge. 15-20 reps/minute."
  },
  {
    "id": "ex_exp_002",
    "category": "explosive",
    "name": "Box Squat into Jump (Barbell)",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers"
    ],
    "intent": [
      "explosivite"
    ],
    "level": "avance",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre légère (~30% 1RM)",
      "Rack",
      "Box basse"
    ],
    "warmup_target": null,
    "description": "Squat avec barre, pause sur box basse, extension explosive en saut. Charge très légère ou technique confirmée obligatoire."
  },
  {
    "id": "ex_exp_003",
    "category": "explosive",
    "name": "Hex Bar Jump Deadlift",
    "muscles_primary": [
      "Fessiers",
      "Quadriceps",
      "Ischio-jambiers"
    ],
    "intent": [
      "explosivite",
      "force"
    ],
    "level": "avance",
    "bodyweight_compatible": false,
    "material_required": [
      "Trap bar / Hex bar",
      "Disques"
    ],
    "warmup_target": null,
    "description": "Charge 30-40% du DL max. Triple extension explosive jusqu'au saut. Atterrissage absorbé. Référence force athlétique."
  },
  {
    "id": "ex_exp_004",
    "category": "explosive",
    "name": "Alternating Rotational Swings",
    "muscles_primary": [
      "Obliques",
      "Fessiers",
      "Épaules"
    ],
    "intent": [
      "explosivite",
      "endurance"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Kettlebell ou médecine ball"
    ],
    "warmup_target": null,
    "description": "Axe rotationnel (≠ swing sagittal). Rotation du torse + swing de côté à côté. Utile pour sports de raquette et surf."
  },
  {
    "id": "ex_exp_005",
    "category": "explosive",
    "name": "EMOM KB Snatch",
    "muscles_primary": [
      "Deltoïdes",
      "Fessiers",
      "Ischio-jambiers"
    ],
    "intent": [
      "explosivite",
      "endurance"
    ],
    "level": "avance",
    "bodyweight_compatible": false,
    "material_required": [
      "Kettlebell (charge légère)"
    ],
    "warmup_target": null,
    "description": "Arraché KB unilatéral. Protocole EMOM. 8-10 reps/bras/minute. Cardiorespiratoire intense. Aucune charge si technique non maîtrisée."
  },
  {
    "id": "ex_exp_006",
    "category": "explosive",
    "name": "Jump Rope",
    "muscles_primary": [
      "Mollets",
      "Fléchisseurs hanches"
    ],
    "intent": [
      "endurance",
      "cardio"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [
      "Corde à sauter (simulable sans corde pour débutant)"
    ],
    "warmup_target": null,
    "description": "Si maîtrisé : double-unders, alternance pieds. Si débutant : saut sur place rythmé. Objectif : vitesse, pas la charge."
  },
  {
    "id": "ex_complex_001",
    "category": "complex",
    "name": "DB Squat to Push Press",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers",
      "Deltoïdes"
    ],
    "intent": [
      "force",
      "explosivite"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères"
    ],
    "warmup_target": null,
    "description": "DB en position de rack. Squat profond, remontée explosive servant de relance pour le press overhead. Mouvement continu. Charge modérée."
  },
  {
    "id": "ex_complex_002",
    "category": "complex",
    "name": "DB Romanian Deadlift to Alternate Biceps Curls",
    "muscles_primary": [
      "Ischio-jambiers",
      "Fessiers",
      "Biceps"
    ],
    "intent": [
      "hypertrophie",
      "force"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères"
    ],
    "warmup_target": null,
    "description": "RDL jusqu'en bas, puis à la remontée enchaîner un curl alterné par bras. Double stimulus postérieur + fléchisseurs. Charge limitée par le curl."
  },
  {
    "id": "ex_complex_003",
    "category": "complex",
    "name": "DB Hang Clean to Front Squat to Push Press",
    "muscles_primary": [
      "Fessiers",
      "Ischio-jambiers",
      "Quadriceps",
      "Deltoïdes"
    ],
    "intent": [
      "explosivite",
      "force"
    ],
    "level": "avance",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères (charge légère 30-40%)"
    ],
    "warmup_target": null,
    "description": "Triple mouvement : clean depuis position suspendue → squat avant → push press. Chaîne cinétique complète."
  },
  {
    "id": "ex_complex_004",
    "category": "complex",
    "name": "Renegade Row + Push-up",
    "muscles_primary": [
      "Grand dorsal",
      "Pectoraux",
      "Core"
    ],
    "intent": [
      "force",
      "stabilite"
    ],
    "level": "avance",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères hexagonaux (recommandés)"
    ],
    "warmup_target": null,
    "description": "Push-up → row bras droit → row bras gauche. Anti-rotation core maximal. Haltères hexagonaux pour stabilité au sol."
  },
  {
    "id": "ex_complex_005",
    "category": "complex",
    "name": "KB Turkish Get-Up",
    "muscles_primary": [
      "Core global",
      "Épaules"
    ],
    "intent": [
      "force",
      "stabilite",
      "mobilite"
    ],
    "level": "avance",
    "bodyweight_compatible": false,
    "material_required": [
      "Kettlebell"
    ],
    "warmup_target": null,
    "description": "KB tenu à bout de bras tout au long. Passage de allongé → assis → genou → debout → retour. Complexité motrice maximale."
  },
  {
    "id": "ex_complex_006",
    "category": "complex",
    "name": "DB Reverse Lunge to Biceps Curl",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers",
      "Biceps"
    ],
    "intent": [
      "hypertrophie",
      "endurance"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères"
    ],
    "warmup_target": null,
    "description": "Fente arrière, puis à la remontée enchaîner un curl alterné. Coordination haut/bas du corps. Charge limitée par le curl."
  },
  {
    "id": "ex_complex_007",
    "category": "complex",
    "name": "KB Swing to Goblet Squat",
    "muscles_primary": [
      "Fessiers",
      "Ischio-jambiers",
      "Quadriceps",
      "Core"
    ],
    "intent": [
      "explosivite",
      "force"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Kettlebell"
    ],
    "warmup_target": null,
    "description": "Swing bilatéral → attraper la KB en position goblet → squat profond contrôlé. Transition ballistique → contrôlé."
  },
  {
    "id": "ex_cond_001",
    "category": "conditioning",
    "name": "Jump Squat → Fentes Sautées → KB Swing",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers",
      "Ischio-jambiers",
      "Core"
    ],
    "intent": [
      "explosivite",
      "endurance",
      "cardio"
    ],
    "level": "avance",
    "bodyweight_compatible": false,
    "material_required": [
      "Kettlebell 16-20 kg"
    ],
    "warmup_target": null,
    "description": "10 jump squats → 10 fentes sautées → 15 KB swings. Repos 60-90s. ×3-4 rounds. Charge légère. Objectif VO2max + puissance."
  },
  {
    "id": "ex_cond_002",
    "category": "conditioning",
    "name": "Barbell Bear Complex",
    "muscles_primary": [
      "Fessiers",
      "Ischio-jambiers",
      "Quadriceps",
      "Deltoïdes"
    ],
    "intent": [
      "endurance",
      "force"
    ],
    "level": "avance",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "Disques (40-50% squat max)"
    ],
    "warmup_target": null,
    "description": "RDL → Hang clean → Front squat → Push press → Back squat. Sans poser la barre. ×5 cycles = 1 round. AMRAP ou EMOM possible."
  },
  {
    "id": "ex_cond_003",
    "category": "conditioning",
    "name": "DB Thruster → Renegade Row → Farmer Carry",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers",
      "Deltoïdes",
      "Grand dorsal"
    ],
    "intent": [
      "force",
      "endurance",
      "cardio"
    ],
    "level": "avance",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères (même charge pour tout l'enchaînement)"
    ],
    "warmup_target": null,
    "description": "10 thrusters → 8 renegade rows → 20 m farmer carry. Circuit métabolique complet."
  },
  {
    "id": "ex_cond_004",
    "category": "conditioning",
    "name": "Burpee Pull-up → Jump Squat → Explosive Push-up (AMRAP)",
    "muscles_primary": [
      "Full body"
    ],
    "intent": [
      "endurance",
      "explosivite",
      "cardio"
    ],
    "level": "avance",
    "bodyweight_compatible": true,
    "material_required": [
      "Barre basse pour burpee pull-up"
    ],
    "warmup_target": null,
    "description": "AMRAP 8 min : 5 burpee pull-ups → 8 jump squats → 6 push-ups explosifs. Score = nombre de rounds."
  },
  {
    "id": "ex_warmup_001",
    "category": "warmup",
    "name": "90/90 Hip Stretch",
    "muscles_primary": [
      "Fléchisseurs hanches",
      "Rotateurs externes"
    ],
    "intent": [
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": [
      "squat",
      "legs"
    ],
    "description": "Position 90/90 au sol, bascule d'un côté à l'autre. 60s chaque côté. Ouvre la capsule de hanche avant squat profond."
  },
  {
    "id": "ex_warmup_002",
    "category": "warmup",
    "name": "Ankle Mobilization (Wall)",
    "muscles_primary": [
      "Tibialis antérieur",
      "Mollets"
    ],
    "intent": [
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": [
      "squat",
      "legs"
    ],
    "description": "Pied près du mur, genou poussé vers l'avant. 10×/côté. Améliore la dorsiflexion = squat plus profond."
  },
  {
    "id": "ex_warmup_003",
    "category": "warmup",
    "name": "Hip Airplanes",
    "muscles_primary": [
      "Fessiers",
      "Rotateurs hip"
    ],
    "intent": [
      "mobilite",
      "stabilite"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": [
      "squat",
      "legs",
      "single_leg"
    ],
    "description": "En appui sur une jambe, rotation du bassin. 8/côté. Contrôle pelvien avant squat unipodal."
  },
  {
    "id": "ex_warmup_004",
    "category": "warmup",
    "name": "Pause Box Squat (Empty Bar)",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers"
    ],
    "intent": [
      "mobilite",
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre vide",
      "Box ou banc"
    ],
    "warmup_target": [
      "squat"
    ],
    "description": "3×3 descente lente 3s, pause 2s sur la box, remontée. Groove le pattern squat. Référence Squat University."
  },
  {
    "id": "ex_warmup_005",
    "category": "warmup",
    "name": "Cat-Camel",
    "muscles_primary": [
      "Érecteurs lombaires"
    ],
    "intent": [
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": [
      "deadlift"
    ],
    "description": "10 reps lentes, cycle flexion-extension vertébrale. Mobilise les vertèbres thoraciques et lombaires."
  },
  {
    "id": "ex_warmup_006",
    "category": "warmup",
    "name": "Hip Hinge Wall Drill",
    "muscles_primary": [
      "Ischio-jambiers",
      "Fessiers"
    ],
    "intent": [
      "mobilite",
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": [
      "deadlift"
    ],
    "description": "Fesse contre le mur, 10 reps. Groove le schéma de charnière de hanche sans charge. Fondamental Starting Strength."
  },
  {
    "id": "ex_warmup_007",
    "category": "warmup",
    "name": "Banded Good Morning",
    "muscles_primary": [
      "Ischio-jambiers",
      "Érecteurs",
      "Fessiers"
    ],
    "intent": [
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Bande élastique"
    ],
    "warmup_target": [
      "deadlift"
    ],
    "description": "Bande sur les épaules, 10 reps légères. Activation de la chaîne postérieure avant DL."
  },
  {
    "id": "ex_warmup_008",
    "category": "warmup",
    "name": "Band Pull-Aparts",
    "muscles_primary": [
      "Deltoïde postérieur",
      "Rhomboïdes"
    ],
    "intent": [
      "endurance",
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Bande élastique"
    ],
    "warmup_target": [
      "push",
      "bench"
    ],
    "description": "Bande à hauteur des yeux, tirer en écartant les bras. 3×15. Activation rétracteurs scapulaires avant press."
  },
  {
    "id": "ex_warmup_009",
    "category": "warmup",
    "name": "Serratus Push-ups",
    "muscles_primary": [
      "Serratus anterior"
    ],
    "intent": [
      "stabilite",
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": [
      "push",
      "bench"
    ],
    "description": "Push-up normal puis protraction maximale de l'omoplate en haut. Active le serratus souvent inhibé."
  },
  {
    "id": "ex_warmup_010",
    "category": "warmup",
    "name": "Shoulder CARs",
    "muscles_primary": [
      "Capsule articulaire épaule"
    ],
    "intent": [
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": [
      "push",
      "ohp"
    ],
    "description": "Rotations articulaires contrôlées en amplitude maximale. 5 reps chaque sens. Référence FRC / physiothérapie."
  },
  {
    "id": "ex_warmup_011",
    "category": "warmup",
    "name": "Cuban Press (Light)",
    "muscles_primary": [
      "Deltoïdes",
      "Rotateurs externes"
    ],
    "intent": [
      "mobilite",
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères légers ou bande élastique"
    ],
    "warmup_target": [
      "ohp"
    ],
    "description": "Row → rotation externe → press. 2×10. Warmup spécifique OHP qui active toute la coiffe des rotateurs."
  },
  {
    "id": "ex_warmup_012",
    "category": "warmup",
    "name": "Dead Hang Passif",
    "muscles_primary": [
      "Grand dorsal",
      "Capsule épaule"
    ],
    "intent": [
      "mobilite",
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [
      "Barre de traction"
    ],
    "warmup_target": [
      "pull"
    ],
    "description": "30s en suspension passive. Décompression vertébrale. Étirement grand dorsal et capsule inférieure."
  },
  {
    "id": "ex_warmup_013",
    "category": "warmup",
    "name": "Scapular Retractions (Dead Hang)",
    "muscles_primary": [
      "Rhomboïdes",
      "Trapèze inférieur"
    ],
    "intent": [
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [
      "Barre de traction"
    ],
    "warmup_target": [
      "pull"
    ],
    "description": "En suspension, rétraction et dépression des omoplates sans fléchir les coudes. 2×10. Base santé épaule."
  },
  {
    "id": "ex_warmup_014",
    "category": "warmup",
    "name": "Band Dislocates",
    "muscles_primary": [
      "Capsule épaule",
      "Deltoïdes"
    ],
    "intent": [
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Bande élastique longue"
    ],
    "warmup_target": [
      "pull",
      "ohp"
    ],
    "description": "Bande tenue large devant, passer derrière la tête et retour. Amplitude overhead maximale."
  },
  {
    "id": "ex_warmup_015",
    "category": "warmup",
    "name": "Thoracic Extension (Foam Roller)",
    "muscles_primary": [
      "Érecteurs thoraciques"
    ],
    "intent": [
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Foam roller"
    ],
    "warmup_target": [
      "ohp",
      "all"
    ],
    "description": "Foam roller sous la thoracique, extension par gravité. Libère le segment T4-T8. 10 reps par position."
  },
  {
    "id": "ex_warmup_016",
    "category": "warmup",
    "name": "Wall Slides",
    "muscles_primary": [
      "Deltoïdes",
      "Serratus",
      "Rhomboïdes"
    ],
    "intent": [
      "mobilite",
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": [
      "ohp",
      "push"
    ],
    "description": "Dos et bras contre un mur, glisser les bras vers le haut. Scapulas collées au mur. 3×10. Corrige impingement."
  },
  {
    "id": "ex_warmup_017",
    "category": "warmup",
    "name": "L-Raises with Disk",
    "muscles_primary": [
      "Deltoïde postérieur",
      "Infraspinatus"
    ],
    "intent": [
      "endurance",
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Disques légers 2.5-5 kg"
    ],
    "warmup_target": [
      "pull",
      "ohp"
    ],
    "description": "Coude à 90°, rotation externe avec disque léger. Renforcement coiffe des rotateurs. 2×12/bras."
  },
  {
    "id": "ex_finisher_001",
    "category": "finisher",
    "name": "Burpees",
    "muscles_primary": [
      "Full body"
    ],
    "intent": [
      "endurance",
      "cardio"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": null,
    "description": "4×10 ou AMRAP 3 min. Drop en push-up + saut en haut. Variante : burpee pull-up pour plus de défi."
  },
  {
    "id": "ex_finisher_002",
    "category": "finisher",
    "name": "Jump Squats",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers"
    ],
    "intent": [
      "explosivite",
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": null,
    "description": "4×12, poids du corps. Descente squat → saut explosif. Atterrissage amorti sur avant-pied."
  },
  {
    "id": "ex_finisher_003",
    "category": "finisher",
    "name": "Fentes Sautées",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers"
    ],
    "intent": [
      "explosivite",
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "warmup_target": null,
    "description": "3×10/jambe. Ciseau en l'air. Atterrissage absorbé en fente. Excellent cardio bas corps."
  },
  {
    "id": "ex_finisher_004",
    "category": "finisher",
    "name": "Jump Rope (Finisher)",
    "muscles_primary": [
      "Mollets",
      "Coordination",
      "Cardio"
    ],
    "intent": [
      "endurance",
      "cardio"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [
      "Corde à sauter"
    ],
    "warmup_target": null,
    "description": "3×1 min ou 5×30s. Si débutant : saut sur place rythmé sans corde. Fréquence cardiaque élevée rapidement."
  },
  {
    "id": "ex_finisher_005",
    "category": "finisher",
    "name": "KB Swings (Finisher)",
    "muscles_primary": [
      "Fessiers",
      "Ischio-jambiers",
      "Core"
    ],
    "intent": [
      "explosivite",
      "endurance"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Kettlebell"
    ],
    "warmup_target": null,
    "description": "4×15 reps. Charge modérée. Focus vitesse et extension hanches. Dernier push énergétique en fin de séance."
  },
  {
    "id": "ex_finisher_006",
    "category": "finisher",
    "name": "KB Snatch (Finisher)",
    "muscles_primary": [
      "Full body"
    ],
    "intent": [
      "explosivite",
      "endurance"
    ],
    "level": "avance",
    "bodyweight_compatible": false,
    "material_required": [
      "Kettlebell (charge légère)"
    ],
    "warmup_target": null,
    "description": "3×8/bras. Arraché complet KB. Complexité technique élevée. Charge légère prioritaire sur la technique."
  },
  {
    "id": "ex_finisher_007",
    "category": "finisher",
    "name": "Battle Rope (Alternating)",
    "muscles_primary": [
      "Épaules",
      "Core"
    ],
    "intent": [
      "endurance",
      "cardio"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Battle rope (~10-15 m)"
    ],
    "warmup_target": null,
    "description": "3×30s max intensity. Ondes alternées. Cardio bras en fin de séance."
  },
  {
    "id": "ex_finisher_008",
    "category": "finisher",
    "name": "Farmer Carry",
    "muscles_primary": [
      "Avant-bras",
      "Trapèze",
      "Core"
    ],
    "intent": [
      "force",
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères lourds ou kettlebells"
    ],
    "warmup_target": null,
    "description": "3×40 m avec haltères lourds. Gainage debout, pas stable. Finisher silencieux mais brutal."
  }
];

export const FEEDBACK_POLL_QUESTIONS: FeedbackPollQuestion[] = [
  {
    "id": "fp_q1",
    "poll_id": "feedback_poll_v1",
    "question_number": 1,
    "text": "Êtes-vous satisfait(e) de vos résultats par rapport à vos objectifs initiaux ?",
    "type": "scale_1_5",
    "stores_as": "score_q1",
    "stores_factor_as": null,
    "scoring_rule": null,
    "subscale": null
  },
  {
    "id": "fp_q2",
    "poll_id": "feedback_poll_v1",
    "question_number": 2,
    "text": "Quel aspect du program a été le plus challenging ?",
    "type": "qcm_with_subscale",
    "stores_as": "score_q2",
    "stores_factor_as": "q2_factor",
    "scoring_rule": "if F selected → score=5 | else score = 5 - sub_scale_value",
    "subscale": {
      "text": "À quel point ce facteur a-t-il affecté votre satisfaction ?",
      "options": [
        {
          "value": 1,
          "label": "Pas du tout",
          "sublabel": "Mineur"
        },
        {
          "value": 2,
          "label": "Un peu",
          "sublabel": "Modéré"
        },
        {
          "value": 3,
          "label": "Beaucoup",
          "sublabel": "Majeur"
        }
      ]
    }
  },
  {
    "id": "fp_q3",
    "poll_id": "feedback_poll_v1",
    "question_number": 3,
    "text": "Compte tenu de vos résultats, quel est votre objectif principal pour le prochain cycle ?",
    "type": "single_choice",
    "stores_as": "q3_new_objective",
    "stores_factor_as": null,
    "scoring_rule": null,
    "subscale": null
  }
];

export const FEEDBACK_POLL_OPTIONS: FeedbackPollOption[] = [
  {
    "id": "fp_q1_1",
    "question_id": "fp_q1",
    "value": "1",
    "label": "⭐ Très insatisfait(e)",
    "sublabel": "Je n'ai pas atteint mes objectifs",
    "numeric_value": 1,
    "has_subscale": false,
    "fixed_score": null,
    "maps_to_variant": [],
    "maps_to_program_id": null,
    "triggers_alternative_pitch": false
  },
  {
    "id": "fp_q1_2",
    "question_id": "fp_q1",
    "value": "2",
    "label": "⭐⭐ Insatisfait(e)",
    "sublabel": "Quelques résultats mais insuffisants",
    "numeric_value": 2,
    "has_subscale": false,
    "fixed_score": null,
    "maps_to_variant": [],
    "maps_to_program_id": null,
    "triggers_alternative_pitch": false
  },
  {
    "id": "fp_q1_3",
    "question_id": "fp_q1",
    "value": "3",
    "label": "⭐⭐⭐ Satisfait(e)",
    "sublabel": "Résultats corrects mais aurais aimé plus",
    "numeric_value": 3,
    "has_subscale": false,
    "fixed_score": null,
    "maps_to_variant": [],
    "maps_to_program_id": null,
    "triggers_alternative_pitch": false
  },
  {
    "id": "fp_q1_4",
    "question_id": "fp_q1",
    "value": "4",
    "label": "⭐⭐⭐⭐ Très satisfait(e)",
    "sublabel": "Excellents résultats",
    "numeric_value": 4,
    "has_subscale": false,
    "fixed_score": null,
    "maps_to_variant": [],
    "maps_to_program_id": null,
    "triggers_alternative_pitch": false
  },
  {
    "id": "fp_q1_5",
    "question_id": "fp_q1",
    "value": "5",
    "label": "⭐⭐⭐⭐⭐ Extrêmement satisfait(e)",
    "sublabel": "Dépassé mes attentes",
    "numeric_value": 5,
    "has_subscale": false,
    "fixed_score": null,
    "maps_to_variant": [],
    "maps_to_program_id": null,
    "triggers_alternative_pitch": false
  },
  {
    "id": "fp_q2_a",
    "question_id": "fp_q2",
    "value": "difficulty",
    "label": "A) Difficulté physique",
    "sublabel": "Intensité trop haute/basse",
    "numeric_value": null,
    "has_subscale": true,
    "fixed_score": null,
    "maps_to_variant": [
      "intensity_down"
    ],
    "maps_to_program_id": null,
    "triggers_alternative_pitch": false
  },
  {
    "id": "fp_q2_b",
    "question_id": "fp_q2",
    "value": "time",
    "label": "B) Temps disponible",
    "sublabel": "Séances trop longues/courtes",
    "numeric_value": null,
    "has_subscale": true,
    "fixed_score": null,
    "maps_to_variant": [
      "frequency_down"
    ],
    "maps_to_program_id": null,
    "triggers_alternative_pitch": false
  },
  {
    "id": "fp_q2_c",
    "question_id": "fp_q2",
    "value": "boredom",
    "label": "C) Ennui",
    "sublabel": "Exercices répétitifs, manque de variation",
    "numeric_value": null,
    "has_subscale": true,
    "fixed_score": null,
    "maps_to_variant": [
      "exercise_variation",
      "split_variation",
      "intensity_up",
      "frequency_up"
    ],
    "maps_to_program_id": null,
    "triggers_alternative_pitch": true
  },
  {
    "id": "fp_q2_d",
    "question_id": "fp_q2",
    "value": "equipment",
    "label": "D) Équipement",
    "sublabel": "Accès insuffisant à l'équipement",
    "numeric_value": null,
    "has_subscale": true,
    "fixed_score": null,
    "maps_to_variant": [
      "exercise_variation"
    ],
    "maps_to_program_id": null,
    "triggers_alternative_pitch": false
  },
  {
    "id": "fp_q2_e",
    "question_id": "fp_q2",
    "value": "recovery",
    "label": "E) Récupération",
    "sublabel": "Fatigue, manque de repos",
    "numeric_value": null,
    "has_subscale": true,
    "fixed_score": null,
    "maps_to_variant": [
      "frequency_down",
      "intensity_down"
    ],
    "maps_to_program_id": null,
    "triggers_alternative_pitch": false
  },
  {
    "id": "fp_q2_f",
    "question_id": "fp_q2",
    "value": "nothing",
    "label": "F) Rien",
    "sublabel": "Tout s'est bien passé !",
    "numeric_value": null,
    "has_subscale": false,
    "fixed_score": 5,
    "maps_to_variant": [],
    "maps_to_program_id": null,
    "triggers_alternative_pitch": false
  },
  {
    "id": "fp_q3_a",
    "question_id": "fp_q3",
    "value": "aesthetics",
    "label": "A) Esthétique",
    "sublabel": "Continuer à construire du muscle, améliorer l'apparence",
    "numeric_value": null,
    "has_subscale": false,
    "fixed_score": null,
    "maps_to_variant": [],
    "maps_to_program_id": "program_muscle_building",
    "triggers_alternative_pitch": false
  },
  {
    "id": "fp_q3_b",
    "question_id": "fp_q3",
    "value": "strength",
    "label": "B) Force",
    "sublabel": "Augmenter ma force maximale",
    "numeric_value": null,
    "has_subscale": false,
    "fixed_score": null,
    "maps_to_variant": [],
    "maps_to_program_id": "program_strength",
    "triggers_alternative_pitch": false
  },
  {
    "id": "fp_q3_c",
    "question_id": "fp_q3",
    "value": "performance",
    "label": "C) Athlétique",
    "sublabel": "Améliorer ma performance, explosivité, cardio",
    "numeric_value": null,
    "has_subscale": false,
    "fixed_score": null,
    "maps_to_variant": [],
    "maps_to_program_id": "program_athletic",
    "triggers_alternative_pitch": false
  },
  {
    "id": "fp_q3_d",
    "question_id": "fp_q3",
    "value": "efficiency",
    "label": "D) Efficacité",
    "sublabel": "Rester efficace avec le temps limité",
    "numeric_value": null,
    "has_subscale": false,
    "fixed_score": null,
    "maps_to_variant": [],
    "maps_to_program_id": "program_lactate",
    "triggers_alternative_pitch": false
  },
  {
    "id": "fp_q3_e",
    "question_id": "fp_q3",
    "value": "complete",
    "label": "E) Complet",
    "sublabel": "Développer tous les aspects (force, muscle, cardio, mobilité)",
    "numeric_value": null,
    "has_subscale": false,
    "fixed_score": null,
    "maps_to_variant": [],
    "maps_to_program_id": null,
    "triggers_alternative_pitch": false
  }
];
