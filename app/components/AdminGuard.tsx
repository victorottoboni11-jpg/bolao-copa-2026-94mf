"use client";

import { useIsAdmin } from "../lib/useIsAdmin";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
