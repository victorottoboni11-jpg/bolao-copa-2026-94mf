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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-200">
          Campeão
          <input
            value={championTeam}
            onChange={(event) => setChampionTeam(event.target.value)}
            placeholder="Seleção campeã"
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none focus:border-[#00ffb2]"
            required
          />
        </label>
        <label className="block text-sm text-slate-200">
          Vice
          <input
            value={runnerUp}
            onChange={(event) => setRunnerUp(event.target.value)}
            placeholder="Seleção vice"
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none focus:border-[#00ffb2]"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-200">
          Artilheiro
          <input
            value={topScorer}
            onChange={(event) => setTopScorer(event.target.value)}
            placeholder="Jogador artilheiro"
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none focus:border-[#00ffb2]"
            required
          />
        </label>
        <label className="block text-sm text-slate-200">
          Gols do artilheiro
          <input
            type="number"
            min={0}
            value={topScorerGoals}
            onChange={(event) => setTopScorerGoals(Number(event.target.value))}
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none focus:border-[#00ffb2]"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-200">
          Melhor goleiro
          <input
            value={bestGoalkeeper}
            onChange={(event) => setBestGoalkeeper(event.target.value)}
            placeholder="Melhor goleiro"
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none focus:border-[#00ffb2]"
            required
          />
        </label>
        <label className="block text-sm text-slate-200">
          Melhor jogador
          <input
            value={bestPlayer}
            onChange={(event) => setBestPlayer(event.target.value)}
            placeholder="Melhor jogador"
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none focus:border-[#00ffb2]"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-200">
          Revelação do torneio
          <input
            value={tournamentRevelation}
            onChange={(event) => setTournamentRevelation(event.target.value)}
            placeholder="Jogador revelação"
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none focus:border-[#00ffb2]"
            required
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-2xl bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:shadow-lg hover:shadow-[#00ffb2]/30 disabled:opacity-70"
      >
        {isSaving ? "Salvando..." : "Salvar Palpite Pré-Copa"}
      </button>
    </form>
  );
}
