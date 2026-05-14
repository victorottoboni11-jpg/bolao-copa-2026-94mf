"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "./supabase";
import type { AppUser } from "../types";

const ADMIN_EMAIL = "victor.ottoboni@94.football";
const AUTH_COOKIE_NAME = "bolao-auth";

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  message: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function setAuthCookie() {
  document.cookie = `${AUTH_COOKIE_NAME}=true; path=/; max-age=${60 * 60}; samesite=lax`;
}

function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, is_admin, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as AppUser | null;
}

function normalizeUserPayload(authUser: { id: string; email?: string | null | undefined; user_metadata?: Record<string, unknown> }) {
  const rawName = authUser.user_metadata?.["full_name"] ?? authUser.user_metadata?.["name"];
  const fullName = typeof rawName === "string" ? rawName : null;

  return {
    id: authUser.id,
    email: authUser.email,
    name: fullName ?? authUser.email ?? undefined,
    full_name: fullName,
    avatar_url: null,
    is_admin: authUser.email?.toLowerCase() === ADMIN_EMAIL,
  } satisfies AppUser;
}

async function ensureUserProfile(authUser: { id: string; email?: string | null | undefined; user_metadata?: Record<string, unknown> }) {
  const profile = await fetchProfile(authUser.id);

  if (profile) {
    return profile;
  }

  const normalized = normalizeUserPayload(authUser);

  const { error } = await supabase.from("users").upsert(
    [
      {
        id: normalized.id,
        full_name: normalized.full_name,
        email: normalized.email,
        is_admin: normalized.is_admin,
      },
    ],
    { onConflict: "id" }
  );

  if (error) {
    const details = [error.message, error.details, error.hint]
      .filter(Boolean)
      .join(" | ");

    throw new Error(`Erro ao salvar perfil do usuário: ${details}`);
  }

  return normalized;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      setError(sessionError.message);
      setUser(null);
      clearAuthCookie();
      setLoading(false);
      return;
    }

    const authUser = data.session?.user;

    if (!authUser) {
      setUser(null);
      clearAuthCookie();
      setLoading(false);
      return;
    }

    try {
      const profile = await ensureUserProfile(authUser);
      setUser(profile);
      setAuthCookie();
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "Erro ao carregar perfil.");
      setUser(null);
      clearAuthCookie();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSession();
    }, 0);

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        void loadSession();
      } else {
        setUser(null);
        clearAuthCookie();
      }
    });

    return () => {
      window.clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, [loadSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Não foi possível autenticar. Verifique suas credenciais.");
      setLoading(false);
      return;
    }

    await loadSession();
  }, [loadSession]);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error: providerError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (providerError) {
      setError(providerError.message);
      setLoading(false);
      return;
    }

    if (data.url) {
      window.location.assign(data.url);
      return;
    }

    setError("Erro ao redirecionar para o login do Google.");
    setLoading(false);
  }, []);

  const signUp = useCallback(async (fullName: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      try {
        await ensureUserProfile(data.user);
      } catch (profileError) {
        setError(profileError instanceof Error ? profileError.message : "Erro ao salvar perfil.");
        setLoading(false);
        return;
      }
    }

    if (data.session?.access_token) {
      setAuthCookie();
      await loadSession();
      return;
    }

    setLoading(false);
    setMessage("Conta criada com sucesso. Verifique seu email para ativar o acesso.");
  }, [loadSession]);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      setLoading(false);
      return;
    }

    setUser(null);
    clearAuthCookie();
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, message, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
