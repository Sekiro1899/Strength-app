/**
 * Client FastAPI.
 *
 * Réservé aux deux endpoints qui portent de la logique métier serveur :
 *   POST /workout/generate   — sélection d'exercices + persistance de la séance
 *   POST /feedback/redirect  — adaptation du programme (pas encore livré côté backend)
 *
 * Tout le CRUD standard passe par le SDK Supabase (voir lib/data.ts).
 */

import { supabase } from "./supabase";
import type { WorkoutRequest, WorkoutResponse } from "./types";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    "Content-Type": "application/json",
    ...(session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}),
  };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  if (!API_URL) {
    throw new Error(
      "EXPO_PUBLIC_API_URL n'est pas défini — impossible d'appeler l'API.",
    );
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    // FastAPI renvoie {"detail": "..."} sur HTTPException (422 ici).
    const raw = await response.text();
    let message = raw;
    try {
      const parsed = JSON.parse(raw) as { detail?: string };
      if (parsed.detail) message = parsed.detail;
    } catch {
      /* corps non-JSON — on garde le texte brut */
    }
    throw new Error(`${path} — ${response.status} : ${message}`);
  }

  return response.json() as Promise<T>;
}

/** POST /workout/generate — routers/workout_generator.py */
export function generateWorkout(
  request: WorkoutRequest,
): Promise<WorkoutResponse> {
  return post<WorkoutResponse>("/workout/generate", request);
}

/** GET /health — sonde de disponibilité du backend. */
export async function checkHealth(): Promise<boolean> {
  if (!API_URL) return false;
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
