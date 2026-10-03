/**
 * ⚠ LEGAL COPY — DRAFTS FOR COUNSEL, NOT LEGAL ADVICE (2026-10-03).
 *
 * Every word this site shows at a point where it collects something — the
 * percentile-pool box, the Save button, the standards-updates email list, the
 * analytics cookie banner — in one place, so counsel reads one file and a
 * change to one is made next to the others. Written to make the site say what
 * the code does (the TPF app's docs/LEGAL_REVIEW_FOR_COUNSEL_2026-10-03.md,
 * H1–H3; this repo's docs/LEGAL-FIXES-2026-10-03.md has every old → new
 * wording). None of it has been read by a lawyer.
 *
 * What it has to stay true to:
 *   - the pool (src/data/pool.ts, migration 0007): results + overall score,
 *     with sex, age band and brand (+ the Operator unit) — no account id, no
 *     bodyweight, the month only; used by benchmark_percentile() and by
 *     scripts/recalibrate*.mjs (a human-reviewed standards check); opt-in;
 *   - the Save (src/data/save.ts): the athlete's details and numbers in their
 *     TPF account, and the mapped 1RMs and race times copied into the TPF
 *     app's profile (src/data/appSync.ts);
 *   - the email list (src/data/remote.ts captureEmail): the address, the
 *     brand, the pathway, the date — no account id since 2026-10-03; nothing
 *     in this repo sends the emails or unsubscribes anyone, so the route out
 *     is the one the app's privacy notice already names (enquiries@);
 *   - the analytics (src/lib/posthog.ts): nothing before Accept; a signed-in
 *     visitor is identify()d by account id, so it is LINKED TO THE ACCOUNT;
 *     no session recording.
 *
 * Pure strings — imports nothing.
 */

/** The privacy notice every collection point links to. The site has no
 *  notice of its own; it uses the TPF app's, which (the legal review notes)
 *  does not yet describe the pool, the saves or the list — an owner action. */
export const PRIVACY_URL = 'https://app.takepointfitness.com/legal/privacy';
export const PRIVACY_LINK_TEXT = 'Privacy notice';

/** Where an email-list subscriber writes to leave — the route the app's
 *  privacy notice ("Marketing Preferences and Communications") names. */
export const UNSUBSCRIBE_EMAIL = 'enquiries@takepointfitness.com';

/** The percentile-pool box beside "Save my results" (H1). Unticked by
 *  default (POOL_OPT_IN_DEFAULT, src/data/pool.ts). */
export const POOL_COPY = {
  label: 'Add my results to the percentile pool (optional)',
  detail:
    'When you save, your results and overall score are sent with your sex and age band — not your account, ' +
    'name, email or bodyweight — and used to work out percentiles and to review TPF’s standards. ' +
    'They aren’t linked to you, so they can’t be found and removed later.',
} as const;

/** One line beside "Save my results" saying what saving does (H1: "The site
 *  also copies 1RMs and race times into the app account"). */
export const SAVE_COPY = {
  button: 'Save my results',
  detail: 'Saves your details and numbers to your TPF account, and copies your 1RMs and race times into the TPF app.',
} as const;

/** The standards-updates email list (H2). The consent box is unticked and
 *  the button needs it; it is separate from the pool box and from sign-up. */
export const EMAIL_LIST_COPY = {
  heading: 'Get standards updates',
  pitch: 'New benchmarks, recalibrated tiers, and training drops. No spam.',
  consent: 'Yes, email me TPF Benchmark updates. I can unsubscribe at any time.',
  notice:
    `We keep your email address (with the site and pathway you signed up from) only to send these updates. ` +
    `To unsubscribe, email ${UNSUBSCRIBE_EMAIL}.`,
  button: 'Notify me',
  done: 'You’re on the list. New standards and training drops only — no spam.',
  invalid: 'Enter a valid email and try again.',
  needsConsent: 'Tick the box to say you’d like these emails.',
  failed: 'Couldn’t add you to the list — please try again.',
} as const;

/** The analytics cookie banner (H3). Both buttons carry the same class. */
export const CONSENT_BANNER_COPY = {
  text:
    'We’d like to measure which parts of the benchmark help — which means an analytics cookie that recognises ' +
    'your browser across our sites. If you sign in, it’s linked to your TPF account. ' +
    'Never sold, never used for ads, no screen recording. Decline and everything here still works.',
  decline: 'Decline',
  accept: 'Accept',
} as const;
