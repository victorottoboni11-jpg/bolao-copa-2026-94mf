import { useState, type FormEvent } from "react";
import type { PreCopaPrediction } from "@/app/types";

interface PreCopaFormProps {
  initialData?: PreCopaPrediction | null;
  onSave: (values: {
    champion_team: string;
    runner_up_team: string;
    top_scorer_player: string;
    top_scorer_goals: number;
    best_goalkeeper_player: string;
    best_player: string;
    tournament_revelation: string;
  }) => Promise<void>;
  isSaving: boolean;
  disabled?: boolean;
}

export function PreCopaForm({ initialData, onSave, isSaving, disabled = false }: PreCopaFormProps) {
  const [championTeam, setChampionTeam] = useState(initialData?.champion_team ?? "");
  const [runnerUp, setRunnerUp] = useState(initialData?.runner_up_team ?? "");
  const [topScorer, setTopScorer] = useState(initialData?.top_scorer_player ?? "");
  const [topScorerGoals, setTopScorerGoals] = useState(initialData?.top_scorer_goals ?? 0);
  const [bestGoalkeeper, setBestGoalkeeper] = useState(initialData?.best_goalkeeper_player ?? "");
  const [bestPlayer, setBestPlayer] = useState(initialData?.best_player ?? "");
  const [tournamentRevelation, setTournamentRevelation] = useState(initialData?.tournament_revelation ?? "");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSave({
      champion_team: championTeam.trim(),
      runner_up_team: runnerUp.trim(),
      top_scorer_player: topScorer.trim(),
      top_scorer_goals: topScorerGoals,
      best_goalkeeper_player: bestGoalkeeper.trim(),
      best_player: bestPlayer.trim(),
      tournament_revelation: tournamentRevelation.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-28 sm:pb-0">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="group rounded-[28px] border border-[#00ffb2]/15 bg-[#04070f]/95 p-4 transition hover:border-[#00ffb2]/30">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00ffb2]/10 text-[#00ffb2]">🏆</span>
            <div>
              <p className="text-sm font-semibold text-white">Campeão</p>
              <p className="text-xs text-slate-400">Seleção campeã</p>
            </div>
          </div>
          <input
            value={championTeam}
            onChange={(event) => setChampionTeam(event.target.value)}
            placeholder="Seleção campeã"
            disabled={disabled}
            className="mt-4 w-full rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-[#00ffb2] disabled:cursor-not-allowed disabled:opacity-50"
            required
          />
        </label>
        <label className="group rounded-[28px] border border-[#00ffb2]/15 bg-[#04070f]/95 p-4 transition hover:border-[#00ffb2]/30">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00ffb2]/10 text-[#00ffb2]">🥈</span>
            <div>
              <p className="text-sm font-semibold text-white">Vice-campeão</p>
              <p className="text-xs text-slate-400">Seleção vice</p>
            </div>
          </div>
          <input
            value={runnerUp}
            onChange={(event) => setRunnerUp(event.target.value)}
            placeholder="Seleção vice"
            disabled={disabled}
            className="mt-4 w-full rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-[#00ffb2] disabled:cursor-not-allowed disabled:opacity-50"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="group rounded-[28px] border border-[#00ffb2]/15 bg-[#04070f]/95 p-4 transition hover:border-[#00ffb2]/30">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00ffb2]/10 text-[#00ffb2]">⚽</span>
            <div>
              <p className="text-sm font-semibold text-white">Artilheiro</p>
              <p className="text-xs text-slate-400">Jogador artilheiro</p>
            </div>
          </div>
          <input
            value={topScorer}
            onChange={(event) => setTopScorer(event.target.value)}
            placeholder="Jogador artilheiro"
            disabled={disabled}
            className="mt-4 w-full rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-[#00ffb2] disabled:cursor-not-allowed disabled:opacity-50"
            required
          />
        </label>
        <label className="group rounded-[28px] border border-[#00ffb2]/15 bg-[#04070f]/95 p-4 transition hover:border-[#00ffb2]/30">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00ffb2]/10 text-[#00ffb2]">🎯</span>
            <div>
              <p className="text-sm font-semibold text-white">Gols do artilheiro</p>
              <p className="text-xs text-slate-400">Previsão de gols</p>
            </div>
          </div>
          <input
            type="number"
            min={0}
            value={topScorerGoals}
            onChange={(event) => setTopScorerGoals(Number(event.target.value))}
            disabled={disabled}
            className="mt-4 w-full rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-[#00ffb2] disabled:cursor-not-allowed disabled:opacity-50"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="group rounded-[28px] border border-[#00ffb2]/15 bg-[#04070f]/95 p-4 transition hover:border-[#00ffb2]/30">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00ffb2]/10 text-[#00ffb2]">🧤</span>
            <div>
              <p className="text-sm font-semibold text-white">Melhor goleiro</p>
              <p className="text-xs text-slate-400">Revelação na defesa</p>
            </div>
          </div>
          <input
            value={bestGoalkeeper}
            onChange={(event) => setBestGoalkeeper(event.target.value)}
            placeholder="Melhor goleiro"
            disabled={disabled}
            className="mt-4 w-full rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-[#00ffb2] disabled:cursor-not-allowed disabled:opacity-50"
            required
          />
        </label>
        <label className="group rounded-[28px] border border-[#00ffb2]/15 bg-[#04070f]/95 p-4 transition hover:border-[#00ffb2]/30">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00ffb2]/10 text-[#00ffb2]">⭐</span>
            <div>
              <p className="text-sm font-semibold text-white">Melhor jogador</p>
              <p className="text-xs text-slate-400">Destaque do torneio</p>
            </div>
          </div>
          <input
            value={bestPlayer}
            onChange={(event) => setBestPlayer(event.target.value)}
            placeholder="Melhor jogador"
            disabled={disabled}
            className="mt-4 w-full rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-[#00ffb2] disabled:cursor-not-allowed disabled:opacity-50"
            required
          />
        </label>
      </div>

      <label className="group rounded-[28px] border border-[#00ffb2]/15 bg-[#04070f]/95 p-4 transition hover:border-[#00ffb2]/30">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00ffb2]/10 text-[#00ffb2]">🔥</span>
          <div>
            <p className="text-sm font-semibold text-white">Revelação do torneio</p>
            <p className="text-xs text-slate-400">Jogador surpresa</p>
          </div>
        </div>
        <input
          value={tournamentRevelation}
          onChange={(event) => setTournamentRevelation(event.target.value)}
          placeholder="Revelação do torneio"
          disabled={disabled}
          className="mt-4 w-full rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-[#00ffb2] disabled:cursor-not-allowed disabled:opacity-50"
          required
        />
      </label>

      <div className="hidden sm:block">
        <button
          type="submit"
          disabled={isSaving || disabled}
          className="w-full rounded-3xl bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] px-5 py-4 text-sm font-semibold text-slate-950 transition hover:shadow-xl hover:shadow-[#00ffb2]/30 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? "Salvando..." : disabled ? "Palpites encerrados" : "Salvar Palpite Pré-Copa"}
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 sm:hidden">
        <div className="mx-4 flex items-center justify-center rounded-t-[28px] border border-[#00ffb2]/15 bg-[#04070f]/95 px-4 py-4 shadow-[0_-20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <button
            type="submit"
            disabled={isSaving || disabled}
            className="w-full max-w-2xl rounded-3xl bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] px-5 py-4 text-sm font-semibold text-slate-950 transition hover:shadow-xl hover:shadow-[#00ffb2]/30 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? "Salvando..." : disabled ? "Encerrado" : "Salvar agora"}
          </button>
        </div>
      </div>
    </form>
  );
}
