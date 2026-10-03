/**
 * "Save my results", what saving does, and the percentile-pool box — for a
 * signed-in athlete (2026-10-03; the TPF app's legal review, H1;
 * docs/LEGAL-FIXES-2026-10-03.md §3).
 *
 * The pool box used to sit apart from Save, ticked by default, reading "add
 * your anonymised numbers to the percentile pool" — and it showed to
 * signed-out visitors too, for whom it did nothing (only a Save contributes).
 * Now it sits beside the Save that acts on it, starts unticked, and says what
 * is sent, what for, and that it cannot be taken back. Words:
 * src/content/legalCopy.ts (for counsel).
 */

import { POOL_COPY, PRIVACY_LINK_TEXT, PRIVACY_URL, SAVE_COPY } from '../content/legalCopy';

interface Props {
  onSave: () => void;
  saving: boolean;
  /** The outcome line from src/data/save.ts, or null. */
  saveMsg: string | null;
  /** True when the last save failed — the line reads as an error. */
  saveFailed: boolean;
  /** Whether the pool exists on this deployment (Supabase configured). */
  poolAvailable: boolean;
  contribute: boolean;
  onContribute: (v: boolean) => void;
}

export function SaveControls({ onSave, saving, saveMsg, saveFailed, poolAvailable, contribute, onContribute }: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="row" style={{ alignItems: 'center' }}>
        <button className="btn" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : SAVE_COPY.button}</button>
        {saveMsg && (
          <span className="subtle" role="status" style={saveFailed ? { color: 'var(--alert)' } : undefined}>{saveMsg}</span>
        )}
      </div>
      <p className="subtle" style={{ margin: '6px 0 0', fontSize: '0.8rem' }}>{SAVE_COPY.detail}</p>
      {poolAvailable && (
        <div style={{ marginTop: 10 }}>
          <label className="row subtle" style={{ alignItems: 'flex-start', gap: 8 }}>
            <input type="checkbox" checked={contribute} onChange={(e) => onContribute(e.target.checked)} />
            <span>{POOL_COPY.label}</span>
          </label>
          <p className="subtle" style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>
            {POOL_COPY.detail}{' '}
            <a className="linklike" href={PRIVACY_URL}>{PRIVACY_LINK_TEXT}</a>
          </p>
        </div>
      )}
    </div>
  );
}
