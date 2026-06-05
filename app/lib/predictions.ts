import { supabase } from "./supabase";
import type { Prediction } from "../types";

export async function getUserPredictions(userId: string): Promise<Prediction[]> {
  const { data, error } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Erro ao buscar palpites do usuário:", error);
    return [];
  }

  return data || [];
}

export async function getPredictionsForMatches(userId: string, matchIds: string[]) {
  if (matchIds.length === 0) {
    return {} as Record<string, Prediction>;
  }

  const { data, error } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", userId)
    .in("match_id", matchIds);

  if (error) {
    console.error("Erro ao buscar palpites por partidas:", error);
    return {} as Record<string, Prediction>;
  }

  const predictions = data || [];
  return predictions.reduce((map: Record<string, Prediction>, pred) => {
    map[String(pred.match_id)] = pred;
    return map;
  }, {} as Record<string, Prediction>);
}

export async function savePrediction(
  userId: string,
  matchId: string,
  predictedHome: number,
  predictedAway: number,
  predictedWinner?: string | null,
  predictedPenalties?: boolean | null
): Promise<Prediction | null> {
  try {
    // Use server API so locking is enforced server-side (30 minutes before kickoff)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session?.access_token) {
      throw new Error("Session not available");
    }

    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ matchId, predictedHome, predictedAway, predictedWinner, predictedPenalties }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      console.error("Failed to save prediction (server):", payload || res.statusText);
      return null;
    }

    const payload = await res.json();
    return payload.prediction || null;
  } catch (err) {
    console.error("Erro ao salvar palpite:", err);
    return null;
  }
}

export function isPredictionLocked(matchDate?: string | null, isOpen = true) {
  if (!isOpen) {
    return true;
  }

  if (!matchDate) {
    return false;
  }

  const matchTime = new Date(matchDate).getTime();
  if (Number.isNaN(matchTime)) {
    return false;
  }

  const cutoffTime = matchTime - 30 * 60 * 1000;
  return Date.now() >= cutoffTime;
}
