"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { getPreCopaPrediction, savePreCopaPrediction, canEditPreCopaPrediction, fetchPreCopaLockDate } from "@/app/lib/preCopa";
import { formatMatchDate } from "@/app/lib/matchDate";
import { PreCopaForm } from "@/app/components/PreCopaForm";
import { Toast } from "@/app/components/Toast";
import type { PreCopaPrediction } from "@/app/types";

export default function PreCopaPage() {
  const { user, loading } = useAuth();
  const [initialData, setInitialData] = useState<PreCopaPrediction | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [lockDate, setLockDate] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const PRE_COPA_LOCK_DATE_FALLBACK = process.env.NEXT_PUBLIC_PRE_COPA_LOCK_DATE ?? "2026-06-01T00:00:00-03:00";
  const effectiveLockDate = lockDate ?? PRE_COPA_LOCK_DATE_FALLBACK;
  const preCopaLocked = !canEditPreCopaPrediction(effectiveLockDate);
  const lockDateText = formatMatchDate(effectiveLockDate);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoadingData(true);
      try {
        const [saved, lockDateResult] = await Promise.all([getPreCopaPrediction(user.id), fetchPreCopaLockDate()]);
        setInitialData(saved);
        setLockDate(lockDateResult);
      } catch (err) {
        console.error(err);
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
    } catch (err) {
      console.error(err);
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
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-[32px] border border-[#00ffb2]/20 bg-gradient-to-br from-[#081116]/90 to-[#06090f]/90 p-6 shadow-[0_35px_80px_rgba(0,255,178,0.12)] backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#00ffb2]">Palpites Pré-Copa</p>
              <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Bolão Oficial 2026</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">Registre suas previsões para campeão, artilheiro e destaques antes da Copa. Um visual dark com detalhes neon para melhorar a experiência em celular.</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-[#00ffb2] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#8bfcc7]"
            >
              <span>←</span>
              Voltar ao painel
            </Link>
          </div>
        </header>

        {loadingData ? (
          <div className="rounded-[32px] border border-[#00ffb2]/15 bg-[#081116]/90 p-6 shadow-[0_35px_80px_rgba(0,255,178,0.12)]">
            <div className="space-y-4">
              <div className="h-24 rounded-3xl bg-slate-900/80 animate-pulse" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-28 rounded-3xl bg-slate-900/80 animate-pulse" />
                <div className="h-28 rounded-3xl bg-slate-900/80 animate-pulse" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="h-28 rounded-3xl bg-slate-900/80 animate-pulse" />
                <div className="h-28 rounded-3xl bg-slate-900/80 animate-pulse" />
                <div className="h-28 rounded-3xl bg-slate-900/80 animate-pulse" />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[32px] border border-[#00ffb2]/15 bg-[#081116]/95 p-6 shadow-[0_35px_120px_rgba(0,255,178,0.1)]">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[28px] border border-[#00ffb2]/15 bg-[#050a11]/95 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.12)] transition hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00ffb2]/15 text-[#00ffb2] shadow-[0_0_24px_rgba(0,255,178,0.16)]">👤</span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-[#00ffb2]">Usuário</p>
                    <p className="mt-2 text-base font-semibold text-white">{user.name || user.full_name || user.email}</p>
                  </div>
                </div>
              </article>
              <article className="rounded-[28px] border border-[#00ffb2]/15 bg-[#050a11]/95 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.12)] transition hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00ffb2]/15 text-[#00ffb2] shadow-[0_0_24px_rgba(0,255,178,0.16)]">⏱️</span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-[#00ffb2]">Status</p>
                    <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${preCopaLocked ? "bg-rose-500/10 text-rose-300" : "bg-emerald-500/10 text-emerald-300"}`}>
                      {preCopaLocked ? "Encerrado" : "Aberto"}
                    </p>
                  </div>
                </div>
              </article>
              <article className="rounded-[28px] border border-[#00ffb2]/15 bg-[#050a11]/95 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.12)] transition hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00ffb2]/15 text-[#00ffb2] shadow-[0_0_24px_rgba(0,255,178,0.16)]">📅</span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-[#00ffb2]">Prazo</p>
                    <p className="mt-2 text-base font-semibold text-white">{lockDateText}</p>
                  </div>
                </div>
              </article>
              <article className="rounded-[28px] border border-[#00ffb2]/15 bg-[#050a11]/95 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.12)] transition hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00ffb2]/15 text-[#00ffb2] shadow-[0_0_24px_rgba(0,255,178,0.16)]">🕒</span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-[#00ffb2]">Atualização</p>
                    <p className="mt-2 text-base font-semibold text-white">{initialData?.updated_at ? new Date(initialData.updated_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }) : "Ainda não salvo"}</p>
                  </div>
                </div>
              </article>
            </div>

            <section className="mt-8 rounded-[28px] border border-[#00ffb2]/15 bg-[#050a11]/90 p-5 shadow-[inset_0_0_0_1px_rgba(0,255,178,0.08)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#00ffb2]">Meu Palpite Atual</p>
                  <p className="mt-2 text-sm text-slate-400">Todos os itens já salvos aparecem abaixo em cards separados.</p>
                </div>
                <div className="rounded-full bg-[#00ffb2]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#00ffb2]">Visual premium</div>
              </div>

              {preCopaLocked ? (
                <div className="mt-6 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-100 shadow-[0_8px_30px_rgba(220,38,38,0.15)]">
                  <p className="font-semibold">Palpites pré-copa encerrados</p>
                  <p className="mt-2 text-sm text-rose-200">As edições foram bloqueadas 5 minutos antes do primeiro jogo da Copa.</p>
                </div>
              ) : null}

              {initialData ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <article className="rounded-3xl border border-[#00ffb2]/10 bg-[#04070f]/95 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.14)]">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00ffb2]/15 text-[#00ffb2]">🏆</div>
                      <p className="text-sm font-semibold text-white">Campeão</p>
                    </div>
                    <p className="mt-4 text-lg font-bold text-white">{initialData.champion_team}</p>
                  </article>
                  <article className="rounded-3xl border border-[#00ffb2]/10 bg-[#04070f]/95 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.14)]">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00ffb2]/15 text-[#00ffb2]">🥈</div>
                      <p className="text-sm font-semibold text-white">Vice</p>
                    </div>
                    <p className="mt-4 text-lg font-bold text-white">{initialData.runner_up_team}</p>
                  </article>
                  <article className="rounded-3xl border border-[#00ffb2]/10 bg-[#04070f]/95 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.14)]">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00ffb2]/15 text-[#00ffb2]">⚽</div>
                      <p className="text-sm font-semibold text-white">Artilheiro</p>
                    </div>
                    <p className="mt-4 text-lg font-bold text-white">{initialData.top_scorer_player}</p>
                  </article>
                  <article className="rounded-3xl border border-[#00ffb2]/10 bg-[#04070f]/95 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.14)]">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00ffb2]/15 text-[#00ffb2]">🎯</div>
                      <p className="text-sm font-semibold text-white">Gols</p>
                    </div>
                    <p className="mt-4 text-lg font-bold text-white">{initialData.top_scorer_goals}</p>
                  </article>
                  <article className="rounded-3xl border border-[#00ffb2]/10 bg-[#04070f]/95 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.14)]">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00ffb2]/15 text-[#00ffb2]">🧤</div>
                      <p className="text-sm font-semibold text-white">Melhor goleiro</p>
                    </div>
                    <p className="mt-4 text-lg font-bold text-white">{initialData.best_goalkeeper_player}</p>
                  </article>
                  <article className="rounded-3xl border border-[#00ffb2]/10 bg-[#04070f]/95 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.14)]">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00ffb2]/15 text-[#00ffb2]">⭐</div>
                      <p className="text-sm font-semibold text-white">Melhor jogador</p>
                    </div>
                    <p className="mt-4 text-lg font-bold text-white">{initialData.best_player}</p>
                  </article>
                  <article className="sm:col-span-2 rounded-3xl border border-[#00ffb2]/10 bg-[#04070f]/95 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.14)]">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00ffb2]/15 text-[#00ffb2]">🔥</div>
                      <p className="text-sm font-semibold text-white">Revelação do torneio</p>
                    </div>
                    <p className="mt-4 text-lg font-bold text-white">{initialData.tournament_revelation}</p>
                  </article>
                </div>
              ) : (
                <p className="mt-4 text-slate-400">Nenhum palpite Pré-Copa salvo ainda.</p>
              )}
            </section>

            <div className="mt-8">
              <PreCopaForm key={initialData?.id ?? "new"} initialData={initialData} onSave={handleSave} isSaving={isSaving} disabled={preCopaLocked} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
