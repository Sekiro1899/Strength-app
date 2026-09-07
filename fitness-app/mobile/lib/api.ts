const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

export async function generateWorkout(params: {
  user_id: string;
  user_program_id: string;
  persona_id: string;
  program_id: string;
  phase_id?: string;
  week_number?: number;
  day_number?: number;
  energy_level?: number;
  available_equipment?: string[];
}) {
  const body = {
    user_id: params.user_id,
    user_program_id: params.user_program_id,
    persona_id: params.persona_id,
    program_id: params.program_id,
    phase_id: params.phase_id || null,
    week_number: params.week_number ?? 1,
    day_number: params.day_number ?? 1,
    energy_level: params.energy_level ?? 3,
    available_equipment: params.available_equipment ?? [],
  };

  const res = await fetch(`${API_URL}/workout/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `API error ${res.status}`);
  }

  return res.json();
}
