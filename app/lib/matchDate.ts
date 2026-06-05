import {
  formatBrazilTime,
  isMatchLocked,
  parseKickoffAt,
  getMatchKickoffAt,
  canEditPrediction,
  isUpcomingMatch,
  isPastMatch,
  isMatchStarted,
  minutesUntilKickoff,
  getMatchStatus,
  compareKickoffTimes,
} from "./dateUtils";

// Re-export from dateUtils for backward compatibility
export {
  parseKickoffAt,
  formatBrazilTime,
  getMatchKickoffAt,
  canEditPrediction,
  isMatchLocked,
  isUpcomingMatch,
  isPastMatch,
  isMatchStarted,
  minutesUntilKickoff,
  getMatchStatus,
  compareKickoffTimes,
} from "./dateUtils";

/**
 * @deprecated Use formatBrazilTime() instead
 * Kept for backward compatibility
 */
export function formatMatchDate(
  kickoffAt?: string | null,
  locale = "pt-BR",
  timeZone = "UTC"
): string {
  return formatBrazilTime(kickoffAt, "full");
}

/**
 * @deprecated Use formatBrazilTime(kickoffAt, "time") instead
 * Kept for backward compatibility
 */
export function formatMatchTime(
  kickoffAt?: string | null,
  locale = "pt-BR",
  timeZone = "UTC"
): string {
  return formatBrazilTime(kickoffAt, "time");
}

/**
 * @deprecated Use isMatchLocked() instead
 * Kept for backward compatibility
 */
export function isPredictionLocked(kickoffAt?: string | null, isOpen = true): boolean {
  if (!isOpen) {
    return true;
  }
  return isMatchLocked(kickoffAt);
}
