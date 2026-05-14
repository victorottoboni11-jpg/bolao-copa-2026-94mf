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
  predictedAway: number
): Promise<Prediction | null> {
  const { data, error } = await supabase
    .from("predictions")
    .upsert(
      [
        {
          user_id: userId,
          match_id: matchId,
          predicted_home: predictedHome,
          predicted_away: predictedAway,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "user_id,match_id" }
    )
    .select("*")
    .single();

  if (error) {
    console.error("Erro ao salvar palpite:", error);
    return null;
  }

  return data || null;
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

  return Date.now() >= matchTime;
}
