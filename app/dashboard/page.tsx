"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/lib/auth";
import { getAllMatches } from "@/app/lib/importCopa2026";
import { fetchRanking } from "@/app/lib/rankings";
import { getPredictionsForMatches, savePrediction, isPredictionLocked } from "@/app/lib/predictions";
import { getPredictionsOpenSetting } from "@/app/lib/matches";
import { MatchCard } from "@/app/components/MatchCard";
import { Toast } from "@/app/components/Toast";
import { calculateMatchPoints } from "@/app/lib/scoring";
import type { Match, Prediction, RankingEntry } from "@/app/types";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [predictionsOpen, setPredictionsOpen] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoadingData(true);
      try {
        const [matchList, rankingList, open] = await Promise.all([
          getAllMatches(),
          fetchRanking(),
          getPredictionsOpenSetting(),
        ]);

        setMatches(matchList);
        setRanking(rankingList.slice(0, 10));
        setPredictionsOpen(open);

        const predictionMap = await getPredictionsForMatches(user.id, matchList.map((match) => match.id));
        setPredictions(predictionMap);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  const handleSavePrediction = async (matchId: string, homeScore: number, awayScore: number) => {
    if (!user) return;
    setSavingMatchId(matchId);

    const saved = await savePrediction(user.id, matchId, homeScore, awayScore);
    if (!saved) {
      setToast({ type: "error", message: "Falha ao salvar palpite." });
      setSavingMatchId(null);
      return;
    }

    setPredictions((current) => ({ ...current, [matchId]: saved }));
    setToast({ type: "success", message: "Palpite salvo com sucesso." });
    setSavingMatchId(null);
    window.setTimeout(() => setToast(null), 3500);
  };

  const myPredictionEntries = useMemo(() => Object.values(predictions), [predictions]);

  const myTotalPoints = useMemo(() => {
    return myPredictionEntries.reduce((sum, prediction) => {
      const match = matches.find((item) => item.id === prediction.match_id);
      return match ? sum + calculateMatchPoints(prediction, match) : sum;
    }, 0);
  }, [matches, myPredictionEntries]);

  const myExactCount = useMemo(() => {
    return myPredictionEntries.filter((prediction) => {
      const match = matches.find((item) => item.id === prediction.match_id);
      return (
        match &&
        match.home_score !== null &&
        match.away_score !== null &&
        prediction.predicted_home === match.home_score &&
        prediction.predicted_away === match.away_score
      );
    }).length;
  }, [matches, myPredictionEntries]);

  const nextMatches = useMemo(() => {
    const now = Date.now();
    return matches
      .filter((match) => new Date(match.match_date ?? match.match_datetime ?? "").getTime() > now)
      .slice(0, 4);
  }, [matches]);

  const closedMatches = useMemo(() => {
    const now = Date.now();
    return matches
      .filter((match) => new Date(match.match_date ?? match.match_datetime ?? "").getTime() <= now)
      .slice(-4)
      .reverse();
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

  return (
    <main className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(0,255,178,0.14),_transparent_28%),_linear-gradient(180deg,#04070f_0%,#070b16_100%)] px-4 py-8 text-white">
      {toast ? <Toast type={toast.type} message={toast.message} /> : null}
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-2xl border border-[#00ffb2]/20 bg-gradient-to-br from-[#081116] to-[#070b16] p-6 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#00ffb2]">Dashboard</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Seu Bolão</h1>
              <p className="mt-1 text-sm text-gray-400">Acompanhe palpites, próximos jogos e sua posição no ranking.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/" className="rounded-2xl border border-[#00ffb2]/20 bg-[#0b1320] px-4 py-3 text-sm text-[#00ffb2] hover:bg-[#081116]">
                Voltar ao menu
              </Link>
              <Link href="/pre-copa" className="rounded-2xl bg-[#00ffb2] px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-[#8bfcc7]">
                Pré-Copa
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-[#00ffb2]/20 bg-slate-950/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
              <h2 className="text-lg font-semibold text-[#00ffb2]">Resumo pessoal</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-[#00ffb2]/20 bg-[#081116] p-4 text-center">
                  <p className="text-xs uppercase tracking-widest text-[#00ffb2]">Palpites</p>
                  <p className="mt-3 text-3xl font-bold text-white">{myPredictionEntries.length}</p>
                </div>
                <div className="rounded-3xl border border-[#00b2ff]/20 bg-[#081116] p-4 text-center">
                  <p className="text-xs uppercase tracking-widest text-[#00b2ff]">Pontos</p>
                  <p className="mt-3 text-3xl font-bold text-white">{myTotalPoints}</p>
                </div>
                <div className="rounded-3xl border border-[#00ffb2]/20 bg-[#081116] p-4 text-center">
                  <p className="text-xs uppercase tracking-widest text-[#00ffb2]">Cravadas</p>
                  <p className="mt-3 text-3xl font-bold text-white">{myExactCount}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#00ffb2]/20 bg-slate-950/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#00b2ff]">Próximos jogos</h2>
                <span className="rounded-full bg-[#00ffb2]/10 px-3 py-1 text-xs text-[#00ffb2]">{predictionsOpen ? "Palpites abertos" : "Palpites fechados"}</span>
              </div>
              <div className="mt-4 space-y-4">
                {loadingData ? (
                  <p className="text-sm text-slate-400">Carregando jogos...</p>
                ) : nextMatches.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhum jogo futuro disponível.</p>
                ) : (
                  nextMatches.map((match) => {
                    const prediction = predictions[match.id];
                    const locked = isPredictionLocked(match.match_date, predictionsOpen);
                    return (
                      <MatchCard
                        key={match.id}
                        match={match}
                        homeTeam={typeof match.home_team === "object" && match.home_team ? match.home_team : undefined}
                        awayTeam={typeof match.away_team === "object" && match.away_team ? match.away_team : undefined}
                        isEditable={!locked}
                        locked={locked}
                        lockMessage={locked ? "Palpite encerrado para este confronto." : undefined}
                        predictedHome={prediction?.predicted_home}
                        predictedAway={prediction?.predicted_away}
                        onPrediction={(homeScore, awayScore) => void handleSavePrediction(match.id, homeScore, awayScore)}
                      />
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-[#00ffb2]/20 bg-slate-950/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
              <h2 className="text-lg font-semibold text-white">Últimos jogos</h2>
              <div className="mt-4 space-y-4">
                {loadingData ? (
                  <p className="text-sm text-slate-400">Carregando...</p>
                ) : closedMatches.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhum jogo finalizado ainda.</p>
                ) : (
                  closedMatches.map((match) => {
                    const prediction = predictions[match.id];
                    return (
                      <MatchCard
                        key={match.id}
                        match={match}
                        homeTeam={typeof match.home_team === "object" && match.home_team ? match.home_team : undefined}
                        awayTeam={typeof match.away_team === "object" && match.away_team ? match.away_team : undefined}
                        isEditable={false}
                        predictedHome={prediction?.predicted_home}
                        predictedAway={prediction?.predicted_away}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-[#00ffb2]/20 bg-slate-950/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
              <h2 className="text-lg font-semibold text-[#00ffb2]">Ranking Top 10</h2>
              <div className="mt-4 space-y-3">
                {loadingData ? (
                  <p className="text-sm text-slate-400">Carregando ranking...</p>
                ) : ranking.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhum ranking ainda.</p>
                ) : (
                  ranking.map((entry, index) => (
                    <div
                      key={entry.user_id}
                      className={`rounded-3xl border px-4 py-3 transition ${
                        entry.user_id === user.id
                          ? "border-[#00ffb2] bg-[#0f172a] shadow-[0_0_0_3px_rgba(0,255,178,0.12)]"
                          : "border-white/10 bg-[#081116]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">{index + 1}. {entry.user_name}</p>
                          <p className="text-xs text-slate-400">{entry.user_email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#00ffb2]">{entry.total_points} pts</p>
                          <p className="text-xs text-slate-400">{entry.exact_scores} exatas</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-[#00ffb2]/20 bg-[#081116] p-6 text-sm text-slate-300">
              <p className="font-semibold text-white">Aproveitamento</p>
              <p className="mt-3">Total de palpites enviados, acertos exatos e resultados corretos são atualizados automaticamente.</p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
