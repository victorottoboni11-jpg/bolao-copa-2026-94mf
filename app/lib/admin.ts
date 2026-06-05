import { supabase } from "./supabase";
import type { Match } from "../types";

export type AdminMatch = Omit<Match, "phase"> & {
  phase: string;
  status?: string;
  kickoff_at?: string | null;
  group_name?: string | null;
};

async function getAdminHeaders() {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data?.session?.access_token) {
    throw new Error("Admin session is not available. Please sign in again.");
  }

  return {
    Authorization: `Bearer ${data.session.access_token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchAdminMatches(): Promise<AdminMatch[]> {
  try {
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
      .order("kickoff_at", { ascending: true })
      .order("match_date", { ascending: true });

    if (error) {
      console.error("[admin] query failed", { error: error.message });
      throw error;
    }

    const matches = ((data || []) as any[]).map((match) => ({
      ...match,
      home_team:
        match.home_team && typeof match.home_team === "object"
          ? match.home_team
          : null,
      away_team:
        match.away_team && typeof match.away_team === "object"
          ? match.away_team
          : null,
      kickoff_at: match.kickoff_at ?? match.match_date ?? null,
    })) as AdminMatch[];

    console.log("[admin] raw rows returned", { totalRows: matches.length });

    return matches;
  } catch (error) {
    console.error("Error loading admin matches:", error);
    return [];
  }
}

export async function finalizeMatchResult(matchId: string, homeScore: number, awayScore: number, winner?: string, penalties?: boolean) {
  const response = await fetch("/api/admin/results", {
    method: "POST",
    headers: await getAdminHeaders(),
    body: JSON.stringify({ matchId, homeScore, awayScore, winner, penalties }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || response.statusText || "Failed to finalize match");
  }

  return response.json();
}

export async function reopenMatchResult(matchId: string) {
  const response = await fetch("/api/admin/results/reopen", {
    method: "POST",
    headers: await getAdminHeaders(),
    body: JSON.stringify({ matchId }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || response.statusText || "Failed to reopen match");
  }

  return response.json();
}

