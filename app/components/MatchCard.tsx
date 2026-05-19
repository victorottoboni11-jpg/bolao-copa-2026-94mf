"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ScoreInput } from "@/app/components/ScoreInput";
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

  useEffect(() => {
    setHome(() => predictedHome ?? 0);
    setAway(() => predictedAway ?? 0);
  }, [predictedHome, predictedAway]);

  const homeTeamResolved =
    homeTeam ?? (typeof match.home_team === "object" ? match.home_team : undefined);
  const awayTeamResolved =
    awayTeam ?? (typeof match.away_team === "object" ? match.away_team : undefined);

  const homeTeamName =
    homeTeamResolved?.name ||
    (typeof match.home_team === "string" ? match.home_team : "Mandante");
  const awayTeamName =
    awayTeamResolved?.name ||
    (typeof match.away_team === "string" ? match.away_team : "Visitante");

  const matchDate = new Date(match.match_date ?? match.match_datetime ?? "");
  const formattedDate = isNaN(matchDate.getTime())
    ? "Data indefinida"
    : matchDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });

  return (
    <div className="bg-gradient-to-br from-[#081116] to-[#070b16] border border-[#00ffb2]/20 rounded-xl overflow-hidden hover:border-[#00ffb2]/50 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(0,255,178,0.1)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00ffb2]/10 to-[#00b2ff]/10 px-4 py-2 border-b border-[#00ffb2]/10">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-[#00ffb2] uppercase tracking-widest">
            {match.group_name ? `Grupo ${match.group_name}` : match.phase}
          </span>
          <span className="text-xs text-[#00b2ff]/70">{formattedDate}</span>
        </div>
      </div>

      {/* Match Content */}
      <div className="p-4">
        {/* Estádio */}
        <div className="text-xs text-gray-400 mb-3 text-center">
          {match.stadium}
        </div>

        <div className="mb-4 flex flex-col items-center gap-2 text-center text-xs sm:flex-row sm:justify-between sm:text-left">
          <span className={`rounded-full px-3 py-1 font-semibold ${locked ? "bg-rose-500/10 text-rose-300" : "bg-emerald-500/10 text-emerald-300"}`}>
            {locked ? "Encerrado" : "Aberto"}
          </span>
          <span className="text-slate-400">Meu palpite: {hasPrediction ? `${predictedHome} - ${predictedAway}` : "Sem palpite"}</span>
          {formattedPredictionAt ? <span className="text-slate-500">Última atualização: {formattedPredictionAt}</span> : null}
        </div>

        {/* Times */}
        <div className="grid grid-cols-3 gap-2 items-center mb-4">
          {/* Home Team */}
          <div className="flex flex-col items-center">
            {homeTeamResolved?.flag_url && (
              <Image
                src={homeTeamResolved.flag_url}
                alt={homeTeamName}
                width={60}
                height={40}
                className="rounded mb-1"
              />
            )}
            <span className="text-xs font-semibold text-center text-white">
              {homeTeamName}
            </span>
          </div>

          {/* Score or Prediction */}
          <div className="flex flex-col items-center gap-1">
            {hasScore ? (
              <div className="text-lg font-bold text-[#00ffb2]">
                {match.home_score} - {match.away_score}
              </div>
            ) : isEditable ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <ScoreInput
                  value={home}
                  onChange={setHome}
                  disabled={locked || disabled}
                  label="placar do time da casa"
                />
                <span className="text-sm font-semibold text-[#00b2ff] sm:text-base">x</span>
                <ScoreInput
                  value={away}
                  onChange={setAway}
                  disabled={locked || disabled}
                  label="placar do time visitante"
                />
              </div>
            ) : predictedHome !== undefined && predictedAway !== undefined ? (
              <div className="text-sm font-semibold text-[#00b2ff]">
                {predictedHome} - {predictedAway}
              </div>
            ) : (
              <div className="text-xs text-gray-500">Sem palpite</div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center">
            {awayTeamResolved?.flag_url && (
              <Image
                src={awayTeamResolved.flag_url}
                alt={awayTeamName}
                width={60}
                height={40}
                className="rounded mb-1"
              />
            )}
            <span className="text-xs font-semibold text-center text-white">
              {awayTeamName}
            </span>
          </div>
        </div>

        {/* Action Button */}
        {isEditable && onPrediction && !hasScore && (
          <div className="space-y-2">
            <button
              onClick={handlePredict}
              disabled={locked || disabled}
              className="w-full py-2 bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-[#00ffb2]/30 transition-all duration-300 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {locked ? "Palpites encerrados" : disabled ? "Salvando..." : "Confirmar Palpite"}
            </button>
            {locked && (
              <p className="text-center text-xs text-rose-300">{lockMessage ?? "Palpites encerrados"}</p>
            )}
          </div>
        )}

        {hasScore && (
          <div className="text-xs text-center text-[#00ffb2]/70 py-2">
            ✓ Resultado Finalizado
          </div>
        )}
      </div>
    </div>
  );
}
