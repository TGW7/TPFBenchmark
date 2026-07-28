/**
 * Auth context over Supabase. Graceful when Supabase isn't configured: stays
 * "ready" with no user, and the sign-in/up calls return a friendly error so the
 * UI can show a "coming soon" state instead of breaking.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { editionKey, identifyUser, resetUser } from '../lib/posthog';
import { isPreExistingAccount } from '../lib/signup_existing_account';
import { detectBrand } from '../brand';
import { event } from '../lib/analytics';

interface AuthResult {
  error?: string;
  /** True when sign-up requires email confirmation before a session exists. */
  needsConfirmation?: boolean;
}

interface AuthState {
  configured: boolean;
  ready: boolean;
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const NOT_CONFIGURED: AuthResult = {
  error: 'Accounts aren’t switched on yet — add your Supabase keys to enable them.',
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // If Supabase isn't configured there's nothing to load — we're ready at once.
  const [ready, setReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
      // Returning user with a live session — re-identify so this visit joins
      // up with their account rather than looking anonymous.
      if (data.session?.user) identifyUser(data.session.user.id, detectBrand());
    });
    const { data: sub } = supabase.auth.onAuthStateChange((authEvent, next) => {
      setSession(next);
      // The Supabase user id is shared with the TPF app (same auth.users), so
      // identifying with it here is what stitches a benchmark visit to an app
      // account in PostHog.
      if (next?.user) identifyUser(next.user.id, detectBrand());
      // Without a reset, the next person on this browser inherits the last
      // user's identity.
      if (authEvent === 'SIGNED_OUT') resetUser();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthState['signIn'] = async (email, password) => {
    if (!supabase) return NOT_CONFIGURED;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  };

  const signUp: AuthState['signUp'] = async (email, password) => {
    if (!supabase) return NOT_CONFIGURED;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    // `user_signed_up` is the event name the Central Dashboard is configured
    // to look for (POSTHOG_SIGNUP_EVENT), and it must match the app's exactly
    // — these two surfaces create accounts in the SAME Supabase auth.users, so
    // between them they have to fire it once per account and never twice.
    // Identify first where we can, so the event lands on the right person.
    // signUp() succeeds silently when the email already exists, so a non-error
    // response is NOT proof an account was created. Firing the event here
    // regardless would emit a second `user_signed_up` for an account the app
    // already reported — the two share auth.users — and quietly corrupt the
    // dashboard's signup attribution.
    if (!isPreExistingAccount(data.user)) {
      if (data.session?.user) identifyUser(data.session.user.id, detectBrand());
      // editionKey(), not detectBrand() — this site's own key for Lift is
      // 'lift', but every other surface (and the dashboard) calls that edition
      // 'hypertrophy'. Sending the raw key here would make this one property
      // disagree with the tpf_brand super property on the very same event.
      event('user_signed_up', { surface: 'benchmark', brand: editionKey(detectBrand()) });
    }

    return { needsConfirmation: !data.session };
  };

  const signOut: AuthState['signOut'] = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  return (
    <AuthCtx.Provider
      value={{
        configured: isSupabaseConfigured,
        ready,
        user: session?.user ?? null,
        session,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
