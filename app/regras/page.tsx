"use client";

import Link from "next/link";

export default function RegrasPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,255,178,0.14),_transparent_28%),_linear-gradient(180deg,#04070f_0%,#070b16_100%)] px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl space-y-8">

        {/* Header */}
        <header className="rounded-2xl border border-[#00ffb2]/20 bg-gradient-to-br from-[#081116] to-[#070b16] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00ffb2]">Bolão 94 M&F</p>
              <h1 className="mt-2 text-3xl font-bold text-white">📋 Regras de Pontuação</h1>
            </div>
            <Link href="/dashboard" className="px-4 py-2 bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] text-black font-semibold rounded-lg text-sm">
              Voltar
            </Link>
          </div>
        </header>

        {/* Pré-Copa */}
        <section className="rounded-2xl border border-[#00ffb2]/20 bg-[#050816] overflow-hidden">
          <div className="bg-gradient-to-r from-[#00ffb2]/10 to-[#00b2ff]/10 px-6 py-4 border-b border-[#00ffb2]/20">
            <h2 className="text-lg font-bold text-[#00ffb2]">🏆 Pré-Copa</h2>
            <p className="text-xs text-gray-400 mt-1">Palpites feitos antes do início da Copa</p>
          </div>
          <div className="divide-y divide-[#ffffff08]">
            {[
              { label: "Campeão", pts: "15 pts" },
              { label: "Vice-Campeão", pts: "10 pts" },
              { label: "Melhor Jogador (Bola de Ouro)", pts: "10 pts" },
              { label: "Artilheiro (número exato de gols)", pts: "10 pts" },
              { label: "Artilheiro (± 1 gol de diferença)", pts: "7 pts" },
              { label: "Artilheiro (± 2 gols de diferença)", pts: "5 pts" },
              { label: "Melhor Goleiro", pts: "8 pts" },
              { label: "Maior Assistente", pts: "8 pts" },
              { label: "Fair Play", pts: "7 pts" },
              { label: "Revelação do Torneio", pts: "7 pts" },
            ].map(({ label, pts }) => (
              <div key={label} className="flex justify-between items-center px-6 py-3">
                <span className="text-sm text-gray-300">{label}</span>
                <span className="text-sm font-bold text-[#00ffb2]">{pts}</span>
              </div>
            ))}
            <div className="px-6 py-3 bg-[#00ffb2]/5">
              <p className="text-xs text-gray-400">Pontuação máxima Pré-Copa: <span className="text-[#00ffb2] font-bold">80 pts</span></p>
            </div>
          </div>
        </section>

        {/* Fase de Grupos */}
        <section className="rounded-2xl border border-[#00ffb2]/20 bg-[#050816] overflow-hidden">
          <div className="bg-gradient-to-r from-[#00ffb2]/10 to-[#00b2ff]/10 px-6 py-4 border-b border-[#00ffb2]/20">
            <h2 className="text-lg font-bold text-[#00ffb2]">⚽ Fase de Grupos</h2>
            <p className="text-xs text-gray-400 mt-1">72 jogos divididos em 12 grupos</p>
          </div>
          <div className="divide-y divide-[#ffffff08]">
            {[
              { label: "Placar exato (cravada)", pts: "5 pts", desc: "Ex: apostou 2x1, terminou 2x1" },
              { label: "Resultado correto", pts: "3 pts", desc: "Acertou quem ganhou ou que empatou, mas não o placar" },
              { label: "Erro", pts: "0 pts", desc: "Errou o resultado" },
            ].map(({ label, pts, desc }) => (
              <div key={label} className="flex justify-between items-center px-6 py-4">
                <div>
                  <p className="text-sm text-gray-300">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <span className="text-sm font-bold text-[#00ffb2] ml-4 flex-none">{pts}</span>
              </div>
            ))}
            <div className="px-6 py-3 bg-[#00ffb2]/5">
              <p className="text-xs text-gray-400">Pontuação máxima Fase de Grupos: <span className="text-[#00ffb2] font-bold">360 pts</span></p>
            </div>
          </div>
        </section>

        {/* Mata-Mata */}
        <section className="rounded-2xl border border-[#00ffb2]/20 bg-[#050816] overflow-hidden">
          <div className="bg-gradient-to-r from-[#00ffb2]/10 to-[#00b2ff]/10 px-6 py-4 border-b border-[#00ffb2]/20">
            <h2 className="text-lg font-bold text-[#00ffb2]">🥊 Mata-Mata</h2>
            <p className="text-xs text-gray-400 mt-1">32-avos, Oitavas, Quartas, Semis e Final — você escolhe o placar, o classificado e o método</p>
          </div>
          <div className="divide-y divide-[#ffffff08]">
            {[
              { label: "💎 Cravada completa", pts: "8 pts", desc: "Placar + classificado + método corretos (ex: 2x1, Alemanha, tempo normal)" },
              { label: "Placar + classificado corretos", pts: "7 pts", desc: "Acertou o placar e quem passou, mas errou o método" },
              { label: "Placar + método corretos", pts: "6 pts", desc: "Acertou o placar e o método, mas errou o classificado" },
              { label: "Só placar correto", pts: "5 pts", desc: "Acertou o placar, mas errou o classificado e o método" },
              { label: "Classificado + método corretos", pts: "4 pts", desc: "Acertou quem passou e o método, mas errou o placar" },
              { label: "Só classificado correto", pts: "2 pts", desc: "Acertou quem passou, mas errou o placar e o método" },
              { label: "Só método correto", pts: "1 pt", desc: "Acertou se foi tempo normal, prorrogação ou pênaltis" },
              { label: "Erro total", pts: "0 pts", desc: "Errou tudo" },
            ].map(({ label, pts, desc }) => (
              <div key={label} className="flex justify-between items-center px-6 py-4">
                <div>
                  <p className="text-sm text-gray-300">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <span className="text-sm font-bold text-[#00ffb2] ml-4 flex-none">{pts}</span>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 bg-[#00ffb2]/5 border-t border-[#00ffb2]/10">
            <p className="text-xs text-gray-400 mb-1">🔹 <strong className="text-gray-300">Método:</strong> tempo normal / prorrogação / pênaltis</p>
            <p className="text-xs text-gray-400">🔹 Em jogos empatados no placar, o classificado e o método são obrigatórios para pontuação máxima</p>
          </div>
        </section>

        {/* Pontuação máxima total */}
        <section className="rounded-2xl border border-[#ffd700]/30 bg-[#ffd700]/5 p-6">
          <h2 className="text-lg font-bold text-[#ffd700] mb-4">🥇 Pontuação Máxima Total</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Pré-Copa", pts: "80" },
              { label: "Fase de Grupos", pts: "360" },
              { label: "Mata-Mata", pts: "256" },
              { label: "Total", pts: "696" },
            ].map(({ label, pts }) => (
              <div key={label} className="text-center">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-2xl font-black text-[#ffd700]">{pts}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
