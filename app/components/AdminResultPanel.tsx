"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatBrazilTime } from "@/app/lib/matchDate";
import type { Match, Team } from "../types/index";

interface MatchResult {
  id: string;
  match_number?: number;
  phase: string;
  group_name?: string;
  home_team_id?: string;
  away_team_id?: string;
  home_score?: number;
  away_score?: number;
  status?: string;
  is_finished?: boolean;
  kickoff_at?: string;
  stadium?: string;
  home_team?: Team | null;
  away_team?: Team | null;
}

export default function AdminResultPanel() {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editScores, setEditScores] = useState<{ home: number; away: number }>({
    home: 0,
    away: 0,
  });
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // Fetch matches
  const fetchMatches = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("supabase.auth.token");
      if (!token) {
        setMessage({ type: "error", text: "No auth token found" });
        return;
      }

      const params = new URLSearchParams();
      if (selectedPhase !== "all") params.append("phase", selectedPhase);
      if (selectedStatus !== "all") params.append("status", selectedStatus);

      const response = await fetch(`/api/admin/results?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch matches: ${response.statusText}`);
      }

      const data = await response.json();
      setMatches(data.matches || []);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to fetch matches",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [selectedPhase, selectedStatus]);

  // Handle finalize match
  const handleFinalizeMatch = async (matchId: string, homeScore: number, awayScore: number) => {
    if (!window.confirm(`Finalize match with score ${homeScore} - ${awayScore}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("supabase.auth.token");
      if (!token) {
        setMessage({ type: "error", text: "No auth token found" });
        return;
      }

      setLoading(true);
      const response = await fetch("/api/admin/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId,
          homeScore,
          awayScore,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to finalize match: ${response.statusText}`);
      }

      const data = await response.json();
      setMessage({
        type: "success",
        text: `Match finalized! Updated ${data.updatedPredictions} predictions.`,
      });
      setEditingMatchId(null);
      await fetchMatches();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to finalize match",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle reopen match
  const handleReopenMatch = async (matchId: string) => {
    if (!window.confirm("Reopen this match? Prediction points will be reset.")) {
      return;
    }

    try {
      const token = localStorage.getItem("supabase.auth.token");
      if (!token) {
        setMessage({ type: "error", text: "No auth token found" });
        return;
      }

      setLoading(true);
      const response = await fetch(`/api/admin/results/reopen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ matchId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reopen match: ${response.statusText}`);
      }

      const data = await response.json();
      setMessage({
        type: "success",
        text: `Match reopened! Reset ${data.affectedPredictions} predictions.`,
      });
      await fetchMatches();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to reopen match",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTeamName = (match: MatchResult, type: "home" | "away") => {
    const team = type === "home" ? match.home_team : match.away_team;
    return team?.name || "Unknown Team";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Match Result Management</h2>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 mb-6">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Phase</label>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="w-full sm:w-48 rounded-lg border border-[#00ffb2]/20 bg-[#0b1320] px-3 py-2 text-sm text-white focus:border-[#00ffb2] focus:outline-none"
            >
              <option value="all">All Phases</option>
              <option value="friendly">Friendly</option>
              <option value="group">Group Stage</option>
              <option value="round_of_32">Round of 32</option>
              <option value="round_of_16">Round of 16</option>
              <option value="quarterfinal">Quarterfinal</option>
              <option value="semifinal">Semifinal</option>
              <option value="third_place">3rd Place</option>
              <option value="final">Final</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-48 rounded-lg border border-[#00ffb2]/20 bg-[#0b1320] px-3 py-2 text-sm text-white focus:border-[#00ffb2] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="live">Live</option>
              <option value="finished">Finished</option>
            </select>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-rose-500/10 text-rose-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Matches List */}
        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading matches...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No matches found</div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {matches.map((match) => (
              <div
                key={match.id}
                className="rounded-lg border border-[#00ffb2]/20 bg-[#0b1320] p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Match Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[#00ffb2] font-semibold mb-2">
                      {match.phase === "friendly"
                        ? "Amistoso"
                        : match.group_name
                          ? `Grupo ${match.group_name}`
                          : match.phase}
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Teams */}
                      <div className="text-sm text-white text-center flex-1 truncate">
                        {getTeamName(match, "home")} vs {getTeamName(match, "away")}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {formatBrazilTime(match.kickoff_at, "full")}
                    </div>
                  </div>

                  {/* Score or Input */}
                  <div className="flex items-center gap-2">
                    {editingMatchId === match.id ? (
                      <>
                        <input
                          type="number"
                          min="0"
                          value={editScores.home}
                          onChange={(e) =>
                            setEditScores({ ...editScores, home: parseInt(e.target.value) || 0 })
                          }
                          className="w-12 h-12 rounded-lg border border-[#00ffb2]/20 bg-[#04070f] text-center text-sm text-white focus:border-[#00ffb2] focus:outline-none"
                        />
                        <span className="text-white font-bold">-</span>
                        <input
                          type="number"
                          min="0"
                          value={editScores.away}
                          onChange={(e) =>
                            setEditScores({ ...editScores, away: parseInt(e.target.value) || 0 })
                          }
                          className="w-12 h-12 rounded-lg border border-[#00ffb2]/20 bg-[#04070f] text-center text-sm text-white focus:border-[#00ffb2] focus:outline-none"
                        />
                      </>
                    ) : (
                      <div className="text-lg font-bold text-[#00ffb2]">
                        {match.home_score !== null && match.home_score !== undefined
                          ? `${match.home_score} - ${match.away_score}`
                          : "Not set"}
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0">
                    {match.is_finished ? (
                      <span className="text-emerald-300 bg-emerald-500/10">Finished</span>
                    ) : (
                      <span className="text-yellow-300 bg-yellow-500/10">Pending</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    {editingMatchId === match.id ? (
                      <>
                        <button
                          onClick={() =>
                            handleFinalizeMatch(
                              match.id,
                              editScores.home,
                              editScores.away
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setEditingMatchId(null)}
                          className="px-3 py-1.5 rounded-lg bg-slate-500/20 text-slate-300 text-xs font-semibold hover:bg-slate-500/30 transition"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {!match.is_finished ? (
                          <button
                            onClick={() => {
                              setEditingMatchId(match.id);
                              setEditScores({ home: 0, away: 0 });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#00ffb2]/20 text-[#00ffb2] text-xs font-semibold hover:bg-[#00ffb2]/30 transition"
                          >
                            Set Score
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReopenMatch(match.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-semibold hover:bg-rose-500/30 transition"
                          >
                            Reopen
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
