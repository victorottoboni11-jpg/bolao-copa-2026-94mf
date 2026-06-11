/**
 * Timezone-safe date utilities for Copa 2026 app
 * All database kickoff_at values are UTC timestamps
 * Display shows the UTC time as-is (no timezone conversion)
 */

const LOCK_MINUTES_BEFORE = 30;

/**
 * Parse ISO string to Date object (safe)
 * Input: UTC ISO string from Supabase (e.g. "2026-06-12T16:00:00Z")
 * Output: Date object or null if invalid
 */
export function parseKickoffAt(kickoffAt?: string | null): Date | null {
  if (!kickoffAt) return null;
  const parsed = new Date(kickoffAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Format UTC timestamp for display
 * Input: UTC ISO string from Supabase
 * Output: Human-readable string showing the UTC time exactly as stored
 */
export function formatBrazilTime(
  kickoffAt?: string | null,
  style: "full" | "time" | "date" = "full"
): string {
  const date = parseKickoffAt(kickoffAt);
  if (!date) return style === "time" ? "--:--" : "Data indefinida";

  const opts: Intl.DateTimeFormatOptions = {
    timeZone: "America/Sao_Paulo",
  };

  if (style === "full" || style === "date") {
    opts.day = "2-digit";
    opts.month = "short";
    opts.year = "numeric";
  }

  if (style === "full" || style === "time") {
    opts.hour = "2-digit";
    opts.minute = "2-digit";
  }

  return new Intl.DateTimeFormat("pt-BR", opts).format(date);
}

/**
 * Check if match is locked (within 30 minutes of kickoff)
 * Uses server time (UTC)
 * Returns true if locked, false if can still place bets
 */
export function isMatchLocked(kickoffAt?: string | null): boolean {
  const date = parseKickoffAt(kickoffAt);
  if (!date) return false;

  // kickoff_at está em timestamp without timezone (horário de Brasília literal)
  // Comparamos diretamente com o horário local do browser/servidor
  const cutoffTime = new Date(date.getTime() - LOCK_MINUTES_BEFORE * 60 * 1000);
  return new Date() >= cutoffTime;
}

/**
 * Check if match is upcoming (in the future)
 * Uses server time (UTC)
 * Returns true if kickoff is in future, false if past/now
 */
export function isUpcomingMatch(kickoffAt?: string | null): boolean {
  const date = parseKickoffAt(kickoffAt);
  if (!date) return false;
  return date > new Date();
}

/**
 * Check if match is in the past (finished or currently playing)
 * Uses server time (UTC)
 */
export function isPastMatch(kickoffAt?: string | null): boolean {
  return !isUpcomingMatch(kickoffAt);
}

/**
 * Check if match has started
 * Returns true if kickoff time is in the past or now
 */
export function isMatchStarted(kickoffAt?: string | null): boolean {
  const date = parseKickoffAt(kickoffAt);
  if (!date) return false;
  return new Date() >= date;
}

/**
 * Get minutes until match starts
 * Negative = match has started
 */
export function minutesUntilKickoff(kickoffAt?: string | null): number {
  const date = parseKickoffAt(kickoffAt);
  if (!date) return 0;
  return Math.round((date.getTime() - new Date().getTime()) / 60000);
}

/**
 * Check if prediction editing is allowed
 * Returns true if CAN edit, false if locked
 * Considers both match lock time and global predictions setting
 */
export function canEditPrediction(kickoffAt?: string | null, predictionsOpen = true): boolean {
  if (!predictionsOpen) return false;
  return !isMatchLocked(kickoffAt);
}

/**
 * Get match status for display
 */
export function getMatchStatus(kickoffAt?: string | null): "upcoming" | "locked" | "started" {
  if (isMatchStarted(kickoffAt)) return "started";
  if (isMatchLocked(kickoffAt)) return "locked";
  return "upcoming";
}

/**
 * Extract kickoff_at from match object (handles multiple date fields)
 */
export function getMatchKickoffAt(match: {
  kickoff_at?: string | null;
  match_date?: string | null;
  match_datetime?: string | null;
}): string | null {
  return match.kickoff_at ?? match.match_date ?? match.match_datetime ?? null;
}

/**
 * Safe date comparison for sorting
 * Returns negative if a is before b, positive if after
 */
export function compareKickoffTimes(
  kickoffA?: string | null,
  kickoffB?: string | null
): number {
  const dateA = parseKickoffAt(kickoffA);
  const dateB = parseKickoffAt(kickoffB);

  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  return dateA.getTime() - dateB.getTime();
}
