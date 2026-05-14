"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/lib/auth";
import { getGroupMatches, getGroupTeams } from "@/app/lib/importCopa2026";
import { MatchCard } from "@/app/components/MatchCard";
import type { Match, Team } from "@/app/types";

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export default function GruposPage() {
  const { user, loading } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState("A");
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [matchesData, teamsData] = await Promise.all([
          getGroupMatches(selectedGroup),
          getGroupTeams(selectedGroup),
        ]);
        setMatches(matchesData);
        setTeams(teamsData.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user, selectedGroup]);

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
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <header className="rounded-2xl border border-[#00ffb2]/20 bg-gradient-to-br from-[#081116] to-[#070b16] p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00ffb2]">
                Grupos - Fase de Grupos
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white">Grupo {selectedGroup}</h1>
              <p className="mt-1 text-sm text-gray-400">
                {teams.length} times - {matches.length} confrontos
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

        {/* Group Selector */}
        <div className="flex flex-wrap gap-2">
          {GROUPS.map((group) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedGroup === group
                  ? "bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] text-black shadow-lg shadow-[#00ffb2]/30"
                  : "bg-gradient-to-br from-[#081116] to-[#070b16] border border-[#00ffb2]/20 text-[#00ffb2] hover:border-[#00ffb2]/50"
              }`}
            >
              Grupo {group}
            </button>
          ))}
        </div>

        {loadingData ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#00ffb2]/30 border-t-[#00ffb2] rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-[#00b2ff] font-semibold">Carregando grupo...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Matches */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-[#00ffb2]">Confrontos</h2>
              {matches.length === 0 ? (
                <div className="rounded-xl border border-[#00ffb2]/20 bg-gradient-to-br from-[#081116] to-[#070b16] p-8 text-center text-gray-400">
                  Nenhum confronto encontrado para este grupo.
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      homeTeam={typeof match.home_team === "object" && match.home_team ? match.home_team : undefined}
                      awayTeam={typeof match.away_team === "object" && match.away_team ? match.away_team : undefined}
                      isEditable={false}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Standings */}
            <div>
              <h2 className="text-xl font-bold text-[#00b2ff] mb-4">Classificação</h2>
              <div className="rounded-xl border border-[#00b2ff]/20 bg-gradient-to-br from-[#081116] to-[#070b16] overflow-hidden">
                <div className="bg-gradient-to-r from-[#00b2ff]/10 to-[#00ffb2]/10 p-4 border-b border-[#00b2ff]/20">
                  <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-[#00b2ff]">
                    <div>Times</div>
                    <div className="text-right">J</div>
                    <div className="text-right">GF</div>
                    <div className="text-right">Pts</div>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  {teams.map((team, idx) => (
                    <div
                      key={team.id}
                      className="grid grid-cols-4 gap-2 items-center text-sm py-2 px-2 rounded hover:bg-[#00ffb2]/5 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-semibold text-[#00ffb2] text-xs">{idx + 1}</span>
                        <span className="truncate">{team.name}</span>
                      </div>
                      <div className="text-right text-gray-400">-</div>
                      <div className="text-right text-gray-400">-</div>
                      <div className="text-right font-bold text-[#00ffb2]">0</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
