import { supabase } from "./supabase";
import type { Match } from "../types";

export async function fetchAdminMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from("matches")
    .select(`
      *,
      home_team:home_team_id (
        id,
        name,
        flag_url,
        fifa_code
      ),
      away_team:away_team_id (
        id,
        name,
        flag_url,
        fifa_code
      )
    `)
    .order("match_date", { ascending: true });

  if (error) {
    console.error("Erro ao buscar jogos para admin:", error);
    return [];
  }

  return data || [];
}

export async function updateMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number
): Promise<boolean> {
  const { error } = await supabase
    .from("matches")
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: "scheduled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  if (error) {
    console.error("Erro ao atualizar placar:", error);
    return false;
  }

  return true;
}

export async function finalizeMatch(matchId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("matches")
    .select("home_score, away_score")
    .eq("id", matchId)
    .single();

  if (error || !data) {
    console.error("Erro ao buscar partida antes de finalizar:", error);
    return false;
  }

  if (data.home_score === null || data.away_score === null) {
    console.warn("Não é possível finalizar partida sem placar definido.");
    return false;
  }

  const { error: updateError } = await supabase
    .from("matches")
    .update({
      is_finished: true,
      status: "finished",
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  if (updateError) {
    console.error("Erro ao finalizar partida:", updateError);
    return false;
  }

  return true;
}

export async function getPredictionsOpenSetting(): Promise<boolean> {
  const { data, error } = await supabase
    .from("admin_settings")
    .select("predictions_open")
    .limit(1)
    .single();

  if (error) {
    console.warn("Erro ao buscar configuração de palpites:", error);
    return true;
  }

  return data?.predictions_open ?? true;
}

export async function setPredictionsOpenSetting(isOpen: boolean): Promise<boolean> {
  const { data, error } = await supabase
    .from("admin_settings")
    .upsert({
      id: "00000000-0000-0000-0000-000000000001",
      predictions_open: isOpen,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: ["id"],
      returning: "representation",
    });

  if (error) {
    console.error("Erro ao atualizar status de palpites:", error);
    return false;
  }

  return true;
}
