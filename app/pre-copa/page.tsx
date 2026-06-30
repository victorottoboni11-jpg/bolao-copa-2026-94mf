"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { getPreCopaPrediction } from "@/app/lib/preCopa";
import type { PreCopaPrediction } from "@/app/types";

export default function PreCopaPage() {
  const { user, loading } = useAuth();
  const [prediction, setPrediction] = useState<PreCopaPrediction | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const data = await getPreCopaPrediction(user.id);
        setPrediction(data);
      } catch (err) {
        console.error("Erro ao carregar pré-copa:", err);
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#04070f] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00ffb2]/30 border-t-[#00ffb2] rounded-full animate-spin" />
      </div>
    );
  }

  // Usar os nomes reais do banco (top_scorer, best_goalkeeper, best_young, predicted_total_goals)
  // com fallback para os nomes do frontend (top_scorer_player, etc)
  const allFields = prediction ? [
    { label: "Campeão", value: prediction.champion_team },
    { label: "Vice-Campeão", value: prediction.runner_up_team },
    { label: "Artilheiro", value: prediction.top_scorer_player ?? prediction.top_scorer },
    { label: "Gols do Artilheiro", value: prediction.top_scorer_goals ?? prediction.predicted_total_goals },
    { label: "Melhor Goleiro", value: prediction.best_goalkeeper_player ?? prediction.best_goalkeeper },
    { label: "Melhor Jogador", value: prediction.best_player },
    { label: "Revelação", value: prediction.tournament_revelation ?? prediction.best_young },
  ] : [];
  // Mostrar apenas campos com dados
  const fields = allFields.filter(f => f.value !== null && f.value !== undefined && f.value !== "");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,255,178,0.14),_transparent_28%),_linear-gradient(180deg,#04070f_0%,#070b16_100%)] px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Header */}
        <header className="rounded-2xl border border-[#00ffb2]/20 bg-gradient-to-br from-[#081116] to-[#070b16] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00ffb2]">Pré-Copa</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Seus Palpites</h1>
              <p className="mt-1 text-sm text-gray-400">Os palpites Pré-Copa foram encerrados.</p>
            </div>
            <Link href="/" className="px-4 py-2 bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] text-black font-semibold rounded-lg text-sm">
              Voltar
            </Link>
          </div>
        </header>

        {/* Banner encerrado */}
        <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="text-red-400 font-semibold">Pré-Copa Encerrada</p>
            <p className="text-red-300/70 text-sm">Não é mais possível alterar os palpites Pré-Copa.</p>
          </div>
        </div>

        {/* Palpites */}
        {loadingData ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-[#00ffb2]/30 border-t-[#00ffb2] rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-gray-400">Carregando palpites...</p>
          </div>
        ) : !prediction ? (
          <div className="rounded-xl border border-[#ffffff10] bg-[#081116] p-8 text-center">
            <p className="text-gray-400">Você não registrou palpites na Pré-Copa.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#00ffb2]/20 bg-[#050816] overflow-hidden">
            <div className="bg-gradient-to-r from-[#00ffb2]/10 to-[#00b2ff]/10 px-6 py-4 border-b border-[#00ffb2]/20">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#00ffb2]">Palpites Registrados</h2>
            </div>
            <div className="divide-y divide-[#ffffff08]">
              {fields.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-6 py-4">
                  <span className="text-sm text-gray-400">{label}</span>
                  <span className="text-sm font-semibold text-white text-right">
{String(value)}
                  </span>
                </div>
              ))}
            </div>
            {(prediction.pre_copa_points !== undefined && prediction.pre_copa_points !== null) && (
              <div className="border-t border-[#00ffb2]/20 px-6 py-4 flex items-center justify-between bg-[#00ffb2]/5">
                <span className="text-sm text-[#00ffb2] font-semibold uppercase tracking-wider">Pontuação Pré-Copa</span>
                <span className="text-xl font-bold text-[#00ffb2]">{prediction.pre_copa_points} pts</span>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
