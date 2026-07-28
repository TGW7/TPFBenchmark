/**
 * PostHog (EU cloud) — consent-gated, no-ops until the visitor opts in.
 *
 * Same single PostHog project as the marketing site and the app; `tpf_surface`
 * is what tells them apart. All three live under takepointfitness.com, so
 * `cross_subdomain_cookie` makes one visitor's journey across them a single
 * person rather than three strangers.
 *
 * Two gates, both must open before anything is sent:
 *   1. VITE_POSTHOG_KEY set (absent locally / in previews).
 *   2. Visitor accepted analytics in the consent banner.
 * Everything here is a silent no-op otherwise, so callers never need to guard.
 */

import posthog from 'posthog-js';
import type { Brand } from '../brand';

const KEY = import.meta.env.VITE_POSTHOG_KEY;

// EU cloud has two hosts and mixing them up fails quietly: events go to
// eu.i.posthog.com, the dashboard and query API live on eu.posthog.com.
const API_HOST = 'https://eu.i.posthog.com';
const UI_HOST = 'https://eu.posthog.com';

const SENSITIVE_PARAMS = ['token', 'access_token', 'refresh_token', 'code', 'email', 'key'];

let started = false;

/**
 * This site's brand keys are its own ('lift'); the app and the dashboard use
 * the internal edition key ('hypertrophy') for the same edition. Translate on
 * the way out so `tpf_brand` means one thing across all three surfaces.
 */
export function editionKey(brand: Brand): string {
  return brand === 'lift' ? 'hypertrophy' : brand;
}

/** Keep credential-shaped query params out of PostHog. */
function scrubUrls(properties: Record<string, unknown>): Record<string, unknown> {
  for (const prop of ['$current_url', '$referrer', '$pathname'] as const) {
    const value = properties[prop];
    if (typeof value !== 'string' || !value.includes('=')) continue;
    try {
      const url = new URL(value, 'https://benchmark.takepointfitness.com');
      let touched = false;
      for (const param of SENSITIVE_PARAMS) {
        if (url.searchParams.has(param)) {
          url.searchParams.set(param, 'redacted');
          touched = true;
        }
      }
      if (touched) {
        properties[prop] = value.startsWith('http')
          ? url.toString()
          : `${url.pathname}${url.search}`;
      }
    } catch {
      /* unparseable — leave it rather than mangle it */
    }
  }
  return properties;
}

export function startAnalytics(brand: Brand): void {
  if (!KEY || typeof window === 'undefined') return;

  // Consent re-granted after a withdrawal in the same page life. posthog-js
  // can't be re-initialised, and stopAnalytics() left it opted out — so
  // returning early here would silently leave analytics dead.
  if (started) {
    try {
      posthog.opt_in_capturing();
      posthog.register({ tpf_surface: 'benchmark', tpf_brand: editionKey(brand) });
    } catch {
      /* non-fatal */
    }
    return;
  }

  started = true;

  posthog.init(KEY, {
    api_host: API_HOST,
    ui_host: UI_HOST,
    defaults: '2026-01-30',

    // Single-page app: navigation never reloads the document, so plain `true`
    // would only ever record the landing view. 'history_change' also fires on
    // pushState/replaceState/popstate — one $pageview per view change.
    capture_pageview: 'history_change',
    capture_pageleave: 'if_capture_pageview',

    autocapture: true,

    // Replay stays off. This site collects bodyweight, lifts and times — the
    // dashboard only needs the `sessions` table (durations, entry/exit pages),
    // which ordinary event capture fills in without recording anyone's screen.
    disable_session_recording: true,

    persistence: 'localStorage+cookie',
    cross_subdomain_cookie: true,

    // Most benchmark users never make an account. Profiles are created on
    // identify() only, so anonymous visitors don't inflate the dashboard's
    // user count.
    person_profiles: 'identified_only',

    before_send: (event) => {
      if (event?.properties) scrubUrls(event.properties);
      return event;
    },
  });

  posthog.register({
    tpf_surface: 'benchmark',
    tpf_brand: editionKey(brand),
  });
}

/** Withdrawn consent — stop capturing and drop what's stored. */
export function stopAnalytics(): void {
  if (!started) return;
  try {
    // Order is load-bearing. reset() internally calls consent.reset(), which
    // wipes PostHog's own opt-out flag — so opting out first and resetting
    // second silently un-opts-out the visitor and capture resumes. Clear the
    // stored identity FIRST, then opt out, so the opt-out is what persists.
    posthog.reset(true);
    posthog.opt_out_capturing();
  } catch {
    /* non-fatal */
  }
}

export function analyticsStarted(): boolean {
  return started;
}

/**
 * Tie events to the Supabase user id — the same id the app identifies with,
 * which is what stitches a benchmark visit to an app account.
 *
 * Deliberately does NOT set `brand`, `tier` or `subscription_status`: those
 * are person properties the app owns (it reads them from `profiles`), and two
 * surfaces writing the same property would just overwrite each other.
 */
export function identifyUser(userId: string, brand: Brand): void {
  if (!started) return;
  try {
    posthog.identify(userId, undefined, {
      // $set_once — records where someone first met TPF without clobbering it
      // on every later visit.
      tpf_first_surface: 'benchmark',
      tpf_first_benchmark_brand: editionKey(brand),
    });
  } catch {
    /* non-fatal */
  }
}

/** On sign-out, or the next person on this browser inherits the last identity. */
export function resetUser(): void {
  if (!started) return;
  try {
    posthog.reset();
  } catch {
    /* non-fatal */
  }
}

export function capture(
  name: string,
  props?: Record<string, string | number | boolean>,
): void {
  if (!started) return;
  try {
    posthog.capture(name, props);
  } catch {
    /* analytics must never break the page */
  }
}
