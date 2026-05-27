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

export async function fetchAdminMatches(phase = "all", status = "all"): Promise<AdminMatch[]> {
  try {
    const normalizedPhase = (phase || "all").toLowerCase();
    const normalizedStatus = (status || "all").toLowerCase();

    let query = supabase
      .from("matches")
      .select(`
        id,
        match_number,
        phase,
        group_name,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        status,
        is_finished,
        kickoff_at,
        match_date,
        stadium,
        home_team:home_team_id (id, name, fifa_code, flag_url),
        away_team:away_team_id (id, name, fifa_code, flag_url)
      `)
      .order("match_date", { ascending: true });

    if (normalizedPhase === "friendly") {
      query = query.eq("phase", "friendly");
    } else if (normalizedPhase === "group") {
      query = query.in("phase", ["group", "group_stage"]);
    } else if (normalizedPhase === "knockout") {
      query = query.in("phase", ["round_of_32", "round_of_16", "quarterfinal", "quarterfinals", "semifinal", "semifinals", "third_place", "final"]);
    } else if (normalizedPhase !== "all") {
      query = query.eq("phase", normalizedPhase);
    }

    if (normalizedStatus === "pending") {
      query = query.in("status", ["pending", "scheduled"]);
    } else if (normalizedStatus === "finished") {
      query = query.in("status", ["finished", "completed", "complete"]);
    } else if (normalizedStatus !== "all") {
      query = query.eq("status", normalizedStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[admin] query failed", { error: error.message, phase: normalizedPhase, status: normalizedStatus });
      throw error;
    }

    const matches = ((data || []) as any[]).map((match) => ({
      ...match,
      home_team: Array.isArray(match.home_team) ? match.home_team[0] ?? null : match.home_team ?? null,
      away_team: Array.isArray(match.away_team) ? match.away_team[0] ?? null : match.away_team ?? null,
      kickoff_at: match.kickoff_at ?? match.match_date ?? null,
    })) as AdminMatch[];

    console.log("[admin] rows returned", {
      totalRows: matches.length,
      filters: { phase: normalizedPhase, status: normalizedStatus },
      phases: Array.from(new Set(matches.map((match) => match.phase).filter(Boolean))).sort(),
      statuses: Array.from(new Set(matches.map((match) => match.status || (match.is_finished ? "finished" : "pending")).filter(Boolean))).sort(),
    });

    return matches;
  } catch (error) {
    console.error("Error loading admin matches:", error);
    return [];
  }
}

export async function finalizeMatchResult(matchId: string, homeScore: number, awayScore: number) {
  const response = await fetch("/api/admin/results", {
    method: "POST",
    headers: await getAdminHeaders(),
    body: JSON.stringify({ matchId, homeScore, awayScore }),
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
