"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Lazily-initialised Supabase client.
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY at runtime.
 * Returns null if the env vars are not configured — callers fall back to
 * localStorage in that case so the app still works without a database.
 */

let _client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (_client !== undefined) return _client;

  if (typeof window === "undefined") {
    _client = null;
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    _client = null;
    return null;
  }

  _client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: "sld-supabase-auth",
    },
  });
  return _client;
}

/**
 * Sign in anonymously if no session exists.
 * Returns the user id, or null if anonymous auth is disabled or failed.
 */
export async function ensureAnonSession(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data: sessionData } = await sb.auth.getSession();
  if (sessionData.session?.user?.id) {
    return sessionData.session.user.id;
  }

  // No session — try anonymous sign-in.
  const { data, error } = await sb.auth.signInAnonymously();
  if (error || !data.user?.id) {
    if (typeof console !== "undefined") {
      console.warn(
        "[sld] Supabase anonymous sign-in failed. Falling back to localStorage. " +
          "Enable Anonymous Sign-Ins in your Supabase project's Authentication settings to fix.",
        error?.message
      );
    }
    return null;
  }
  return data.user.id;
}
