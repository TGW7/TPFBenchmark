/**
 * Funnel events. Fans out to both analytics backends, and no-ops off Vercel /
 * before consent / in tests, so it's safe to call anywhere. Use for measuring
 * the funnel: pathway picked → score computed → share / get-app clicks.
 *
 * Two backends on purpose:
 *  - Vercel Analytics is cookieless and needs no consent, so it keeps counting
 *    for visitors who decline.
 *  - PostHog is consent-gated and feeds the TTC Central Dashboard, which needs
 *    person/session data Vercel can't give.
 */
import { track } from '@vercel/analytics';
import { capture } from './posthog';

export function event(name: string, props?: Record<string, string | number | boolean>) {
  try {
    track(name, props);
  } catch {
    /* not on Vercel — ignore */
  }
  // Silently does nothing until PostHog is booted (i.e. consent given).
  capture(name, props);
}
