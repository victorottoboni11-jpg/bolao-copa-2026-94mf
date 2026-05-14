import type { Match, Prediction } from "../types";

// ========== CONSTANTES DE PONTUAÇÃO ==========

export const SCORING_RULES = {
  GROUPS: {
    EXACT_SCORE: 10,
    CORRECT_RESULT: 5,
    WRONG: 0,
  },
};

export function calculateMatchPoints(prediction: Prediction, match: Match): number {
  if (match.home_score === undefined || match.home_score === null || match.away_score === undefined || match.away_score === null) {
    return 0;
  }

  const predictedHome = prediction.predicted_home;
  const predictedAway = prediction.predicted_away;
  const actualHome = match.home_score;
  const actualAway = match.away_score;

  if (predictedHome === actualHome && predictedAway === actualAway) {
    return SCORING_RULES.GROUPS.EXACT_SCORE;
  }

  const actualResult = actualHome > actualAway ? "home" : actualAway > actualHome ? "away" : "draw";
  const predictedResult = predictedHome > predictedAway ? "home" : predictedAway > predictedHome ? "away" : "draw";

  if (actualResult === predictedResult) {
    return SCORING_RULES.GROUPS.CORRECT_RESULT;
  }

  return SCORING_RULES.GROUPS.WRONG;
}

export function calculateExactScores(predictions: Prediction[], matches: Match[]): number {
  return predictions.filter((prediction) => {
    const match = matches.find((m) => m.id === prediction.match_id);
    if (!match || match.home_score === undefined || match.home_score === null || match.away_score === undefined || match.away_score === null) return false;
    return prediction.predicted_home === match.home_score && prediction.predicted_away === match.away_score;
  }).length;
}

export function calculateCorrectResults(predictions: Prediction[], matches: Match[]): number {
  return predictions.filter((prediction) => {
    const match = matches.find((m) => m.id === prediction.match_id);
    if (!match || match.home_score === undefined || match.home_score === null || match.away_score === undefined || match.away_score === null) return false;

    const actualResult = match.home_score > match.away_score ? "home" : match.away_score > match.home_score ? "away" : "draw";
    const predictedResult =
      prediction.predicted_home > prediction.predicted_away
        ? "home"
        : prediction.predicted_away > prediction.predicted_home
          ? "away"
          : "draw";

    return actualResult === predictedResult;
  }).length;
}
