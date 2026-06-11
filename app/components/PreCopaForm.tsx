import { useEffect, useState, type FormEvent } from "react";
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

// Mapear campos do banco para o formulário
function mapFromDB(data?: PreCopaPrediction | null) {
  return {
    champion_team: data?.champion_team ?? "",
    runner_up_team: data?.runner_up_team ?? "",
    top_scorer: data?.top_scorer_player ?? data?.top_scorer ?? "",
    top_scorer_goals: data?.top_scorer_goals ?? data?.predicted_total_goals ?? 0,
    best_goalkeeper: data?.best_goalkeeper_player ?? data?.best_goalkeeper ?? "",
    best_player: data?.best_player ?? "",
    revelation: data?.tournament_revelation ?? data?.best_young ?? "",
  };
}

export function PreCopaForm({ initialData, onSave, isSaving, disabled = false }: PreCopaFormProps) {
  const mapped = mapFromDB(initialData);

  const [championTeam, setChampionTeam] = useState(mapped.champion_team);
  const [runnerUp, setRunnerUp] = useState(mapped.runner_up_team);
  const [topScorer, setTopScorer] = useState(mapped.top_scorer);
  const [topScorerGoals, setTopScorerGoals] = useState(mapped.top_scorer_goals);
  const [bestGoalkeeper, setBestGoalkeeper] = useState(mapped.best_goalkeeper);
  const [bestPlayer, setBestPlayer] = useState(mapped.best_player);
  const [revelation, setRevelation] = useState(mapped.revelation);

  // Atualizar formulário quando initialData mudar (após salvar ou carregar)
  useEffect(() => {
    const m = mapFromDB(initialData);
    setChampionTeam(m.champion_team);
    setRunnerUp(m.runner_up_team);
    setTopScorer(m.top_scorer);
    setTopScorerGoals(m.top_scorer_goals);
    setBestGoalkeeper(m.best_goalkeeper);
    setBestPlayer(m.best_player);
    setRevelation(m.revelation);
  }, [initialData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave({
      champion_team: championTeam.trim(),
      runner_up_team: runnerUp.trim(),
      top_scorer_player: topScorer.trim(),
      top_scorer_goals: topScorerGoals,
      best_goalkeeper_player: bestGoalkeeper.trim(),
      best_player: bestPlayer.trim(),
      tournament_revelation: revelation.trim(),
    });
  };

  const inputClass = "mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none focus:border-[#00ffb2] disabled:opacity-50";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Resumo do palpite atual */}
      {initialData && (
        <div className="rounded-xl border border-[#00ffb2]/20 bg-[#081116] p-4 mb-2">
          <p className="text-xs text-[#00ffb2] font-semibold uppercase tracking-wider mb-3">Último palpite salvo</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
            <span><span className="text-gray-500">Campeão:</span> {initialData.champion_team || "—"}</span>
            <span><span className="text-gray-500">Vice:</span> {initialData.runner_up_team || "—"}</span>
            <span><span className="text-gray-500">Artilheiro:</span> {initialData.top_scorer_player || initialData.top_scorer || "—"}</span>
            <span><span className="text-gray-500">Gols:</span> {initialData.top_scorer_goals ?? initialData.predicted_total_goals ?? "—"}</span>
            <span><span className="text-gray-500">Melhor goleiro:</span> {initialData.best_goalkeeper_player || initialData.best_goalkeeper || "—"}</span>
            <span><span className="text-gray-500">Melhor jogador:</span> {initialData.best_player || "—"}</span>
            <span><span className="text-gray-500">Revelação:</span> {initialData.tournament_revelation || initialData.best_young || "—"}</span>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-200">
          Campeão
          <input value={championTeam} onChange={e => setChampionTeam(e.target.value)}
            placeholder="Seleção campeã" className={inputClass} required disabled={disabled} />
        </label>
        <label className="block text-sm text-slate-200">
          Vice
          <input value={runnerUp} onChange={e => setRunnerUp(e.target.value)}
            placeholder="Seleção vice" className={inputClass} required disabled={disabled} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-200">
          Artilheiro
          <input value={topScorer} onChange={e => setTopScorer(e.target.value)}
            placeholder="Jogador artilheiro" className={inputClass} required disabled={disabled} />
        </label>
        <label className="block text-sm text-slate-200">
          Gols do artilheiro
          <input type="number" min={0} value={topScorerGoals} onChange={e => setTopScorerGoals(Number(e.target.value))}
            className={inputClass} required disabled={disabled} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-200">
          Melhor goleiro
          <input value={bestGoalkeeper} onChange={e => setBestGoalkeeper(e.target.value)}
            placeholder="Melhor goleiro" className={inputClass} required disabled={disabled} />
        </label>
        <label className="block text-sm text-slate-200">
          Melhor jogador
          <input value={bestPlayer} onChange={e => setBestPlayer(e.target.value)}
            placeholder="Melhor jogador" className={inputClass} required disabled={disabled} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-200">
          Revelação do torneio
          <input value={revelation} onChange={e => setRevelation(e.target.value)}
            placeholder="Jogador revelação" className={inputClass} required disabled={disabled} />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSaving || disabled}
        className="w-full rounded-2xl bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:shadow-lg hover:shadow-[#00ffb2]/30 disabled:opacity-70"
      >
        {isSaving ? "Salvando..." : initialData ? "Atualizar Palpite Pré-Copa" : "Salvar Palpite Pré-Copa"}
      </button>

    </form>
  );
}
