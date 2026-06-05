"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { calculateExactScores, calculateCorrectResults, calculateMatchPoints } from "@/app/lib/scoring";
import { useAuth } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabase";
import { formatBrazilTime } from "@/app/lib/dateUtils";

import type { Match, Prediction } from "@/app/types";

function getUpcomingMatches(matches: Match[]): Match[] {
  const nowUtc = Date.now();

  // Jogos futuros ordenados por kickoff
  const upcoming = matches
    .filter((m) => {
      const t = m.kickoff_at ? new Date(m.kickoff_at).getTime() : null;
      return t !== null && t > nowUtc;
    })
    .sort((a, b) => new Date(a.kickoff_at!).getTime() - new Date(b.kickoff_at!).getTime());

  if (upcoming.length === 0) return [];

  // Data do primeiro jogo futuro (em UTC, só a parte da data)
  const firstDate = new Date(upcoming[0].kickoff_at!);
  const firstDay = Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), firstDate.getUTCDate());

  // Próximo dia após o primeiro
  const nextDay = firstDay + 86400000;

  // Pega os 8 primeiros + todos do dia seguinte ao último dos 8
  const first8 = upcoming.slice(0, 8);

  if (upcoming.length <= 8) return first8;

  // Data do 8º jogo
  const eighth = new Date(first8[first8.length - 1].kickoff_at!);
  const eighthDay = Date.UTC(eighth.getUTCFullYear(), eighth.getUTCMonth(), eighth.getUTCDate());
  const dayAfterEighth = eighthDay + 86400000;

  // Todos os jogos do dia seguinte ao 8º
  const nextDayMatches = upcoming.slice(8).filter((m) => {
    const d = new Date(m.kickoff_at!);
    const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return day === dayAfterEighth;
  });

  return [...first8, ...nextDayMatches];
}

export default function DashboardPage() {
  const { user, loading } = useAuth();

  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setLoadingData(false);
        return;
      }

      setLoadingData(true);

      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select(`
          *,
          home_team_info:teams!matches_home_team_id_fkey(*),
          away_team_info:teams!matches_away_team_id_fkey(*)
        `)
        .order("kickoff_at", { ascending: true });

      if (matchesError) {
        console.error("SUPABASE ERROR:", matchesError);
        setLoadingData(false);
        return;
      }

      setMatches(matchesData || []);

      const { data: predictionsData, error: predictionsError } =
        await supabase
          .from("predictions")
          .select("*")
          .eq("user_id", user.id);

      if (predictionsError) {
        console.error("PREDICTIONS ERROR:", predictionsError);
      }

      setPredictions(predictionsData || []);
      setLoadingData(false);
    }

    loadData();
  }, [user]);

  const totalPredictions = predictions.length;
  const exactHits = useMemo(() => calculateExactScores(predictions, matches), [predictions, matches]);
  const correctResults = useMemo(() => calculateCorrectResults(predictions, matches), [predictions, matches]);
  const totalPoints = useMemo(() => {
    return predictions.reduce((s, p) => {
      if (typeof p.points === "number") return s + (p.points || 0);
      const match = matches.find((m) => m.id === p.match_id);
      if (!match) return s;
      return s + calculateMatchPoints(p as any, match as any).points;
    }, 0);
  }, [predictions, matches]);

  const upcomingMatches = useMemo(() => getUpcomingMatches(matches), [matches]);

  if (loading || loadingData) {
    return (
      <main className="min-h-screen bg-[#020817] text-white flex items-center justify-center">
        <p className="text-xl">Carregando dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <section className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white">Dashboard</h1>
            <p className="text-gray-400 mt-2">Bem-vindo ao Bolão 2026</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl border border-[#00ffb244] bg-[#081120]">
              {user?.email}
            </div>
            <Link href="/" className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00ffb2] to-[#24cfff] text-black font-bold">
              Sair
            </Link>
          </div>
        </div>

        {/* NAVEGAÇÃO */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Link href="/fase-de-grupos" className="rounded-2xl border border-[#00ffb233] bg-[#050816] p-6 hover:border-[#00ffb2]">
            <h2 className="text-xl font-bold mb-2 text-[#00ffb2]">Fase de Grupos</h2>
            <p className="text-gray-400">Faça seus palpites da fase de grupos.</p>
          </Link>
          <Link href="/mata-mata" className="rounded-2xl border border-[#00ffb233] bg-[#050816] p-6 hover:border-[#00ffb2]">
            <h2 className="text-xl font-bold mb-2 text-[#00ffb2]">Mata-Mata</h2>
            <p className="text-gray-400">Faça seus palpites eliminatórios.</p>
          </Link>
          <Link href="/pre-copa" className="rounded-2xl border border-[#00ffb233] bg-[#050816] p-6 hover:border-[#00ffb2]">
            <h2 className="text-xl font-bold mb-2 text-[#00ffb2]">Pré-Copa</h2>
            <p className="text-gray-400">Palpites especiais do torneio.</p>
          </Link>
          <Link href="/ranking" className="rounded-2xl border border-[#00ffb233] bg-[#050816] p-6 hover:border-[#00ffb2]">
            <h2 className="text-xl font-bold mb-2 text-[#00ffb2]">Ranking</h2>
            <p className="text-gray-400">Veja a classificação do bolão.</p>
          </Link>
        </div>

        {/* RESUMO DO USUÁRIO */}
        <div className="rounded-3xl border border-[#00ffb233] bg-[#050816] p-6">
          <h2 className="text-2xl font-bold text-[#00ffb2] mb-4">Resumo do usuário</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-[#081116] text-center">
              <p className="text-sm text-gray-400">Total de palpites</p>
              <p className="mt-2 text-2xl font-semibold">{totalPredictions}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#081116] text-center">
              <p className="text-sm text-gray-400">Acertos exatos</p>
              <p className="mt-2 text-2xl font-semibold">{exactHits}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#081116] text-center">
              <p className="text-sm text-gray-400">Resultados corretos</p>
              <p className="mt-2 text-2xl font-semibold">{correctResults}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#081116] text-center">
              <p className="text-sm text-gray-400">Pontuação</p>
              <p className="mt-2 text-2xl font-semibold">{totalPoints}</p>
            </div>
          </div>
        </div>

        {/* PRÓXIMOS JOGOS */}
        {upcomingMatches.length > 0 && (
          <div className="rounded-3xl border border-[#00ffb233] bg-[#050816] p-6">
            <h2 className="text-2xl font-bold text-[#00ffb2] mb-6">Próximos jogos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingMatches.map((match) => {
                const home = match.home_team_info as any;
                const away = match.away_team_info as any;
                const prediction = predictions.find((p) => p.match_id === match.id);
                const hasPrediction = !!prediction;

                return (
                  <div key={match.id} className="rounded-2xl border border-[#00ffb222] bg-[#081116] p-4 flex flex-col gap-3">

                    {/* Fase + horário */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="uppercase tracking-wider text-[#00ffb2] font-semibold">
                        {match.phase === "friendly" ? "Amistoso" : match.group_name ? `Grupo ${match.group_name}` : match.phase}
                      </span>
                      <span>{formatBrazilTime(match.kickoff_at, "full")}</span>
                    </div>

                    {/* Times */}
                    <div className="flex items-center justify-between gap-2">

                      {/* Mandante */}
                      <div className="flex flex-col items-center gap-1 flex-1 text-center">
                        {home?.flag_url ? (
                          <Image src={home.flag_url} alt={home.name} width={40} height={28}
                            className="rounded object-cover border border-[#00ffb222]" />
                        ) : (
                          <div className="w-10 h-7 rounded bg-[#111827]" />
                        )}
                        <p className="text-xs font-semibold text-white truncate max-w-[80px]">
                          {home?.name || "Mandante"}
                        </p>
                      </div>

                      {/* Placar / VS */}
                      <div className="flex flex-col items-center gap-1">
                        {hasPrediction ? (
                          <div className="flex items-center gap-1">
                            <span className="w-8 h-8 rounded bg-[#00ffb215] border border-[#00ffb244] flex items-center justify-center text-white font-bold text-sm">
                              {prediction.predicted_home}
                            </span>
                            <span className="text-gray-400 text-xs">x</span>
                            <span className="w-8 h-8 rounded bg-[#00ffb215] border border-[#00ffb244] flex items-center justify-center text-white font-bold text-sm">
                              {prediction.predicted_away}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm font-bold">VS</span>
                        )}
                        {hasPrediction ? (
                          <span className="text-[10px] text-[#00ffb2]">seu palpite</span>
                        ) : (
                          <span className="text-[10px] text-orange-400">sem palpite</span>
                        )}
                      </div>

                      {/* Visitante */}
                      <div className="flex flex-col items-center gap-1 flex-1 text-center">
                        {away?.flag_url ? (
                          <Image src={away.flag_url} alt={away.name} width={40} height={28}
                            className="rounded object-cover border border-[#00ffb222]" />
                        ) : (
                          <div className="w-10 h-7 rounded bg-[#111827]" />
                        )}
                        <p className="text-xs font-semibold text-white truncate max-w-[80px]">
                          {away?.name || "Visitante"}
                        </p>
                      </div>

                    </div>

                    {/* Estádio */}
                    {match.stadium && (
                      <p className="text-[10px] text-gray-500 text-center">{match.stadium}</p>
                    )}

                  </div>
                );
              })}
            </div>
          </div>
        )}

      </section>
    </main>
  );
}
