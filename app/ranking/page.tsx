"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/lib/auth";
import type { RankingEntry } from "@/app/types";

export default function RankingPage() {
  const { user, loading } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadRanking = async () => {
      // TODO: Fetch ranking from Supabase
      setRanking([]);
      setLoadingData(false);
    };

    loadRanking();
  }, [user]);

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
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <header className="rounded-2xl border border-[#00ffb2]/20 bg-gradient-to-br from-[#081116] to-[#070b16] p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00ffb2]">
                Ranking Geral
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white">Palpitômetro</h1>
              <p className="mt-1 text-sm text-gray-400">
                Veja a posição de todos os palpiteiros
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-[#00ffb2]/30 transition-all duration-300"
            >
              Voltar
            </Link>
          </div>
        </header>

        {/* Ranking Table */}
        {loadingData ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#00ffb2]/30 border-t-[#00ffb2] rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-[#00b2ff] font-semibold">Carregando ranking...</p>
          </div>
        ) : ranking.length === 0 ? (
          <div className="rounded-xl border border-[#00ffb2]/20 bg-gradient-to-br from-[#081116] to-[#070b16] p-12 text-center">
            <p className="text-gray-400">
              Nenhum ranking disponível ainda. Começe a fazer palpites!
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#00ffb2]/20 bg-gradient-to-br from-[#081116] to-[#070b16] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#00ffb2]/10 to-[#00b2ff]/10 p-4 border-b border-[#00ffb2]/20">
              <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-[#00ffb2]">
                <div>Rank</div>
                <div>Usuário</div>
                <div className="text-right">Pontos</div>
                <div className="text-right">Grupos</div>
                <div className="text-right">Exatas</div>
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[#00ffb2]/10">
              {ranking.map((entry, idx) => (
                <div
                  key={entry.user_id}
                  className={`p-4 hover:bg-[#00ffb2]/5 transition-colors ${
                    entry.user_id === user?.id
                      ? "bg-[#00b2ff]/10 border-l-4 border-[#00b2ff]"
                      : ""
                  }`}
                >
                  <div className="grid grid-cols-5 gap-4 items-center text-sm">
                    <div className="flex items-center gap-3">
                      {idx < 3 ? (
                        <span className="text-lg">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                        </span>
                      ) : (
                        <span className="font-bold text-[#00b2ff]">#{idx + 1}</span>
                      )}
                    </div>

                    <div>
                      <p className="font-semibold">{entry.user_name}</p>
                      <p className="text-xs text-gray-500">{entry.user_email}</p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-[#00ffb2] text-lg">
                        {entry.total_points}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[#00b2ff]">{entry.group_stage_points}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[#00ffb2]">{entry.exact_scores}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
