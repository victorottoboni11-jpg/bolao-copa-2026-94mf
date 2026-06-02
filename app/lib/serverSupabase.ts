import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _serverSupabase: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (_serverSupabase) return _serverSupabase;

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing server Supabase configuration (SUPABASE_SERVICE_ROLE_KEY). Set env var on the server.");
  }

  _serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _serverSupabase;
}
