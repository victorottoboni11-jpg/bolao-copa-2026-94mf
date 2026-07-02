"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { calculateExactScores, calculateCorrectResults, calculateMatchPoints } from "@/app/lib/scoring";
import { useAuth } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabase";
import { formatBrazilTime } from "@/app/lib/dateUtils";
import { savePrediction } from "@/app/lib/predictions";

import type { Match, Prediction } from "@/app/types";

const LOCK_MINUTES = 30;

function isLocked(kickoffAt?: string) {
  if (!kickoffAt) return true;
  const cutoff = new Date(kickoffAt).getTime() - LOCK_MINUTES * 60 * 1000;
  return Date.now() >= cutoff;
}

function getNext24hMatches(matches: Match[]): Match[] {
  const now = Date.now();
  const in24h = now + 24 * 60 * 60 * 1000;

  return matches
    .filter((m) => {
      if (!m.kickoff_at) return false;
      const t = new Date(m.kickoff_at).getTime();
      const cutoff = t - LOCK_MINUTES * 60 * 1000;
      return cutoff > now && t <= in24h;
    })
    .sort((a, b) => new Date(a.kickoff_at!).getTime() - new Date(b.kickoff_at!).getTime());
}

export default function DashboardPage() {
  const { user, loading } = useAuth();

  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  // scores locais para edição inline: matchId -> [home, away]
  const [scores, setScores] = useState<Record<string, [number, number]>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [showPalpites, setShowPalpites] = useState(false);
  const [allPredictions, setAllPredictions] = useState<any[]>([]);
  const [topRanking, setTopRanking] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!user?.id) { setLoadingData(false); return; }
      setLoadingData(true);

      const { data: matchesData } = await supabase
        .from("matches")
        .select(`
          *,
          home_team_info:home_team_id (id, name, fifa_code, flag_url),
          away_team_info:away_team_id (id, name, fifa_code, flag_url)
        `)
        .order("kickoff_at", { ascending: true });

      setMatches(matchesData || []);

      // Buscar todas as predictions para estatísticas
      const { data: allPreds } = await supabase
        .from("predictions")
        .select("match_id, predicted_home, predicted_away, points, user_id");
      setAllPredictions(allPreds || []);

      // Buscar ranking top 3
      const { data: rankData } = await supabase
        .from("rankings")
        .select("user_id, total_points, exact_scores, position")
        .order("total_points", { ascending: false })
        .limit(3);
      const userIds = (rankData || []).map((r: any) => r.user_id);
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, full_name, email")
          .in("id", userIds);
        const usersMap = Object.fromEntries((usersData || []).map((u: any) => [u.id, u]));
        setTopRanking((rankData || []).map((r: any) => ({
          ...r,
          name: usersMap[r.user_id]?.full_name || usersMap[r.user_id]?.email || "—",
        })));
      }

      const { data: predictionsData } = await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", user.id);

      const preds = predictionsData || [];
      setPredictions(preds);

      // Inicializar scores com palpites existentes
      const initialScores: Record<string, [number, number]> = {};
      for (const p of preds) {
        initialScores[p.match_id] = [p.predicted_home ?? 0, p.predicted_away ?? 0];
      }
      setScores(initialScores);
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

  const upcomingMatches = useMemo(() => getNext24hMatches(matches), [matches]);

  const stats = useMemo(() => {
    const finishedMatches = matches.filter(m => m.is_finished && m.home_score !== null);
    if (finishedMatches.length === 0 || allPredictions.length === 0) return null;

    // Jogo com mais cravadas
    const exactsByMatch: Record<string, { count: number; match: any }> = {};
    allPredictions.forEach(p => {
      const m = finishedMatches.find(m => m.id === p.match_id);
      if (!m) return;
      if (!exactsByMatch[p.match_id]) exactsByMatch[p.match_id] = { count: 0, match: m };
      if (p.predicted_home === m.home_score && p.predicted_away === m.away_score) {
        exactsByMatch[p.match_id].count++;
      }
    });
    const mostExacts = Object.values(exactsByMatch).sort((a, b) => b.count - a.count)[0];

    // Jogo mais zebra (menos cravadas ou menos pontos totais)
    const leastExacts = Object.values(exactsByMatch)
      .filter(e => e.count === 0 || (allPredictions.filter(p => p.match_id === e.match.id).length > 0))
      .sort((a, b) => a.count - b.count)[0];

    // Placar mais apostado
    const scoreCounts: Record<string, number> = {};
    allPredictions.forEach(p => {
      const key = String(p.predicted_home) + "x" + String(p.predicted_away);
      scoreCounts[key] = (scoreCounts[key] || 0) + 1;
    });
    const topScore = Object.entries(scoreCounts).sort((a, b) => b[1] - a[1])[0];

    // Top 3 cravadores
    const exactsByUser: Record<string, number> = {};
    allPredictions.forEach(p => {
      const m = finishedMatches.find(m => m.id === p.match_id);
      if (!m) return;
      if (p.predicted_home === m.home_score && p.predicted_away === m.away_score) {
        exactsByUser[p.user_id] = (exactsByUser[p.user_id] || 0) + 1;
      }
    });
    const topCravadores = Object.entries(exactsByUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return { mostExacts, leastExacts, topScore, topCravadores, finishedCount: finishedMatches.length };
  }, [matches, allPredictions]);

  const handleSave = async (matchId: string) => {
    if (!user) return;
    setSaving((s) => ({ ...s, [matchId]: true }));
    const [home, away] = scores[matchId] ?? [0, 0];
    const saved = await savePrediction(user.id, matchId, home, away);
    if (saved) {
      setPredictions((prev) => {
        const filtered = prev.filter((p) => p.match_id !== matchId);
        return [...filtered, saved];
      });
      setSaved((s) => ({ ...s, [matchId]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [matchId]: false })), 2000);
    }
    setSaving((s) => ({ ...s, [matchId]: false }));
  };

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
            <h1 className="text-4xl font-black text-white">Palpites</h1>
            <p className="text-gray-400 mt-2">Bem-vindo ao Bolão 94 M&F Copa 2026</p>
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
          <Link href="/regras" className="rounded-2xl border border-[#00ffb233] bg-[#050816] p-6 hover:border-[#00ffb2]">
            <h2 className="text-xl font-bold mb-2 text-[#00ffb2]">📋 Regras</h2>
            <p className="text-gray-400">Veja como funciona a pontuação.</p>
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

        {/* ESTATÍSTICAS DA RODADA */}
        {stats && stats.finishedCount > 0 && (
          <div className="rounded-3xl border border-[#00ffb233] bg-[#050816] p-6">
            <h2 className="text-2xl font-bold text-[#00ffb2] mb-6">Estatísticas do Bolão</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* Top 3 Ranking */}
              <div className="rounded-xl border border-[#00ffb2]/20 bg-[#081116] p-4">
                <p className="text-xs text-[#00ffb2] font-semibold uppercase tracking-wider mb-3">🏆 Top 3 Ranking</p>
                <div className="space-y-2">
                  {topRanking.map((r, i) => (
                    <div key={r.user_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                        <span className="text-sm text-white truncate max-w-[120px]">{r.name}</span>
                      </div>
                      <span className="text-sm font-bold text-[#00ffb2]">{r.total_points} pts</span>
                    </div>
                  ))}
                  {topRanking.length === 0 && <p className="text-xs text-gray-500">Nenhum dado ainda</p>}
                </div>
              </div>

              {/* Top 3 Cravadores */}
              <div className="rounded-xl border border-[#00ffb2]/20 bg-[#081116] p-4">
                <p className="text-xs text-[#00ffb2] font-semibold uppercase tracking-wider mb-3">💎 Maiores Cravadores</p>
                <div className="space-y-2">
                  {stats.topCravadores.length === 0 && <p className="text-xs text-gray-500">Nenhuma cravada ainda</p>}
                  {stats.topCravadores.map(([userId, count], i) => {
                    const rankUser = topRanking.find(r => r.user_id === userId);
                    return (
                      <div key={userId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                          <span className="text-sm text-white truncate max-w-[120px]">{rankUser?.name || "—"}</span>
                        </div>
                        <span className="text-sm font-bold text-[#00ffb2]">{count} 💎</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Placar mais apostado */}
              <div className="rounded-xl border border-[#00ffb2]/20 bg-[#081116] p-4">
                <p className="text-xs text-[#00ffb2] font-semibold uppercase tracking-wider mb-3">⚽ Placar Mais Apostado</p>
                {stats.topScore ? (
                  <div className="text-center">
                    <p className="text-3xl font-black text-white mt-2">{stats.topScore[0]}</p>
                    <p className="text-sm text-gray-400 mt-1">{stats.topScore[1]} palpites</p>
                  </div>
                ) : <p className="text-xs text-gray-500">Nenhum dado ainda</p>}
              </div>

              {/* Jogo com mais cravadas */}
              {stats.mostExacts && (
                <div className="rounded-xl border border-[#00ffb2]/20 bg-[#081116] p-4">
                  <p className="text-xs text-[#00ffb2] font-semibold uppercase tracking-wider mb-3">🎯 Jogo com Mais Cravadas</p>
                  <p className="text-sm text-white">
                    {(stats.mostExacts.match as any).home_team_info?.name} {stats.mostExacts.match.home_score} x {stats.mostExacts.match.away_score} {(stats.mostExacts.match as any).away_team_info?.name}
                  </p>
                  <p className="text-xs text-[#00ffb2] mt-1">{stats.mostExacts.count} cravadas</p>
                </div>
              )}

              {/* Jogo mais zebra */}
              {stats.leastExacts && stats.leastExacts.count === 0 && (
                <div className="rounded-xl border border-red-500/20 bg-[#0a0505] p-4">
                  <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-3">🦓 Maior Zebra</p>
                  <p className="text-sm text-white">
                    {(stats.leastExacts.match as any).home_team_info?.name} {stats.leastExacts.match.home_score} x {stats.leastExacts.match.away_score} {(stats.leastExacts.match as any).away_team_info?.name}
                  </p>
                  <p className="text-xs text-red-400 mt-1">Ninguém cravou!</p>
                </div>
              )}

            </div>
          </div>
        )}

        {/* PALPITES SALVOS */}
        <div className="rounded-3xl border border-[#00ffb233] bg-[#050816] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#00ffb2]">Meus Palpites</h2>
            <button
              onClick={() => setShowPalpites(!showPalpites)}
              className="px-4 py-2 rounded-xl border border-[#00ffb233] text-[#00ffb2] text-sm hover:bg-[#00ffb2]/10 transition"
            >
              {showPalpites ? "Ocultar" : "Ver todos"}
            </button>
          </div>

          {showPalpites && (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {predictions.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Nenhum palpite salvo ainda.</p>
              ) : (
                [...predictions]
                  .sort((a, b) => {
                    const ma = matches.find(m => m.id === a.match_id);
                    const mb = matches.find(m => m.id === b.match_id);
                    return new Date(ma?.kickoff_at ?? 0).getTime() - new Date(mb?.kickoff_at ?? 0).getTime();
                  })
                  .map((pred) => {
                    const match = matches.find(m => m.id === pred.match_id);
                    if (!match) return null;
                    const home = (match as any).home_team_info;
                    const away = (match as any).away_team_info;
                    const finished = match.is_finished;
                    const correct = finished && match.home_score !== null && (() => {
                       const pts = pred.points ?? 0;
                       if (pts === 0) return "erro";
                       const exactScore = pred.predicted_home === match.home_score && pred.predicted_away === match.away_score;
                       if (exactScore && pts >= 6) return "cravada";
                       return "acerto";
                     })();
                    return (
                      <div key={pred.id} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                        correct === "cravada" ? "border-[#00ffb2]/40 bg-[#00ffb2]/5" :
                        correct === "acerto" ? "border-yellow-500/30 bg-yellow-500/5" :
                        correct === "erro" ? "border-red-500/20 bg-red-500/5" :
                        "border-[#ffffff10] bg-[#081116]"
                      }`}>
                        <div className="flex items-center gap-3 min-w-0">
                          {home?.flag_url && <img src={home.flag_url} alt="" className="w-6 h-4 rounded object-cover" />}
                          <span className="text-xs text-gray-400 truncate">{home?.name ?? "?"}</span>
                        </div>
                        <div className="flex items-center gap-2 mx-3 flex-none">
                          <span className={`font-bold text-sm ${correct === "cravada" ? "text-[#00ffb2]" : "text-white"}`}>
                            {pred.predicted_home} x {pred.predicted_away}
                          </span>
                          {finished && (
                            <span className="text-xs text-gray-500">
                              ({match.home_score} x {match.away_score})
                            </span>
                          )}
                          {correct === "cravada" && <span className="text-xs text-[#00ffb2]">💎 +{pred.points}pts</span>}
                          {correct === "acerto" && <span className="text-xs text-yellow-400">✓ +{pred.points}pts</span>}
                          {correct === "erro" && <span className="text-xs text-red-400">✗ 0pts</span>}
                        </div>
                        <div className="flex items-center gap-3 min-w-0 justify-end">
                          <span className="text-xs text-gray-400 truncate">{away?.name ?? "?"}</span>
                          {away?.flag_url && <img src={away.flag_url} alt="" className="w-6 h-4 rounded object-cover" />}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </div>

        {/* PRÓXIMOS JOGOS COM PALPITE INLINE */}
        <div className="rounded-3xl border border-[#00ffb233] bg-[#050816] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#00ffb2]">Próximos jogos</h2>
            <span className="text-xs text-gray-400 border border-[#00ffb233] px-3 py-1 rounded-full">
              Próximas 24h — palpites abertos
            </span>
          </div>

          {upcomingMatches.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>Nenhum jogo aberto para palpites nas próximas 24h.</p>
              <Link href="/fase-de-grupos" className="mt-3 inline-block text-[#00ffb2] text-sm underline">
                Ver todos os jogos →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingMatches.map((match) => {
                const home = match.home_team_info as any;
                const away = match.away_team_info as any;
                const prediction = predictions.find((p) => p.match_id === match.id);
                const locked = isLocked(match.kickoff_at);
                const [homeScore, awayScore] = scores[match.id] ?? [prediction?.predicted_home ?? 0, prediction?.predicted_away ?? 0];
                const isSaving = saving[match.id];
                const justSaved = saved[match.id];

                return (
                  <div key={match.id} className={`rounded-2xl border ${locked ? "border-red-900/40 bg-[#0a0505]" : "border-[#00ffb222] bg-[#081116]"} p-4 flex flex-col gap-3`}>

                    {/* Fase + horário */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="uppercase tracking-wider text-[#00ffb2] font-semibold">
                        {match.phase === "friendly" ? "Amistoso" : match.group_name ? `Grupo ${match.group_name}` : match.phase}
                      </span>
                      <span className="text-gray-400">{formatBrazilTime(match.kickoff_at, "full")}</span>
                    </div>

                    {/* Times + inputs de palpite */}
                    <div className="flex items-center gap-2">

                      {/* Mandante */}
                      <div className="flex flex-col items-center gap-1 w-16 text-center">
                        {home?.flag_url ? (
                          <Image src={home.flag_url} alt={home.name} width={40} height={28}
                            className="rounded object-cover border border-[#00ffb222]" />
                        ) : (
                          <div className="w-10 h-7 rounded bg-[#111827]" />
                        )}
                        <p className="text-[10px] font-semibold text-white truncate w-full">
                          {home?.fifa_code || home?.name || "Casa"}
                        </p>
                      </div>

                      {/* Inputs de placar */}
                      <div className="flex-1 flex items-center justify-center gap-2">
                        <input
                          type="number" min={0}
                          value={scores[match.id]?.[0] ?? prediction?.predicted_home ?? 0}
                          disabled={locked}
                          onChange={(e) => setScores((s) => ({ ...s, [match.id]: [Number(e.target.value), s[match.id]?.[1] ?? 0] }))}
                          className="w-10 h-10 bg-[#081120] border border-[#00ffb244] rounded-lg text-center text-white font-bold text-lg disabled:opacity-40"
                        />
                        <span className="text-white font-bold">x</span>
                        <input
                          type="number" min={0}
                          value={scores[match.id]?.[1] ?? prediction?.predicted_away ?? 0}
                          disabled={locked}
                          onChange={(e) => setScores((s) => ({ ...s, [match.id]: [s[match.id]?.[0] ?? 0, Number(e.target.value)] }))}
                          className="w-10 h-10 bg-[#081120] border border-[#00ffb244] rounded-lg text-center text-white font-bold text-lg disabled:opacity-40"
                        />
                      </div>

                      {/* Visitante */}
                      <div className="flex flex-col items-center gap-1 w-16 text-center">
                        {away?.flag_url ? (
                          <Image src={away.flag_url} alt={away.name} width={40} height={28}
                            className="rounded object-cover border border-[#00ffb222]" />
                        ) : (
                          <div className="w-10 h-7 rounded bg-[#111827]" />
                        )}
                        <p className="text-[10px] font-semibold text-white truncate w-full">
                          {away?.fifa_code || away?.name || "Fora"}
                        </p>
                      </div>

                    </div>

                    {/* Botão salvar ou status */}
                    {locked ? (
                      <div className="text-center text-xs text-red-400 font-semibold">
                        🔒 Palpites encerrados
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSave(match.id)}
                        disabled={isSaving}
                        className={`w-full py-2 rounded-xl text-sm font-bold transition ${
                          justSaved
                            ? "bg-[#00ffb2]/20 text-[#00ffb2] border border-[#00ffb2]/40"
                            : "bg-gradient-to-r from-[#00ffb2] to-[#24cfff] text-black hover:opacity-90"
                        } disabled:opacity-50`}
                      >
                        {isSaving ? "Salvando..." : justSaved ? "✓ Salvo!" : prediction ? "Atualizar Palpite" : "Confirmar Palpite"}
                      </button>
                    )}

                    {/* Estádio */}
                    {match.stadium && (
                      <p className="text-[10px] text-gray-500 text-center">{match.stadium}</p>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </section>
    </main>
  );
}
