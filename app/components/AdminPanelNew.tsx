"use client";

export function AdminPanel() {

  return (
    <div className="w-full bg-gradient-to-br from-[#081116] to-[#070b16] border border-[#00ffb2]/20 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-[#00ffb2] rounded-full animate-pulse"></div>
        <h2 className="text-lg font-bold text-[#00ffb2]">Painel Administrativo</h2>
      </div>

      <div className="space-y-3">
        <div className="bg-[#04070f] border border-[#00b2ff]/20 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-2">Painel administrativo</h3>
          <p className="text-sm text-gray-400 mb-4">
            Use o painel principal para gerenciar partidas, resultados e rankings.
          </p>
          <a
            href="/admin"
            className="inline-flex rounded-2xl bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] px-4 py-2 text-sm font-semibold text-slate-950 hover:shadow-lg hover:shadow-[#00ffb2]/30 transition-all duration-300"
          >
            Abrir painel admin
          </a>
        </div>
      </div>

      <div className="border-t border-[#00ffb2]/10 pt-4 mt-4">
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Gerenciamento de partidas</p>
          <p>• Edição de resultados</p>
          <p>• Recalcular rankings</p>
        </div>
      </div>
    </div>
  );
}
