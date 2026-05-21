"use client";

import { useState } from "react";
import Image from "next/image";
import { ScoreInput } from "@/app/components/ScoreInput";
import { formatPhaseLabel } from "@/app/lib/phases";
import { formatMatchDate, formatMatchTime, getMatchKickoffAt } from "@/app/lib/matchDate";
import type { Match, Team } from "@/app/types";

interface MatchCardProps {
  match: Match;
  homeTeam?: Team;
  awayTeam?: Team;
  onPrediction?: (homeScore: number, awayScore: number) => void;
  isEditable?: boolean;
  predictedHome?: number;
  predictedAway?: number;
  locked?: boolean;
  disabled?: boolean;
  lockMessage?: string;
  predictionUpdatedAt?: string;
}

export function MatchCard({
  match,
  homeTeam,
  awayTeam,
  onPrediction,
  isEditable = false,
  predictedHome,
  predictedAway,
  locked = false,
  disabled = false,
  lockMessage,
  predictionUpdatedAt,
}: MatchCardProps) {
  const [home, setHome] = useState(predictedHome ?? 0);
  const [away, setAway] = useState(predictedAway ?? 0);

  const hasScore =
    match.home_score !== null &&
    match.away_score !== null &&
    match.home_score !== undefined &&
    match.away_score !== undefined;

  const hasPrediction = predictedHome !== undefined && predictedAway !== undefined;
  const formattedPredictionAt = predictionUpdatedAt
    ? new Date(predictionUpdatedAt).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      })
    : null;

  const handlePredict = () => {
    onPrediction?.(home, away);
  };


  const homeTeamResolved =
    homeTeam ??
    match.home_team_info ??
    (typeof match.home_team === "object" ? match.home_team : undefined);
  const awayTeamResolved =
    awayTeam ??
    match.away_team_info ??
    (typeof match.away_team === "object" ? match.away_team : undefined);

  const homeTeamName =
    homeTeamResolved?.name ||
    (typeof match.home_team === "string" ? match.home_team : "Mandante");
  const awayTeamName =
    awayTeamResolved?.name ||
    (typeof match.away_team === "string" ? match.away_team : "Visitante");

  const kickoffAt = getMatchKickoffAt(match);
  const formattedDate = formatMatchDate(kickoffAt);
  const formattedTime = formatMatchTime(kickoffAt);

  return (
    <div className="bg-gradient-to-br from-[#081116] to-[#070b16] border border-[#00ffb2]/20 rounded-lg overflow-hidden hover:border-[#00ffb2]/50 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(0,255,178,0.1)]">
      {/* Header - Compact */}
      <div className="bg-gradient-to-r from-[#00ffb2]/10 to-[#00b2ff]/10 px-3 py-2 border-b border-[#00ffb2]/10">
        <div className="flex justify-between items-center gap-2">
          <span className="text-xs font-bold text-[#00ffb2] uppercase tracking-wide flex items-center gap-1.5 flex-shrink-0">
            {match.phase === "friendly" ? (
              <span className="px-1.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-300 text-xs">Amistoso</span>
            ) : (
              match.group_name ? `Grupo ${match.group_name}` : formatPhaseLabel(match.phase)
            )}
          </span>
          <span className="text-xs text-[#00b2ff]/60 text-right whitespace-nowrap">{formattedTime}</span>
        </div>
      </div>

      {/* Match Content */}
      <div className="p-3 sm:p-4">
        {/* Stadium & Date */}
        <div className="text-xs text-gray-400 mb-2 text-center line-clamp-1">
          {match.stadium}
        </div>
        <div className="text-xs text-slate-400 mb-3 text-center">
          {formattedDate}
        </div>

        {/* Status Badge - Compact */}
        <div className="mb-3 flex justify-center">
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${locked ? "bg-rose-500/10 text-rose-300" : "bg-emerald-500/10 text-emerald-300"}`}>
            {locked ? "Encerrado" : "Aberto"}
          </span>
        </div>

        {/* Prediction Info - Compact */}
        {hasPrediction && (
          <div className="mb-3 text-center text-xs text-slate-400">
            Palpite: <span className="text-[#00ffb2]">{predictedHome} - {predictedAway}</span>
            {formattedPredictionAt && <div className="text-slate-500 text-xs mt-1">{formattedPredictionAt}</div>}
          </div>
        )}

        {/* Teams - Horizontal Compact Layout */}
        <div className="flex items-center justify-between gap-1.5 mb-3 sm:gap-2">
          {/* Home Team */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            {homeTeamResolved?.flag_url && (
              <Image
                src={homeTeamResolved.flag_url}
                alt={homeTeamName}
                width={48}
                height={32}
                className="rounded mb-1 sm:w-12 sm:h-8"
              />
            )}
            <span className="text-xs sm:text-sm font-semibold text-center text-white truncate">
              {homeTeamName}
            </span>
          </div>

          {/* Score or Prediction - Center */}
          <div className="flex flex-col items-center flex-shrink-0">
            {hasScore ? (
              <div className="text-base sm:text-lg font-bold text-[#00ffb2]">
                {match.home_score}–{match.away_score}
              </div>
            ) : isEditable ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <ScoreInput
                  value={home}
                  onChange={setHome}
                  disabled={locked || disabled}
                  label="placar do time da casa"
                />
                <span className="text-xs sm:text-sm font-semibold text-[#00b2ff]">vs</span>
                <ScoreInput
                  value={away}
                  onChange={setAway}
                  disabled={locked || disabled}
                  label="placar do time visitante"
                />
              </div>
            ) : predictedHome !== undefined && predictedAway !== undefined ? (
              <div className="text-sm sm:text-base font-semibold text-[#00b2ff]">
                {predictedHome}–{predictedAway}
              </div>
            ) : (
              <div className="text-xs text-gray-500">–</div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            {awayTeamResolved?.flag_url && (
              <Image
                src={awayTeamResolved.flag_url}
                alt={awayTeamName}
                width={48}
                height={32}
                className="rounded mb-1 sm:w-12 sm:h-8"
              />
            )}
            <span className="text-xs sm:text-sm font-semibold text-center text-white truncate">
              {awayTeamName}
            </span>
          </div>
        </div>

        {/* Action Button */}
        {isEditable && onPrediction && !hasScore && (
          <div className="mt-3 space-y-1.5">
            <button
              onClick={handlePredict}
              disabled={locked || disabled}
              className="w-full py-2 sm:py-2.5 bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-[#00ffb2]/30 transition-all duration-300 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {locked ? "Encerrado" : disabled ? "Salvando..." : "Confirmar"}
            </button>
            {locked && (
              <p className="text-center text-xs text-rose-300">{lockMessage ?? "Palpites encerrados"}</p>
            )}
          </div>
        )}

        {hasScore && (
          <div className="text-xs text-center text-[#00ffb2]/70 py-2 font-semibold">
            ✓ Finalizado
          </div>
        )}
      </div>
    </div>
  );
}
