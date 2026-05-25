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
    const params = new URLSearchParams();
    if (phase && phase !== "all") params.set("phase", phase);
    if (status && status !== "all") params.set("status", status);

    const url = `/api/admin/results${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, {
      headers: await getAdminHeaders(),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error || response.statusText || "Failed to load admin matches");
    }

    const data = await response.json();
    return data.matches || [];
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
