"use client";

import Link from "next/link";
import { useAuth } from "@/app/lib/auth";

export default function PerfilPage() {
  const { user, loading, signOut } = useAuth();

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,255,178,0.14),_transparent_28%),_linear-gradient(180deg,#04070f_0%,#070b16_100%)] flex items-center justify-center px-4 py-8">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#00ffb2]/30 border-t-[#00ffb2] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#00b2ff] font-semibold">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(0,255,178,0.14),_transparent_28%),_linear-gradient(180deg,#04070f_0%,#070b16_100%)] px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <header className="rounded-2xl border border-[#00ffb2]/20 bg-gradient-to-br from-[#081116] to-[#070b16] p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00ffb2]">
                Seu Perfil
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white">
                {user.name || user.full_name || "Usuário"}
              </h1>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-[#00ffb2]/30 transition-all duration-300"
            >
              Voltar
            </Link>
          </div>
        </header>

        {/* Profile Information */}
        <div className="rounded-xl border border-[#00ffb2]/20 bg-gradient-to-br from-[#081116] to-[#070b16] p-6 space-y-6">
          {/* Email */}
          <div className="border-b border-[#00ffb2]/10 pb-6">
            <label className="text-xs font-semibold uppercase tracking-widest text-[#00b2ff]">
              Email
            </label>
            <p className="mt-2 text-white font-semibold">{user.email}</p>
          </div>

          {/* User ID */}
          <div className="border-b border-[#00ffb2]/10 pb-6">
            <label className="text-xs font-semibold uppercase tracking-widest text-[#00b2ff]">
              ID do Usuário
            </label>
            <p className="mt-2 text-gray-400 font-mono text-sm">{user.id}</p>
          </div>

          {/* Account Created */}
          <div className="border-b border-[#00ffb2]/10 pb-6">
            <label className="text-xs font-semibold uppercase tracking-widest text-[#00b2ff]">
              Membro Desde
            </label>
            <p className="mt-2 text-white font-semibold">
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "Data não disponível"}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#00ffb2]/10 border border-[#00ffb2]/20 rounded-lg p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00ffb2]">
                Palpites
              </p>
              <p className="mt-2 text-2xl font-bold text-[#00ffb2]">0</p>
            </div>
            <div className="bg-[#00b2ff]/10 border border-[#00b2ff]/20 rounded-lg p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00b2ff]">
                Cravadas
              </p>
              <p className="mt-2 text-2xl font-bold text-[#00b2ff]">0</p>
            </div>
            <div className="bg-[#00ffb2]/10 border border-[#00ffb2]/20 rounded-lg p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00ffb2]">
                Pontos
              </p>
              <p className="mt-2 text-2xl font-bold text-[#00ffb2]">0</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="rounded-xl border border-rose-500/20 bg-gradient-to-br from-[#081116] to-[#070b16] p-6">
          <h2 className="text-lg font-bold text-rose-400 mb-4">Ações</h2>
          <button
            onClick={async () => {
              await signOut();
            }}
            className="w-full py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-rose-500/30 transition-all duration-300"
          >
            Fazer Logout
          </button>
        </div>
      </div>
    </main>
  );
}
