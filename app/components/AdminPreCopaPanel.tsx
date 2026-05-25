"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

interface PreCopaOutcome {
  champion: string;
  runner_up: string;
  top_scorer: string;
  top_scorer_goals: number;
  best_player: string;
  best_goalkeeper: string;
  most_assists: string;
  fair_play: string;
  revelation: string;
}

export default function AdminPreCopaPanel() {
  const [outcome, setOutcome] = useState<PreCopaOutcome>({
    champion: "",
    runner_up: "",
    top_scorer: "",
    top_scorer_goals: 0,
    best_player: "",
    best_goalkeeper: "",
    most_assists: "",
    fair_play: "",
    revelation: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const handleInputChange = (key: keyof PreCopaOutcome, value: string | number) => {
    setOutcome({ ...outcome, [key]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allFilled = Object.entries(outcome).every(([key, value]) => {
      if (key === "top_scorer_goals") {
        return typeof value === "number" && value >= 0;
      }
      return typeof value === "string" && value.trim().length > 0;
    });

    if (!allFilled) {
      setMessage({ type: "error", text: "All fields are required" });
      return;
    }

    if (!window.confirm("Update official Pre-Copa outcomes and recalculate all user points?")) {
      return;
    }

    try {
      setLoading(true);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error("No valid admin session found. Please sign in again.");
      }

      const response = await fetch("/api/admin/pre-copa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify(outcome),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error || response.statusText || "Failed to update outcomes");
      }

      const data = await response.json();
      setMessage({
        type: "success",
        text: `Pre-Copa outcomes updated! Scored ${data.updatedUsers} users.`,
      });
      setOutcome({
        champion: "",
        runner_up: "",
        top_scorer: "",
        top_scorer_goals: 0,
        best_player: "",
        best_goalkeeper: "",
        most_assists: "",
        fair_play: "",
        revelation: "",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update outcomes",
      });
    } finally {
      setLoading(false);
    }
  };

  const fields: Array<{
    key: keyof PreCopaOutcome;
    label: string;
    description: string;
    points: number;
    type: "text" | "number";
  }> = [
    { key: "champion", label: "Champion", description: "Tournament winner", points: 15, type: "text" },
    { key: "runner_up", label: "Runner-up", description: "Final runner-up", points: 10, type: "text" },
    { key: "top_scorer", label: "Top Scorer", description: "Best scorer", points: 10, type: "text" },
    { key: "top_scorer_goals", label: "Top Scorer Goals", description: "Total goals by top scorer", points: 5, type: "number" },
    { key: "best_player", label: "Best Player", description: "Tournament MVP", points: 10, type: "text" },
    { key: "best_goalkeeper", label: "Best Goalkeeper", description: "Best goalkeeper", points: 8, type: "text" },
    { key: "most_assists", label: "Most Assists", description: "Player with most assists", points: 8, type: "text" },
    { key: "fair_play", label: "Fair Play Team", description: "Most disciplined team", points: 7, type: "text" },
    { key: "revelation", label: "Revelation", description: "Tournament revelation", points: 7, type: "text" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Pre-Copa Official Outcomes</h2>
        <p className="text-slate-400 text-sm mb-6">
          Define the official outcomes and score every user's Pre-Copa predictions automatically.
        </p>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-semibold text-[#00ffb2] mb-2">
                  {field.label}
                  <span className="text-slate-400 text-xs ml-2">({field.points} pts)</span>
                </label>
                <input
                  type={field.type}
                  min={field.type === "number" ? 0 : undefined}
                  value={outcome[field.key] as string | number}
                  onChange={(event) =>
                    handleInputChange(
                      field.key,
                      field.type === "number" ? Number(event.target.value) : event.target.value
                    )
                  }
                  placeholder={field.description}
                  className="w-full rounded-lg border border-[#00ffb2]/20 bg-[#0b1320] px-3 py-2.5 text-white placeholder-slate-500 focus:border-[#00ffb2] focus:outline-none text-sm"
                  disabled={loading}
                />
              </div>
            ))}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-[#00ffb2]/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Outcomes & Recalculate Rankings"}
            </button>
          </div>
        </form>

        <div className="mt-6 rounded-lg border border-[#00ffb2]/20 bg-[#0b1320] p-4">
          <h3 className="text-sm font-semibold text-[#00ffb2] mb-3">Scoring Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {fields.map((field) => (
              <div key={field.key} className="text-xs">
                <div className="text-slate-400">{field.label}</div>
                <div className="text-[#00ffb2] font-semibold">{field.points} pts</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-400 mt-3 border-t border-[#00ffb2]/10 pt-3">
            Maximum possible: {fields.reduce((sum, field) => sum + field.points, 0)} points
          </div>
        </div>
      </div>
    </div>
  );
}
