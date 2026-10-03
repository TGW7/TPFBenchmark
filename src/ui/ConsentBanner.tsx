/**
 * Analytics consent, deny-by-default. Nothing is tracked while this is on
 * screen — PostHog only boots after "Accept".
 *
 * Both buttons look the same weight deliberately: a loud Accept beside a faded
 * Decline is the pattern regulators call out, and it would fill the data with
 * clicks nobody meant.
 *
 * 2026-10-03 — that comment was not true of the code: Accept was `btn` (the
 * filled primary) and Decline `btn ghost` (an outline). The TPF app's legal
 * review (H3) found it; the app fixed its own bar the same day. Now ONE class
 * for both (BANNER_BUTTON_CLASS), pinned by src/test/legal-copy.test.ts. The
 * ICO's guidance: refusing must be as easy as accepting, and an accept option
 * more prominent than the refuse option is listed as bad practice.
 *
 * The words live in src/content/legalCopy.ts (for counsel). They stopped
 * saying "never attach your name or email to it": a signed-in visitor IS
 * identify()d by account id (src/lib/posthog.ts identifyUser), so the cookie
 * is linked to the account, and the banner now says so.
 */

import { useEffect, useState } from 'react';
import type { Brand } from '../brand';
import { readConsent, writeConsent, type Consent } from '../lib/consent';
import { startAnalytics, stopAnalytics } from '../lib/posthog';
import { CONSENT_BANNER_COPY as C, PRIVACY_LINK_TEXT, PRIVACY_URL } from '../content/legalCopy';

/** The one class both buttons carry — equal weight (H3). */
export const BANNER_BUTTON_CLASS = 'btn ghost';

export function ConsentBanner({ brand }: { brand: Brand }) {
  const [consent, setConsent] = useState<Consent>('unset');

  // Read after mount rather than during render — keeps the first paint
  // identical for everyone and avoids touching document.cookie in a render.
  useEffect(() => {
    const stored = readConsent();
    setConsent(stored);
    if (stored === 'granted') startAnalytics(brand);
  }, [brand]);

  if (consent !== 'unset') return null;

  function accept() {
    writeConsent('granted');
    setConsent('granted');
    startAnalytics(brand);
  }

  function decline() {
    writeConsent('denied');
    setConsent('denied');
    stopAnalytics();
  }

  return (
    <div
      role="dialog"
      aria-label="Analytics consent"
      style={{
        position: 'fixed',
        insetInline: 0,
        bottom: 0,
        zIndex: 60,
        background: 'var(--surface)',
        borderTop: '1px solid var(--line)',
        padding: '16px 20px',
      }}
    >
      <div
        className="row"
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          gap: 20,
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <p style={{ margin: 0, maxWidth: 640, fontSize: '0.85rem', color: 'var(--fg-muted)' }}>
          {C.text}{' '}
          <a className="linklike" href={PRIVACY_URL}>{PRIVACY_LINK_TEXT}</a>
        </p>
        <div className="row" style={{ gap: 10 }}>
          <button type="button" className={BANNER_BUTTON_CLASS} onClick={decline}>{C.decline}</button>
          <button type="button" className={BANNER_BUTTON_CLASS} onClick={accept}>{C.accept}</button>
        </div>
      </div>
    </div>
  );
}
