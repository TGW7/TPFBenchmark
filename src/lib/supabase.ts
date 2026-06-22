/**
 * Supabase client — points at the SAME project as the Take Point Fitness app,
 * so a benchmark sign-up is a shared TPF account (same `auth.users`).
 *
 * Env-gated: if the URL/key aren't set, the client is null and the app runs in
 * anonymous-only mode (Layer 1 fully works; accounts/sync are disabled). This
 * lets the app build, preview and ship before the keys are wired in.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
