/**
 * Analytics consent, deny-by-default. Nothing is tracked while this is on
 * screen — PostHog only boots after "Accept".
 *
 * Both buttons look the same weight deliberately: a loud Accept beside a faded
 * Decline is the pattern regulators call out, and it would fill the data with
 * clicks nobody meant.
 */

import { useEffect, useState } from 'react';
import type { Brand } from '../brand';
import { readConsent, writeConsent, type Consent } from '../lib/consent';
import { startAnalytics, stopAnalytics } from '../lib/posthog';

const PRIVACY_URL = 'https://app.takepointfitness.com/legal/privacy';

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
          We&rsquo;d like to measure which parts of the benchmark actually help
          &mdash; which means a cookie that recognises your browser across our
          sites. We never sell it and never attach your name or email to it.
          Decline and everything here still works.{' '}
          <a className="linklike" href={PRIVACY_URL}>Privacy policy</a>
        </p>
        <div className="row" style={{ gap: 10 }}>
          <button className="btn ghost" onClick={decline}>Decline</button>
          <button className="btn" onClick={accept}>Accept</button>
        </div>
      </div>
    </div>
  );
}
