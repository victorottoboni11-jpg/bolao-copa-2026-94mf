interface AuthPanelProps {
  modo: "login" | "cadastro";
  email: string;
  senha: string;
  nome: string;
  loading?: boolean;
  error?: string | null;
  message?: string | null;
  onEmailChange: (value: string) => void;
  onSenhaChange: (value: string) => void;
  onNomeChange: (value: string) => void;
  onToggleModo: () => void;
  onGoogleSignIn: () => Promise<void>;
  onSubmit: () => Promise<void>;
}

export function AuthPanel({
  modo,
  email,
  senha,
  nome,
  loading = false,
  error,
  message,
  onEmailChange,
  onSenhaChange,
  onNomeChange,
  onToggleModo,
  onGoogleSignIn,
  onSubmit,
}: AuthPanelProps) {
  const isLogin = modo === "login";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,255,178,0.16),_transparent_28%),_linear-gradient(180deg,#04070f_0%,#070b16_100%)] px-4 py-10 text-white">
      <section className="mx-auto flex max-w-md flex-col gap-6 rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-[#00ffb2]">94 Marketing & Football</p>
          <h1 className="text-3xl font-semibold text-white">Bolão Oficial Copa 2026</h1>
          <p className="text-sm text-slate-400">Entre com sua conta ou registre-se para acompanhar todos os palpites da competição.</p>
        </div>

        <div className="space-y-4">
          {!isLogin && (
            <label className="block text-sm text-slate-200">
              Nome completo
              <input
                type="text"
                value={nome}
                onChange={(event) => onNomeChange(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-[#00ffb2]"
                placeholder="Digite seu nome"
              />
            </label>
          )}

          <label className="block text-sm text-slate-200">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-[#00ffb2]"
              placeholder="seu@email.com"
            />
          </label>

          <label className="block text-sm text-slate-200">
            Senha
            <input
              type="password"
              value={senha}
              onChange={(event) => onSenhaChange(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-[#00ffb2]"
              placeholder="••••••••"
            />
          </label>
        </div>

        {message ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 pt-3">
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="rounded-2xl bg-[#00ffb2] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#8bfcc7] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Aguarde..." : isLogin ? "Entrar" : "Cadastrar"}
          </button>

          {isLogin && (
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={loading}
              className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-3 text-sm text-white transition hover:border-[#00ffb2] hover:bg-[#081116] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Entrar com Google
            </button>
          )}

          <button
            type="button"
            onClick={onToggleModo}
            disabled={loading}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLogin ? "Criar uma conta" : "Voltar para login"}
          </button>
        </div>
      </section>
    </main>
  );
}
