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

export function getPreCopaLockDateFromMatchStart(matchDate?: string | null, minutesBefore = 5): string | null {
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
  const { data, error } = await supabase
    .from("pre_copa_predictions")
    .upsert(
      [
        {
          user_id: userId,
          champion_team: values.champion_team,
          runner_up_team: values.runner_up_team,
          top_scorer_player: values.top_scorer_player,
          top_scorer_goals: values.top_scorer_goals,
          best_goalkeeper_player: values.best_goalkeeper_player,
          best_player: values.best_player,
          tournament_revelation: values.tournament_revelation,
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
