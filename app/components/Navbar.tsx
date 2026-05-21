"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/lib/auth";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/fase-de-grupos", label: "Fase de Grupos" },
  { href: "/mata-mata", label: "Mata-Mata" },
  { href: "/pre-copa", label: "Pré-Copa" },
  { href: "/ranking", label: "Ranking" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  const isActive = (href: string) => {
    if (href === "/dashboard" && pathname === "/") {
      return false;
    }
    return pathname === href;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#00ffb2]/10 bg-[#04070f]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/dashboard" className="text-lg font-semibold tracking-wide text-white">
            Bolão 2026
          </Link>
          <nav className="flex flex-wrap gap-2">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-2xl px-3 py-2 text-sm transition ${
                  isActive(link.href)
                    ? "bg-[#00ffb2]/15 text-[#00ffb2]"
                    : "bg-[#081116] text-slate-200 hover:bg-[#0f172a]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-2xl bg-[#081116]" />
          ) : user ? (
            <>
              <span className="rounded-2xl border border-[#00ffb2]/20 bg-[#0b1320] px-4 py-2 text-sm text-[#00ffb2]">
                {user.name || user.full_name || user.email}
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-2xl bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] px-4 py-2 text-sm font-semibold text-black hover:shadow-lg hover:shadow-[#00ffb2]/30 transition"
              >
                Sair
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
