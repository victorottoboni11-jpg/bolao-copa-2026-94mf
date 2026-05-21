"use client";

import { useState } from "react";
import { importCopa2026Data, checkCopa2026Imported } from "@/app/lib/importCopa2026";

export function AdminPanel() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isImported, setIsImported] = useState(false);

  const handleImportCopa2026 = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const alreadyImported = await checkCopa2026Imported();

      if (alreadyImported) {
        setMessage({ type: "success", text: "Copa 2026 já foi importada anteriormente!" });
        setIsImported(true);
        return;
      }

      await importCopa2026Data();

      setMessage({
        type: "success",
        text: "✅ Copa 2026 importada com sucesso! 48 times + 104 partidas",
      });
      setIsImported(true);
    } catch (error) {
      console.error("Erro ao importar:", error);
      setMessage({
        type: "error",
        text: "❌ Erro ao importar Copa 2026. Verifique o console.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-[#081116] to-[#070b16] border border-[#00ffb2]/20 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-[#00ffb2] rounded-full animate-pulse"></div>
        <h2 className="text-lg font-bold text-[#00ffb2]">Painel Administrativo</h2>
      </div>

      <div className="space-y-3">
        <div className="bg-[#04070f] border border-[#00b2ff]/20 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-2">Importar Copa 2026</h3>
          <p className="text-sm text-gray-400 mb-4">
            Importar dados oficiais: 48 times, 12 grupos, 104 partidas (grupos + mata-mata)
          </p>

          <button
            onClick={handleImportCopa2026}
            disabled={loading || isImported}
            className="w-full py-2 px-4 bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-[#00ffb2]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Importando..." : isImported ? "✓ Importado" : "Importar Dados"}
          </button>
        </div>

        {message && (
          <div
            className={`border rounded-lg p-4 text-sm font-semibold ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      <div className="border-t border-[#00ffb2]/10 pt-4 mt-4">
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Equipes: 48</p>
          <p>• Grupos: 12 (A-L)</p>
          <p>• Partidas: 104 (72 grupos + 32 mata-mata)</p>
        </div>
      </div>
    </div>
  );
}
