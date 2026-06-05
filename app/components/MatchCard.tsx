"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { formatBrazilTime } from "@/app/lib/dateUtils";
import { formatPhaseLabel } from "@/app/lib/phases";

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
  predictedWinner?: string | null;
  predictedPenalties?: boolean | null;
  predictedMethod?: "normal" | "extra_time" | "penalties" | null;
  predictionUpdatedAt?: string;
  onPrediction?: (homeScore: number, awayScore: number, winner?: string, penalties?: boolean, method?: "normal" | "extra_time" | "penalties") => void;
}

const KNOCKOUT_PHASES = ["round_of_32", "round_of_16", "quarterfinal", "semifinal", "third_place", "final"];

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
  predictedWinner,
  predictedPenalties,
  predictedMethod,
  onPrediction,
}: MatchCardProps) {
  const [homeScore, setHomeScore] = useState<number>(predictedHome ?? 0);
  const [awayScore, setAwayScore] = useState<number>(predictedAway ?? 0);
  const [winner, setWinner] = useState<string | null>(predictedWinner ?? null);
  const [penalties, setPenalties] = useState<boolean>(predictedPenalties ?? false);
  const [method, setMethod] = useState<"normal" | "extra_time" | "penalties">(
    predictedMethod === "extra_time" ? "extra_time" :
    predictedMethod === "penalties" ? "penalties" : "normal"
  );

  const isKnockout = KNOCKOUT_PHASES.includes(match.phase);

  useEffect(() => { setHomeScore(predictedHome ?? 0); }, [predictedHome]);
  useEffect(() => { setAwayScore(predictedAway ?? 0); }, [predictedAway]);
  useEffect(() => { setWinner(predictedWinner ?? null); }, [predictedWinner]);
  useEffect(() => { setPenalties(predictedPenalties ?? false); }, [predictedPenalties]);
  useEffect(() => {
    setMethod(
      predictedMethod === "extra_time" ? "extra_time" :
      predictedMethod === "penalties" ? "penalties" : "normal"
    );
  }, [predictedMethod]);

  const formattedDate = formatBrazilTime(match.kickoff_at, "full");

  const handlePrediction = (newHome: number, newAway: number, newWinner?: string, newPenalties?: boolean, newMethod?: "normal" | "extra_time" | "penalties") => {
    setHomeScore(newHome);
    setAwayScore(newAway);
    if (onPrediction) {
      onPrediction(newHome, newAway, newWinner ?? winner ?? undefined, newPenalties ?? penalties, newMethod ?? method);
    }
  };

  const handleWinner = (side: string) => {
    const newWinner = winner === side ? null : side;
    setWinner(newWinner);
    if (onPrediction) {
      onPrediction(homeScore, awayScore, newWinner ?? undefined, method === "penalties", method);
    }
  };

  const handleMethod = (val: "normal" | "extra_time" | "penalties") => {
    setMethod(val);
    setPenalties(val === "penalties");
    if (onPrediction) {
      onPrediction(homeScore, awayScore, winner ?? undefined, val === "penalties", val);
    }
  };

  const isDisabled = !isEditable || locked || disabled;

  return (
    <div className="rounded-2xl border border-[#00ffb233] overflow-hidden bg-[#050816]">

      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-4 bg-[#0b2a2f]">
        <span className="text-[#00ffb2] font-bold uppercase tracking-wider text-sm">
          {formatPhaseLabel(match.phase)}
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

        {/* TEAMS + SCORE */}
        <div className="grid grid-cols-3 items-center gap-4">

          {/* HOME */}
          <div className="flex flex-col items-center text-center gap-2">
            {homeTeam?.flag_url ? (
              <Image src={homeTeam.flag_url} alt={homeTeam.name} width={72} height={48}
                className="rounded-md object-cover border border-[#00ffb244]" />
            ) : (
              <div className="w-[72px] h-[48px] rounded-md bg-[#111827]" />
            )}
            <div>
              <p className="font-bold text-white">{homeTeam?.name || "Mandante"}</p>
              <p className="text-xs text-[#00ffb2]">{homeTeam?.fifa_code || "---"}</p>
            </div>
          </div>

          {/* SCORE */}
          <div className="flex items-center justify-center gap-2">
            <input type="number" min={0} value={homeScore} disabled={isDisabled}
              onChange={(e) => handlePrediction(Number(e.target.value), awayScore)}
              className="w-12 h-12 bg-[#081120] border border-[#00ffb244] rounded-lg text-center text-white text-xl font-bold disabled:opacity-50"
            />
            <span className="text-white text-xl font-bold">x</span>
            <input type="number" min={0} value={awayScore} disabled={isDisabled}
              onChange={(e) => handlePrediction(homeScore, Number(e.target.value))}
              className="w-12 h-12 bg-[#081120] border border-[#00ffb244] rounded-lg text-center text-white text-xl font-bold disabled:opacity-50"
            />
          </div>

          {/* AWAY */}
          <div className="flex flex-col items-center text-center gap-2">
            {awayTeam?.flag_url ? (
              <Image src={awayTeam.flag_url} alt={awayTeam.name} width={72} height={48}
                className="rounded-md object-cover border border-[#00ffb244]" />
            ) : (
              <div className="w-[72px] h-[48px] rounded-md bg-[#111827]" />
            )}
            <div>
              <p className="font-bold text-white">{awayTeam?.name || "Visitante"}</p>
              <p className="text-xs text-[#00ffb2]">{awayTeam?.fifa_code || "---"}</p>
            </div>
          </div>

        </div>

        {/* MATA-MATA: CLASSIFICADO + PÊNALTIS */}
        {isKnockout && (
          <div className="space-y-3 border border-[#00ffb222] rounded-xl p-4 bg-[#081120]">

            <p className="text-xs text-[#00ffb2] font-semibold uppercase tracking-wider text-center">
              Quem se classifica?
            </p>

            <div className="flex gap-3 justify-center">
              <button
                disabled={isDisabled}
                onClick={() => handleWinner("home")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition border ${
                  winner === "home"
                    ? "bg-[#00ffb2] text-black border-[#00ffb2]"
                    : "bg-transparent text-white border-[#00ffb244] hover:border-[#00ffb2]"
                } disabled:opacity-50`}
              >
                {homeTeam?.fifa_code || "Casa"}
              </button>

              <button
                disabled={isDisabled}
                onClick={() => handleWinner("away")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition border ${
                  winner === "away"
                    ? "bg-[#00ffb2] text-black border-[#00ffb2]"
                    : "bg-transparent text-white border-[#00ffb244] hover:border-[#00ffb2]"
                } disabled:opacity-50`}
              >
                {awayTeam?.fifa_code || "Fora"}
              </button>
            </div>

            {/* Pênaltis — só aparece se o placar for empate */}
            {homeScore === awayScore && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 text-center">Como se classificou?</p>
                <div className="flex gap-3 justify-center">
                  <button
                    disabled={isDisabled}
                    onClick={() => handlePenalties(false)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition border ${
                      !penalties
                        ? "bg-[#24cfff] text-black border-[#24cfff]"
                        : "bg-transparent text-white border-[#00ffb244] hover:border-[#24cfff]"
                    } disabled:opacity-50`}
                  >
                    Tempo Normal
                  </button>
                  <button
                    disabled={isDisabled}
                    onClick={() => handlePenalties(true)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition border ${
                      penalties
                        ? "bg-[#24cfff] text-black border-[#24cfff]"
                        : "bg-transparent text-white border-[#00ffb244] hover:border-[#24cfff]"
                    } disabled:opacity-50`}
                  >
                    Pênaltis
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

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
