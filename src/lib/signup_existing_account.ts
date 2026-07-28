/**
 * Did supabase.auth.signUp() actually create a NEW account, or quietly hand
 * back an EXISTING one it declined to touch?
 *
 * signUp() never errors when the email already exists — that's deliberate, so
 * an attacker can't probe which emails are registered. It signals the
 * collision through the returned user instead, and the signal differs by
 * whether the existing account was ever confirmed:
 *
 *   • CONFIRMED existing account — `identities` comes back as an empty array.
 *   • UNCONFIRMED existing account — `identities` is non-empty and looks
 *     identical to a genuine new signup. What separates them is `created_at`:
 *     a real signup is timestamped seconds ago, whereas a pre-existing user
 *     carries its ORIGINAL created_at, however old.
 *
 * Why this matters here specifically: this site shares `auth.users` with the
 * TPF app, and BOTH fire `user_signed_up` — the event the Central Dashboard
 * reads for signup attribution. It has to land exactly once per account. An
 * existing user "signing up" here would otherwise emit a second one and
 * silently corrupt that attribution.
 *
 * Mirrors the rule in the app repo (re-implemented, not imported — the two
 * codebases share metadata only).
 *
 * The threshold is deliberately generous (60s, not 2-3s) to absorb clock skew
 * and slow networks: a false positive would drop a genuine signup event,
 * which is worse than an occasional missed duplicate.
 */

export interface SignUpUserLike {
  identities?: unknown[] | null;
  created_at?: string | null;
}

export const STALE_ACCOUNT_THRESHOLD_MS = 60_000;

/**
 * True when `user` is the response to a signUp() that did NOT create a new
 * account — the email already belonged to someone.
 */
export function isPreExistingAccount(
  user: SignUpUserLike | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!user) return false;
  if (Array.isArray(user.identities) && user.identities.length === 0) return true;
  if (user.created_at) {
    const createdMs = Date.parse(user.created_at);
    if (Number.isFinite(createdMs) && now - createdMs > STALE_ACCOUNT_THRESHOLD_MS) return true;
  }
  return false;
}
