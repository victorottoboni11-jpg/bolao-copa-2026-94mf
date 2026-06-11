import { supabase } from "./supabase";
import { getMatchKickoffAt } from "./matchDate";
import type { PreCopaPrediction } from "../types";

export async function getPreCopaPrediction(userId: string): Promise<PreCopaPrediction | null> {
  const { data, error } = await supabase
    .from("pre_copa_predictions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar palpite pré-copa:", error);
    return null;
  }

  return data || null;
}

export function getPreCopaLockDateFromMatchStart(matchDate?: string | null, minutesBefore = 30): string | null {
  if (!matchDate) {
    return null;
  }

  const deadline = new Date(matchDate);
  if (Number.isNaN(deadline.getTime())) {
    return null;
  }

  deadline.setMinutes(deadline.getMinutes() - minutesBefore);
  return deadline.toISOString();
}

export async function fetchPreCopaLockDate(): Promise<string | null> {
  const { data, error } = await supabase
    .from("matches")
    .select("kickoff_at, match_date, match_datetime")
    .order("kickoff_at", { ascending: true, nullsFirst: false })
    .order("match_date", { ascending: true, nullsFirst: false })
    .order("match_datetime", { ascending: true, nullsFirst: false })
    .limit(1);

  if (error) {
    console.error("Erro ao buscar primeira partida da Copa:", error);
    return null;
  }

  const earliestMatch = Array.isArray(data) ? data[0] : null;
  const firstMatchDate = earliestMatch ? getMatchKickoffAt(earliestMatch) : null;

  return getPreCopaLockDateFromMatchStart(firstMatchDate);
}

export function canEditPreCopaPrediction(lockDate?: string | null): boolean {
  if (!lockDate) {
    return true;
  }

  const deadline = new Date(lockDate);
  if (Number.isNaN(deadline.getTime())) {
    return true;
  }

  return new Date() < deadline;
}

export async function savePreCopaPrediction(
  userId: string,
  values: Omit<PreCopaPrediction, "id" | "user_id" | "created_at" | "updated_at" | "points">
): Promise<PreCopaPrediction | null> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) {
      console.error("Sessão não disponível para salvar pré-copa");
      return null;
    }

    const res = await fetch("/api/pre-copa-predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        champion_team: values.champion_team,
        runner_up_team: values.runner_up_team,
        top_scorer_player: values.top_scorer_player,
        top_scorer_goals: values.top_scorer_goals,
        best_goalkeeper_player: values.best_goalkeeper_player,
        best_player: values.best_player,
        tournament_revelation: values.tournament_revelation,
      }),
    });

    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("Erro ao salvar pré-copa via API:", payload?.error);
      return null;
    }

    return payload?.prediction ?? null;
  } catch (error) {
    console.error("Erro ao salvar palpite pré-copa:", error);
    return null;
  }
}
