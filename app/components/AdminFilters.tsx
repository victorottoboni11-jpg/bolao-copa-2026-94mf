"use client";

interface AdminFiltersProps {
  phase: string;
  status: string;
  onPhaseChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const phaseOptions = [
  { value: "all", label: "Todas as fases" },
  { value: "friendly", label: "Amistoso" },
  { value: "group", label: "Fase de Grupos" },
  { value: "round_of_32", label: "32 avos" },
  { value: "round_of_16", label: "Oitavas" },
  { value: "quarterfinal", label: "Quartas de Final" },
  { value: "semifinal", label: "Semifinal" },
  { value: "third_place", label: "Disputa 3º Lugar" },
  { value: "final", label: "Final" },
];

const statusOptions = [
  { value: "all", label: "Todos os status" },
  { value: "pending", label: "Pendente" },
  { value: "scheduled", label: "Agendado" },
  { value: "live", label: "Ao vivo" },
  { value: "finished", label: "Finalizado" },
];

export function AdminFilters({ phase, status, onPhaseChange, onStatusChange, onRefresh, isLoading }: AdminFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="block text-sm text-slate-300">
        <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-[#00ffb2]">Fase</span>
        <select
          value={phase}
          onChange={(event) => onPhaseChange(event.target.value)}
          className="w-full rounded-2xl border border-[#00ffb2]/20 bg-[#081116] px-4 py-3 text-sm text-white outline-none transition focus:border-[#00ffb2]"
        >
          {phaseOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#0b1320] text-white">
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm text-slate-300">
        <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-[#00ffb2]">Status</span>
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          className="w-full rounded-2xl border border-[#00ffb2]/20 bg-[#081116] px-4 py-3 text-sm text-white outline-none transition focus:border-[#00ffb2]"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#0b1320] text-white">
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-end">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="w-full rounded-2xl bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:shadow-lg hover:shadow-[#00ffb2]/30 disabled:opacity-50"
        >
          {isLoading ? "Atualizando..." : "Atualizar lista"}
        </button>
      </div>
    </div>
  );
}
