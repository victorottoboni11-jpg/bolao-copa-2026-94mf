import { supabase } from "./supabase";
import type { LeaderboardEntry, Match } from "../types";

interface RawPrediction {
  user_id: string;
  match_id: string | number;
  predicted_home: number;
  predicted_away: number;
}

interface RawUser {
  id: string;
  name?: string | null;
  email?: string | null;
}

const scorePrediction = (
  prediction: RawPrediction,
  match: Pick<Match, "home_score" | "away_score">
) => {
  const homeScore = match.home_score;
  const awayScore = match.away_score;

  if (homeScore === null || awayScore === null) {
    return { points: 0, exact: 0, correctResult: 0 };
  }

  const exact =
    homeScore !== undefined && awayScore !== undefined &&
    prediction.predicted_home === homeScore &&
    prediction.predicted_away === awayScore
      ? 1
      : 0;

  if (homeScore === undefined || awayScore === undefined) {
    return { points: 0, exact: 0, correctResult: 0 };
  }

  const diffPrediction = prediction.predicted_home - prediction.predicted_away;
  const diffReal = homeScore - awayScore;
  const winnerPrediction = Math.sign(diffPrediction);
  const winnerReal = Math.sign(diffReal);
  const correctResult = winnerPrediction === winnerReal ? 1 : 0;
  const sameDifference = diffPrediction === diffReal ? 1 : 0;

  if (exact) {
    return { points: 5, exact: 1, correctResult: 1 };
  }

  if (correctResult) {
    return { points: 3, exact: 0, correctResult: 1 };
  }

  if (sameDifference) {
    return { points: 1, exact: 0, correctResult: 0 };
  }

  return { points: 0, exact: 0, correctResult: 0 };
};

export async function fetchLeaderboard() {
  const [{ data: predictionsData }, { data: matchesData }, { data: usersData }] =
    await Promise.all([
      supabase
        .from("predictions")
        .select("user_id, match_id, predicted_home, predicted_away"),
      supabase
        .from("matches")
        .select("id, home_score, away_score"),
      supabase.from("users").select("id, name, email"),
    ]);

  const predictions = predictionsData || [];
  const matches = matchesData || [];
  const users = usersData || [];

  const matchMap = new Map<string, Pick<Match, "home_score" | "away_score">>();
  matches.forEach((match) => {
    matchMap.set(String(match.id), {
      home_score: match.home_score ?? null,
      away_score: match.away_score ?? null,
    });
  });

  const userMap = new Map<string, RawUser>();
  users.forEach((user) => userMap.set(user.id, user));

  const scoreMap = new Map<string, LeaderboardEntry>();

  predictions.forEach((prediction) => {
    const match = matchMap.get(String(prediction.match_id));
    if (!match) {
      return;
    }

    const result = scorePrediction(prediction, match);
    const userId = prediction.user_id;
    const existing = scoreMap.get(userId);

    const currentUser = userMap.get(userId);
    const userName = currentUser?.name || currentUser?.email || "Participante";

    if (existing) {
      existing.points += result.points;
      existing.exacts += result.exact;
      existing.correctResults += result.correctResult;
      existing.predictions += 1;
    } else {
      scoreMap.set(userId, {
        userId,
        userName,
        email: currentUser?.email ?? null,
        points: result.points,
        exacts: result.exact,
        correctResults: result.correctResult,
        predictions: 1,
      });
    }
  });

  return Array.from(scoreMap.values()).sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    if (b.exacts !== a.exacts) {
      return b.exacts - a.exacts;
    }

    return b.correctResults - a.correctResults;
  });
}
