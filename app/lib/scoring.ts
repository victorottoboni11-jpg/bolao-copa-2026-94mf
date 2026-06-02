import type { Match, Prediction } from "../types";
import { isGroupPhase, isKnockoutPhase } from "./phases";

// ========== CONSTANTES DE PONTUAÇÃO ==========

export const SCORING_RULES = {
  PRE_COPA: {
    CHAMPION: 15,
    RUNNER_UP: 10,
    TOP_SCORER_EXACT: 10,
    TOP_SCORER_GOALS: 5,
    GOLDEN_BALL: 10,
    BEST_GOALKEEPER: 8,
    MOST_ASSISTS: 8,
    FAIR_PLAY: 7,
    REVELATION: 7,
  },

  GROUPS: {
    EXACT_SCORE: 5,
    CORRECT_RESULT: 3,
    WRONG: 0,
  },

  KNOCKOUT: {
    EXACT_WINNER_SCORE: 8,
    SCORE_RESULT: 4,
    ONLY_WINNER: 4,
    ONLY_RESULT: 1,
    WRONG: 0,
  },
};

export function calculateGroupStagePoints(prediction: Prediction, match: Match): number {
  if (match.home_score === undefined || match.home_score === null || match.away_score === undefined || match.away_score === null) {
    return 0;
  }

  const { predicted_home, predicted_away } = prediction;
  const { home_score, away_score } = match;

  if (predicted_home === home_score && predicted_away === away_score) {
    return SCORING_RULES.GROUPS.EXACT_SCORE;
  }

  const actualResult = home_score > away_score ? "home" : away_score > home_score ? "away" : "draw";
  const predictedResult = predicted_home > predicted_away ? "home" : predicted_away > predicted_home ? "away" : "draw";

  if (actualResult === predictedResult) {
    return SCORING_RULES.GROUPS.CORRECT_RESULT;
  }

  return SCORING_RULES.GROUPS.WRONG;
}

export function calculateKnockoutPoints(prediction: Prediction, match: Match): number {
  if (match.home_score === undefined || match.home_score === null || match.away_score === undefined || match.away_score === null) {
    return 0;
  }

  const { predicted_home, predicted_away } = prediction;
  const { home_score, away_score } = match;
  const exactScore = predicted_home === home_score && predicted_away === away_score;

  if (exactScore) {
    return SCORING_RULES.KNOCKOUT.EXACT_WINNER_SCORE;
  }

  const actualWinner = home_score > away_score ? "home" : away_score > home_score ? "away" : "draw";
  const predictedWinner = predicted_home > predicted_away ? "home" : predicted_away > predicted_home ? "away" : "draw";
  const oneSideCorrect = predicted_home === home_score || predicted_away === away_score;

  if (actualWinner === predictedWinner && actualWinner !== "draw") {
    if (oneSideCorrect) {
      return SCORING_RULES.KNOCKOUT.SCORE_RESULT;
    }
    return SCORING_RULES.KNOCKOUT.ONLY_WINNER;
  }

  if (oneSideCorrect) {
    return SCORING_RULES.KNOCKOUT.ONLY_RESULT;
  }

  return SCORING_RULES.KNOCKOUT.WRONG;
}

function isGroupPhaseMatch(phase?: string, groupName?: string | null) {
  return isGroupPhase(phase) || typeof groupName === "string";
}

function isKnockoutPhaseMatch(phase?: string) {
  return isKnockoutPhase(phase);
}

export function calculateMatchPoints(prediction: Prediction, match: Match) {
  if (match.home_score === undefined || match.home_score === null || match.away_score === undefined || match.away_score === null) {
    return { points: 0, exact: false };
  }

  const exact = prediction.predicted_home === match.home_score && prediction.predicted_away === match.away_score;

  return {
    points: isGroupPhaseMatch(match.phase, match.group_name)
      ? calculateGroupStagePoints(prediction, match)
      : calculateKnockoutPoints(prediction, match),
    exact,
  };
}

export function calculatePreCopaPoints(
  championMatches: boolean,
  runnerUpMatches: boolean,
  topScorerMatches: boolean,
  topScorerGoalsMatches: boolean,
  goldenBallMatches: boolean,
  bestGoalkeeperMatches: boolean,
  mostAssistsMatches: boolean,
  fairPlayMatches: boolean,
  revelationMatches: boolean
): number {
  let points = 0;

  if (championMatches) points += SCORING_RULES.PRE_COPA.CHAMPION;
  if (runnerUpMatches) points += SCORING_RULES.PRE_COPA.RUNNER_UP;
  if (topScorerMatches) points += SCORING_RULES.PRE_COPA.TOP_SCORER_EXACT;
  if (topScorerGoalsMatches) points += SCORING_RULES.PRE_COPA.TOP_SCORER_GOALS;
  if (goldenBallMatches) points += SCORING_RULES.PRE_COPA.GOLDEN_BALL;
  if (bestGoalkeeperMatches) points += SCORING_RULES.PRE_COPA.BEST_GOALKEEPER;
  if (mostAssistsMatches) points += SCORING_RULES.PRE_COPA.MOST_ASSISTS;
  if (fairPlayMatches) points += SCORING_RULES.PRE_COPA.FAIR_PLAY;
  if (revelationMatches) points += SCORING_RULES.PRE_COPA.REVELATION;

  return points;
}

export function calculateUserPhasePoints(
  predictions: Prediction[],
  matches: Match[],
  phase: "group" | "knockout"
): number {
  return predictions.reduce((total, prediction) => {
    const match = matches.find((m) => m.id === prediction.match_id);
    if (!match) return total;

    const points =
      phase === "group" ? calculateGroupStagePoints(prediction, match) : calculateKnockoutPoints(prediction, match);

    return total + points;
  }, 0);
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
