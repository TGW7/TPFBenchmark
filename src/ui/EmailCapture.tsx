/**
 * Email list capture — the lowest-friction conversion below a sign-up. Honest
 * framing: an updates list (new benchmarks, standards revisions, training
 * drops), not a promise of an email we can't yet send. Write-only via Supabase;
 * renders nothing when Supabase isn't configured (no list to join).
 */

import { useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { captureEmail } from '../data/remote';
import { event } from '../lib/analytics';
import type { Brand } from '../brand';

interface Props {
  brand: Brand;
  pathway?: string;
  userId?: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailCapture({ brand, pathway, userId }: Props) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  if (!isSupabaseConfigured) return null;
  if (state === 'done') {
    return (
      <div className="card" style={{ marginTop: 16 }}>
        <p style={{ margin: 0 }}>You’re on the list. New standards and training drops only — no spam.</p>
      </div>
    );
  }

  async function submit() {
    if (!EMAIL_RE.test(email)) { setState('error'); return; }
    setState('busy');
    const ok = await captureEmail({ email, brand, source: 'updates', pathway, userId });
    setState(ok ? 'done' : 'error');
    if (ok) event('email_captured', { brand, pathway: pathway ?? '' });
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 6 }}>Get standards updates</h3>
      <p className="subtle" style={{ marginTop: 0 }}>
        New benchmarks, recalibrated tiers, and training drops. No spam, unsubscribe anytime.
      </p>
      <div className="row" style={{ alignItems: 'center' }}>
        <input
          type="email"
          inputMode="email"
          placeholder="you@email.com"
          value={email}
          style={{ flex: '1 1 220px' }}
          onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle'); }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        />
        <button className="btn" onClick={submit} disabled={state === 'busy'}>
          {state === 'busy' ? 'Adding…' : 'Notify me'}
        </button>
      </div>
      {state === 'error' && (
        <p className="subtle" style={{ marginTop: 8, color: 'var(--alert)' }}>
          Enter a valid email and try again.
        </p>
      )}
    </div>
  );
}
