"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface Team {
  id: string;
  name: string;
  fifa_code: string;
  flag_url: string;
}

interface Match {
  id: string;
  phase: string;
  venue?: string | null;
  kickoff_at?: string;
}

interface MatchCardProps {
  match: Match;

  homeTeam?: Team | null;
  awayTeam?: Team | null;

  isEditable?: boolean;

  locked?: boolean;

  disabled?: boolean;

  lockMessage?: string;

  predictedHome?: number;

  predictedAway?: number;

  predictionUpdatedAt?: string;

  onPrediction?: (homeScore: number, awayScore: number) => void;
}

export function MatchCard({
  match,
  homeTeam,
  awayTeam,
  isEditable = true,
  locked = false,
  disabled = false,
  lockMessage,
  predictedHome,
  predictedAway,
  onPrediction,
}: MatchCardProps) {
  const [homeScore, setHomeScore] = useState<number>(
    predictedHome ?? 0
  );

  const [awayScore, setAwayScore] = useState<number>(
    predictedAway ?? 0
  );

  useEffect(() => {
    setHomeScore(predictedHome ?? 0);
  }, [predictedHome]);

  useEffect(() => {
    setAwayScore(predictedAway ?? 0);
  }, [predictedAway]);

  const formattedDate = match.kickoff_at
    ? new Date(match.kickoff_at).toLocaleString("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Data indefinida";

  const handlePrediction = (
    newHome: number,
    newAway: number
  ) => {
    setHomeScore(newHome);
    setAwayScore(newAway);

    if (onPrediction) {
      onPrediction(newHome, newAway);
    }
  };

  return (
    <div className="rounded-2xl border border-[#00ffb233] overflow-hidden bg-[#050816]">

      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-4 bg-[#0b2a2f]">

        <span className="text-[#00ffb2] font-bold uppercase tracking-wider text-sm">
          {match.phase}
        </span>

        <span className="text-[#35cfff] text-sm">
          {formattedDate}
        </span>

      </div>

      {/* BODY */}
      <div className="p-6 space-y-6">

        {/* VENUE */}
        <div className="text-center text-sm text-gray-400">
          {match.venue || "Estádio não definido"}
        </div>

        {/* TEAMS */}
        <div className="grid grid-cols-3 items-center gap-4">

          {/* HOME */}
          <div className="flex flex-col items-center text-center gap-2">

            {homeTeam?.flag_url ? (
              <Image
                src={homeTeam.flag_url}
                alt={homeTeam.name}
                width={72}
                height={48}
                className="rounded-md object-cover border border-[#00ffb244]"
              />
            ) : (
              <div className="w-[72px] h-[48px] rounded-md bg-[#111827]" />
            )}

            <div>
              <p className="font-bold text-white">
                {homeTeam?.name || "Mandante"}
              </p>

              <p className="text-xs text-[#00ffb2]">
                {homeTeam?.fifa_code || "---"}
              </p>
            </div>

          </div>

          {/* SCORE */}
          <div className="flex items-center justify-center gap-2">

            <input
              type="number"
              min={0}
              value={homeScore}
              disabled={!isEditable || locked || disabled}
              onChange={(e) =>
                handlePrediction(
                  Number(e.target.value),
                  awayScore
                )
              }
              className="w-12 h-12 bg-[#081120] border border-[#00ffb244] rounded-lg text-center text-white text-xl font-bold disabled:opacity-50"
            />

            <span className="text-white text-xl font-bold">
              x
            </span>

            <input
              type="number"
              min={0}
              value={awayScore}
              disabled={!isEditable || locked || disabled}
              onChange={(e) =>
                handlePrediction(
                  homeScore,
                  Number(e.target.value)
                )
              }
              className="w-12 h-12 bg-[#081120] border border-[#00ffb244] rounded-lg text-center text-white text-xl font-bold disabled:opacity-50"
            />

          </div>

          {/* AWAY */}
          <div className="flex flex-col items-center text-center gap-2">

            {awayTeam?.flag_url ? (
              <Image
                src={awayTeam.flag_url}
                alt={awayTeam.name}
                width={72}
                height={48}
                className="rounded-md object-cover border border-[#00ffb244]"
              />
            ) : (
              <div className="w-[72px] h-[48px] rounded-md bg-[#111827]" />
            )}

            <div>
              <p className="font-bold text-white">
                {awayTeam?.name || "Visitante"}
              </p>

              <p className="text-xs text-[#00ffb2]">
                {awayTeam?.fifa_code || "---"}
              </p>
            </div>

          </div>

        </div>

        {/* LOCK MESSAGE */}
        {locked && lockMessage && (
          <div className="text-center text-sm text-red-400 font-semibold">
            {lockMessage}
          </div>
        )}

        {/* BUTTON */}
        {isEditable && !locked && (
          <button
            disabled={disabled}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00ffb2] to-[#24cfff] text-black font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
          >
            Confirmar Palpite
          </button>
        )}

      </div>
    </div>
  );
}