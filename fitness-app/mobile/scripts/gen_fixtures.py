#!/usr/bin/env python3
"""Génère lib/fixtures.ts à partir des vrais fichiers seed docs/data/*.json."""
import json, os

DATA = "/home/user/Strength-app/fitness-app/docs/data"
OUT = "/home/user/Strength-app/fitness-app/mobile/lib/fixtures.ts"

def load(n):
    with open(os.path.join(DATA, n), encoding="utf-8") as f:
        return json.load(f)

personas = load("01_personas.json")
programs = load("02_programs.json")
elig = load("03_persona_program_eligibility.json")
quest = load("04_questionnaire_initial.json")
poll = load("05_feedback_poll.json")
exercises = load("08_exercises.json")

def js(v, indent=0):
    """Sérialise en littéral TS lisible."""
    return json.dumps(v, ensure_ascii=False, indent=2)

# ---- Personas ----
PERSONA_KEYS = ["id","code","name","slug","tagline","description","objective","objective_label",
                "experience_level","sessions_per_week_min","sessions_per_week_max",
                "session_duration_min_min","session_duration_min_max",
                "primary_program_id","secondary_program_id","tertiary_program_id","color","icon"]
p_out = [{k: p.get(k) for k in PERSONA_KEYS} for p in personas]

# ---- Programs (sans phases) + phases à plat ----
PROGRAM_KEYS = ["id","code","name","slug","tagline","objective","duration_weeks","is_continuous",
                "frequency_per_week_min","frequency_per_week_max","session_duration_min",
                "session_duration_max","rep_range_min","rep_range_max",
                "available_protocols","default_protocol","session_structure","has_core_block",
                "color","icon"]
prog_out = []
phase_out = []
PHASE_KEYS = ["id","phase_number","name","duration_weeks","objective","approach","rep_range_min",
              "rep_range_max","sets_compounds","sets_isolation","load_pct_1rm","rest_sec_min",
              "rest_sec_max","progression_rule","notes"]
for p in programs:
    row = {k: p.get(k) for k in PROGRAM_KEYS}
    row["is_continuous"] = bool(p.get("is_continuous"))
    row["has_core_block"] = bool(p.get("has_core_block"))
    prog_out.append(row)
    for ph in (p.get("phases") or []):
        r = {k: ph.get(k) for k in PHASE_KEYS}
        r["program_id"] = p["id"]
        phase_out.append({kk: r.get(kk) for kk in
                          ["id","program_id","phase_number","name","duration_weeks","objective",
                           "approach","rep_range_min","rep_range_max","sets_compounds",
                           "sets_isolation","load_pct_1rm","rest_sec_min","rest_sec_max",
                           "progression_rule","notes"]})

# ---- Eligibility ----
elig_out = [{k: e.get(k) for k in
             ["id","persona_id","program_id","eligibility_rank","rank_order","rationale","sav_rotation_day"]}
            for e in elig]

# ---- Questionnaire : questions + options aplaties (persona_scores -> score_xx) ----
q_out, o_out = [], []
for q in quest["questions"]:
    q_out.append({
        "id": q["id"],
        "questionnaire_id": quest["questionnaire_id"],
        "question_number": q["question_number"],
        "text": q["text"],
        "type": q["type"],
        "segmentation_role": q.get("segmentation_role"),
        "note": q.get("note"),
    })
    for o in q["options"]:
        s = o.get("persona_scores", {})
        o_out.append({
            "id": o["id"],
            "question_id": q["id"],
            "label": o["label"],
            "value": o["value"],
            "maps_to_objective": o.get("maps_to_objective"),
            "maps_to_duration_max": o.get("maps_to_duration_max"),
            "maps_to_frequency_min": o.get("maps_to_frequency_min"),
            "maps_to_frequency_max": o.get("maps_to_frequency_max"),
            "maps_to_environment": o.get("maps_to_environment"),
            "score_smb": s.get("SMB", 0),
            "score_bf": s.get("BF", 0),
            "score_aw": s.get("AW", 0),
            "score_cr": s.get("CR", 0),
            "score_sav": s.get("SAV", 0),
            "has_malus": bool(o.get("has_malus")),
            "is_exclusive": bool(o.get("is_exclusive")),
            "is_sav_exclusive_signal": bool(o.get("is_sav_exclusive_signal")),
        })

# ---- Exercises (champs utiles au rendu + à la sélection) ----
EX_KEYS = ["id","category","name","muscles_primary","muscles_secondary","intent","level",
           "bodyweight_compatible","material_required","equipment_tags","locations",
           "warmup_target","description",
           "exercise_type","movement_pattern","target_programs","image_url"]
ex_out = [{k: e.get(k) for k in EX_KEYS} for e in exercises]

# ---- Feedback poll : questions + options aplaties ----
fq_out, fo_out = [], []
for q in poll["questions"]:
    fq_out.append({
        "id": q["id"],
        "poll_id": poll["poll_id"],
        "question_number": q["question_number"],
        "text": q["text"],
        "type": q["type"],
        "stores_as": q.get("stores_as"),
        "stores_factor_as": q.get("stores_factor_as"),
        "scoring_rule": q.get("scoring_rule"),
        "subscale": q.get("subscale"),
    })
    for i, o in enumerate(q["options"]):
        fo_out.append({
            "id": o.get("id") or f"{q['id']}_{i+1}",
            "question_id": q["id"],
            "value": str(o["value"]),
            "label": o["label"],
            "sublabel": o.get("sublabel"),
            "numeric_value": o["value"] if isinstance(o["value"], int) else None,
            "has_subscale": bool(o.get("has_subscale")),
            "fixed_score": o.get("fixed_score"),
            "maps_to_variant": o.get("maps_to_variant") or [],
            "maps_to_program_id": o.get("maps_to_program_id"),
            "triggers_alternative_pitch": bool(o.get("triggers_alternative_program_pitch")),
        })

header = '''/**
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

'''

body = header
body += "export const PERSONAS: Persona[] = " + js(p_out) + ";\n\n"
body += "export const PROGRAMS: Program[] = " + js(prog_out) + ";\n\n"
body += "export const PROGRAM_PHASES: ProgramPhase[] = " + js(phase_out) + ";\n\n"
body += "export const PERSONA_PROGRAM_ELIGIBILITY: PersonaProgramEligibility[] = " + js(elig_out) + ";\n\n"
body += "export const QUESTIONNAIRE_QUESTIONS: QuestionnaireQuestion[] = " + js(q_out) + ";\n\n"
body += "export const QUESTIONNAIRE_OPTIONS: QuestionnaireOption[] = " + js(o_out) + ";\n\n"
body += "export const EXERCISES: Exercise[] = " + js(ex_out) + ";\n\n"
body += "export const FEEDBACK_POLL_QUESTIONS: FeedbackPollQuestion[] = " + js(fq_out) + ";\n\n"
body += "export const FEEDBACK_POLL_OPTIONS: FeedbackPollOption[] = " + js(fo_out) + ";\n"

with open(OUT, "w", encoding="utf-8") as f:
    f.write(body)

print(f"OK  personas={len(p_out)} programs={len(prog_out)} phases={len(phase_out)} "
      f"elig={len(elig_out)} questions={len(q_out)} options={len(o_out)} "
      f"exercises={len(ex_out)} feedbackQ={len(fq_out)} feedbackO={len(fo_out)}")
print(f"-> {OUT}  ({os.path.getsize(OUT)} bytes)")
