/**
 * Privacy-friendly funnel events via Vercel Analytics. No-ops off Vercel / in
 * tests, so it's safe to call anywhere. Use for measuring the funnel:
 * pathway picked → score computed → share / get-app clicks.
 */
import { track } from '@vercel/analytics';

export function event(name: string, props?: Record<string, string | number | boolean>) {
  try {
    track(name, props);
  } catch {
    /* not on Vercel — ignore */
  }
}
