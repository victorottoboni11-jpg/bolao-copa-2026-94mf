"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabase";
import { getPredictionsForMatches, savePrediction, isPredictionLocked } from "@/app/lib/predictions";
import { getPredictionsOpenSetting } from "@/app/lib/matches";
import { getMatchKickoffAt, compareKickoffTimes } from "@/app/lib/matchDate";
import { KNOCKOUT_PHASE_ORDER, formatPhaseLabel } from "@/app/lib/phases";
import { MatchCard } from "@/app/components/MatchCard";
import { Toast } from "@/app/components/Toast";
import type { Match, Prediction } from "@/app/types";

export default function MataMataPage() {
  const { user, loading } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [predictionsOpen, setPredictionsOpen] = useState(true);
  const [groupStageFinished, setGroupStageFinished] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [pendingScores, setPendingScores] = useState<Record<string, { home: number; away: number; winner?: string; penalties?: boolean; method?: string }>>({});
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoadingData(true);
      try {
        const [supabaseMatches, predictionsOpen] = await Promise.all([
          supabase
            .from("matches")
            .select(`
              *,
              home_team_info:home_team_id (id, name, fifa_code, flag_url),
              away_team_info:away_team_id (id, name, fifa_code, flag_url)
            `)
            .order("kickoff_at", { ascending: true }),
          getPredictionsOpenSetting(),
        ]);

        const { data, error } = supabaseMatches;
        if (error) throw error;

        console.log("MATA-MATA MATCHES TEAM INFO:", (data || []).map((match) => ({
          id: match.id,
          home_team_info: match.home_team_info,
          away_team_info: match.away_team_info,
        })));

        const knockoutMatches = (data || []).filter((match) =>
          ["round_of_32", "round_of_16", "quarterfinal", "semifinal", "third_place", "final"].includes(match.phase)
        );
        console.log("MATCHES FROM SUPABASE:", data);
        console.log("MATCH COUNTS", {
          total: data?.length ?? 0,
          group: (data || []).filter((match) => match.phase === "group_stage").length,
          knockout: knockoutMatches.length,
          friendlies: (data || []).filter((match) => match.phase === "friendly").length,
        });

        setMatches(knockoutMatches);
        setPredictionsOpen(predictionsOpen);
        setGroupStageFinished(
          (data || [])
            .filter((match) => match.phase === "group_stage")
            .every((match) => match.is_finished === true)
        );

        const predictionMap = await getPredictionsForMatches(user.id, knockoutMatches.map((match) => match.id));
        setPredictions(predictionMap);
      } catch (error) {
        console.error("Erro ao carregar jogos do mata-mata:", error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  const handleSavePrediction = async (matchId: string, homeScore: number, awayScore: number, winner?: string, penalties?: boolean, method?: string) => {
    if (!user) return;
    setSavingMatchId(matchId);

    try {
      const saved = await savePrediction(user.id, matchId, homeScore, awayScore, winner ?? null, penalties ?? false);
      if (!saved) {
        setToast({ type: "error", message: "Erro ao salvar palpite" });
        return;
      }

      setPredictions((current) => ({ ...current, [matchId]: saved }));
      setToast({ type: "success", message: "Palpite salvo com sucesso" });
    } catch (error) {
      console.error("Erro ao salvar palpite no mata-mata:", error);
      setToast({ type: "error", message: "Erro ao salvar palpite" });
    } finally {
      setSavingMatchId(null);
      window.setTimeout(() => setToast(null), 3500);
    }
  };

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) =>
      compareKickoffTimes(getMatchKickoffAt(a), getMatchKickoffAt(b))
    );
  }, [matches]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,255,178,0.14),_transparent_28%),_linear-gradient(180deg,#04070f_0%,#070b16_100%)] flex items-center justify-center px-4 py-8">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#00ffb2]/30 border-t-[#00ffb2] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#00b2ff] font-semibold">Carregando...</p>
        </div>
      </div>
    );
  }

  const groupedByPhase = KNOCKOUT_PHASE_ORDER.map((phase) => ({
    phase,
    title: formatPhaseLabel(phase),
    matches: sortedMatches.filter((match) => match.phase === phase),
  })).filter((group) => group.matches.length > 0);

  return (
    <main className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(0,255,178,0.14),_transparent_28%),_linear-gradient(180deg,#04070f_0%,#070b16_100%)] px-4 py-8 text-white">
      {toast ? <Toast type={toast.type} message={toast.message} /> : null}
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-2xl border border-[#00ffb2]/20 bg-gradient-to-br from-[#081116] to-[#070b16] p-6 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#00ffb2]">Mata-Mata</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Jogos do mata-mata</h1>
              <p className="mt-1 text-sm text-gray-400">Configure seus palpites para as fases eliminatórias.</p>
            </div>
            <Link href="/dashboard" className="rounded-2xl bg-[#00ffb2] px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-[#8bfcc7]">
              Voltar ao Dashboard
            </Link>
          </div>
          <div className="mt-4 text-sm text-slate-400">
            <span className="mr-2">Home</span>/ <span className="text-[#00ffb2]">Mata-Mata</span>
          </div>
        </header>

        <div className="rounded-3xl border border-[#00ffb2]/20 bg-slate-950/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#00ffb2]">Resumo</p>
              <p className="mt-2 text-lg font-semibold text-white">{sortedMatches.length} partidas do mata-mata</p>
            </div>
            <span className="rounded-full bg-[#00ffb2]/10 px-3 py-1 text-xs text-[#00ffb2]">{predictionsOpen ? "Palpites abertos" : "Palpites fechados"}</span>
          </div>
        </div>

        <div className="space-y-8">
          {loadingData ? (
            <div className="rounded-3xl border border-[#00ffb2]/20 bg-slate-950/90 p-10 text-center text-[#00b2ff]">
              <p>Carregando partidas do mata-mata...</p>
            </div>
          ) : !groupStageFinished ? (
            <div className="rounded-3xl border border-[#00ffb2]/20 bg-slate-950/90 p-10 text-center text-white">
              <h2 className="text-2xl font-semibold text-white">🔒 Mata-mata bloqueado</h2>
              <p className="mt-4 text-slate-300">
                Os palpites do mata-mata serão liberados após o admin finalizar todos os jogos da fase de grupos.
              </p>
            </div>
          ) : groupedByPhase.length === 0 ? (
            <div className="rounded-3xl border border-[#00ffb2]/20 bg-slate-950/90 p-8 text-center text-slate-400">
              Nenhuma partida do mata-mata disponível.
            </div>
          ) : (
            groupedByPhase.map((group) => (
              <section key={group.phase} className="rounded-3xl border border-[#00ffb2]/20 bg-[#081116]/90 p-6">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-[#00ffb2]">{group.title}</p>
                    <p className="text-lg font-semibold text-white">{group.matches.length} partidas</p>
                  </div>
                  <span className="rounded-full bg-[#00ffb2]/10 px-3 py-1 text-xs text-[#00ffb2]">{group.title}</span>
                </div>
                <div className="space-y-4">
                  {group.matches.map((match) => {
                    const prediction = predictions[match.id];
                    const locked = isPredictionLocked(getMatchKickoffAt(match), predictionsOpen);
                    return (
                      <MatchCard
                        key={`${match.id}-${prediction?.predicted_home ?? ""}-${prediction?.predicted_away ?? ""}`}
                        match={match}
                        homeTeam={match.home_team_info ?? undefined}
                        awayTeam={match.away_team_info ?? undefined}
                        isEditable={!locked}
                        locked={locked}
                        disabled={savingMatchId === match.id}
                        lockMessage={locked ? "Palpites encerrados" : undefined}
                        predictedHome={prediction?.predicted_home}
                        predictedAway={prediction?.predicted_away}
                        predictedWinner={(prediction as any)?.predicted_winner}
                        predictedPenalties={(prediction as any)?.predicted_penalties}
                        predictedMethod={(prediction as any)?.predicted_method}
                        predictionUpdatedAt={prediction?.updated_at}
                        onPrediction={(homeScore, awayScore, winner, penalties, method) => {
                          setPendingScores((prev) => ({ ...prev, [match.id]: { home: homeScore, away: awayScore, winner, penalties, method } }));
                        }}
                        onConfirm={() => {
                          const p = pendingScores[match.id];
                          if (p) {
                            void handleSavePrediction(match.id, p.home, p.away, p.winner, p.penalties, p.method);
                          } else if (prediction) {
                            void handleSavePrediction(match.id, prediction.predicted_home, prediction.predicted_away);
                          }
                        }}
                      />
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
