"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabase";
import { getPredictionsForMatches, savePrediction, isPredictionLocked } from "@/app/lib/predictions";
import { getPredictionsOpenSetting } from "@/app/lib/matches";
import { getMatchKickoffAt } from "@/app/lib/matchDate";
import { formatBrazilTime } from "@/app/lib/dateUtils";
import { Toast } from "@/app/components/Toast";
import type { Match, Prediction } from "@/app/types";

// Estrutura do chaveamento oficial FIFA 2026
// Numeração oficial confirmada via fifa.com (jogos 73-88 dos 32-avos)
const BRACKET = {
  // Lado esquerdo: 32-avos 73-80
  left: [
    { match: 73, home: "Alemanha", away: "Paraguai" },
    { match: 74, home: "França", away: "Suécia" },
    { match: 75, home: "África do Sul", away: "Canadá" },
    { match: 76, home: "Holanda", away: "Marrocos" },
    { match: 77, home: "Portugal", away: "Croácia" },
    { match: 78, home: "Espanha", away: "Áustria" },
    { match: 79, home: "Estados Unidos", away: "Bósnia e Herzegovina" },
    { match: 80, home: "Bélgica", away: "Senegal" },
  ],
  // Lado direito: 32-avos 81-88
  right: [
    { match: 81, home: "Brasil", away: "Japão" },
    { match: 82, home: "Costa do Marfim", away: "Noruega" },
    { match: 83, home: "México", away: "Equador" },
    { match: 84, home: "Inglaterra", away: "RD Congo" },
    { match: 85, home: "Argentina", away: "Cabo Verde" },
    { match: 86, home: "Austrália", away: "Egito" },
    { match: 87, home: "Suíça", away: "Argélia" },
    { match: 88, home: "Colômbia", away: "Gana" },
  ],
  // Lado A (esquerda visual): oitavas 89, 90, 93, 94
  oitavas_left: [
    { match: 89, home: "W73", away: "W74" },
    { match: 90, home: "W75", away: "W76" },
    { match: 93, home: "W77", away: "W78" },
    { match: 94, home: "W79", away: "W80" },
  ],
  // Lado B (direita visual): oitavas 91, 92, 95, 96
  oitavas_right: [
    { match: 91, home: "W81", away: "W82" },
    { match: 92, home: "W83", away: "W84" },
    { match: 95, home: "W85", away: "W86" },
    { match: 96, home: "W87", away: "W88" },
  ],
  // Lado A: J97 (W89 x W90) e J98 (W93 x W94)
  quartas_left: [
    { match: 97, home: "W89", away: "W90" },
    { match: 98, home: "W93", away: "W94" },
  ],
  // Lado B: J99 (W91 x W92) e J100 (W95 x W96)
  quartas_right: [
    { match: 99, home: "W91", away: "W92" },
    { match: 100, home: "W95", away: "W96" },
  ],
  semi_left: { match: 101, home: "W97", away: "W98" },
  semi_right: { match: 102, home: "W99", away: "W100" },
  terceiro: { match: 103, home: "P101", away: "P102" },
  final: { match: 104, home: "W101", away: "W102" },
};

interface MatchData {
  id: string;
  match_number: number;
  phase: string;
  kickoff_at?: string;
  home_team?: string | null;
  away_team?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  is_finished?: boolean;
  winner?: string | null;
  winner_type?: string | null;
  home_team_info?: any;
  away_team_info?: any;
}

function MatchNode({
  matchNum,
  homeLabel,
  awayLabel,
  matchData,
  prediction,
  locked,
  saving,
  onSelect,
  selected,
}: {
  matchNum: number;
  homeLabel: string;
  awayLabel: string;
  matchData?: MatchData;
  prediction?: Prediction;
  locked?: boolean;
  saving?: boolean;
  onSelect?: () => void;
  selected?: boolean;
}) {
  const home = matchData?.home_team_info?.name || matchData?.home_team || homeLabel;
  const away = matchData?.away_team_info?.name || matchData?.away_team || awayLabel;
  const homeFlag = matchData?.home_team_info?.flag_url;
  const awayFlag = matchData?.away_team_info?.flag_url;
  const finished = matchData?.is_finished;
  const hasPrediction = prediction && (prediction.predicted_home !== undefined);
  const kickoff = matchData?.kickoff_at ? formatBrazilTime(matchData.kickoff_at, "date") : null;

  return (
    <div
      onClick={!finished && !locked && onSelect ? onSelect : undefined}
      className={`
        relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 w-[130px]
        ${selected ? "ring-2 ring-[#00ffb2] shadow-lg shadow-[#00ffb2]/20" : ""}
        ${finished ? "border border-[#00ffb2]/30 bg-[#081120]" : "border border-[#ffffff15] bg-[#050816] hover:border-[#00ffb2]/40"}
        ${!finished && !locked && onSelect ? "hover:scale-105" : ""}
      `}
    >
      {kickoff && (
        <div className="px-1.5 py-0.5 text-[9px] text-gray-600 border-b border-[#ffffff08] truncate">
          J{matchNum} · {kickoff}
        </div>
      )}
      {!kickoff && (
        <div className="px-1.5 py-0.5 text-[9px] text-gray-700 border-b border-[#ffffff08]">
          J{matchNum}
        </div>
      )}
      <div className={`flex items-center justify-between px-2 py-1 text-[11px] ${finished && matchData?.winner === "home" ? "text-[#00ffb2] font-bold" : "text-gray-300"}`}>
        <span className="flex items-center gap-1 truncate flex-1">
          {homeFlag && <img src={homeFlag} alt="" className="w-4 h-3 rounded-sm object-cover flex-none" />}
          <span className="truncate">{home}</span>
        </span>
        {finished && <span className="ml-1 font-bold text-white">{matchData?.home_score}</span>}
        {!finished && hasPrediction && <span className="ml-1 text-[#00ffb2]/60">{prediction?.predicted_home}</span>}
      </div>
      <div className="h-px bg-[#ffffff08]" />
      <div className={`flex items-center justify-between px-2 py-1 text-[11px] ${finished && matchData?.winner === "away" ? "text-[#00ffb2] font-bold" : "text-gray-300"}`}>
        <span className="flex items-center gap-1 truncate flex-1">
          {awayFlag && <img src={awayFlag} alt="" className="w-4 h-3 rounded-sm object-cover flex-none" />}
          <span className="truncate">{away}</span>
        </span>
        {finished && <span className="ml-1 font-bold text-white">{matchData?.away_score}</span>}
        {!finished && hasPrediction && <span className="ml-1 text-[#00ffb2]/60">{prediction?.predicted_away}</span>}
      </div>
      {finished && matchData?.winner_type && matchData.winner_type !== "normal" && (
        <div className="px-2 py-0.5 text-[9px] text-center text-[#24cfff] border-t border-[#ffffff08]">
          {matchData.winner_type === "penalties" ? "PEN" : "PRORR"}
        </div>
      )}
    </div>
  );
}

function Connector({ vertical = false }: { vertical?: boolean }) {
  return vertical
    ? <div className="w-px h-4 bg-[#00ffb2]/20 mx-auto" />
    : <div className="h-px w-4 bg-[#00ffb2]/20" />;
}

function PalpiteModal({
  matchData,
  prediction,
  onSave,
  onClose,
  saving,
}: {
  matchData: MatchData;
  prediction?: Prediction;
  onSave: (home: number, away: number, winner?: string, penalties?: boolean, method?: string) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [homeScore, setHomeScore] = useState(prediction?.predicted_home ?? 0);
  const [awayScore, setAwayScore] = useState(prediction?.predicted_away ?? 0);
  const [winner, setWinner] = useState<string | null>((prediction as any)?.predicted_winner ?? null);
  const [method, setMethod] = useState<"normal" | "extra_time" | "penalties">(
    (prediction as any)?.predicted_method === "penalties" ? "penalties" :
    (prediction as any)?.predicted_method === "extra_time" ? "extra_time" : "normal"
  );

  const home = matchData.home_team_info?.name || matchData.home_team || "Mandante";
  const away = matchData.away_team_info?.name || matchData.away_team || "Visitante";
  const isEmpatado = homeScore === awayScore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[#00ffb2]/30 bg-[#070b16] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-[#00ffb2] font-semibold uppercase tracking-wider">J{matchData.match_number} · Palpite</p>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg">✕</button>
        </div>

        {/* Times + placar */}
        <div className="grid grid-cols-3 items-center gap-3 mb-4">
          <div className="text-center">
            {matchData.home_team_info?.flag_url && (
              <img src={matchData.home_team_info.flag_url} alt={home} className="w-12 h-8 rounded mx-auto mb-1 object-cover border border-[#00ffb2]/20" />
            )}
            <p className="text-xs font-bold text-white truncate">{home}</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <input type="number" min={0} value={homeScore}
              onChange={e => setHomeScore(Number(e.target.value))}
              className="w-12 h-12 bg-[#081120] border border-[#00ffb244] rounded-lg text-center text-white text-xl font-bold"
            />
            <span className="text-white font-bold">x</span>
            <input type="number" min={0} value={awayScore}
              onChange={e => setAwayScore(Number(e.target.value))}
              className="w-12 h-12 bg-[#081120] border border-[#00ffb244] rounded-lg text-center text-white text-xl font-bold"
            />
          </div>
          <div className="text-center">
            {matchData.away_team_info?.flag_url && (
              <img src={matchData.away_team_info.flag_url} alt={away} className="w-12 h-8 rounded mx-auto mb-1 object-cover border border-[#00ffb2]/20" />
            )}
            <p className="text-xs font-bold text-white truncate">{away}</p>
          </div>
        </div>

        {/* Classificado */}
        <div className="space-y-3 border border-[#00ffb2]/15 rounded-xl p-3 bg-[#081120] mb-4">
          <p className="text-xs text-[#00ffb2] font-semibold text-center uppercase tracking-wider">Quem se classifica?</p>
          <div className="flex gap-2">
            <button onClick={() => setWinner(winner === "home" ? null : "home")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${winner === "home" ? "bg-[#00ffb2] text-black border-[#00ffb2]" : "bg-transparent text-white border-[#00ffb244] hover:border-[#00ffb2]"}`}>
              {matchData.home_team_info?.fifa_code || home.slice(0, 8)}
            </button>
            <button onClick={() => setWinner(winner === "away" ? null : "away")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${winner === "away" ? "bg-[#00ffb2] text-black border-[#00ffb2]" : "bg-transparent text-white border-[#00ffb244] hover:border-[#00ffb2]"}`}>
              {matchData.away_team_info?.fifa_code || away.slice(0, 8)}
            </button>
          </div>
          {isEmpatado && (
            <div className="space-y-1">
              <p className="text-[10px] text-gray-400 text-center">Como se classificou?</p>
              <div className="flex gap-1">
                {(["normal", "extra_time", "penalties"] as const).map(m => (
                  <button key={m} onClick={() => setMethod(m)}
                    className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition ${method === m ? "bg-[#24cfff] text-black border-[#24cfff]" : "bg-transparent text-white border-[#00ffb244] hover:border-[#24cfff]"}`}>
                    {m === "normal" ? "Normal" : m === "extra_time" ? "Prorrog." : "Pênaltis"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          disabled={saving}
          onClick={() => onSave(homeScore, awayScore, winner ?? undefined, method === "penalties", method)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00ffb2] to-[#24cfff] text-black font-bold hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Confirmar Palpite"}
        </button>
      </div>
    </div>
  );
}

export default function MataMataPage() {
  const { user, loading } = useAuth();
  const [matchesMap, setMatchesMap] = useState<Record<number, MatchData>>({});
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [predictionsOpen, setPredictionsOpen] = useState(true);
  const [groupStageFinished, setGroupStageFinished] = useState(true); // Liberado manualmente - chaveamento parcial
  const [loadingData, setLoadingData] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("chaveamento");
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingData(true);
      try {
        const [{ data }, open] = await Promise.all([
          supabase.from("matches").select(`
            id, match_number, phase, kickoff_at, home_score, away_score,
            is_finished, winner, winner_type,
            home_team_info:home_team_id (id, name, fifa_code, flag_url),
            away_team_info:away_team_id (id, name, fifa_code, flag_url)
          `).order("match_number", { ascending: true }),
          getPredictionsOpenSetting(),
        ]);

        const all = data || [];
        const map: Record<number, MatchData> = {};
        all.forEach((m: any) => { map[m.match_number] = m; });
        setMatchesMap(map);
        setPredictionsOpen(open);
        setGroupStageFinished(
          all.filter((m: any) => m.phase === "group_stage").every((m: any) => m.is_finished === true)
        );

        const knockoutIds = all
          .filter((m: any) => ["round_of_32","round_of_16","quarterfinal","semifinal","third_place","final"].includes(m.phase))
          .map((m: any) => m.id);
        const predMap = await getPredictionsForMatches(user.id, knockoutIds);
        setPredictions(predMap);
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [user]);

  const handleSave = async (home: number, away: number, winner?: string, penalties?: boolean, method?: string) => {
    if (!user || !selectedMatch) return;
    const matchData = matchesMap[selectedMatch];
    if (!matchData) return;
    setSavingMatchId(matchData.id);
    try {
      const saved = await savePrediction(user.id, matchData.id, home, away, winner ?? null, penalties ?? false, method ?? null);
      if (saved) {
        setPredictions(p => ({ ...p, [matchData.id]: saved }));
        setToast({ type: "success", message: "Palpite salvo!" });
        setSelectedMatch(null);
      } else {
        setToast({ type: "error", message: "Erro ao salvar palpite" });
      }
    } finally {
      setSavingMatchId(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const node = (matchNum: number, homeLabel: string, awayLabel: string) => {
    const m = matchesMap[matchNum];
    const pred = m ? predictions[m.id] : undefined;
    const locked = m ? isPredictionLocked(m.kickoff_at, predictionsOpen) : true;
    return (
      <MatchNode
        matchNum={matchNum}
        homeLabel={homeLabel}
        awayLabel={awayLabel}
        matchData={m}
        prediction={pred}
        locked={locked}
        saving={m ? savingMatchId === m.id : false}
        selected={selectedMatch === matchNum}
        onSelect={!locked && groupStageFinished ? () => setSelectedMatch(matchNum) : undefined}
      />
    );
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#04070f] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00ffb2]/30 border-t-[#00ffb2] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,255,178,0.08),_transparent_30%),_linear-gradient(180deg,#04070f_0%,#070b16_100%)] px-4 py-8 text-white">
      {toast && <Toast type={toast.type} message={toast.message} />}
      {selectedMatch && matchesMap[selectedMatch] && (
        <PalpiteModal
          matchData={matchesMap[selectedMatch]}
          prediction={predictions[matchesMap[selectedMatch].id]}
          onSave={handleSave}
          onClose={() => setSelectedMatch(null)}
          saving={savingMatchId === matchesMap[selectedMatch].id}
        />
      )}

      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Header */}
        <header className="rounded-2xl border border-[#00ffb2]/20 bg-gradient-to-br from-[#081116] to-[#070b16] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00ffb2]">Copa do Mundo 2026</p>
              <h1 className="mt-1 text-3xl font-bold">Mata-Mata</h1>
              <p className="mt-1 text-sm text-gray-400">
                {groupStageFinished
                  ? "Clique em um jogo para fazer seu palpite"
                  : "Disponível após o encerramento da fase de grupos"}
              </p>
            </div>
            <Link href="/dashboard" className="px-4 py-2 bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] text-black font-semibold rounded-lg text-sm">
              Voltar
            </Link>
          </div>
        </header>

        {!groupStageFinished && (
          <div className="rounded-2xl border border-[#00ffb2]/20 bg-[#050816] p-8 text-center">
            <p className="text-2xl font-bold mb-2">🔒 Mata-mata bloqueado</p>
            <p className="text-gray-400">Os palpites serão liberados após o admin finalizar todos os jogos da fase de grupos.</p>
          </div>
        )}

        {/* Abas */}
        {groupStageFinished && (
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("chaveamento")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === "chaveamento"
                  ? "bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] text-black"
                  : "border border-[#00ffb2]/20 text-[#00ffb2] hover:bg-[#00ffb2]/10"
              }`}
            >
              Chaveamento
            </button>
            <button
              onClick={() => setActiveTab("lista")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === "lista"
                  ? "bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] text-black"
                  : "border border-[#00ffb2]/20 text-[#00ffb2] hover:bg-[#00ffb2]/10"
              }`}
            >
              Lista de Jogos
            </button>
          </div>
        )}

        {/* Legenda */}
        {groupStageFinished && (
          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00ffb2]" />Com palpite</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-600" />Sem palpite</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#24cfff]" />Finalizado</span>
            <span className="text-gray-500">· Clique no jogo para palpitar</span>
          </div>
        )}

        {/* Chaveamento em árvore */}
        {groupStageFinished && activeTab === "chaveamento" && (
        <div className="rounded-2xl border border-[#00ffb2]/20 bg-[#050816] p-6 overflow-x-auto">
          <div className="min-w-[1100px]">

            {/* Bracket principal — estrutura em pares explícitos (evita desalinhamento visual) */}
            <div className="flex gap-1 items-start">

              {/* LADO ESQUERDO: 4 grupos de [32avos+32avos -> oitava] */}
              <div className="flex flex-col gap-6 flex-none">
                <p className="text-[10px] text-[#00ffb2] font-semibold uppercase tracking-wider mb-1">32-avos / Oitavas</p>
                {[0,1,2,3].map((groupIdx) => {
                  const m1 = BRACKET.left[groupIdx*2];
                  const m2 = BRACKET.left[groupIdx*2+1];
                  const oitava = BRACKET.oitavas_left[groupIdx];
                  return (
                    <div key={groupIdx} className="flex items-center gap-2">
                      <div className="flex flex-col gap-2">
                        <div>{node(m1.match, m1.home, m1.away)}</div>
                        <div>{node(m2.match, m2.home, m2.away)}</div>
                      </div>
                      <div className="text-[#00ffb2]/30 text-xs px-1">→</div>
                      <div>{node(oitava.match, oitava.home, oitava.away)}</div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[#00ffb2]/20 text-xs px-2 self-center">→</div>

              {/* Quartas esquerda */}
              <div className="flex flex-col gap-12 flex-none justify-center self-stretch">
                <p className="text-[10px] text-[#00ffb2] font-semibold uppercase tracking-wider text-center mb-1">Quartas</p>
                {BRACKET.quartas_left.map(({ match, home, away }) => (
                  <div key={match}>{node(match, home, away)}</div>
                ))}
              </div>

              <div className="text-[#00ffb2]/20 text-xs px-2 self-center">→</div>

              {/* Semi esquerda + Final + Semi direita */}
              <div className="flex flex-col flex-1 justify-center items-center gap-4 min-w-[150px] self-stretch">
                <p className="text-[10px] text-[#00ffb2] font-semibold uppercase tracking-wider text-center mb-1">Semifinal / Final</p>
                <div>{node(BRACKET.semi_left.match, BRACKET.semi_left.home, BRACKET.semi_left.away)}</div>

                <div className="flex flex-col items-center gap-1">
                  <p className="text-[10px] text-[#ffd700] font-bold uppercase tracking-widest">🏆 Final</p>
                  {node(BRACKET.final.match, BRACKET.final.home, BRACKET.final.away)}
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">3º lugar</p>
                  {node(BRACKET.terceiro.match, BRACKET.terceiro.home, BRACKET.terceiro.away)}
                </div>

                <div>{node(BRACKET.semi_right.match, BRACKET.semi_right.home, BRACKET.semi_right.away)}</div>
              </div>

              <div className="text-[#00ffb2]/20 text-xs px-2 self-center">→</div>

              {/* Quartas direita */}
              <div className="flex flex-col gap-12 flex-none justify-center self-stretch">
                <p className="text-[10px] text-[#00ffb2] font-semibold uppercase tracking-wider text-center mb-1">Quartas</p>
                {BRACKET.quartas_right.map(({ match, home, away }) => (
                  <div key={match}>{node(match, home, away)}</div>
                ))}
              </div>

              <div className="text-[#00ffb2]/20 text-xs px-2 self-center">→</div>

              {/* LADO DIREITO: 4 grupos de [oitava <- 32avos+32avos] */}
              <div className="flex flex-col gap-6 flex-none">
                <p className="text-[10px] text-[#00ffb2] font-semibold uppercase tracking-wider mb-1 text-right">Oitavas / 32-avos</p>
                {[0,1,2,3].map((groupIdx) => {
                  const m1 = BRACKET.right[groupIdx*2];
                  const m2 = BRACKET.right[groupIdx*2+1];
                  const oitava = BRACKET.oitavas_right[groupIdx];
                  return (
                    <div key={groupIdx} className="flex items-center gap-2">
                      <div>{node(oitava.match, oitava.home, oitava.away)}</div>
                      <div className="text-[#00ffb2]/30 text-xs px-1">←</div>
                      <div className="flex flex-col gap-2">
                        <div>{node(m1.match, m1.home, m1.away)}</div>
                        <div>{node(m2.match, m2.home, m2.away)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
        )}

        {/* Lista de Jogos */}
        {groupStageFinished && activeTab === "lista" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(matchesMap)
              .filter((m) => m.match_number >= 73)
              .sort((a, b) => new Date(a.kickoff_at ?? 0).getTime() - new Date(b.kickoff_at ?? 0).getTime())
              .map((m) => {
                const pred = predictions[m.id];
                const locked = isPredictionLocked(m.kickoff_at, predictionsOpen);
                return (
                  <div
                    key={m.id}
                    onClick={!locked ? () => setSelectedMatch(m.match_number) : undefined}
                    className={`rounded-2xl border p-4 cursor-pointer transition hover:scale-[1.02] ${
                      m.is_finished
                        ? "border-[#00ffb2]/40 bg-[#081120]"
                        : pred
                        ? "border-[#00ffb2]/30 bg-[#050816]"
                        : "border-[#ffffff15] bg-[#050816]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2">
                      <span>J{m.match_number}</span>
                      <span>{m.kickoff_at ? formatBrazilTime(m.kickoff_at, "full") : ""}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {m.home_team_info?.flag_url && (
                          <img src={m.home_team_info.flag_url} alt="" className="w-6 h-4 rounded-sm object-cover flex-none" />
                        )}
                        <span className="text-sm text-white truncate">{m.home_team_info?.name || m.home_team}</span>
                      </div>
                      <div className="px-3 text-center">
                        {m.is_finished ? (
                          <span className="text-sm font-bold text-white">{m.home_score} x {m.away_score}</span>
                        ) : pred ? (
                          <span className="text-sm font-bold text-[#00ffb2]">{pred.predicted_home} x {pred.predicted_away}</span>
                        ) : (
                          <span className="text-xs text-gray-500">vs</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-sm text-white truncate">{m.away_team_info?.name || m.away_team}</span>
                        {m.away_team_info?.flag_url && (
                          <img src={m.away_team_info.flag_url} alt="" className="w-6 h-4 rounded-sm object-cover flex-none" />
                        )}
                      </div>
                    </div>
                    {locked && !m.is_finished && (
                      <p className="text-center text-[10px] text-red-400 mt-2">🔒 Palpites encerrados</p>
                    )}
                    {!locked && !m.is_finished && (
                      <p className="text-center text-[10px] text-[#00ffb2]/60 mt-2">
                        {pred ? "Clique para atualizar" : "Clique para palpitar"}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        )}

      </div>
    </main>
  );
}
