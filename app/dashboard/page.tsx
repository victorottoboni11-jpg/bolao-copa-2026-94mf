"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { calculateExactScores, calculateCorrectResults, calculateMatchPoints } from "@/app/lib/scoring";
import { useAuth } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabase";

import type { Match, Prediction } from "@/app/types";

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
      // fallback to calculate points from match data
      const match = matches.find((m) => m.id === p.match_id);
      if (!match) return s;
      return s + calculateMatchPoints(p as any, match as any).points;
    }, 0);
  }, [predictions, matches]);

  if (loading || loadingData) {
    return (
      <main className="min-h-screen bg-[#020817] text-white flex items-center justify-center">
        <p className="text-xl">Carregando dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020817] text-white">

      <section className="max-w-7xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">

          <div>
            <h1 className="text-4xl font-black text-white">
              Dashboard
            </h1>

            <p className="text-gray-400 mt-2">
              Bem-vindo ao Bolão 2026
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="px-4 py-2 rounded-xl border border-[#00ffb244] bg-[#081120]">
              {user?.email}
            </div>

            <Link
              href="/"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00ffb2] to-[#24cfff] text-black font-bold"
            >
              Sair
            </Link>

          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">

          <Link
            href="/fase-de-grupos"
            className="rounded-2xl border border-[#00ffb233] bg-[#050816] p-6 hover:border-[#00ffb2]"
          >
            <h2 className="text-xl font-bold mb-2 text-[#00ffb2]">
              Fase de Grupos
            </h2>

            <p className="text-gray-400">
              Faça seus palpites da fase de grupos.
            </p>
          </Link>

          <Link
            href="/mata-mata"
            className="rounded-2xl border border-[#00ffb233] bg-[#050816] p-6 hover:border-[#00ffb2]"
          >
            <h2 className="text-xl font-bold mb-2 text-[#00ffb2]">
              Mata-Mata
            </h2>

            <p className="text-gray-400">
              Faça seus palpites eliminatórios.
            </p>
          </Link>

          <Link
            href="/pre-copa"
            className="rounded-2xl border border-[#00ffb233] bg-[#050816] p-6 hover:border-[#00ffb2]"
          >
            <h2 className="text-xl font-bold mb-2 text-[#00ffb2]">
              Pré-Copa
            </h2>

            <p className="text-gray-400">
              Palpites especiais do torneio.
            </p>
          </Link>

          <Link
            href="/ranking"
            className="rounded-2xl border border-[#00ffb233] bg-[#050816] p-6 hover:border-[#00ffb2]"
          >
            <h2 className="text-xl font-bold mb-2 text-[#00ffb2]">
              Ranking
            </h2>

            <p className="text-gray-400">
              Veja a classificação do bolão.
            </p>
          </Link>

        </div>

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

      </section>

    </main>
  );
}