import type { Match } from "../types";

interface AdminPanelProps {
  jogos: Match[];
  onUpdateScore: (matchId: string, homeScore: number, awayScore: number) => Promise<void>;
  onMarkFinished: (matchId: string) => Promise<void>;
  isBusy: boolean;
}

export function AdminPanel({ jogos, onUpdateScore, onMarkFinished, isBusy }: AdminPanelProps) {
  const jogosFinalizados = jogos.filter((jogo) => jogo.home_score !== null && jogo.away_score !== null);
  const jogosPendentes = jogos.filter((jogo) => jogo.home_score === null || jogo.away_score === null);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[#00ffb2]">Painel Administrativo</p>
          <h2 className="text-2xl font-semibold text-white">Gerenciar jogos e resultados</h2>
          <p className="mt-2 text-sm text-slate-400">Atualize placares e marque jogos como finalizados.</p>
        </div>

        <div className="flex gap-3">
          <div className="rounded-full border border-white/10 bg-slate-900/90 px-4 py-2">
            <span className="text-sm text-slate-400">Finalizados: </span>
            <span className="text-sm font-semibold text-[#00ffb2]">{jogosFinalizados.length}</span>
          </div>
          <div className="rounded-full border border-white/10 bg-slate-900/90 px-4 py-2">
            <span className="text-sm text-slate-400">Pendentes: </span>
            <span className="text-sm font-semibold text-orange-400">{jogosPendentes.length}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {jogos.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum jogo encontrado. Importe jogos primeiro.</p>
        ) : (
          <>
            {jogosPendentes.length > 0 && (
              <div>
                <h3 className="mb-4 text-lg font-semibold text-white">Jogos Pendentes</h3>
                <div className="grid gap-4 lg:grid-cols-2">
                  {jogosPendentes.map((jogo) => (
                    <AdminMatchCard
                      key={String(jogo.id)}
                      jogo={jogo}
                      onUpdateScore={onUpdateScore}
                      onMarkFinished={onMarkFinished}
                      isBusy={isBusy}
                    />
                  ))}
                </div>
              </div>
            )}

            {jogosFinalizados.length > 0 && (
              <div>
                <h3 className="mb-4 text-lg font-semibold text-white">Jogos Finalizados</h3>
                <div className="grid gap-4 lg:grid-cols-2">
                  {jogosFinalizados.map((jogo) => (
                    <AdminMatchCard
                      key={String(jogo.id)}
                      jogo={jogo}
                      onUpdateScore={onUpdateScore}
                      onMarkFinished={onMarkFinished}
                      isBusy={isBusy}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface AdminMatchCardProps {
  jogo: Match;
  onUpdateScore: (matchId: string, homeScore: number, awayScore: number) => Promise<void>;
  onMarkFinished: (matchId: string) => Promise<void>;
  isBusy: boolean;
}

function AdminMatchCard({ jogo, onUpdateScore, onMarkFinished, isBusy }: AdminMatchCardProps) {
  const [homeScore, setHomeScore] = React.useState(jogo.home_score ?? "");
  const [awayScore, setAwayScore] = React.useState(jogo.away_score ?? "");
  const [isEditing, setIsEditing] = React.useState(false);

  const isFinished = jogo.home_score !== null && jogo.away_score !== null;

  const homeTeamName =
    typeof jogo.home_team === "string"
      ? jogo.home_team
      : jogo.home_team?.name ?? "Mandante";
  const awayTeamName =
    typeof jogo.away_team === "string"
      ? jogo.away_team
      : jogo.away_team?.name ?? "Visitante";

  const handleSave = async () => {
    const home = Number(homeScore);
    const away = Number(awayScore);

    if (Number.isNaN(home) || Number.isNaN(away)) {
      alert("Digite placares válidos.");
      return;
    }

    await onUpdateScore(String(jogo.id), home, away);
    setIsEditing(false);
  };

  const handleMarkFinished = async () => {
    await onMarkFinished(String(jogo.id));
  };

  return (
    <div className={`rounded-3xl border p-4 transition ${
      isFinished
        ? "border-green-500/20 bg-green-950/20"
        : "border-orange-500/20 bg-orange-950/20"
    }`}>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-slate-400">
          {jogo.group_name || jogo.phase || "Partida"}
        </span>
        <span className={`rounded-full px-2 py-1 text-xs ${
          isFinished
            ? "bg-green-500/20 text-green-400"
            : "bg-orange-500/20 text-orange-400"
        }`}>
          {isFinished ? "Finalizado" : "Pendente"}
        </span>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-white">{homeTeamName}</span>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <input
                type="number"
                min="0"
                max="20"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-12 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-center text-white"
              />
              <span className="text-slate-400">x</span>
              <input
                type="number"
                min="0"
                max="20"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-12 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-center text-white"
              />
            </>
          ) : (
            <>
              <span className="w-8 text-center text-lg font-semibold text-white">
                {jogo.home_score ?? "-"}
              </span>
              <span className="text-slate-400">x</span>
              <span className="w-8 text-center text-lg font-semibold text-white">
                {jogo.away_score ?? "-"}
              </span>
            </>
          )}
        </div>
        <span className="text-white">{awayTeamName}</span>
      </div>

      <div className="flex gap-2">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy}
              className="flex-1 rounded-lg bg-[#00ffb2] px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-[#8bfcc7] disabled:opacity-50"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-700"
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex-1 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-700"
            >
              Editar Placar
            </button>
            {!isFinished && (
              <button
                type="button"
                onClick={handleMarkFinished}
                disabled={isBusy}
                className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-500 disabled:opacity-50"
              >
                Finalizar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Import React for useState
import React from "react";
