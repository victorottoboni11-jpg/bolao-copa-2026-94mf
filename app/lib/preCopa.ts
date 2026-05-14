import { supabase } from "./supabase";
import type { PreCopaPrediction } from "../types";

export async function getPreCopaPrediction(userId: string): Promise<PreCopaPrediction | null> {
  const { data, error } = await supabase
    .from("pre_copa_predictions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Erro ao buscar palpite pré-copa:", error);
    return null;
  }

  return data || null;
}

export async function savePreCopaPrediction(
  userId: string,
  values: Omit<PreCopaPrediction, "id" | "user_id" | "created_at" | "updated_at" | "points">
): Promise<PreCopaPrediction | null> {
  const { data, error } = await supabase
    .from("pre_copa_predictions")
    .upsert(
      [
        {
          user_id: userId,
          champion_team: values.champion_team,
          runner_up_team: values.runner_up_team,
          golden_ball_player: values.golden_ball_player,
          top_scorer_player: values.top_scorer_player,
          top_scorer_goals: values.top_scorer_goals,
          most_assists_player: values.most_assists_player,
          most_assists_count: values.most_assists_count,
          fair_play_team: values.fair_play_team,
          revelation_player: values.revelation_player,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error) {
    console.error("Erro ao salvar palpite pré-copa:", error);
    return null;
  }

  return data || null;
}
