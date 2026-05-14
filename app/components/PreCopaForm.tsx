import { useEffect, useState } from "react";
import type { PreCopaPrediction } from "@/app/types";

interface PreCopaFormProps {
  initialData?: PreCopaPrediction | null;
  onSave: (values: {
    champion_team: string;
    runner_up_team: string;
    golden_ball_player: string;
    top_scorer_player: string;
    top_scorer_goals: number;
    most_assists_player: string;
    most_assists_count: number;
    fair_play_team: string;
    revelation_player: string;
  }) => Promise<void>;
  isSaving: boolean;
}

export function PreCopaForm({ initialData, onSave, isSaving }: PreCopaFormProps) {
  const [championTeam, setChampionTeam] = useState("");
  const [runnerUp, setRunnerUp] = useState("");
  const [goldenBallPlayer, setGoldenBallPlayer] = useState("");
  const [topScorer, setTopScorer] = useState("");
  const [topScorerGoals, setTopScorerGoals] = useState(0);
  const [mostAssists, setMostAssists] = useState("");
  const [mostAssistsCount, setMostAssistsCount] = useState(0);
  const [fairPlayTeam, setFairPlayTeam] = useState("");
  const [revelationPlayer, setRevelationPlayer] = useState("");

  useEffect(() => {
    if (!initialData) return;

    setChampionTeam(() => initialData.champion_team);
    setRunnerUp(() => initialData.runner_up_team);
    setGoldenBallPlayer(() => initialData.golden_ball_player);
    setTopScorer(() => initialData.top_scorer_player);
    setTopScorerGoals(() => initialData.top_scorer_goals);
    setMostAssists(() => initialData.most_assists_player);
    setMostAssistsCount(() => initialData.most_assists_count);
    setFairPlayTeam(() => initialData.fair_play_team);
    setRevelationPlayer(() => initialData.revelation_player);
  }, [initialData]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSave({
      champion_team: championTeam.trim(),
      runner_up_team: runnerUp.trim(),
      golden_ball_player: goldenBallPlayer.trim(),
      top_scorer_player: topScorer.trim(),
      top_scorer_goals: topScorerGoals,
      most_assists_player: mostAssists.trim(),
      most_assists_count: mostAssistsCount,
      fair_play_team: fairPlayTeam.trim(),
      revelation_player: revelationPlayer.trim(),
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
          Melhor jogador
          <input
            value={goldenBallPlayer}
            onChange={(event) => setGoldenBallPlayer(event.target.value)}
            placeholder="Melhor jogador"
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none focus:border-[#00ffb2]"
            required
          />
        </label>
        <label className="block text-sm text-slate-200">
          Seleção surpresa
          <input
            value={mostAssists}
            onChange={(event) => setMostAssists(event.target.value)}
            placeholder="Seleção surpresa"
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none focus:border-[#00ffb2]"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-200">
          Seleção decepção
          <input
            value={fairPlayTeam}
            onChange={(event) => setFairPlayTeam(event.target.value)}
            placeholder="Seleção decepção"
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none focus:border-[#00ffb2]"
            required
          />
        </label>
        <label className="block text-sm text-slate-200">
          Revelação do torneio
          <input
            value={revelationPlayer}
            onChange={(event) => setRevelationPlayer(event.target.value)}
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
