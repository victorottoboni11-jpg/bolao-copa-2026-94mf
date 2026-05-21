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
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 py-3 sm:gap-3 sm:py-4 md:flex-row md:items-center md:justify-between">
        {/* Logo and Nav */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Link href="/dashboard" className="text-lg font-bold tracking-wide text-white flex-shrink-0">
            Bolão 2026
          </Link>
          <nav className="flex flex-wrap gap-1.5 sm:gap-2">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition ${
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

        {/* User Section */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-[#081116]" />
          ) : user ? (
            <>
              <span className="rounded-lg border border-[#00ffb2]/20 bg-[#0b1320] px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-[#00ffb2] truncate">
                {user.name || user.full_name || user.email}
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-lg bg-gradient-to-r from-[#00ffb2] to-[#00b2ff] px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-black hover:shadow-lg hover:shadow-[#00ffb2]/30 transition flex-shrink-0"
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
