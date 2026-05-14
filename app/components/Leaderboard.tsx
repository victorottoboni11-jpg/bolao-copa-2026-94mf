import type { LeaderboardEntry } from "../types";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string | null;
}

export function Leaderboard({ entries, currentUserId }: LeaderboardProps) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[#00ffb2]">Classificação</p>
          <h2 className="text-2xl font-semibold text-white">Ranking dos palpites</h2>
        </div>
        <span className="rounded-full bg-white/5 px-4 py-2 text-xs text-slate-300">Top {Math.min(entries.length, 5)}</span>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-400">Ainda não há resultados suficientes para gerar o ranking.</p>
      ) : (
        <div className="space-y-3">
          {entries.slice(0, 5).map((entry, index) => (
            <div
              key={entry.userId}
              className={`flex items-center justify-between rounded-3xl border px-4 py-4 transition ${
                currentUserId === entry.userId
                  ? "border-[#00ffb2] bg-[#0f172a] shadow-[0_0_0_3px_rgba(0,255,178,0.12)]"
                  : "border-white/10 bg-slate-900/90"
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-white">{index + 1}. {entry.userName}</p>
                <p className="text-xs text-slate-500">{entry.email ?? "Email não disponível"}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-white">{entry.points} pts</p>
                <p className="text-slate-400">{entry.exacts} exatas · {entry.correctResults} resultados</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
