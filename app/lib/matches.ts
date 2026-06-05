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
  const updatePayload = {
    home_score: homeScore,
    away_score: awayScore,
    status: "scheduled",
  };

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const session = sessionData?.session ?? null;
  const currentUserId = session?.user?.id ?? null;
  const safeSession = session
    ? {
        user: session.user,
        expires_at: session.expires_at,
        hasAccessToken: Boolean(session.access_token),
      }
    : null;

  console.log("SESSION", sessionData);
  console.log("USER", sessionData?.session?.user);
  console.log("EMAIL", sessionData?.session?.user?.email);
  console.log("ACCESS TOKEN EXISTS", !!sessionData?.session?.access_token);
  console.log("[matches] updateMatchScore start", {
    matchId,
    payload: updatePayload,
    userId: currentUserId,
    session: safeSession,
    sessionError,
  });

  const { data, error } = await supabase
    .from("matches")
    .update(updatePayload)
    .eq("id", matchId)
    .select("id, home_score, away_score");

  console.log("UPDATE RESULT", data);
  console.log("UPDATE ERROR", error);

  if (error) {
    let profileInfo = null;
    let profileError = null;

    if (currentUserId) {
      const profileResponse = await supabase
        .from("users")
        .select("id, is_admin")
        .eq("id", currentUserId)
        .single();

      profileInfo = profileResponse.data ?? null;
      profileError = profileResponse.error ?? null;
    }

    console.error("SUPABASE ERROR FULL", error);
    console.error("[matches] updateMatchScore failed", {
      matchId,
      payload: updatePayload,
      userId: currentUserId,
      session: safeSession,
      sessionError,
      profileInfo,
      profileError,
      supabaseError: error,
    });
    return false;
  }

  console.log("[matches] updateMatchScore succeeded", {
    matchId,
    updatedMatch: data,
    userId: currentUserId,
  });
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
    })
    .eq("id", matchId);

  if (updateError) {
    console.error("Erro ao finalizar partida:", updateError);
    return false;
  }

  return true;
}

export async function getPredictionsOpenSetting(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("predictions_locked")
      .limit(1)
      .single();

    if (error) {
      // Tabela indisponível — palpites abertos por padrão
      console.warn("admin_settings indisponível, assumindo palpites abertos:", error.message);
      return true;
    }

    // predictions_locked = true  → palpites FECHADOS → retorna false
    // predictions_locked = false → palpites ABERTOS  → retorna true
    return !(data?.predictions_locked ?? false);
  } catch {
    return true;
  }
}

export async function setPredictionsOpenSetting(isOpen: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("admin_settings")
      .update({
        // isOpen = true  → predictions_locked = false
        // isOpen = false → predictions_locked = true
        predictions_locked: !isOpen,
      })
      .eq("id", 1);

    if (error) {
      console.error("Erro ao atualizar status de palpites:", error.message);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
