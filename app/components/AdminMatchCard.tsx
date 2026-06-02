"use client";

import { useEffect, useState } from "react";
import { formatBrazilTime } from "@/app/lib/matchDate";
import type { AdminMatch } from "@/app/lib/admin";

interface AdminMatchCardProps {
  match: AdminMatch;
  onSaveScore: (matchId: string, homeScore: number, awayScore: number) => Promise<void>;
  onFinalizeMatch: (matchId: string, homeScore: number, awayScore: number) => Promise<void>;
  onReopenMatch: (matchId: string) => Promise<void>;
  isProcessing: boolean;
}

export function AdminMatchCard({ match, onSaveScore, onFinalizeMatch, onReopenMatch, isProcessing }: AdminMatchCardProps) {
  const [homeScore, setHomeScore] = useState<number | string>(match.home_score ?? "");
  const [awayScore, setAwayScore] = useState<number | string>(match.away_score ?? "");

  useEffect(() => {
    setHomeScore(match.home_score ?? "");
    setAwayScore(match.away_score ?? "");
  }, [match.home_score, match.away_score]);

  const isFinished = match.is_finished === true || match.status === "finished";
  const homeTeam = match.home_team && typeof match.home_team !== "string" ? match.home_team : null;
  const awayTeam = match.away_team && typeof match.away_team !== "string" ? match.away_team : null;
  const homeTeamName = homeTeam?.name ?? "Mandante";
  const awayTeamName = awayTeam?.name ?? "Visitante";
  const homeTeamFlag = homeTeam?.flag_url;
  const awayTeamFlag = awayTeam?.flag_url;
  const kickoffLabel = formatBrazilTime(match.kickoff_at, "full");

  const handleSave = async () => {
    const home = Number(homeScore);
    const away = Number(awayScore);

    if (Number.isNaN(home) || Number.isNaN(away)) {
      alert("Informe placares válidos antes de salvar.");
      return;
    }

    await onSaveScore(match.id, home, away);
  };

  const handleFinalize = async () => {
    const home = Number(homeScore);
    const away = Number(awayScore);

    if (Number.isNaN(home) || Number.isNaN(away)) {
      alert("Informe placares válidos antes de finalizar.");
      return;
    }

    await onFinalizeMatch(match.id, home, away);
  };

  const handleReopen = async () => {
    await onReopenMatch(match.id);
  };

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
        <span>{match.group_name || match.phase || "Partida"}</span>
        <span className={`rounded-full px-3 py-1 text-xs ${isFinished ? "bg-emerald-500/10 text-emerald-200" : "bg-orange-500/10 text-orange-200"}`}>
          {isFinished ? "Finalizado" : match.status ? match.status : "Pendente"}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-4 border-t border-white/5 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-slate-400">Mandante</div>
          <div className="text-sm text-slate-400">Placar</div>
          <div className="text-sm text-slate-400">Visitante</div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {homeTeamFlag ? (
              <img src={homeTeamFlag} alt={homeTeamName} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <span className="h-10 w-10 rounded-full bg-slate-800" />
            )}
            <span className="text-lg font-semibold text-white">{homeTeamName}</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={homeScore}
              onChange={(event) => setHomeScore(event.target.value === "" ? "" : Number(event.target.value))}
              className="w-16 rounded-2xl border border-[#00ffb2]/15 bg-[#081116] px-3 py-2 text-center text-white outline-none"
              disabled={isFinished || isProcessing}
            />
            <span className="text-xl font-semibold text-white">×</span>
            <input
              type="number"
              min={0}
              value={awayScore}
              onChange={(event) => setAwayScore(event.target.value === "" ? "" : Number(event.target.value))}
              className="w-16 rounded-2xl border border-[#00ffb2]/15 bg-[#081116] px-3 py-2 text-center text-white outline-none"
              disabled={isFinished || isProcessing}
            />
          </div>

          <div className="flex items-center gap-3">
            {awayTeamFlag ? (
              <img src={awayTeamFlag} alt={awayTeamName} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <span className="h-10 w-10 rounded-full bg-slate-800" />
            )}
            <span className="text-lg font-semibold text-white">{awayTeamName}</span>
          </div>
        </div>

        {kickoffLabel ? <div className="text-xs text-slate-500">Partida: {kickoffLabel}</div> : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {!isFinished ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={isProcessing}
                className="rounded-2xl bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-lg hover:shadow-[#00ffb2]/30 disabled:opacity-50"
              >
                Salvar resultado
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={isProcessing}
                className="rounded-2xl border border-[#00ffb2]/20 bg-[#081116] px-4 py-2 text-sm text-[#00ffb2] transition hover:bg-[#0b1621] disabled:opacity-50"
              >
                Finalizar partida
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleReopen}
              disabled={isProcessing}
              className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
            >
              Reabrir partida
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
