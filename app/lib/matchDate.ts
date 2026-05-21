export function parseKickoffAt(kickoffAt?: string | null): Date | null {
  if (!kickoffAt) {
    return null;
  }

  const parsed = new Date(kickoffAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatMatchDate(
  kickoffAt?: string | null,
  locale = "pt-BR",
  timeZone?: string
): string {
  const date = parseKickoffAt(kickoffAt);
  if (!date) {
    return "Data indefinida";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

export function formatMatchTime(
  kickoffAt?: string | null,
  locale = "pt-BR",
  timeZone?: string
): string {
  const date = parseKickoffAt(kickoffAt);
  if (!date) {
    return "--:--";
  }

  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

export function getMatchKickoffAt(match: {
  kickoff_at?: string | null;
  match_date?: string | null;
  match_datetime?: string | null;
}): string | null {
  return match.kickoff_at ?? match.match_date ?? match.match_datetime ?? null;
}

export function canEditPrediction(kickoffAt?: string | null, minutesBefore = 5): boolean {
  const matchDate = parseKickoffAt(kickoffAt);
  if (!matchDate) {
    return true;
  }

  const lockTime = new Date(matchDate);
  lockTime.setMinutes(lockTime.getMinutes() - minutesBefore);
  return new Date() < lockTime;
}

export function isPredictionLocked(kickoffAt?: string | null, isOpen = true): boolean {
  if (!isOpen) {
    return true;
  }

  return !canEditPrediction(kickoffAt);
}
