/**
 * Analytics consent, deny-by-default. 'unset' is treated exactly like 'denied'
 * for tracking; it's the only state that shows the banner.
 *
 * Stored in a cookie scoped to `.takepointfitness.com` (not localStorage) so
 * one decision covers the marketing site, this benchmark and the app — the
 * same three surfaces that share a PostHog project. On localhost the domain is
 * dropped and it degrades to a host-only cookie.
 */

export type Consent = 'unset' | 'granted' | 'denied';

const COOKIE = 'tpf-consent';
const SHARED_DOMAIN = 'takepointfitness.com';
/** Consent isn't forever — re-ask after six months. */
const MAX_AGE_DAYS = 180;

function cookieDomain(): string {
  if (typeof location === 'undefined') return '';
  return location.hostname.endsWith(SHARED_DOMAIN) ? `; domain=.${SHARED_DOMAIN}` : '';
}

export function readConsent(): Consent {
  if (typeof document === 'undefined') return 'unset';
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]*)`));
  const value = match?.[1];
  return value === 'granted' || value === 'denied' ? value : 'unset';
}

export function writeConsent(value: Exclude<Consent, 'unset'>): void {
  if (typeof document === 'undefined') return;
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${cookieDomain()}`;
}

/** Clears the decision so the banner comes back — the "change your mind" path. */
export function clearConsent(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE}=; path=/; max-age=0; SameSite=Lax${cookieDomain()}`;
}
