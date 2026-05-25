"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabase";

const BASE_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/fase-de-grupos", label: "Fase de Grupos" },
  { href: "/mata-mata", label: "Mata-Mata" },
  { href: "/pre-copa", label: "Pré-Copa" },
  { href: "/ranking", label: "Ranking" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [isProfileAdmin, setIsProfileAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkProfile() {
      if (!user?.id) {
        setIsProfileAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();

        if (!mounted) return;

        if (!error && data && typeof data.is_admin === "boolean") {
          setIsProfileAdmin(Boolean(data.is_admin));
          return;
        }
      } catch (err) {
        // ignore and fallback to user.is_admin
      }

      // fallback to user.is_admin (populated from users table/profile sync)
      setIsProfileAdmin(Boolean(user?.is_admin));
    }

    void checkProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  const LINKS = useMemo(() => {
    // insert Admin link before Ranking (after Pré-Copa)
    const links = [...BASE_LINKS];
    if (isProfileAdmin) {
      // ensure we don't duplicate
      const exists = links.find((l) => l.href === "/admin");
      if (!exists) {
        // insert before the last item (Ranking)
        links.splice(4, 0, { href: "/admin", label: "Admin" });
      }
    }
    return links;
  }, [isProfileAdmin]);

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
