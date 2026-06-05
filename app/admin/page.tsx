"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/lib/auth";
import { useIsAdmin } from "@/app/lib/useIsAdmin";
import { AdminFilters } from "@/app/components/AdminFilters";
import { AdminMatchCard } from "@/app/components/AdminMatchCard";
import AdminPreCopaPanel from "@/app/components/AdminPreCopaPanel";
import { Toast } from "@/app/components/Toast";
import { getPredictionsOpenSetting, setPredictionsOpenSetting, updateMatchScore } from "@/app/lib/matches";
import { fetchAdminMatches, finalizeMatchResult, reopenMatchResult, type AdminMatch } from "@/app/lib/admin";
import { recalculateRankings } from "@/app/lib/rankings";
import { updateKnockoutBracket } from "@/app/lib/bracket";
import { supabase } from "@/app/lib/supabase";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingData, setLoadingData] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [predictionsOpen, setPredictionsOpen] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [generatingBracket, setGeneratingBracket] = useState(false);

  const finishedCount = useMemo(
    () => matches.filter((item) => item.is_finished || item.status === "finished").length,
    [matches]
  );

  const pendingCount = useMemo(() => matches.length - finishedCount, [matches.length, finishedCount]);

  useEffect(() => {
    if (!user || !isAdmin) return;

    const loadData = async () => {
      setLoadingData(true);
      try {
        const [adminMatches, open] = await Promise.all([
          fetchAdminMatches(),
          getPredictionsOpenSetting(),
        ]);
        setMatches(adminMatches);
        setPredictionsOpen(open);
      } catch (error) {
        console.error(error);
        setToast({ type: "error", text: "Falha ao carregar dados administrativos." });
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user, isAdmin, phaseFilter, statusFilter]);

  const showToast = (type: "success" | "error" | "info", text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 5000);
  };

  const refreshMatches = async () => {
    setLoadingData(true);
    try {
      const adminMatches = await fetchAdminMatches();
      setMatches(adminMatches);
    } catch (error) {
      console.error(error);
      showToast("error", "Não foi possível atualizar a lista de partidas.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleTogglePredictions = async () => {
    setProcessing(true);
    try {
      const nextState = !predictionsOpen;
      const success = await setPredictionsOpenSetting(nextState);
      if (success) {
        setPredictionsOpen(nextState);
        showToast("success", `Palpites ${nextState ? "abertos" : "fechados"} com sucesso.`);
      } else {
        showToast("error", "Não foi possível alterar o status dos palpites.");
      }
    } catch (error) {
      console.error(error);
      showToast("error", "Erro ao atualizar status de palpites.");
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveScore = async (matchId: string, homeScore: number, awayScore: number, winner?: string, penalties?: boolean) => {
    setProcessing(true);
    try {
      const success = await updateMatchScore(matchId, homeScore, awayScore);
      if (!success) {
        showToast("error", "Falha ao salvar o placar.");
        return;
      }

      setMatches((current) =>
        current.map((match) =>
          match.id === matchId ? { ...match, home_score: homeScore, away_score: awayScore } : match
        )
      );
      showToast("success", "Placar salvo com sucesso.");
    } catch (error) {
      console.error(error);
      showToast("error", "Erro ao salvar o placar.");
    } finally {
      setProcessing(false);
    }
  };

  const handleFinalizeMatch = async (matchId: string, homeScore: number, awayScore: number, winner?: string, penalties?: boolean) => {
    setProcessing(true);
    try {
      const result = await finalizeMatchResult(matchId, homeScore, awayScore, winner, penalties);
      if (!result?.success) {
        showToast("error", result?.error || "Não foi possível finalizar a partida.");
        return;
      }

      setMatches((current) =>
        current.map((match) =>
          match.id === matchId ? { ...match, home_score: homeScore, away_score: awayScore, is_finished: true, status: "finished" } : match
        )
      );
      showToast("success", "Partida finalizada e rankings recalculados.");
    } catch (error) {
      console.error(error);
      showToast("error", error instanceof Error ? error.message : "Erro ao finalizar a partida.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReopenMatch = async (matchId: string) => {
    setProcessing(true);
    try {
      const result = await reopenMatchResult(matchId);
      if (!result?.success) {
        showToast("error", result?.error || "Não foi possível reabrir a partida.");
        return;
      }

      setMatches((current) =>
        current.map((match) =>
          match.id === matchId ? { ...match, is_finished: false, status: "pending" } : match
        )
      );
      showToast("success", "Partida reaberta e pontos reinicializados.");
    } catch (error) {
      console.error(error);
      showToast("error", error instanceof Error ? error.message : "Erro ao reabrir a partida.");
    } finally {
      setProcessing(false);
    }
  };

  const handleRecalculateRanking = async () => {
    setProcessing(true);
    try {
      await recalculateRankings();
      showToast("success", "Ranking recalculado com sucesso.");
    } catch (error) {
      console.error(error);
      showToast("error", "Erro ao recalcular o ranking.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !user) {
    const handleGenerateBracket = async () => {
    setGeneratingBracket(true);
    try {
      const { getServerSupabase } = await import("@/app/lib/serverSupabase").catch(() => ({ getServerSupabase: null }));
      const { updated, errors } = await updateKnockoutBracket(supabase);
      if (errors.length > 0) {
        setToast({ type: "error", text: `Erros: ${errors.join(", ")}` });
      } else {
        setToast({ type: "success", text: `Chaveamento gerado! ${updated} jogos atualizados.` });
        await refreshMatches();
      }
    } catch (err) {
      setToast({ type: "error", text: "Erro ao gerar chaveamento" });
    } finally {
      setGeneratingBracket(false);
      window.setTimeout(() => setToast(null), 4000);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-[#04070f] px-4 py-8 text-white">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full border-4 border-[#00ffb2]/30 border-t-[#00ffb2] animate-spin mx-auto"></div>
          <p className="text-[#00b2ff] font-semibold">Validando acesso…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    const handleGenerateBracket = async () => {
    setGeneratingBracket(true);
    try {
      const { getServerSupabase } = await import("@/app/lib/serverSupabase").catch(() => ({ getServerSupabase: null }));
      const { updated, errors } = await updateKnockoutBracket(supabase);
      if (errors.length > 0) {
        setToast({ type: "error", text: `Erros: ${errors.join(", ")}` });
      } else {
        setToast({ type: "success", text: `Chaveamento gerado! ${updated} jogos atualizados.` });
        await refreshMatches();
      }
    } catch (err) {
      setToast({ type: "error", text: "Erro ao gerar chaveamento" });
    } finally {
      setGeneratingBracket(false);
      window.setTimeout(() => setToast(null), 4000);
    }
  };

  return (
      <main className="min-h-screen bg-[#04070f] px-4 py-8 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-[#00ffb2]/20 bg-slate-950/90 p-10 text-center">
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="mt-4 text-slate-400">Esta área é exclusiva para administradores.</p>
          <Link href="/" className="mt-6 inline-flex rounded-2xl bg-[#00ffb2] px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-[#8bfcc7]">
            Voltar para o painel
          </Link>
        </div>
      </main>
    );
  }

  const handleGenerateBracket = async () => {
    setGeneratingBracket(true);
    try {
      const { getServerSupabase } = await import("@/app/lib/serverSupabase").catch(() => ({ getServerSupabase: null }));
      const { updated, errors } = await updateKnockoutBracket(supabase);
      if (errors.length > 0) {
        setToast({ type: "error", text: `Erros: ${errors.join(", ")}` });
      } else {
        setToast({ type: "success", text: `Chaveamento gerado! ${updated} jogos atualizados.` });
        await refreshMatches();
      }
    } catch (err) {
      setToast({ type: "error", text: "Erro ao gerar chaveamento" });
    } finally {
      setGeneratingBracket(false);
      window.setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <main className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(0,255,178,0.14),_transparent_28%),_linear-gradient(180deg,#04070f_0%,#070b16_100%)] px-4 py-8 text-white">
      {toast ? <Toast type={toast.type} message={toast.text} /> : null}
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-2xl border border-[#00ffb2]/20 bg-gradient-to-br from-[#081116] to-[#070b16] p-6 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#00ffb2]">Administração</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Painel de Controle</h1>
              <p className="mt-1 text-sm text-gray-400">Gerencie partidas oficiais, resultados pré-copa e recompute rankings.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/" className="rounded-2xl border border-[#00ffb2]/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10">
                Voltar ao início
              </Link>
              <Link href="/pre-copa" className="rounded-2xl bg-[#00b2ff] px-4 py-2 text-sm font-semibold text-black hover:bg-[#8bc8ff]">
                Painel Pré-Copa
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-[#00ffb2]/20 bg-slate-950/90 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Ações rápidas</h2>
                  <p className="mt-1 text-sm text-slate-400">Use os controles abaixo para administrar o bolão.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleTogglePredictions}
                    disabled={processing}
                    className="rounded-2xl border border-[#00ffb2]/20 bg-[#081116] px-4 py-3 text-sm text-[#00ffb2] hover:bg-[#0c1621] disabled:opacity-50"
                  >
                    {predictionsOpen ? "Fechar palpites" : "Abrir palpites"}
                  </button>
                  <button
                    type="button"
                    onClick={handleRecalculateRanking}
                    disabled={processing}
                    className="rounded-2xl border border-[#00ffb2]/20 bg-[#04070f] px-4 py-3 text-sm text-[#00ffb2] hover:bg-[#0b1a25] disabled:opacity-50"
                  >
                    Recalcular ranking
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateBracket}
                    disabled={generatingBracket || processing}
                    className="rounded-2xl border border-[#00b2ff]/40 bg-[#04070f] px-4 py-3 text-sm text-[#00b2ff] hover:bg-[#0b1a25] disabled:opacity-50"
                  >
                    {generatingBracket ? "Gerando..." : "⚽ Gerar Chaveamento"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#00ffb2]/20 bg-slate-950/90 p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#00ffb2]">Filtros</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">Filtrar partidas</h3>
                </div>
              </div>

              <AdminFilters
                phase={phaseFilter}
                status={statusFilter}
                onPhaseChange={setPhaseFilter}
                onStatusChange={setStatusFilter}
                onRefresh={refreshMatches}
                isLoading={loadingData}
              />
            </div>

            <div className="rounded-3xl border border-[#00ffb2]/20 bg-slate-950/90 p-6">
              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-[#081116] p-4">
                  <p className="text-sm text-slate-400">Partidas carregadas</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{matches.length}</p>
                </div>
                <div className="rounded-3xl bg-[#081116] p-4">
                  <p className="text-sm text-slate-400">Finalizadas</p>
                  <p className="mt-3 text-3xl font-semibold text-emerald-400">{finishedCount}</p>
                </div>
                <div className="rounded-3xl bg-[#081116] p-4">
                  <p className="text-sm text-slate-400">Pendentes</p>
                  <p className="mt-3 text-3xl font-semibold text-orange-400">{pendingCount}</p>
                </div>
              </div>

              {loadingData ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-[#0b1320] p-8 text-center text-slate-400">Carregando partidas...</div>
              ) : matches.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-[#0b1320] p-8 text-center text-slate-400">Nenhuma partida encontrada para os filtros selecionados.</div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <AdminMatchCard
                      key={match.id}
                      match={match}
                      onSaveScore={handleSaveScore}
                      onFinalizeMatch={handleFinalizeMatch}
                      onReopenMatch={handleReopenMatch}
                      isProcessing={processing}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-[#00ffb2]/20 bg-slate-950/90 p-6">
              <h3 className="text-lg font-semibold text-[#00ffb2]">Painel Pré-Copa</h3>
              <p className="mt-2 text-sm text-slate-400">Atualize resultados oficiais e recalcule pontos de Pre-Copa.</p>
            </div>

            <AdminPreCopaPanel />

            <div className="rounded-3xl border border-[#00ffb2]/20 bg-slate-950/90 p-6">
              <h3 className="text-lg font-semibold text-white">Status de administração</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>
                  <span className="font-semibold text-white">Palpites:</span> {predictionsOpen ? "Aberto" : "Fechado"}
                </p>
                <p>
                  <span className="font-semibold text-white">Última atualização:</span> {new Date().toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

