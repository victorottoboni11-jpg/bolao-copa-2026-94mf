"use client";

import { useState } from "react";
import { AuthPanel } from "./components/AuthPanel";
import { AdminGuard } from "./components/AdminGuard";
import { useAuth } from "./lib/auth";

export default function Home() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [formError, setFormError] = useState<string | null>(null);

  const { user, loading: authLoading, error: authError, message: authMessage, signIn, signUp, signInWithGoogle, signOut } = useAuth();

  const handleAuthSubmit = async () => {
    setFormError(null);

    if (!email.trim() || !senha.trim()) {
      setFormError("Email e senha são obrigatórios.");
      return;
    }

    if (modo === "cadastro" && !nome.trim()) {
      setFormError("Informe seu nome completo.");
      return;
    }

    if (modo === "login") {
      await signIn(email.trim(), senha);
      return;
    }

    await signUp(nome.trim(), email.trim(), senha);
  };

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
  };

  const logout = async () => {
    await signOut();
  };

  if (!user) {
    return (
      <AuthPanel
        modo={modo}
        email={email}
        senha={senha}
        nome={nome}
        loading={authLoading}
        error={formError || authError}
        message={authMessage}
        onEmailChange={setEmail}
        onSenhaChange={setSenha}
        onNomeChange={setNome}
        onToggleModo={() => setModo((current) => (current === "login" ? "cadastro" : "login"))}
        onGoogleSignIn={handleGoogleLogin}
        onSubmit={handleAuthSubmit}
      />
    );
  }

  return (
    <main className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(0,255,178,0.14),_transparent_28%),_linear-gradient(180deg,#04070f_0%,#070b16_100%)] px-4 py-8 text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        {/* Header */}
        <header className="rounded-2xl border border-[#00ffb2]/20 bg-gradient-to-br from-[#081116] to-[#070b16] p-6 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00ffb2]">
                Bolão Copa 2026 - 94 Marketing & Football
              </p>
              <h1 className="mt-2 text-2xl font-bold text-white">Bem-vindo!</h1>
              <p className="mt-1 text-sm text-gray-400">
                Gerencie seus palpites e acompanhe os resultados
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="rounded-lg border border-[#00b2ff]/30 bg-[#00b2ff]/10 px-4 py-2 text-sm text-[#00b2ff]">
                {user.name || user.full_name || user.email || "Usuário"}
              </span>
              <button
                onClick={logout}
                className="rounded-lg bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] px-4 py-2 text-sm font-semibold text-black hover:shadow-lg hover:shadow-[#00ffb2]/30 transition-all duration-300"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* Admin Section */}
        <AdminGuard>
          <section className="rounded-2xl border border-[#00ffb2]/20 bg-gradient-to-br from-[#081116] to-[#070b16] p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white">Painel administrativo</h2>
            <p className="mt-2 text-sm text-slate-400">Gerencie partidas, resultados e rankings na área administrativa.</p>
            <a
              href="/admin"
              className="mt-4 inline-flex rounded-2xl bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] px-4 py-2 text-sm font-semibold text-slate-950 hover:shadow-lg hover:shadow-[#00ffb2]/30 transition-all duration-300"
            >
              Abrir painel admin
            </a>
          </section>
        </AdminGuard>

        {/* Dashboard Links */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/dashboard"
            className="p-6 bg-gradient-to-br from-[#081116] to-[#070b16] border border-[#00ffb2]/20 rounded-xl hover:border-[#00ffb2]/50 transition-all hover:shadow-lg hover:shadow-[#00ffb2]/10"
          >
            <h3 className="font-semibold text-[#00ffb2] mb-2">🎯 Dashboard</h3>
            <p className="text-sm text-gray-400">
              Visualize seus palpites e acompanhe os resultados
            </p>
          </a>

          <a
            href="/grupos"
            className="p-6 bg-gradient-to-br from-[#081116] to-[#070b16] border border-[#00b2ff]/20 rounded-xl hover:border-[#00b2ff]/50 transition-all hover:shadow-lg hover:shadow-[#00b2ff]/10"
          >
            <h3 className="font-semibold text-[#00b2ff] mb-2">🏆 Grupos</h3>
            <p className="text-sm text-gray-400">
              Veja a classificação dos grupos e confrontos
            </p>
          </a>

          <a
            href="/ranking"
            className="p-6 bg-gradient-to-br from-[#081116] to-[#070b16] border border-[#00ffb2]/20 rounded-xl hover:border-[#00ffb2]/50 transition-all hover:shadow-lg hover:shadow-[#00ffb2]/10"
          >
            <h3 className="font-semibold text-[#00ffb2] mb-2">📊 Ranking</h3>
            <p className="text-sm text-gray-400">Veja sua posição no palpitômetro</p>
          </a>

          <a
            href="/perfil"
            className="p-6 bg-gradient-to-br from-[#081116] to-[#070b16] border border-[#00b2ff]/20 rounded-xl hover:border-[#00b2ff]/50 transition-all hover:shadow-lg hover:shadow-[#00b2ff]/10"
          >
            <h3 className="font-semibold text-[#00b2ff] mb-2">👤 Perfil</h3>
            <p className="text-sm text-gray-400">Gerencie seu perfil e estatísticas</p>
          </a>
        </section>
      </div>
    </main>
  );
}
