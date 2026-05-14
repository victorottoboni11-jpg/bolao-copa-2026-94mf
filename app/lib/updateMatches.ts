import { supabase } from "./supabase";
import type { Match } from "../types";

export async function atualizarResultados() {
  const { data, error } = await supabase
    .from("matches")
    .select("id, home_score, away_score")
    .order("match_datetime", { ascending: true });

  if (error) {
    console.error("Erro ao buscar partidas para atualização:", error);
    throw error;
  }

  if (!data) {
    return;
  }

  const rows = (data as Array<Pick<Match, "id" | "home_score" | "away_score">>) || [];

  const updates = rows
    .filter((match) => match.home_score !== null && match.away_score !== null)
    .map((match) => ({
      id: match.id,
      result_updated: true,
    }));

  if (updates.length === 0) {
    return;
  }

  const { error: updateError } = await supabase.from("matches").upsert(updates);

  if (updateError) {
    console.error("Erro ao atualizar resultados:", updateError);
    throw updateError;
  }
}
