"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { getPreCopaPrediction, savePreCopaPrediction, canEditPreCopaPrediction } from "@/app/lib/preCopa";
import { PreCopaForm } from "@/app/components/PreCopaForm";
import { Toast } from "@/app/components/Toast";
import type { PreCopaPrediction } from "@/app/types";

export default function PreCopaPage() {
  const { user, loading } = useAuth();
  const [initialData, setInitialData] = useState<PreCopaPrediction | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const PRE_COPA_LOCK_DATE = process.env.NEXT_PUBLIC_PRE_COPA_LOCK_DATE ?? "2026-06-01T00:00:00-03:00";
  const preCopaLocked = !canEditPreCopaPrediction(PRE_COPA_LOCK_DATE);
  const lockDateText = new Date(PRE_COPA_LOCK_DATE).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoadingData(true);
      try {
        const saved = await getPreCopaPrediction(user.id);
        setInitialData(saved);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  const handleSave = async (values: Parameters<typeof savePreCopaPrediction>[1]) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const saved = await savePreCopaPrediction(user.id, values);
      if (saved) {
        setInitialData(saved);
        setToast({ type: "success", message: "Palpite Pré-Copa salvo com sucesso." });
      } else {
        setToast({ type: "error", message: "Erro ao salvar o palpite Pré-Copa." });
      }
    } catch (error) {
      setToast({ type: "error", message: "Falha ao salvar o palpite Pré-Copa." });
    } finally {
      setIsSaving(false);
      window.setTimeout(() => setToast(null), 4500);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#04070f] flex items-center justify-center px-4 py-8 text-white">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#00ffb2]/30 border-t-[#00ffb2]"></div>
          <p className="text-[#00b2ff] font-semibold">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(0,255,178,0.14),_transparent_28%),_linear-gradient(180deg,#04070f_0%,#070b16_100%)] px-4 py-8 text-white">
      {toast ? <Toast type={toast.type} message={toast.message} /> : null}
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="rounded-3xl border border-[#00ffb2]/20 bg-gradient-to-br from-[#081116] to-[#070b16] p-6 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#00ffb2]">Palpites Pré-Copa</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Bolão Oficial 2026</h1>
              <p className="mt-1 text-sm text-gray-400">Registre suas previsões para campeão, artilheiro e destaques antes da Copa.</p>
            </div>
            <Link
              href="/"
              className="rounded-2xl bg-[#00ffb2] px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-[#8bfcc7]"
            >
              Voltar ao painel
            </Link>
          </div>
        </header>

        {loadingData ? (
          <div className="rounded-3xl border border-[#00ffb2]/20 bg-slate-950/90 p-10 text-center text-[#00b2ff]">
            <p>Carregando seus palpites Pré-Copa...</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-[#00ffb2]/20 bg-slate-950/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[#00ffb2]">Usuário</p>
                <p className="mt-2 text-lg font-semibold text-white">{user.name || user.full_name || user.email}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[#00ffb2]">Status</p>
                <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${preCopaLocked ? "bg-rose-500/10 text-rose-300" : "bg-emerald-500/10 text-emerald-300"}`}>
                  {preCopaLocked ? "Encerrado" : "Aberto"}
                </p>
              </div>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[#00ffb2]">Última atualização</p>
                <p className="mt-2 text-white">{initialData?.updated_at ? new Date(initialData.updated_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }) : "Ainda não salvo"}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[#00ffb2]">Prazo</p>
                <p className="mt-2 text-white">{lockDateText}</p>
              </div>
            </div>

            <div className="mb-6 rounded-3xl border border-[#00ffb2]/20 bg-[#081116] p-4">
              <p className="text-sm uppercase tracking-[0.3em] text-[#00ffb2]">Meu Palpite Atual</p>
              {initialData ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#04070f] p-4">
                    <p className="text-xs uppercase text-slate-400">Campeão</p>
                    <p className="mt-2 text-lg font-semibold text-white">{initialData.champion_team}</p>
                  </div>
                  <div className="rounded-2xl bg-[#04070f] p-4">
                    <p className="text-xs uppercase text-slate-400">Vice</p>
                    <p className="mt-2 text-lg font-semibold text-white">{initialData.runner_up_team}</p>
                  </div>
                  <div className="rounded-2xl bg-[#04070f] p-4">
                    <p className="text-xs uppercase text-slate-400">Artilheiro</p>
                    <p className="mt-2 text-lg font-semibold text-white">{initialData.top_scorer_player}</p>
                  </div>
                  <div className="rounded-2xl bg-[#04070f] p-4">
                    <p className="text-xs uppercase text-slate-400">Goleiro do torneio</p>
                    <p className="mt-2 text-lg font-semibold text-white">{initialData.golden_ball_player}</p>
                  </div>
                  <div className="rounded-2xl bg-[#04070f] p-4">
                    <p className="text-xs uppercase text-slate-400">Seleção surpresa</p>
                    <p className="mt-2 text-lg font-semibold text-white">{initialData.most_assists_player}</p>
                  </div>
                  <div className="rounded-2xl bg-[#04070f] p-4">
                    <p className="text-xs uppercase text-slate-400">Seleção decepção</p>
                    <p className="mt-2 text-lg font-semibold text-white">{initialData.fair_play_team}</p>
                  </div>
                  <div className="rounded-2xl bg-[#04070f] p-4 sm:col-span-2">
                    <p className="text-xs uppercase text-slate-400">Revelação do torneio</p>
                    <p className="mt-2 text-lg font-semibold text-white">{initialData.revelation_player}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-slate-400">Nenhum palpite Pré-Copa salvo ainda.</p>
              )}
            </div>

            <PreCopaForm initialData={initialData} onSave={handleSave} isSaving={isSaving} disabled={preCopaLocked} />
          </div>
        )}
      </div>
    </main>
  );
}
