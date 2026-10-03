/**
 * Email list capture — the lowest-friction conversion below a sign-up. Honest
 * framing: an updates list (new benchmarks, standards revisions, training
 * drops), not a promise of an email we can't yet send. Write-only via Supabase;
 * renders nothing when Supabase isn't configured (no list to join).
 *
 * 2026-10-03 (the TPF app's legal review, H2; docs/LEGAL-FIXES-2026-10-03.md
 * §5): marketing consent is now an explicit, UNTICKED box that "Notify me"
 * needs — separate from the pool box and from sign-up — with a line at the
 * point of collection saying what is kept, why, how to leave, and a link to
 * the privacy notice. "Unsubscribe anytime" had no mechanism behind it in this
 * code; the line now names the route the app's notice already gives. The
 * signed-in account id is no longer stored with the address. Words: src/content/legalCopy.ts.
 */

import { useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { captureEmail } from '../data/remote';
import { event } from '../lib/analytics';
import { EMAIL_LIST_COPY as C, PRIVACY_LINK_TEXT, PRIVACY_URL } from '../content/legalCopy';
import type { Brand } from '../brand';

interface Props {
  brand: Brand;
  pathway?: string;
  /** Test seam: whether there is a list to join. Default: Supabase configured. */
  configured?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type State = 'idle' | 'busy' | 'done' | 'invalid' | 'needsConsent' | 'failed';

export function EmailCapture({ brand, pathway, configured = isSupabaseConfigured }: Props) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<State>('idle');

  if (!configured) return null;
  if (state === 'done') {
    return (
      <div className="card" style={{ marginTop: 16 }}>
        <p style={{ margin: 0 }}>{C.done}</p>
      </div>
    );
  }

  async function submit() {
    if (!EMAIL_RE.test(email)) { setState('invalid'); return; }
    if (!consent) { setState('needsConsent'); return; }
    setState('busy');
    const ok = await captureEmail({ email, brand, source: 'updates', pathway });
    setState(ok ? 'done' : 'failed');
    if (ok) event('email_captured', { brand, pathway: pathway ?? '' });
  }

  const errorText = state === 'invalid' ? C.invalid : state === 'needsConsent' ? C.needsConsent : state === 'failed' ? C.failed : null;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 6 }}>{C.heading}</h3>
      <p className="subtle" style={{ marginTop: 0 }}>{C.pitch}</p>
      <div className="row" style={{ alignItems: 'center' }}>
        <input
          type="email"
          inputMode="email"
          placeholder="you@email.com"
          aria-label="Email address"
          value={email}
          style={{ flex: '1 1 220px' }}
          onChange={(e) => { setEmail(e.target.value); if (state !== 'busy') setState('idle'); }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        />
        <button className="btn" onClick={submit} disabled={state === 'busy' || !consent}>
          {state === 'busy' ? 'Adding…' : C.button}
        </button>
      </div>
      <label className="row subtle" style={{ alignItems: 'flex-start', gap: 8, marginTop: 10 }}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => { setConsent(e.target.checked); if (state === 'needsConsent') setState('idle'); }}
        />
        <span>{C.consent}</span>
      </label>
      <p className="subtle" style={{ margin: '6px 0 0', fontSize: '0.8rem' }}>
        {C.notice}{' '}
        <a className="linklike" href={PRIVACY_URL}>{PRIVACY_LINK_TEXT}</a>
      </p>
      {errorText && (
        <p className="subtle" style={{ marginTop: 8, color: 'var(--alert)' }}>{errorText}</p>
      )}
    </div>
  );
}
