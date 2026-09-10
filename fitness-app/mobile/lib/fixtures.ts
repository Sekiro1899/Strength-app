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
    "session_structure": "split",
    "has_core_block": true,
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
    "session_structure": "split",
    "has_core_block": true,
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
    "session_structure": "split",
    "has_core_block": true,
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
      "full_body"
    ],
    "default_protocol": "full_body",
    "session_structure": "circuit",
    "has_core_block": false,
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
    "duration_weeks": 8,
    "is_continuous": false,
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
    "session_structure": "circuit",
    "has_core_block": false,
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
  },
  {
    "id": "lcf_phase_1",
    "program_id": "program_lactate",
    "phase_number": 1,
    "name": "Base Lactique",
    "duration_weeks": 2,
    "objective": "Installer la tolérance à l'accumulation lactique",
    "approach": "Densité modérée, apprentissage des enchaînements",
    "rep_range_min": 8,
    "rep_range_max": 10,
    "sets_compounds": 3,
    "sets_isolation": 2,
    "load_pct_1rm": null,
    "rest_sec_min": 60,
    "rest_sec_max": 75,
    "progression_rule": "Maîtriser les enchaînements avant d'augmenter la densité",
    "notes": "Repos plus longs le temps d'installer la technique"
  },
  {
    "id": "lcf_phase_2",
    "program_id": "program_lactate",
    "phase_number": 2,
    "name": "Densification",
    "duration_weeks": 4,
    "objective": "Réduire les temps de repos à volume constant",
    "approach": "Supersets lourds, repos décroissants",
    "rep_range_min": 8,
    "rep_range_max": 10,
    "sets_compounds": 4,
    "sets_isolation": 3,
    "load_pct_1rm": null,
    "rest_sec_min": 45,
    "rest_sec_max": 60,
    "progression_rule": "-5s de repos par semaine, charge constante",
    "notes": "Cœur du cycle — la densité est la variable de progression"
  },
  {
    "id": "lcf_phase_3",
    "program_id": "program_lactate",
    "phase_number": 3,
    "name": "Peak & Deload",
    "duration_weeks": 2,
    "objective": "Pic de densité puis récupération",
    "approach": "1 semaine de pic, 1 semaine allégée",
    "rep_range_min": 8,
    "rep_range_max": 10,
    "sets_compounds": 4,
    "sets_isolation": 2,
    "load_pct_1rm": null,
    "rest_sec_min": 45,
    "rest_sec_max": 90,
    "progression_rule": "Semaine 7 = pic, semaine 8 = deload -40%",
    "notes": "Clôture le cycle et prépare le feedback"
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
    "id": "ARM-028",
    "category": "arms",
    "name": "Biceps Curls (Barbell)",
    "muscles_primary": [
      "Biceps brachii"
    ],
    "muscles_secondary": [
      "Brachialis",
      "Avant-bras"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre droite ou EZ",
      "disques"
    ],
    "equipment_tags": [
      "barbell",
      "plate"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Barre droite ou EZ, prise supination. Flexion pure, sans balancement. Poignets neutres. Coudes fixes contre le torse.",
    "exercise_type": "isolation",
    "movement_pattern": null,
    "movement_family": "elbow_flexion",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "ARM-029",
    "category": "arms",
    "name": "Alternate Biceps Curls (DB)",
    "muscles_primary": [
      "Biceps brachii"
    ],
    "muscles_secondary": [
      "Brachialis"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères"
    ],
    "equipment_tags": [
      "dumbbell"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "Haltères en alternance, supination en cours de mouvement. Active le chef long du biceps sur la torsion.",
    "exercise_type": "isolation",
    "movement_pattern": null,
    "movement_family": "elbow_flexion",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "ARM-030",
    "category": "arms",
    "name": "EZ Bar Curls (Alternating Width)",
    "muscles_primary": [
      "Biceps brachii",
      "Brachialis"
    ],
    "muscles_secondary": [
      "Avant-bras"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre EZ",
      "disques"
    ],
    "equipment_tags": [
      "barbell",
      "plate"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Chaque set alterne entre prise serrée et large sur la barre EZ. Prise serrée : chef long. Prise large : chef court.",
    "exercise_type": "isolation",
    "movement_pattern": null,
    "movement_family": "elbow_flexion",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "ARM-031",
    "category": "arms",
    "name": "Hammer Curls",
    "muscles_primary": [
      "Brachialis",
      "Brachioradialis"
    ],
    "muscles_secondary": [
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
    "equipment_tags": [
      "dumbbell"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "Prise neutre (paumes face à face). Cible le brachialis et avant-bras. Peut se faire alterné ou simultané.",
    "exercise_type": "isolation",
    "movement_pattern": null,
    "movement_family": "elbow_flexion",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "ARM-032",
    "category": "arms",
    "name": "Zottman Curls",
    "muscles_primary": [
      "Biceps (montée)",
      "Brachioradialis (descente)"
    ],
    "muscles_secondary": [
      "Avant-bras"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères"
    ],
    "equipment_tags": [
      "dumbbell"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "Montée en supination puis rotation du poignet en pronation avant la descente. Double stimulation : concentrique biceps, excentrique avant-bras.",
    "exercise_type": "isolation",
    "movement_pattern": null,
    "movement_family": "elbow_flexion",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "ARM-033",
    "category": "arms",
    "name": "Triceps Pushdown (Cable)",
    "muscles_primary": [
      "Triceps (chef latéral)"
    ],
    "muscles_secondary": [],
    "intent": [
      "hypertrophie",
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Câble",
      "barre droite ou corde"
    ],
    "equipment_tags": [
      "cable",
      "barbell"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Câble haut, barre droite ou corde. Coudes fixes, extension complète. Prise pronation standard. Fort volume possible.",
    "exercise_type": "isolation",
    "movement_pattern": null,
    "movement_family": "elbow_extension",
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "ARM-034",
    "category": "arms",
    "name": "Triceps Overhead (Cable)",
    "muscles_primary": [
      "Triceps (chef long)"
    ],
    "muscles_secondary": [],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Câble",
      "corde"
    ],
    "equipment_tags": [
      "cable",
      "rope"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Câble derrière la tête, prise supination ou corde. Étirement complet du chef long en position haute. Coudes proches des oreilles.",
    "exercise_type": "isolation",
    "movement_pattern": null,
    "movement_family": "elbow_extension",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "ARM-035",
    "category": "arms",
    "name": "Triceps Pushdown (Pronation Grip)",
    "muscles_primary": [
      "Triceps (chef latéral",
      "médial)"
    ],
    "muscles_secondary": [],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Câble",
      "barre angled ou droite"
    ],
    "equipment_tags": [
      "cable",
      "barbell"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Même que pushdown mais prise inversée ou barre angled. Variation pour changer l'angle de force.",
    "exercise_type": "isolation",
    "movement_pattern": null,
    "movement_family": "elbow_extension",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "ARM-036",
    "category": "arms",
    "name": "Skullcrushers (EZ Bar)",
    "muscles_primary": [
      "Triceps"
    ],
    "muscles_secondary": [],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre EZ",
      "disques",
      "banc plat"
    ],
    "equipment_tags": [
      "barbell",
      "plate",
      "bench"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Allongé sur banc, barre EZ. Descente vers le front ou au-dessus du crâne, coudes fixes. Extension complète. Charge modérée, contrôle strict.",
    "exercise_type": "isolation",
    "movement_pattern": null,
    "movement_family": "elbow_extension",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "ARM-037",
    "category": "arms",
    "name": "Bench Dips",
    "muscles_primary": [
      "Triceps"
    ],
    "muscles_secondary": [
      "Deltoïde ant.",
      "Pectoraux inf."
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
    "equipment_tags": [
      "bench"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Mains sur un banc derrière soi, pieds au sol ou surélevés. Descente en fléchissant les coudes. Attention contrainte épaule en rotation interne.",
    "exercise_type": "isolation",
    "movement_pattern": null,
    "movement_family": "elbow_extension",
    "is_regression": true,
    "target_programs": [
      "program_bodyweight",
      "program_lactate",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COM-074",
    "category": "complex",
    "name": "DB Squat to Push Press",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers",
      "Deltoïdes"
    ],
    "muscles_secondary": [
      "Triceps",
      "Core"
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
    "equipment_tags": [
      "dumbbell"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "DB en position de rack. Squat profond, remontée explosive servant de relance pour le press overhead. Mouvement continu. Charge modérée.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_athletic",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COM-075",
    "category": "complex",
    "name": "DB Romanian Deadlift to Alternate Biceps Curls",
    "muscles_primary": [
      "Ischio-jambiers",
      "Fessiers",
      "Biceps"
    ],
    "muscles_secondary": [
      "Érecteurs",
      "Avant-bras"
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
    "equipment_tags": [
      "dumbbell"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "RDL jusqu'en bas, puis à la remontée enchaîner un curl alterné par bras. Double stimulus postérieur + fléchisseurs. Charge limitée par le curl.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_muscle_building",
      "program_athletic",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COM-076",
    "category": "complex",
    "name": "DB Hang Clean to Front Squat to Push Press",
    "muscles_primary": [
      "Fessiers",
      "Ischio",
      "Quadriceps",
      "Deltoïdes"
    ],
    "muscles_secondary": [
      "Core",
      "Triceps",
      "Avant-bras"
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
    "equipment_tags": [
      "dumbbell"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "Triple mouvement : clean depuis position suspendue → squat avant → push press. Chaîne cinétique complète. Référence CrossFit / athlètes.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_athletic",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COM-077",
    "category": "complex",
    "name": "Renegade Row + Push-up",
    "muscles_primary": [
      "Grand dorsal",
      "Pectoraux",
      "Core"
    ],
    "muscles_secondary": [
      "Triceps",
      "Épaules"
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
    "equipment_tags": [
      "dumbbell"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "Push-up → row bras droit → row bras gauche. Anti-rotation core maximal. Haltères hexagonaux pour stabilité au sol.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_athletic",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COM-078",
    "category": "complex",
    "name": "KB Turkish Get-Up",
    "muscles_primary": [
      "Core global",
      "Épaules"
    ],
    "muscles_secondary": [
      "Fessiers",
      "Quadriceps",
      "Ischio"
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
    "equipment_tags": [
      "kettlebell"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "KB tenu à bout de bras tout au long. Passage de allongé → assis → genou → debout → retour. Complexité motrice maximale.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_athletic",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COM-079",
    "category": "complex",
    "name": "DB Reverse Lunge to Biceps Curl",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers",
      "Biceps"
    ],
    "muscles_secondary": [
      "Core",
      "Ischio",
      "Avant-bras"
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
    "equipment_tags": [
      "dumbbell"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "Fente arrière, puis à la remontée enchaîner un curl alterné. Coordination haut/bas du corps. Charge limitée par le curl.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_muscle_building",
      "program_athletic",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COM-080",
    "category": "complex",
    "name": "KB Swing to Goblet Squat",
    "muscles_primary": [
      "Fessiers",
      "Ischio",
      "Quadriceps",
      "Core"
    ],
    "muscles_secondary": [
      "Grand dorsal",
      "Épaules"
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
    "equipment_tags": [
      "kettlebell"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Swing bilatéral → attraper la KB en position goblet → squat profond contrôlé. Transition ballistique → contrôlé. Enseigne l'absorption de force.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_athletic",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "CON-081",
    "category": "conditioning",
    "name": "Jump Squat → Fentes Sautées → KB Swing",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers",
      "Ischio",
      "Core"
    ],
    "muscles_secondary": [
      "Mollets",
      "Épaules"
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
    "equipment_tags": [
      "kettlebell"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "10 jump squats → 10 fentes sautées → 15 KB swings. Repos 60-90s. ×3-4 rounds. Charge légère. Objectif VO2max + puissance.",
    "exercise_type": "cardio",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_athletic"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "CON-082",
    "category": "conditioning",
    "name": "Barbell Bear Complex",
    "muscles_primary": [
      "Fessiers",
      "Ischio",
      "Quadriceps",
      "Deltoïdes"
    ],
    "muscles_secondary": [
      "Core",
      "Triceps"
    ],
    "intent": [
      "endurance",
      "force"
    ],
    "level": "avance",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "disques (40-50% squat max)"
    ],
    "equipment_tags": [
      "barbell",
      "plate"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "RDL → Hang clean → Front squat → Push press → Back squat. Sans poser la barre. ×5 cycles = 1 round. AMRAP ou EMOM possible.",
    "exercise_type": "cardio",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_athletic",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "CON-083",
    "category": "conditioning",
    "name": "DB Thruster → Renegade Row → Farmer Carry",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers",
      "Deltoïdes",
      "Grand dorsal"
    ],
    "muscles_secondary": [
      "Core",
      "Triceps",
      "Avant-bras"
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
    "equipment_tags": [
      "dumbbell"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "10 thrusters → 8 renegade rows → 20 m farmer carry. Circuit métabolique complet.",
    "exercise_type": "cardio",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_athletic",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "CON-084",
    "category": "conditioning",
    "name": "Burpee Pull-up → Jump Squat → Explosive Push-up (AMRAP)",
    "muscles_primary": [
      "Full body"
    ],
    "muscles_secondary": [
      "Core",
      "Coordination"
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
    "equipment_tags": [
      "pullup_bar"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "AMRAP 8 min : 5 burpee pull-ups → 8 jump squats → 6 push-ups explosifs. Score = nombre de rounds.",
    "exercise_type": "cardio",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_athletic"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": 1,
    "prescribed_duration_sec": 600
  },
  {
    "id": "CON-131",
    "category": "conditioning",
    "name": "Cindy (AMRAP 20 min)",
    "muscles_primary": [
      "Full body"
    ],
    "muscles_secondary": [
      "Dorsaux",
      "Pectoraux",
      "Quadriceps"
    ],
    "intent": [
      "endurance",
      "cardio"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [
      "pullup_bar"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Benchmark CrossFit. 20 minutes, autant de tours que possible : 5 tractions, 10 pompes, 15 air squats. Rythme régulier plutôt que départ rapide. Scaler avec des tractions australiennes et des pompes sur genoux.",
    "exercise_type": "cardio",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_athletic",
      "program_bodyweight"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": 1,
    "prescribed_duration_sec": 1200
  },
  {
    "id": "CON-132",
    "category": "conditioning",
    "name": "Circuit Jump Squat → Pompes → Fentes alternées (3 tours)",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers",
      "Pectoraux"
    ],
    "muscles_secondary": [
      "Core",
      "Mollets"
    ],
    "intent": [
      "explosivite",
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "3 tours : 15 jump squats, 12 pompes, 20 fentes alternées. 60 s de repos entre les tours, aucun repos à l'intérieur d'un tour. Aucun matériel.",
    "exercise_type": "cardio",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_athletic",
      "program_bodyweight"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": 3,
    "prescribed_duration_sec": 180
  },
  {
    "id": "CON-133",
    "category": "conditioning",
    "name": "Chelsea (EMOM 30 min)",
    "muscles_primary": [
      "Full body"
    ],
    "muscles_secondary": [
      "Dorsaux",
      "Pectoraux",
      "Quadriceps"
    ],
    "intent": [
      "endurance",
      "cardio"
    ],
    "level": "avance",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [
      "pullup_bar"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Benchmark CrossFit. Au début de chaque minute, pendant 30 minutes : 5 tractions, 10 pompes, 15 air squats. Le repos est ce qu'il reste de la minute. On s'arrête dès qu'une minute n'est plus tenue.",
    "exercise_type": "cardio",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_athletic",
      "program_bodyweight"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": 1,
    "prescribed_duration_sec": 1800
  },
  {
    "id": "CON-134",
    "category": "conditioning",
    "name": "Circuit Spiderman → Burpees → Tractions australiennes (4 tours)",
    "muscles_primary": [
      "Full body"
    ],
    "muscles_secondary": [
      "Core",
      "Pectoraux",
      "Dorsaux"
    ],
    "intent": [
      "endurance",
      "explosivite"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "4 tours : 10 pompes spiderman (genou vers le coude à la descente), 12 burpees, 10 tractions australiennes sous une barre basse. 90 s de repos entre les tours.",
    "exercise_type": "cardio",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_athletic",
      "program_bodyweight"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": 4,
    "prescribed_duration_sec": 200
  },
  {
    "id": "COR-055",
    "category": "core_strength",
    "name": "Leg Raises (Roman Chair)",
    "muscles_primary": [
      "Abdominaux",
      "Fléchisseurs hanches"
    ],
    "muscles_secondary": [
      "Iliopsoas"
    ],
    "intent": [
      "force"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Roman chair / Captain's chair"
    ],
    "equipment_tags": [
      "machine"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Bras appuyés sur les supports. Jambes tendues ou fléchies montées jusqu'à l'horizontale ou plus. Contrôle du balancement. Focus bas du ventre.",
    "exercise_type": "core",
    "movement_pattern": "hip_flexion",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-056",
    "category": "core_strength",
    "name": "Leg Raises (Bar)",
    "muscles_primary": [
      "Abdominaux",
      "Fléchisseurs hanches"
    ],
    "muscles_secondary": [
      "Grand dorsal (stabilisation)"
    ],
    "intent": [
      "force"
    ],
    "level": "avance",
    "bodyweight_compatible": true,
    "material_required": [
      "Barre de traction"
    ],
    "equipment_tags": [
      "pullup_bar"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "En suspension à la barre. Jambes tendues montées à 90° ou plus. Forte composante stabilisation épaule. Version avancée : L-sit hang.",
    "exercise_type": "core",
    "movement_pattern": "hip_flexion",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_strength",
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-057",
    "category": "core_strength",
    "name": "Ab Wheel Rollout",
    "muscles_primary": [
      "Rectus abdominis",
      "Serratus"
    ],
    "muscles_secondary": [
      "Épaules",
      "Lombaires"
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
    "equipment_tags": [
      "wheel"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "Sur genoux ou debout (avancé). Roulement vers l'avant, extension maximale sans toucher le sol. Retour contrôlé. Fort activation core en allongement.",
    "exercise_type": "core",
    "movement_pattern": "anti_extension",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-058",
    "category": "core_strength",
    "name": "Landmine Twists",
    "muscles_primary": [
      "Obliques"
    ],
    "muscles_secondary": [
      "Core anti-rotation",
      "Épaules"
    ],
    "intent": [
      "force",
      "explosivite"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre",
      "support landmine ou angle de mur"
    ],
    "equipment_tags": [
      "barbell"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Barre tenue à bout de bras. Rotation du torse d'un côté à l'autre. Charge progressive possible. Utile pour sports de rotation (surf, raquette).",
    "exercise_type": "core",
    "movement_pattern": "rotation",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-059",
    "category": "core_strength",
    "name": "Kneeling Cable Crunch",
    "muscles_primary": [
      "Rectus abdominis"
    ],
    "muscles_secondary": [
      "Obliques"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Câble haut",
      "corde"
    ],
    "equipment_tags": [
      "cable",
      "rope"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "À genoux face au câble, corde derrière la nuque. Flexion du torse vers le bas, coudes vers les genoux. Résistance constante. Pas de balancement.",
    "exercise_type": "core",
    "movement_pattern": "flexion",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-060",
    "category": "core_strength",
    "name": "Seated Good Morning",
    "muscles_primary": [
      "Érecteurs",
      "Ischio-jambiers"
    ],
    "muscles_secondary": [
      "Fessiers",
      "Lombaires"
    ],
    "intent": [
      "force",
      "endurance"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre légère",
      "banc"
    ],
    "equipment_tags": [
      "barbell",
      "bench"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Assis sur un banc, barre légère sur les épaules. Flexion de hanche vers l'avant, dos plat. Renforcement lombaire et mobilité.",
    "exercise_type": "core",
    "movement_pattern": "extension",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-061",
    "category": "core_strength",
    "name": "Hip Flexor KB Raises",
    "muscles_primary": [
      "Iliopsoas",
      "Rectus femoris"
    ],
    "muscles_secondary": [
      "Abdominaux",
      "Carré lombaire"
    ],
    "intent": [
      "force",
      "endurance"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Kettlebell",
      "banc ou chaise stable"
    ],
    "equipment_tags": [
      "kettlebell",
      "bench"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "Assis ou en suspension, KB fixé sur le pied ou cheville. Élévation du genou contre résistance. Référence KOT / Ben Patrick.",
    "exercise_type": "core",
    "movement_pattern": "hip_flexion",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-062",
    "category": "core_endurance",
    "name": "Starfish Crunch",
    "muscles_primary": [
      "Rectus abdominis",
      "Obliques"
    ],
    "muscles_secondary": [],
    "intent": [
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Allongé, bras et jambes en étoile. Crunch en ramenant coude opposé au genou opposé. Enchaînement bilatéral en rythme HIIT. Référence Jeff Cavalière / AthleanX.",
    "exercise_type": "core",
    "movement_pattern": "flexion",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_lactate",
      "program_athletic"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-063",
    "category": "core_endurance",
    "name": "Russian Twist (HIIT)",
    "muscles_primary": [
      "Obliques"
    ],
    "muscles_secondary": [
      "Rectus abdominis"
    ],
    "intent": [
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [
      "Médecine ball ou haltère léger (optionnel)"
    ],
    "equipment_tags": [
      "dumbbell"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Assis à 45°, pieds levés. Rotation du torse alternée gauche-droite en rythme rapide. Mode HIIT : 30-45s non-stop.",
    "exercise_type": "core",
    "movement_pattern": "rotation",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_lactate",
      "program_athletic"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-064",
    "category": "core_endurance",
    "name": "Mountain Climbers",
    "muscles_primary": [
      "Core",
      "Fléchisseurs hanches"
    ],
    "muscles_secondary": [
      "Épaules",
      "Quadriceps"
    ],
    "intent": [
      "endurance",
      "cardio"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Position de push-up, genoux amenés alternativement vers la poitrine en rythme rapide. Transition parfaite core → cardio.",
    "exercise_type": "core",
    "movement_pattern": "hip_flexion",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_lactate",
      "program_athletic"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-065",
    "category": "core_endurance",
    "name": "Plank to Downward Dog",
    "muscles_primary": [
      "Core",
      "Épaules"
    ],
    "muscles_secondary": [
      "Ischio",
      "Grand dorsal"
    ],
    "intent": [
      "endurance",
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Alterné entre position planche et V inversé. Mobilité thoracique + gainage. Rythme lent pour contrôle ou rapide pour cardio.",
    "exercise_type": "core",
    "movement_pattern": "anti_extension",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_lactate",
      "program_athletic"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-066",
    "category": "core_endurance",
    "name": "Bicycle Crunches",
    "muscles_primary": [
      "Obliques",
      "Rectus abdominis"
    ],
    "muscles_secondary": [
      "Fléchisseurs hanches"
    ],
    "intent": [
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Allongé, pédalage alterné avec rotation coude-genou opposé. Rythme contrôlé cible mieux les obliques que rythme rapide.",
    "exercise_type": "core",
    "movement_pattern": "flexion",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_lactate",
      "program_athletic"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-067",
    "category": "core_endurance",
    "name": "Bear Crawl",
    "muscles_primary": [
      "Core global",
      "Épaules"
    ],
    "muscles_secondary": [
      "Quadriceps",
      "Fessiers"
    ],
    "intent": [
      "endurance",
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "À quatre pattes, genoux à 5 cm du sol. Avancée alternée bras/jambe opposé sur 10-20 m. Gainage complet en mouvement.",
    "exercise_type": "core",
    "movement_pattern": "anti_extension",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_lactate",
      "program_athletic"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-110",
    "category": "core_endurance",
    "name": "Weighted Plank",
    "muscles_primary": [
      "Transverse",
      "Grand droit"
    ],
    "muscles_secondary": [
      "Obliques",
      "Épaules"
    ],
    "intent": [
      "force",
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [
      "Disque",
      "Tapis de sol"
    ],
    "equipment_tags": [
      "plate",
      "mat"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Planche sur avant-bras, disque posé entre les omoplates. Bassin en rétroversion, ligne épaules-hanches-chevilles maintenue. La charge se progresse disque après disque.",
    "exercise_type": "core",
    "movement_pattern": "anti_extension",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength",
      "program_bodyweight"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-111",
    "category": "core_strength",
    "name": "Weighted Dead Bug",
    "muscles_primary": [
      "Transverse",
      "Grand droit"
    ],
    "muscles_secondary": [
      "Fléchisseurs de hanche"
    ],
    "intent": [
      "force",
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [
      "Haltère",
      "Tapis de sol"
    ],
    "equipment_tags": [
      "dumbbell",
      "mat"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Dos plaqué au sol, haltère tenu bras tendus. Descendre jambe et bras opposés sans décoller les lombaires. Le lest augmente la demande anti-extension.",
    "exercise_type": "core",
    "movement_pattern": "anti_extension",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_bodyweight"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-112",
    "category": "core_strength",
    "name": "Kneeling Cable Fallout",
    "muscles_primary": [
      "Grand droit",
      "Transverse"
    ],
    "muscles_secondary": [
      "Dorsaux",
      "Triceps"
    ],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Câble haut",
      "Corde"
    ],
    "equipment_tags": [
      "cable",
      "rope"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "À genoux face à la poulie haute, corde tenue au-dessus de la tête. Étendre les bras vers l'avant en résistant à la cambrure, puis revenir. Charge réglable au kilo près.",
    "exercise_type": "core",
    "movement_pattern": "anti_extension",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-113",
    "category": "core_strength",
    "name": "Weighted Crunch",
    "muscles_primary": [
      "Grand droit"
    ],
    "muscles_secondary": [
      "Obliques"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [
      "Disque",
      "Tapis de sol"
    ],
    "equipment_tags": [
      "plate",
      "mat"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Allongé genoux fléchis, disque tenu contre la poitrine. Enrouler le buste vertèbre par vertèbre sur 30-40° d'amplitude. Expirer en haut, contrôler la descente.",
    "exercise_type": "core",
    "movement_pattern": "flexion",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_bodyweight"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-114",
    "category": "core_strength",
    "name": "Weighted Decline Crunch",
    "muscles_primary": [
      "Grand droit"
    ],
    "muscles_secondary": [
      "Fléchisseurs de hanche",
      "Obliques"
    ],
    "intent": [
      "hypertrophie",
      "force"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Banc décliné",
      "Disque"
    ],
    "equipment_tags": [
      "bench",
      "plate"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Sur banc décliné, pieds bloqués, disque contre la poitrine. Enrouler le buste sans tirer sur la nuque. L'inclinaison allonge le bras de levier.",
    "exercise_type": "core",
    "movement_pattern": "flexion",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-115",
    "category": "core_strength",
    "name": "Cable Reverse Crunch",
    "muscles_primary": [
      "Grand droit inférieur"
    ],
    "muscles_secondary": [
      "Transverse"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Câble bas",
      "Sangles de cheville",
      "Banc plat"
    ],
    "equipment_tags": [
      "cable",
      "rings",
      "bench"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Allongé, chevilles sanglées à la poulie basse. Enrouler le bassin vers la cage en décollant le sacrum, sans élan. Cible la portion basse du grand droit.",
    "exercise_type": "core",
    "movement_pattern": "flexion",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-116",
    "category": "core_strength",
    "name": "Half-Kneeling Pallof Press",
    "muscles_primary": [
      "Obliques",
      "Transverse"
    ],
    "muscles_secondary": [
      "Fessiers",
      "Épaules"
    ],
    "intent": [
      "force",
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Câble",
      "Poignée simple"
    ],
    "equipment_tags": [
      "cable"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "En fente à genoux, perpendiculaire à la poulie. Presser la poignée devant le sternum en résistant à la rotation. Le tronc ne bouge pas, c'est là tout le travail.",
    "exercise_type": "core",
    "movement_pattern": "rotation",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-117",
    "category": "core_strength",
    "name": "Cable Woodchopper (High to Low)",
    "muscles_primary": [
      "Obliques"
    ],
    "muscles_secondary": [
      "Grand droit",
      "Fessiers"
    ],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Câble haut",
      "Corde"
    ],
    "equipment_tags": [
      "cable",
      "rope"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Poulie haute, corde saisie à deux mains. Tirer en diagonale vers la hanche opposée, rotation menée par le tronc et non par les bras. Contrôler le retour.",
    "exercise_type": "core",
    "movement_pattern": "rotation",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-118",
    "category": "core_strength",
    "name": "Suitcase Carry",
    "muscles_primary": [
      "Obliques",
      "Transverse"
    ],
    "muscles_secondary": [
      "Trapèzes",
      "Avant-bras"
    ],
    "intent": [
      "force",
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Kettlebell"
    ],
    "equipment_tags": [
      "kettlebell"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Marcher sur 20-30 m avec une charge lourde d'un seul côté, épaules de niveau. Le tronc lutte contre l'inclinaison latérale. Alterner les côtés à chaque série.",
    "exercise_type": "core",
    "movement_pattern": "anti_lateral_flexion",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength",
      "program_bodyweight"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-119",
    "category": "core_endurance",
    "name": "Weighted Side Plank",
    "muscles_primary": [
      "Obliques",
      "Carré des lombes"
    ],
    "muscles_secondary": [
      "Moyen fessier",
      "Épaules"
    ],
    "intent": [
      "force",
      "stabilite"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": true,
    "material_required": [
      "Disque",
      "Tapis de sol"
    ],
    "equipment_tags": [
      "plate",
      "mat"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Planche latérale sur avant-bras, disque posé sur la hanche haute. Bassin haut, corps aligné de la cheville à l'épaule. Ajouter du poids plutôt que du temps.",
    "exercise_type": "core",
    "movement_pattern": "anti_lateral_flexion",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_bodyweight"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-120",
    "category": "core_strength",
    "name": "Weighted Hanging Leg Raise",
    "muscles_primary": [
      "Grand droit inférieur",
      "Fléchisseurs de hanche"
    ],
    "muscles_secondary": [
      "Obliques",
      "Avant-bras"
    ],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "avance",
    "bodyweight_compatible": true,
    "material_required": [
      "Barre de traction",
      "Haltère"
    ],
    "equipment_tags": [
      "pullup_bar",
      "dumbbell"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Suspendu, haltère serré entre les chevilles. Monter jambes tendues jusqu'à l'horizontale en enroulant le bassin. Aucun balancement — descente contrôlée.",
    "exercise_type": "core",
    "movement_pattern": "hip_flexion",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength",
      "program_bodyweight"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "COR-121",
    "category": "core_endurance",
    "name": "Weighted Hollow Body Hold",
    "muscles_primary": [
      "Grand droit",
      "Transverse"
    ],
    "muscles_secondary": [
      "Fléchisseurs de hanche"
    ],
    "intent": [
      "force",
      "stabilite"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": true,
    "material_required": [
      "Disque",
      "Tapis de sol"
    ],
    "equipment_tags": [
      "plate",
      "mat"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Lombaires plaquées au sol, bras et jambes tendus décollés, disque tenu bras tendus. Position en banane maintenue sans creuser le bas du dos.",
    "exercise_type": "core",
    "movement_pattern": "anti_extension",
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_bodyweight"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "EXP-068",
    "category": "explosive",
    "name": "EMOM KB Swings",
    "muscles_primary": [
      "Fessiers",
      "Ischio",
      "Core"
    ],
    "muscles_secondary": [
      "Épaules",
      "Grand dorsal"
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
    "equipment_tags": [
      "kettlebell"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Protocole EMOM. Swing bilatéral, hanches = moteur. Charge légère, vitesse > charge. 15-20 reps/minute. Référence kettlebell sport.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_athletic"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "EXP-069",
    "category": "explosive",
    "name": "Box Squat into Jump (Barbell)",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers"
    ],
    "muscles_secondary": [
      "Core",
      "Ischio"
    ],
    "intent": [
      "explosivite"
    ],
    "level": "avance",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre légère (~30% 1RM)",
      "rack",
      "box basse"
    ],
    "equipment_tags": [
      "barbell",
      "rack",
      "box"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Squat avec barre, pause sur box basse, extension explosive en saut. Charge très légère ou technique confirmée obligatoire.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_athletic"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "EXP-070",
    "category": "explosive",
    "name": "Hex Bar Jump Deadlift",
    "muscles_primary": [
      "Fessiers",
      "Quadriceps",
      "Ischio"
    ],
    "muscles_secondary": [
      "Érecteurs",
      "Trapèze"
    ],
    "intent": [
      "explosivite",
      "force"
    ],
    "level": "avance",
    "bodyweight_compatible": false,
    "material_required": [
      "Trap bar / Hex bar",
      "disques"
    ],
    "equipment_tags": [
      "barbell",
      "plate"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Charge 30-40% du DL max. Triple extension explosive jusqu'au saut. Atterrissage absorbé. Référence force athlétique.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_athletic",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "EXP-071",
    "category": "explosive",
    "name": "Alternating Rotational Swings",
    "muscles_primary": [
      "Obliques",
      "Fessiers",
      "Épaules"
    ],
    "muscles_secondary": [
      "Core",
      "Grand dorsal"
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
    "equipment_tags": [
      "kettlebell"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Axe rotationnel (≠ swing sagittal). Rotation du torse + swing de côté à côté. Utile pour sports de raquette et surf.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_athletic"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "EXP-072",
    "category": "explosive",
    "name": "EMOM KB Snatch",
    "muscles_primary": [
      "Deltoïdes",
      "Fessiers",
      "Ischio"
    ],
    "muscles_secondary": [
      "Core",
      "Trapèze",
      "Avant-bras"
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
    "equipment_tags": [
      "kettlebell"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Arraché KB unilatéral. Protocole EMOM. 8-10 reps/bras/minute. Cardiorespiratoire intense. Aucune charge si technique non maîtrisée.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_athletic"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "EXP-073",
    "category": "explosive",
    "name": "Jump Rope",
    "muscles_primary": [
      "Mollets",
      "Fléchisseurs hanches"
    ],
    "muscles_secondary": [
      "Épaules",
      "Coordination"
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
    "equipment_tags": [
      "rope"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Si maîtrisé : double-unders, alternance pieds. Si débutant : saut sur place rythmé. Objectif : vitesse, pas la charge. Excellent warmup ou finisher.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_athletic"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "FIN-102",
    "category": "finisher",
    "name": "Burpees",
    "muscles_primary": [
      "Full body"
    ],
    "muscles_secondary": [
      "Core",
      "Coordination"
    ],
    "intent": [
      "endurance",
      "cardio"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "4×10 ou AMRAP 3 min. Drop en push-up + saut en haut. Rythme élevé. Variante : burpee pull-up pour plus de défi.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "FIN-103",
    "category": "finisher",
    "name": "Jump Squats",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers"
    ],
    "muscles_secondary": [
      "Mollets"
    ],
    "intent": [
      "explosivite",
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "4×12, poids du corps. Descente squat → saut explosif. Atterrissage amorti sur avant-pied. Pas de charge ajoutée.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "FIN-104",
    "category": "finisher",
    "name": "Fentes Sautées",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers"
    ],
    "muscles_secondary": [
      "Mollets",
      "Core"
    ],
    "intent": [
      "explosivite",
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "3×10/jambe. Ciseau en l'air. Atterrissage absorbé en fente. Excellent cardio bas corps.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "FIN-105",
    "category": "finisher",
    "name": "Jump Rope",
    "muscles_primary": [
      "Mollets",
      "Coordination",
      "Cardio"
    ],
    "muscles_secondary": [
      "Épaules"
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
    "equipment_tags": [
      "rope"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "3×1 min ou 5×30s. Si débutant : saut sur place rythmé sans corde. Fréquence cardiaque élevée rapidement.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "FIN-106",
    "category": "finisher",
    "name": "KB Swings (Finisher)",
    "muscles_primary": [
      "Fessiers",
      "Ischio",
      "Core"
    ],
    "muscles_secondary": [
      "Grand dorsal",
      "Épaules"
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
    "equipment_tags": [
      "kettlebell"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "4×15 reps. Charge modérée. Focus vitesse et extension hanches. Dernier push énergétique en fin de séance.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "FIN-107",
    "category": "finisher",
    "name": "KB Snatch (Finisher)",
    "muscles_primary": [
      "Full body"
    ],
    "muscles_secondary": [
      "Core",
      "Épaules"
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
    "equipment_tags": [
      "kettlebell"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "3×8/bras. Arraché complet KB. Complexité technique élevée. Charge légère prioritaire sur la technique.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "FIN-108",
    "category": "finisher",
    "name": "Battle Rope (Alternating)",
    "muscles_primary": [
      "Épaules",
      "Core"
    ],
    "muscles_secondary": [
      "Avant-bras"
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
    "equipment_tags": [
      "rope"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "3×30s max intensity. Ondes alternées. Cardio bras en fin de séance.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "FIN-109",
    "category": "finisher",
    "name": "Farmer Carry",
    "muscles_primary": [
      "Avant-bras",
      "Trapèze",
      "Core"
    ],
    "muscles_secondary": [
      "Full body"
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
    "equipment_tags": [
      "dumbbell"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "3×40 m avec haltères lourds. Gainage debout, pas stable. Finisher silencieux mais brutal.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-038",
    "category": "legs",
    "name": "Goblet Squat",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers"
    ],
    "muscles_secondary": [
      "Core",
      "Mollets"
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
    "equipment_tags": [
      "dumbbell"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "Haltère ou KB tenu en coupe devant la poitrine. Descente profonde, coudes entre les genoux. Excellent pour la mobilité de hanche et la technique squat.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "squat",
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-039",
    "category": "legs",
    "name": "Barbell Squat",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers"
    ],
    "muscles_secondary": [
      "Ischio",
      "Érecteurs",
      "Core"
    ],
    "intent": [
      "force"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "rack",
      "disques"
    ],
    "equipment_tags": [
      "barbell",
      "rack",
      "plate"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Barre en high bar ou low bar. Descente sous parallèle, genoux dans l'axe des orteils. Montée explosive. Fondateur Starting Strength.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "squat",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-040",
    "category": "legs",
    "name": "Single Leg Romanian Deadlift",
    "muscles_primary": [
      "Ischio-jambiers",
      "Fessiers"
    ],
    "muscles_secondary": [
      "Stabilisateurs",
      "Core"
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
    "equipment_tags": [
      "dumbbell"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "Sur une jambe, haltères dans les mains. Charnière de hanche, dos plat. Torse parallèle au sol en bas. Charge excentrique ischio. Référence KOT.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "hinge",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-041",
    "category": "legs",
    "name": "Goblet Sumo Squat",
    "muscles_primary": [
      "Adducteurs",
      "Fessiers"
    ],
    "muscles_secondary": [
      "Quadriceps"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Kettlebell ou haltère"
    ],
    "equipment_tags": [
      "dumbbell"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "Pieds larges en sumo, orteils à 45°. Haltère en coupe. Descente profonde. Cible adducteurs et fessiers plus que le goblet classique.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "squat",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-042",
    "category": "legs",
    "name": "Barbell Sumo Squat",
    "muscles_primary": [
      "Adducteurs",
      "Fessiers",
      "Quadriceps"
    ],
    "muscles_secondary": [
      "Ischio",
      "Érecteurs"
    ],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "rack",
      "disques"
    ],
    "equipment_tags": [
      "barbell",
      "rack",
      "plate"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Écartement large, barre en position haute. Bon pour la mobilité de hanche et les adducteurs sous charge lourde.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "squat",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-043",
    "category": "legs",
    "name": "Hip Thrust (Barbell)",
    "muscles_primary": [
      "Fessiers"
    ],
    "muscles_secondary": [
      "Ischio-jambiers",
      "Core"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "banc",
      "disques",
      "pad de protection"
    ],
    "equipment_tags": [
      "barbell",
      "bench",
      "plate",
      "mat"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Dos appuyé sur banc, barre sur les hanches. Extension complète de hanche en haut, contraction isométrique finale. Référence Bret Contreras.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "hip_extension",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-044",
    "category": "legs",
    "name": "Deadlift (Conventional)",
    "muscles_primary": [
      "Ischio-jambiers",
      "Fessiers",
      "Érecteurs"
    ],
    "muscles_secondary": [
      "Grand dorsal",
      "Trapèze"
    ],
    "intent": [
      "force"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "disques",
      "plateforme"
    ],
    "equipment_tags": [
      "barbell",
      "plate",
      "box"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Pieds dans la largeur des hanches, barre au-dessus des mid-foot. Prise mixte ou crochet. Dos neutre. Starting Strength fondamental.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "hinge",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-045",
    "category": "legs",
    "name": "Sumo Deadlift",
    "muscles_primary": [
      "Adducteurs",
      "Fessiers",
      "Ischio"
    ],
    "muscles_secondary": [
      "Érecteurs",
      "Grand dorsal"
    ],
    "intent": [
      "force"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "disques",
      "plateforme"
    ],
    "equipment_tags": [
      "barbell",
      "plate",
      "box"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Écartement très large, barre entre les jambes, prise pronation. Torse plus vertical. Bonne alternative pour morphologies courtes de buste.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "hinge",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-046",
    "category": "legs",
    "name": "Suitcase Deadlift",
    "muscles_primary": [
      "Carré des lombes",
      "Obliques"
    ],
    "muscles_secondary": [
      "Fessiers",
      "Ischio",
      "Core"
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
    "equipment_tags": [
      "dumbbell"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "Haltère sur le côté (comme une valise). Anti-flexion latérale du core. Asymétrie utile pour corriger déséquilibres gauche/droite.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "hinge",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-047",
    "category": "legs",
    "name": "Zercher Squat",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers",
      "Core"
    ],
    "muscles_secondary": [
      "Biceps",
      "Érecteurs"
    ],
    "intent": [
      "force"
    ],
    "level": "avance",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "rack",
      "pad de coude optionnel"
    ],
    "equipment_tags": [
      "barbell",
      "rack",
      "mat"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Barre dans le creux des coudes, bras fléchis. Position très verticale du torse. Fort engagement du core. Référence Westside / Ed Coan.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "squat",
    "is_regression": false,
    "target_programs": [
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-048",
    "category": "legs",
    "name": "Landmine Deadlift",
    "muscles_primary": [
      "Fessiers",
      "Ischio",
      "Érecteurs"
    ],
    "muscles_secondary": [
      "Grand dorsal",
      "Core"
    ],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre",
      "support landmine ou angle de mur"
    ],
    "equipment_tags": [
      "barbell"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Barre insérée dans angle landmine. Mouvement en arc vers le haut. Axe de traction différent du DL classique, moins de stress lombaire.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "hinge",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-049",
    "category": "legs",
    "name": "Bulgarian Split Squat",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers"
    ],
    "muscles_secondary": [
      "Core",
      "Stabilisateurs"
    ],
    "intent": [
      "hypertrophie",
      "endurance"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères",
      "banc"
    ],
    "equipment_tags": [
      "dumbbell",
      "bench"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "Pied arrière surélevé sur banc, pied avant avancé. Descente verticale. Fort volume possible. Référence Jeremy Ethier unilatéral.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "lunge",
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-050",
    "category": "legs",
    "name": "Seated Calf Raises",
    "muscles_primary": [
      "Soléaire"
    ],
    "muscles_secondary": [
      "Gastrocnémiens"
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
    "equipment_tags": [
      "machine"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Genou à 90°. Le soléaire est plus actif en position fléchie. Amplitude complète : descente profonde, contraction max en haut.",
    "exercise_type": "isolation",
    "movement_pattern": null,
    "movement_family": "calf",
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-051",
    "category": "legs",
    "name": "Calf Raises (Standing)",
    "muscles_primary": [
      "Gastrocnémiens"
    ],
    "muscles_secondary": [
      "Soléaire"
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
    "equipment_tags": [
      "machine"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Debout sur une marche. Descente lente (3-4s), montée explosive. Amplitude totale. Possible avec sac à dos lesté si pas de machine.",
    "exercise_type": "isolation",
    "movement_pattern": null,
    "movement_family": "calf",
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-052",
    "category": "legs",
    "name": "Single Leg Bridges",
    "muscles_primary": [
      "Fessiers"
    ],
    "muscles_secondary": [
      "Ischio",
      "Core"
    ],
    "intent": [
      "endurance",
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Au sol, une jambe tendue, l'autre fléchie. Extension de hanche unilatérale. Régression du hip thrust. Bon pour activation pré-workout.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "hip_extension",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_lactate",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-053",
    "category": "legs",
    "name": "Frog Hip Thrust",
    "muscles_primary": [
      "Fessiers (fibres profondes)"
    ],
    "muscles_secondary": [
      "Adducteurs",
      "Ischio"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Pieds joints plante contre plante (position grenouille). Flexion externe de hanche maximale. Cible différemment les fessiers. Référence Ben Patrick / KOT.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "hip_extension",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-054",
    "category": "legs",
    "name": "Side Leg Raises",
    "muscles_primary": [
      "Abducteurs",
      "TFL"
    ],
    "muscles_secondary": [
      "Fessiers médians"
    ],
    "intent": [
      "endurance",
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Allongé sur le côté ou debout. Élévation latérale contrôlée. Stabilisation bassin. Compatible rééducation genou.",
    "exercise_type": "isolation",
    "movement_pattern": null,
    "movement_family": "abduction",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_lactate",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-126",
    "category": "legs",
    "name": "Air Squat",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers"
    ],
    "muscles_secondary": [
      "Ischio-jambiers",
      "Core"
    ],
    "intent": [
      "endurance",
      "force"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [
      "squat",
      "leg"
    ],
    "description": "Squat au poids de corps, cuisses sous la parallèle, talons au sol, genoux dans l'axe des pieds. Base de tout travail de jambes sans matériel.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "squat",
    "is_regression": true,
    "target_programs": [
      "program_bodyweight",
      "program_muscle_building",
      "program_strength",
      "program_lactate"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-127",
    "category": "legs",
    "name": "Walking Lunges (Poids de corps)",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers"
    ],
    "muscles_secondary": [
      "Ischio-jambiers",
      "Core"
    ],
    "intent": [
      "endurance",
      "force"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Fentes avant enchaînées en avançant. Genou arrière effleure le sol, buste droit. Compter les répétitions par jambe.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "lunge",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-128",
    "category": "legs",
    "name": "Step-ups (Banc)",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers"
    ],
    "muscles_secondary": [
      "Ischio-jambiers",
      "Mollets"
    ],
    "intent": [
      "force",
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Montée sur un banc ou une marche, jambe d'appui seule, sans pousser sur la jambe libre. Descente contrôlée. Un banc de parc convient.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "lunge",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-129",
    "category": "legs",
    "name": "Pistol Squat (Assisté)",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers"
    ],
    "muscles_secondary": [
      "Ischio-jambiers",
      "Core"
    ],
    "intent": [
      "force",
      "stabilite"
    ],
    "level": "avance",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Squat sur une jambe, l'autre tendue devant. S'aider d'un poteau ou d'une sangle au début. Demande mobilité de cheville et gainage.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "lunge",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "LEG-130",
    "category": "legs",
    "name": "Nordic Hamstring Curl",
    "muscles_primary": [
      "Ischio-jambiers"
    ],
    "muscles_secondary": [
      "Fessiers",
      "Core"
    ],
    "intent": [
      "force"
    ],
    "level": "avance",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Genoux au sol, chevilles bloquées (banc, partenaire, barre basse). Descendre le buste le plus lentement possible, remonter en poussant des mains. Excentrique très exigeant : peu de répétitions.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "hinge",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUL-015",
    "category": "pull",
    "name": "Pull-over (DB)",
    "muscles_primary": [
      "Grand dorsal"
    ],
    "muscles_secondary": [
      "Grand pectoral",
      "Serratus"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltère",
      "banc"
    ],
    "equipment_tags": [
      "dumbbell",
      "bench"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "Allongé perpendiculaire au banc, haltère tenu à deux mains. Arc de cercle de la poitrine vers l'arrière de la tête. Étirement max du dorsal. Coudes légèrement fléchis.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "pullover",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUL-016",
    "category": "pull",
    "name": "Pull-ups (Pronation)",
    "muscles_primary": [
      "Grand dorsal",
      "Biceps"
    ],
    "muscles_secondary": [
      "Rhomboïdes",
      "Trapèze"
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
    "equipment_tags": [
      "pullup_bar"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Prise pronation (paumes en avant), mains ~1.5× largeur épaules. Tirer coudes vers les hanches. Chin au-dessus de la barre. Descente contrôlée.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "vertical_pull",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUL-017",
    "category": "pull",
    "name": "Chin-ups (Supination)",
    "muscles_primary": [
      "Grand dorsal",
      "Biceps"
    ],
    "muscles_secondary": [
      "Rhomboïdes"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [
      "Barre de traction"
    ],
    "equipment_tags": [
      "pullup_bar"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Prise supination (paumes vers soi). Plus de recrutement biceps. Facilite la connexion esprit-muscle sur le dorsal pour débutants.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "vertical_pull",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUL-018",
    "category": "pull",
    "name": "Negative Pull-ups",
    "muscles_primary": [
      "Grand dorsal",
      "Biceps"
    ],
    "muscles_secondary": [
      "Rhomboïdes",
      "Trapèze"
    ],
    "intent": [
      "force"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [
      "Barre de traction"
    ],
    "equipment_tags": [
      "pullup_bar"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Monter en sautant ou sur une box, puis descente excentrique lente (4-6s). Construit la force nécessaire avant les tractions complètes.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "vertical_pull",
    "is_regression": true,
    "target_programs": [
      "program_bodyweight",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUL-019",
    "category": "pull",
    "name": "Scapular Pull-ups",
    "muscles_primary": [
      "Rhomboïdes",
      "Trapèze inf."
    ],
    "muscles_secondary": [
      "Grand dorsal"
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
    "equipment_tags": [
      "pullup_bar"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "En dead hang, rétraction scapulaire pure sans fléchir les coudes. Activation des fixateurs de l'omoplate. Base de santé épaule / posture.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "vertical_pull",
    "is_regression": true,
    "target_programs": [
      "program_bodyweight",
      "program_lactate",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUL-020",
    "category": "pull",
    "name": "Barbell Rows",
    "muscles_primary": [
      "Grand dorsal",
      "Rhomboïdes"
    ],
    "muscles_secondary": [
      "Trapèze",
      "Biceps"
    ],
    "intent": [
      "force"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "disques"
    ],
    "equipment_tags": [
      "barbell",
      "plate"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Pendlay ou Yates row. Buste ~45°, barre tirée vers le bas du sternum. Rétraction scapulaire en fin de mouvement. Base du programme de force.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "horizontal_pull",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUL-021",
    "category": "pull",
    "name": "T-Bar / Landmine Rows",
    "muscles_primary": [
      "Grand dorsal",
      "Rhomboïdes"
    ],
    "muscles_secondary": [
      "Trapèze",
      "Biceps"
    ],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre",
      "support landmine ou angle de mur",
      "poignée V-bar optionnelle"
    ],
    "equipment_tags": [
      "barbell"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Barre insérée dans un angle ou support landmine. Position légèrement plus upright que le barbell row. Prise neutre si poignée V-bar.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "horizontal_pull",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUL-022",
    "category": "pull",
    "name": "Australian Pull-ups / TRX Rows",
    "muscles_primary": [
      "Grand dorsal",
      "Rhomboïdes"
    ],
    "muscles_secondary": [
      "Biceps",
      "Trapèze"
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
    "equipment_tags": [
      "pullup_bar"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Corps quasi horizontal sous barre fixe ou TRX. Tire la poitrine vers la barre. Régression utile avant pull-ups. Volume élevé possible.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "horizontal_pull",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_lactate",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUL-023",
    "category": "pull",
    "name": "Single Arm Dumbbell Row",
    "muscles_primary": [
      "Grand dorsal",
      "Rhomboïdes"
    ],
    "muscles_secondary": [
      "Biceps",
      "Érecteurs"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltère",
      "banc"
    ],
    "equipment_tags": [
      "dumbbell",
      "bench"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "Appui sur un banc, bras libre tire l'haltère vers la hanche. Focus sur rétraction finale et légère rotation du torse. Amplitude maximale.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "horizontal_pull",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUL-024",
    "category": "pull",
    "name": "Face Pulls",
    "muscles_primary": [
      "Deltoïde post.",
      "Trapèze"
    ],
    "muscles_secondary": [
      "Rotateurs ext.",
      "Rhomboïdes"
    ],
    "intent": [
      "endurance",
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Câble avec corde",
      "ou bande élastique"
    ],
    "equipment_tags": [
      "cable",
      "band"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Câble à hauteur des yeux ou plus. Tirer vers le visage en ouvrant les coudes. Rotation externe en fin de mouvement. Santé épaule prioritaire.",
    "exercise_type": "isolation",
    "movement_pattern": null,
    "movement_family": "rear_delt",
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUL-025",
    "category": "pull",
    "name": "Y Raises & W Raises (Plates)",
    "muscles_primary": [
      "Trapèze inf.",
      "Deltoïde post."
    ],
    "muscles_secondary": [
      "Rhomboïdes",
      "Rotateurs"
    ],
    "intent": [
      "endurance",
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Disques légers 2.5-5 kg",
      "banc incliné"
    ],
    "equipment_tags": [
      "plate",
      "bench"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Allongé face contre banc incliné. Y : bras en V vers le haut. W : coudes fléchis, rotation externe. Disques très légers. Référence physiothérapie épaule.",
    "exercise_type": "isolation",
    "movement_pattern": null,
    "movement_family": "rear_delt",
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUL-026",
    "category": "pull",
    "name": "Prone Paddle Simulator",
    "muscles_primary": [
      "Érecteurs",
      "Deltoïde post."
    ],
    "muscles_secondary": [
      "Trapèze",
      "Grand dorsal"
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
    "equipment_tags": [
      "ball"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Sur tapis, position prone. Simulation du mouvement de paddle surf : bras alternés en arc horizontal, torse légèrement soulevé. Pour surfeurs.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "horizontal_pull",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_lactate",
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUL-027",
    "category": "pull",
    "name": "Straight Arm Lat Pulldown",
    "muscles_primary": [
      "Grand dorsal",
      "Serratus"
    ],
    "muscles_secondary": [
      "Teres major"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Câble haut ou bande élastique"
    ],
    "equipment_tags": [
      "cable"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Câble ou élastique haut, bras tendus (légère flexion coude). Descendre les bras vers les hanches en gardant les coudes fixes. Isole le dorsal sans biceps.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "pullover",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUL-125",
    "category": "pull",
    "name": "Ring Rows",
    "muscles_primary": [
      "Dorsaux",
      "Rhomboïdes"
    ],
    "muscles_secondary": [
      "Biceps",
      "Trapèzes moy."
    ],
    "intent": [
      "hypertrophie",
      "force"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [
      "rings"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Tirage horizontal aux anneaux, corps gainé en planche. Plus les pieds avancent, plus c'est lourd. Serrer les omoplates en fin de tirage.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "horizontal_pull",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUS-001",
    "category": "push",
    "name": "Barbell Bench Press",
    "muscles_primary": [
      "Pectoraux",
      "Deltoïde ant."
    ],
    "muscles_secondary": [
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
      "banc plat",
      "rack"
    ],
    "equipment_tags": [
      "barbell",
      "bench",
      "rack"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Allongé sur le banc, barre saisie en prise large. Descente contrôlée jusqu'au sternum, coudes à 45-75°. Poussée explosive en expirant.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "horizontal_push",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUS-002",
    "category": "push",
    "name": "Dumbbell Bench Press",
    "muscles_primary": [
      "Pectoraux",
      "Deltoïde ant."
    ],
    "muscles_secondary": [
      "Triceps"
    ],
    "intent": [
      "hypertrophie"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères",
      "banc plat"
    ],
    "equipment_tags": [
      "dumbbell",
      "bench"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "Même schéma que la barre mais amplitude plus grande. Permet une rotation naturelle des poignets. Instabilité utile pour activation stabilisatrice.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "horizontal_push",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUS-003",
    "category": "push",
    "name": "Ring Dips",
    "muscles_primary": [
      "Pectoraux inf.",
      "Triceps"
    ],
    "muscles_secondary": [
      "Core",
      "Épaules"
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
    "equipment_tags": [
      "rings"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Dips sur anneaux — instabilité maximale. Corps légèrement incliné vers l'avant pour cibler pectoraux. Anneaux tournés vers l'extérieur en haut.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "dip",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_strength",
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUS-004",
    "category": "push",
    "name": "Dips",
    "muscles_primary": [
      "Pectoraux inf.",
      "Triceps"
    ],
    "muscles_secondary": [
      "Épaules"
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
    "equipment_tags": [
      "pullup_bar"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Barres parallèles. Descente jusqu'à 90° de coude minimum. Variation triceps : corps vertical. Variation pec : légère inclinaison avant.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "dip",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUS-005",
    "category": "push",
    "name": "Straight Bar Dips",
    "muscles_primary": [
      "Pectoraux inf.",
      "Triceps"
    ],
    "muscles_secondary": [
      "Épaules",
      "Core"
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
    "equipment_tags": [
      "pullup_bar"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Barre fixe basse ou parallèles. Mouvement de bascule vers l'avant, pression sur la barre en prise pronation. Transition vers muscle-up possible.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "dip",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_strength",
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUS-006",
    "category": "push",
    "name": "Overhead Press (Barbell)",
    "muscles_primary": [
      "Deltoïdes",
      "Triceps"
    ],
    "muscles_secondary": [
      "Trapèze",
      "Core"
    ],
    "intent": [
      "force"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "rack"
    ],
    "equipment_tags": [
      "barbell",
      "rack"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Barre au niveau de la clavicule, prise légèrement plus large que les épaules. Pousser verticalement, tête en arrière au passage, verrouillage en haut.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "vertical_push",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUS-007",
    "category": "push",
    "name": "Push-ups (Endurance Reps)",
    "muscles_primary": [
      "Pectoraux",
      "Deltoïdes ant."
    ],
    "muscles_secondary": [
      "Triceps",
      "Core"
    ],
    "intent": [
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Appuis au sol, mains à largeur d'épaules. Séries longues (20-50 reps), rythme constant. Gainage actif tout au long. Objectif : densité de reps.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "horizontal_push",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_lactate",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUS-008",
    "category": "push",
    "name": "Close Grip Bench Press",
    "muscles_primary": [
      "Triceps"
    ],
    "muscles_secondary": [
      "Pectoraux",
      "Deltoïde ant."
    ],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre olympique",
      "banc plat",
      "rack"
    ],
    "equipment_tags": [
      "barbell",
      "bench",
      "rack"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [],
    "description": "Prise serrée (~30 cm), coudes près du corps. Focus sur extension triceps. Moins de mobilisation pectorale que bench classique.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "horizontal_push",
    "is_regression": false,
    "target_programs": [
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUS-009",
    "category": "push",
    "name": "Close Grip Push-ups",
    "muscles_primary": [
      "Triceps"
    ],
    "muscles_secondary": [
      "Pectoraux"
    ],
    "intent": [
      "hypertrophie",
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Mains sous les épaules, coudes plaqués au corps. Variante accessible du close grip bench. Bon finisher ou exercice de remplissage.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "horizontal_push",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_lactate",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUS-010",
    "category": "push",
    "name": "Ring Negative Muscle-ups (Band)",
    "muscles_primary": [
      "Dorsaux",
      "Pectoraux",
      "Triceps"
    ],
    "muscles_secondary": [
      "Biceps",
      "Core"
    ],
    "intent": [
      "force"
    ],
    "level": "avance",
    "bodyweight_compatible": true,
    "material_required": [
      "Anneaux de gymnastique",
      "bande élastique"
    ],
    "equipment_tags": [
      "rings",
      "band"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Descente lente depuis la position de support sur anneaux vers le bas du pull. Bande élastique sous les pieds pour assistance. Temps de descente : 4-6s.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "muscle_up",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUS-011",
    "category": "push",
    "name": "Negative Muscle-ups",
    "muscles_primary": [
      "Dorsaux",
      "Pectoraux",
      "Triceps"
    ],
    "muscles_secondary": [
      "Biceps",
      "Core"
    ],
    "intent": [
      "force"
    ],
    "level": "avance",
    "bodyweight_compatible": true,
    "material_required": [
      "Barre fixe ou anneaux"
    ],
    "equipment_tags": [
      "pullup_bar"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Même mouvement sans assistance. Point de départ : support au-dessus de la barre. Descente excentrique maximale. Renforce le schéma moteur complet.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "muscle_up",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUS-012",
    "category": "push",
    "name": "Ring Support Hold",
    "muscles_primary": [
      "Épaules",
      "Triceps"
    ],
    "muscles_secondary": [
      "Core",
      "Avant-bras"
    ],
    "intent": [
      "stabilite"
    ],
    "level": "avance",
    "bodyweight_compatible": true,
    "material_required": [
      "Anneaux de gymnastique"
    ],
    "equipment_tags": [
      "rings"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Position de support statique sur anneaux, bras tendus, anneaux tournés vers l'extérieur. Gainage total. Base des progressions aux anneaux (dips, muscle-up).",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "dip",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUS-013",
    "category": "push",
    "name": "Knee Push-ups",
    "muscles_primary": [
      "Pectoraux",
      "Deltoïde ant."
    ],
    "muscles_secondary": [
      "Triceps"
    ],
    "intent": [
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Version allégée du push-up. Genou au sol, corps en ligne droite de genou à tête. Idéal débutant ou récupération active.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "horizontal_push",
    "is_regression": true,
    "target_programs": [
      "program_bodyweight",
      "program_lactate",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUS-014",
    "category": "push",
    "name": "Lateral Raises (Incline Posture)",
    "muscles_primary": [
      "Deltoïde latéral"
    ],
    "muscles_secondary": [
      "Deltoïde post.",
      "Trapèze"
    ],
    "intent": [
      "hypertrophie",
      "endurance"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Haltères",
      "banc incliné"
    ],
    "equipment_tags": [
      "dumbbell",
      "bench"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [],
    "description": "Buste incliné à ~30° vers l'avant sur banc incliné pour pré-étirer le faisceau latéral. Élévations strictes, sans élan. Isole mieux que la version debout droite.",
    "exercise_type": "isolation",
    "movement_pattern": null,
    "movement_family": "shoulder_isolation",
    "is_regression": false,
    "target_programs": [
      "program_lactate",
      "program_muscle_building"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUS-122",
    "category": "push",
    "name": "Pike Push-ups",
    "muscles_primary": [
      "Deltoïdes ant.",
      "Triceps"
    ],
    "muscles_secondary": [
      "Trapèzes sup.",
      "Core"
    ],
    "intent": [
      "hypertrophie",
      "force"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Bassin haut, tronc proche de la verticale, tête entre les mains. Descendre le sommet du crâne vers le sol. Plus les pieds sont hauts, plus la charge passe sur les épaules. Progression vers le handstand.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "vertical_push",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUS-123",
    "category": "push",
    "name": "Ring Push-ups",
    "muscles_primary": [
      "Pectoraux",
      "Deltoïdes ant."
    ],
    "muscles_secondary": [
      "Triceps",
      "Core"
    ],
    "intent": [
      "hypertrophie",
      "stabilite"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [
      "rings"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Pompes aux anneaux, mains libres de tourner. L'instabilité recrute les stabilisateurs de l'épaule. Anneaux bas pour commencer, plus hauts pour alléger.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "horizontal_push",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "PUS-124",
    "category": "push",
    "name": "Archer Push-ups",
    "muscles_primary": [
      "Pectoraux",
      "Triceps"
    ],
    "muscles_secondary": [
      "Deltoïdes ant.",
      "Core"
    ],
    "intent": [
      "force",
      "hypertrophie"
    ],
    "level": "avance",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [],
    "description": "Pompes bras très écartés : on descend sur un bras, l'autre reste tendu au sol. Charge unilatérale, étape vers la pompe à un bras.",
    "exercise_type": "compound",
    "movement_pattern": null,
    "movement_family": "horizontal_push",
    "is_regression": false,
    "target_programs": [
      "program_bodyweight",
      "program_muscle_building",
      "program_strength"
    ],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "WAR-085",
    "category": "warmup",
    "name": "90/90 Hip Stretch",
    "muscles_primary": [
      "Fléchisseurs hanches",
      "Rotateurs ext."
    ],
    "muscles_secondary": [
      "Fessiers"
    ],
    "intent": [
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [
      "squat",
      "leg"
    ],
    "description": "Pour Squat / Leg. Position 90/90 au sol, bascule d'un côté à l'autre. 60s chaque côté. Ouvre la capsule de hanche avant squat profond.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "WAR-086",
    "category": "warmup",
    "name": "Ankle Mobilization (Wall)",
    "muscles_primary": [
      "Tibialis ant.",
      "Mollets"
    ],
    "muscles_secondary": [
      "Achille"
    ],
    "intent": [
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [
      "squat",
      "leg"
    ],
    "description": "Pour Squat / Leg. Pied près du mur, genou poussé vers l'avant. 10×/côté. Améliore la dorsiflexion = squat plus profond.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "WAR-087",
    "category": "warmup",
    "name": "Hip Airplanes",
    "muscles_primary": [
      "Fessiers",
      "Rotateurs hip"
    ],
    "muscles_secondary": [
      "Core",
      "Carré lombaire"
    ],
    "intent": [
      "mobilite",
      "stabilite"
    ],
    "level": "intermediaire",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [
      "squat",
      "leg",
      "single_leg"
    ],
    "description": "Pour Squat / Single leg. En appui sur une jambe, rotation du bassin. 8/côté. Contrôle pelvien avant squat unipodal.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "WAR-088",
    "category": "warmup",
    "name": "Pause Box Squat (Empty Bar)",
    "muscles_primary": [
      "Quadriceps",
      "Fessiers"
    ],
    "muscles_secondary": [
      "Core",
      "Ischio"
    ],
    "intent": [
      "mobilite",
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Barre vide",
      "box ou banc"
    ],
    "equipment_tags": [
      "barbell",
      "bench"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [
      "squat"
    ],
    "description": "Pour Squat. 3×3 descente lente 3s, pause 2s sur la box, remontée. Groove le pattern squat. Référence Squat University.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "WAR-089",
    "category": "warmup",
    "name": "Cat-Camel",
    "muscles_primary": [
      "Érecteurs lombaires"
    ],
    "muscles_secondary": [
      "Abdominaux",
      "Trapèze"
    ],
    "intent": [
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [
      "deadlift"
    ],
    "description": "Pour Deadlift. 10 reps lentes, cycle flexion-extension vertébrale. Mobilise les vertèbres thoraciques et lombaires.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "WAR-090",
    "category": "warmup",
    "name": "Hip Hinge Wall Drill",
    "muscles_primary": [
      "Ischio-jambiers",
      "Fessiers"
    ],
    "muscles_secondary": [
      "Érecteurs"
    ],
    "intent": [
      "stabilite",
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [
      "deadlift"
    ],
    "description": "Pour Deadlift. Fesse contre le mur, 10 reps. Groove le schéma de charnière de hanche sans charge. Fondamental Starting Strength.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "WAR-091",
    "category": "warmup",
    "name": "Banded Good Morning",
    "muscles_primary": [
      "Ischio",
      "Érecteurs",
      "Fessiers"
    ],
    "muscles_secondary": [
      "Core"
    ],
    "intent": [
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Bande élastique"
    ],
    "equipment_tags": [
      "band"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [
      "deadlift"
    ],
    "description": "Pour Deadlift. Bande sur les épaules, 10 reps légères. Activation de la chaîne postérieure avant DL.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "WAR-092",
    "category": "warmup",
    "name": "Band Pull-Aparts",
    "muscles_primary": [
      "Deltoïde post.",
      "Rhomboïdes"
    ],
    "muscles_secondary": [
      "Trapèze inf.",
      "Rotateurs ext."
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
    "equipment_tags": [
      "band"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [
      "push",
      "bench"
    ],
    "description": "Pour Push / Bench. Bande à hauteur des yeux, tirer en écartant les bras. 3×15. Activation rétracteurs scapulaires avant press.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "WAR-093",
    "category": "warmup",
    "name": "Serratus Push-ups",
    "muscles_primary": [
      "Serratus anterior"
    ],
    "muscles_secondary": [
      "Deltoïdes"
    ],
    "intent": [
      "stabilite",
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [
      "push",
      "bench"
    ],
    "description": "Pour Push / Bench. Push-up normal puis protraction maximale de l'omoplate en haut. Active le serratus souvent inhibé.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "WAR-094",
    "category": "warmup",
    "name": "Shoulder CARs",
    "muscles_primary": [
      "Capsule articulaire épaule"
    ],
    "muscles_secondary": [
      "Rotateurs",
      "Deltoïdes"
    ],
    "intent": [
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [
      "push",
      "ohp"
    ],
    "description": "Pour Push / OHP. Rotations articulaires contrôlées en amplitude maximale. 5 reps chaque sens. Référence FRC / physiothérapie.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "WAR-095",
    "category": "warmup",
    "name": "Cuban Press (Light)",
    "muscles_primary": [
      "Deltoïdes",
      "Rotateurs ext."
    ],
    "muscles_secondary": [
      "Trapèze",
      "Rhomboïdes"
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
    "equipment_tags": [
      "dumbbell"
    ],
    "locations": [
      "gym",
      "home"
    ],
    "warmup_target": [
      "ohp"
    ],
    "description": "Pour OHP. Row → rotation externe → press. 2×10. Warmup spécifique OHP qui active toute la coiffe des rotateurs.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "WAR-096",
    "category": "warmup",
    "name": "Dead Hang Passif",
    "muscles_primary": [
      "Grand dorsal",
      "Capsule épaule"
    ],
    "muscles_secondary": [
      "Biceps",
      "Avant-bras"
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
    "equipment_tags": [
      "pullup_bar"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [
      "pull"
    ],
    "description": "Pour Pull. 30s en suspension passive. Décompression vertébrale. Étirement grand dorsal et capsule inférieure.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "WAR-097",
    "category": "warmup",
    "name": "Scapular Retractions (Dead Hang)",
    "muscles_primary": [
      "Rhomboïdes",
      "Trapèze inf."
    ],
    "muscles_secondary": [
      "Grand dorsal"
    ],
    "intent": [
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [
      "Barre de traction"
    ],
    "equipment_tags": [
      "pullup_bar"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [
      "pull"
    ],
    "description": "Pour Pull. En suspension, rétraction et dépression des omoplates sans fléchir les coudes. 2×10. Base santé épaule.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "WAR-098",
    "category": "warmup",
    "name": "Band Dislocates",
    "muscles_primary": [
      "Capsule épaule",
      "Deltoïdes"
    ],
    "muscles_secondary": [
      "Trapèze",
      "Biceps"
    ],
    "intent": [
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Bande élastique longue"
    ],
    "equipment_tags": [
      "band"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [
      "pull",
      "ohp"
    ],
    "description": "Pour Pull / OHP. Bande tenue large devant, passer derrière la tête et retour. Amplitude overhead maximale.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "WAR-099",
    "category": "warmup",
    "name": "Thoracic Extension (Foam Roller)",
    "muscles_primary": [
      "Érecteurs thoraciques"
    ],
    "muscles_secondary": [
      "Trapèze",
      "Rhomboïdes"
    ],
    "intent": [
      "mobilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": false,
    "material_required": [
      "Foam roller"
    ],
    "equipment_tags": [
      "mat"
    ],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [
      "ohp",
      "all"
    ],
    "description": "Pour OHP / All. Foam roller sous la thoracique, extension par gravité. Libère le segment T4-T8. 10 reps par position.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "WAR-100",
    "category": "warmup",
    "name": "Wall Slides",
    "muscles_primary": [
      "Deltoïdes",
      "Serratus",
      "Rhomboïdes"
    ],
    "muscles_secondary": [
      "Trapèze inf."
    ],
    "intent": [
      "mobilite",
      "stabilite"
    ],
    "level": "debutant",
    "bodyweight_compatible": true,
    "material_required": [],
    "equipment_tags": [],
    "locations": [
      "gym",
      "home",
      "outdoor"
    ],
    "warmup_target": [
      "ohp",
      "push"
    ],
    "description": "Pour OHP / Push. Dos et bras contre un mur, glisser les bras vers le haut. Scapulas collées au mur. 3×10. Corrige impingement.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
  },
  {
    "id": "WAR-101",
    "category": "warmup",
    "name": "L-Raises with Disk",
    "muscles_primary": [
      "Deltoïde post.",
      "Infraspinatus"
    ],
    "muscles_secondary": [
      "Trapèze inf."
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
    "equipment_tags": [
      "plate"
    ],
    "locations": [
      "gym"
    ],
    "warmup_target": [
      "pull",
      "ohp"
    ],
    "description": "Pour Pull / OHP. Coude à 90°, rotation externe avec disque léger. Renforcement coiffe des rotateurs. 2×12/bras.",
    "exercise_type": null,
    "movement_pattern": null,
    "movement_family": null,
    "is_regression": false,
    "target_programs": [],
    "video_url": null,
    "image_url": null,
    "prescribed_sets": null,
    "prescribed_duration_sec": null
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
