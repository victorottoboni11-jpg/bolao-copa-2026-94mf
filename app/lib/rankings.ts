import { type SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { calculateMatchPoints } from "./scoring";
import { isGroupPhase, isKnockoutPhase } from "./phases";
import type { Match, Prediction, RankingEntry } from "../types";

export async function fetchRanking(): Promise<RankingEntry[]> {
  const { data, error } = await supabase
    .from("rankings")
    .select(`
      *,
      user:user_id (
        id,
        full_name,
        email
      )
    `)
    .order("total_points", { ascending: false })
    .order("exact_hits", { ascending: false });

  if (!error && data && data.length > 0) {
    return (data as any).map((item: any, index: number) => ({
      rank: index + 1,
      user_id: item.user_id,
      user_name: item.user?.full_name || item.user?.email || "Participante",
      user_email: item.user?.email || null,
      total_points: item.total_points ?? 0,
      pre_copa_points: item.pre_copa_points ?? 0,
      group_stage_points: item.group_stage_points ?? 0,
      knockout_points: item.knockout_points ?? 0,
      exact_scores: item.exact_hits ?? 0,
      created_at: item.updated_at,
    }));
  }

  return await calculateRankingFromPredictions(supabase);
}

export async function recalculateRankings(db?: SupabaseClient): Promise<RankingEntry[]> {
  const client = db ?? supabase;
  const ranking = await calculateRankingFromPredictions(client);

  const upsertRows = ranking.map((item) => ({
    user_id: item.user_id,
    total_points: item.total_points,
    exact_hits: item.exact_scores,
    winner_hits: item.group_stage_points + item.knockout_points,
    group_stage_points: item.group_stage_points,
    knockout_points: item.knockout_points,
    pre_copa_points: item.pre_copa_points,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await client
    .from("rankings")
    .upsert(upsertRows, { onConflict: "user_id" });

  if (error) {
    console.error("Erro ao recalcular ranking:", error);
  }

  return ranking;
}

async function calculateRankingFromPredictions(client: SupabaseClient): Promise<RankingEntry[]> {
  const [{ data: predictionsData }, { data: matchesData }, { data: usersData }] = await Promise.all([
    client.from("predictions").select("*"),
    client.from("matches").select("id, home_score, away_score, phase"),
    client.from("users").select("id, full_name, email"),
  ]);

  const predictions = predictionsData || [];
  const matches = matchesData || [];
  const users = usersData || [];

  const matchMap = new Map<string, Match>();
  matches.forEach((match) => {
    matchMap.set(String(match.id), match as Match);
  });

  const userMap = new Map<string, { full_name?: string | null; email?: string | null }>();
  users.forEach((user) => userMap.set(user.id, user));

  const scoreMap = new Map<string, RankingEntry>();

  predictions.forEach((prediction) => {
    const match = matchMap.get(String(prediction.match_id));
    if (!match) return;

    const matchPoints = calculateMatchPoints(prediction, match).points;
    const exact = isExact(prediction, match) ? 1 : 0;

    const userId = prediction.user_id;
    const existing = scoreMap.get(userId);
    const user = userMap.get(userId);
    const base = {
      rank: 0,
      user_id: userId,
      user_name: user?.full_name || user?.email || "Participante",
      user_email: user?.email ?? null,
      total_points: 0,
      pre_copa_points: 0,
      group_stage_points: 0,
      knockout_points: 0,
      exact_scores: 0,
      created_at: undefined,
    };

    const isGroup = isGroupPhase(match.phase);
    const isKnockout = isKnockoutPhase(match.phase);
    if (existing) {
      existing.total_points += matchPoints;
      existing.exact_scores += exact;
      existing.group_stage_points += isGroup ? matchPoints : 0;
      existing.knockout_points += isKnockout ? matchPoints : 0;
    } else {
      scoreMap.set(userId, {
        ...base,
        total_points: matchPoints,
        exact_scores: exact,
        group_stage_points: isGroup ? matchPoints : 0,
        knockout_points: isKnockout ? matchPoints : 0,
      });
    }
  });

  const ranking = Array.from(scoreMap.values()).sort((a, b) => {
    if (b.total_points !== a.total_points) {
      return b.total_points - a.total_points;
    }
    if (b.exact_scores !== a.exact_scores) {
      return b.exact_scores - a.exact_scores;
    }
    return b.group_stage_points + b.knockout_points - (a.group_stage_points + a.knockout_points);
  });

  return ranking.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

function isExact(prediction: Prediction, match: Match) {
  return (
    match.home_score !== null &&
    match.away_score !== null &&
    prediction.predicted_home === match.home_score &&
    prediction.predicted_away === match.away_score
  );
}
