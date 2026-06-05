"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabase";

interface BracketMatch {
  match_number: number;
  phase: string;
  kickoff_at?: string;
  home_team?: string | null;
  away_team?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  home_label: string;
  away_label: string;
  is_finished?: boolean;
}

const PHASE_LABELS: Record<string, string> = {
  round_of_32: "32-avos",
  round_of_16: "Oitavas",
  quarterfinal: "Quartas",
  semifinal: "Semifinal",
  third_place: "3º Lugar",
  final: "Final",
};

// Chaveamento oficial conforme documento FIFA Copa 2026
const BRACKET_STRUCTURE = {
  // Lado esquerdo (jogos 74,77,75,73,83,84,81,82)
  left: [
    { match: 74, home: "1ºE", away: "3ºABCDF" },
    { match: 77, home: "1ºI", away: "3ºCDFGH" },
    { match: 75, home: "1ºF", away: "2ºC" },
    { match: 73, home: "2ºA", away: "2ºB" },
    { match: 83, home: "2ºK", away: "2ºL" },
    { match: 84, home: "1ºH", away: "2ºJ" },
    { match: 81, home: "1ºD", away: "3ºBEFIJ" },
    { match: 82, home: "1ºG", away: "3ºAEHIJ" },
  ],
  // Lado direito (jogos 79,76,78,85,86,88,87,80)
  right: [
    { match: 79, home: "1ºA", away: "3ºCEFHI" },
    { match: 76, home: "1ºC", away: "2ºF" },
    { match: 78, home: "2ºE", away: "2ºI" },
    { match: 85, home: "1ºB", away: "3ºEFGIJ" },
    { match: 86, home: "1ºJ", away: "2ºH" },
    { match: 88, home: "2ºD", away: "2ºG" },
    { match: 87, home: "1ºK", away: "3ºDEIJL" },
    { match: 80, home: "1ºL", away: "3ºEHIJK" },
  ],
  // Oitavas
  oitavas_left: [
    { match: 89, home: "W74", away: "W77" },
    { match: 90, home: "W73", away: "W75" },
    { match: 93, home: "W83", away: "W84" },
    { match: 94, home: "W81", away: "W82" },
  ],
  oitavas_right: [
    { match: 91, home: "W76", away: "W78" },
    { match: 92, home: "W79", away: "W80" },
    { match: 95, home: "W86", away: "W88" },
    { match: 96, home: "W85", away: "W87" },
  ],
  // Quartas
  quartas_left: [
    { match: 97, home: "W89", away: "W90" },
    { match: 98, home: "W93", away: "W94" },
  ],
  quartas_right: [
    { match: 99, home: "W91", away: "W92" },
    { match: 100, home: "W95", away: "W96" },
  ],
  // Semis
  semi_left: [{ match: 101, home: "W97", away: "W98" }],
  semi_right: [{ match: 102, home: "W99", away: "W100" }],
  // Final e 3º lugar
  final: { match: 104, home: "W101", away: "W102" },
  terceiro: { match: 103, home: "P101", away: "P102" },
};

function formatDate(kickoffAt?: string) {
  if (!kickoffAt) return "";
  const d = new Date(kickoffAt);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function MatchBox({
  matchData,
  matchNumber,
  homeLabel,
  awayLabel,
  size = "normal",
}: {
  matchData?: BracketMatch;
  matchNumber: number;
  homeLabel: string;
  awayLabel: string;
  size?: "normal" | "large";
}) {
  const home = matchData?.home_team || homeLabel;
  const away = matchData?.away_team || awayLabel;
  const finished = matchData?.is_finished;
  const homeScore = matchData?.home_score;
  const awayScore = matchData?.away_score;

  const sizeClass = size === "large"
    ? "min-w-[160px] text-sm"
    : "min-w-[130px] text-xs";

  return (
    <div className={`rounded-lg border ${finished ? "border-[#00ffb2]/40 bg-[#081120]" : "border-[#ffffff20] bg-[#050816]"} overflow-hidden ${sizeClass}`}>
      {matchData?.kickoff_at && (
        <div className="px-2 py-0.5 text-[10px] text-gray-500 border-b border-[#ffffff10]">
          J{matchNumber} · {formatDate(matchData.kickoff_at)}
        </div>
      )}
      {!matchData?.kickoff_at && (
        <div className="px-2 py-0.5 text-[10px] text-gray-600 border-b border-[#ffffff10]">
          J{matchNumber}
        </div>
      )}
      <div className={`flex items-center justify-between px-2 py-1 ${finished && homeScore! > awayScore! ? "text-[#00ffb2] font-bold" : "text-white"}`}>
        <span className="truncate flex-1">{home}</span>
        {finished && <span className="ml-2 font-bold">{homeScore}</span>}
      </div>
      <div className="h-px bg-[#ffffff10]" />
      <div className={`flex items-center justify-between px-2 py-1 ${finished && awayScore! > homeScore! ? "text-[#00ffb2] font-bold" : "text-white"}`}>
        <span className="truncate flex-1">{away}</span>
        {finished && <span className="ml-2 font-bold">{awayScore}</span>}
      </div>
    </div>
  );
}

export default function ChaveamentoPage() {
  const { user, loading } = useAuth();
  const [matchesMap, setMatchesMap] = useState<Record<number, BracketMatch>>({});
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          match_number, phase, kickoff_at, home_score, away_score, is_finished,
          home_team_info:home_team_id (name),
          away_team_info:away_team_id (name)
        `)
        .in("phase", ["round_of_32", "round_of_16", "quarterfinal", "semifinal", "third_place", "final"]);

      if (!error && data) {
        const map: Record<number, BracketMatch> = {};
        for (const m of data) {
          map[m.match_number] = {
            match_number: m.match_number,
            phase: m.phase,
            kickoff_at: m.kickoff_at,
            home_team: (m.home_team_info as any)?.name ?? null,
            away_team: (m.away_team_info as any)?.name ?? null,
            home_score: m.home_score,
            away_score: m.away_score,
            home_label: "",
            away_label: "",
            is_finished: m.is_finished,
          };
        }
        setMatchesMap(map);
      }
      setLoadingData(false);
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

  const m = (n: number, hl: string, al: string) => (
    <MatchBox matchData={matchesMap[n]} matchNumber={n} homeLabel={hl} awayLabel={al} />
  );

  const ml = (n: number, hl: string, al: string) => (
    <MatchBox matchData={matchesMap[n]} matchNumber={n} homeLabel={hl} awayLabel={al} size="large" />
  );

  const connector = "flex items-center text-[#00ffb2]/30 text-lg px-1";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,255,178,0.08),_transparent_30%),_linear-gradient(180deg,#04070f_0%,#070b16_100%)] px-4 py-8 text-white">
      <div className="mx-auto max-w-[1400px] space-y-8">

        {/* Header */}
        <header className="rounded-2xl border border-[#00ffb2]/20 bg-gradient-to-br from-[#081116] to-[#070b16] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00ffb2]">Copa do Mundo 2026</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Chave do Mata-Mata</h1>
              <p className="mt-1 text-sm text-gray-400">Chaveamento completo — 32-avos até a Final</p>
            </div>
            <div className="flex gap-3">
              <Link href="/mata-mata" className="px-4 py-2 border border-[#00ffb2]/30 text-[#00ffb2] font-semibold rounded-lg hover:bg-[#00ffb2]/10 transition text-sm">
                Fazer Palpites
              </Link>
              <Link href="/" className="px-4 py-2 bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] text-black font-semibold rounded-lg transition text-sm">
                Voltar
              </Link>
            </div>
          </div>
        </header>

        {loadingData ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-[#00ffb2]/30 border-t-[#00ffb2] rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-[#00b2ff]">Carregando chaveamento...</p>
          </div>
        ) : (
          <div className="space-y-6 overflow-x-auto pb-4">

            {/* LEGENDA */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              {Object.entries(PHASE_LABELS).map(([key, label]) => (
                <span key={key} className="px-2 py-1 rounded border border-[#00ffb2]/20 text-[#00ffb2]">{label}</span>
              ))}
              <span className="px-2 py-1 rounded border border-white/10">W# = Vencedor do Jogo #</span>
              <span className="px-2 py-1 rounded border border-white/10">P# = Perdedor do Jogo #</span>
            </div>

            {/* BRACKET PRINCIPAL */}
            <div className="rounded-2xl border border-[#00ffb2]/20 bg-[#050816] p-6">

              {/* 32-AVOS */}
              <div className="mb-6">
                <h2 className="text-sm font-bold text-[#00ffb2] uppercase tracking-wider mb-4">32-avos de Final</h2>
                <div className="grid grid-cols-2 gap-6">
                  {/* Lado esquerdo */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-2">Chave A</p>
                    {BRACKET_STRUCTURE.left.map(({ match, home, away }) => (
                      <div key={match}>{m(match, home, away)}</div>
                    ))}
                  </div>
                  {/* Lado direito */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-2">Chave B</p>
                    {BRACKET_STRUCTURE.right.map(({ match, home, away }) => (
                      <div key={match}>{m(match, home, away)}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="h-px bg-[#00ffb2]/10 my-6" />

              {/* OITAVAS */}
              <div className="mb-6">
                <h2 className="text-sm font-bold text-[#00b2ff] uppercase tracking-wider mb-4">Oitavas de Final</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    {BRACKET_STRUCTURE.oitavas_left.map(({ match, home, away }) => (
                      <div key={match}>{m(match, home, away)}</div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {BRACKET_STRUCTURE.oitavas_right.map(({ match, home, away }) => (
                      <div key={match}>{m(match, home, away)}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="h-px bg-[#00ffb2]/10 my-6" />

              {/* QUARTAS */}
              <div className="mb-6">
                <h2 className="text-sm font-bold text-[#24cfff] uppercase tracking-wider mb-4">Quartas de Final</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    {BRACKET_STRUCTURE.quartas_left.map(({ match, home, away }) => (
                      <div key={match}>{m(match, home, away)}</div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {BRACKET_STRUCTURE.quartas_right.map(({ match, home, away }) => (
                      <div key={match}>{m(match, home, away)}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="h-px bg-[#00ffb2]/10 my-6" />

              {/* SEMIS + FINAL */}
              <div className="mb-6">
                <h2 className="text-sm font-bold text-[#ffb200] uppercase tracking-wider mb-4">Semifinais</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>{m(101, "W97", "W98")}</div>
                  <div>{m(102, "W99", "W100")}</div>
                </div>
              </div>

              <div className="h-px bg-[#00ffb2]/10 my-6" />

              {/* 3º LUGAR + FINAL */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Disputa 3º Lugar</h2>
                  {m(103, "P101", "P102")}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#ffd700] uppercase tracking-wider mb-4">🏆 Final</h2>
                  {ml(104, "W101", "W102")}
                </div>
              </div>

            </div>

          </div>
        )}
      </div>
    </main>
  );
}
