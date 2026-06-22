/**
 * Compact auth control for the top bar: signed-out shows a sign-in/up popover;
 * signed-in shows the email + sign out. When Supabase isn't configured it shows
 * a "coming soon" CTA so the funnel reads correctly in the anonymous preview.
 */

import { useState } from 'react';
import { useAuth } from './AuthContext';

export function AuthPanel() {
  const { configured, ready, user, signIn, signUp, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) return <span className="subtle">…</span>;

  if (user) {
    return (
      <div className="row" style={{ alignItems: 'center' }}>
        <span className="subtle">{user.email}</span>
        <button className="btn ghost" onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }

  async function submit() {
    setBusy(true);
    setMsg(null);
    const res = mode === 'in' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (res.error) setMsg(res.error);
    else if (res.needsConfirmation) setMsg('Check your email to confirm your account.');
    else { setOpen(false); setEmail(''); setPassword(''); }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn" onClick={() => setOpen((o) => !o)}>
        {configured ? 'Sign in / up' : 'Save my results'}
      </button>
      {open && (
        <div className="card" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 280, zIndex: 10 }}>
          {!configured && (
            <p className="subtle" style={{ marginTop: 0 }}>
              Accounts are coming soon. You’ll be able to save results, set targets
              and sync with the Take Point Fitness app.
            </p>
          )}
          <div className="row" style={{ marginBottom: 8 }}>
            <button className={`btn ${mode === 'in' ? '' : 'ghost'}`} onClick={() => setMode('in')}>Sign in</button>
            <button className={`btn ${mode === 'up' ? '' : 'ghost'}`} onClick={() => setMode('up')}>Create account</button>
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!configured} />
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label htmlFor="auth-pw">Password</label>
            <input id="auth-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!configured} />
          </div>
          <button className="btn" style={{ width: '100%' }} onClick={submit} disabled={!configured || busy}>
            {busy ? '…' : mode === 'in' ? 'Sign in' : 'Create account'}
          </button>
          {msg && <p className="subtle" style={{ marginBottom: 0, marginTop: 8 }}>{msg}</p>}
        </div>
      )}
    </div>
  );
}
