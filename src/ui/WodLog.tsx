/** Log a benchmark WOD result with its Rx load + scaling (rx / scaled / incomplete). */

import { useState } from 'react';
import { wodPublicName } from '../config/wods';
import type { Sex, WodDef, WodEntry, WodScaling } from '../engine/types';

interface Props {
  wods: WodDef[];
  sex: Sex;
  onLogWod: (e: WodEntry) => void;
}

const SCALINGS: WodScaling[] = ['rx', 'scaled', 'incomplete'];

function parseResult(s: string, unit: string): number | null {
  const str = s.trim();
  if (!str) return null;
  if (unit.includes(':')) {
    if (!str.includes(':')) {
      const n = Number(str);
      return Number.isFinite(n) ? n : null;
    }
    const parts = str.split(':').map((p) => Number(p));
    if (parts.some((n) => Number.isNaN(n))) return null;
    return parts.reduce((acc, n) => acc * 60 + n, 0);
  }
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}

/** Prescribed Rx load text for a WOD + sex, e.g. "Rx 43 kg · thruster" or "Bodyweight". */
function rxLoadText(wod: WodDef, sex: Sex): string | null {
  const load = wod.loads?.[0];
  if (!load) return null;
  const kg = load[sex];
  return kg != null ? `Rx ${kg} kg · ${load.movement.toLowerCase()}` : load.movement;
}

export function WodLog({ wods, sex, onLogWod }: Props) {
  const [id, setId] = useState(wods[0]?.id ?? '');
  const [result, setResult] = useState('');
  const [scaling, setScaling] = useState<WodScaling>('rx');

  const wod = wods.find((w) => w.id === id);
  if (!wod) return null;
  const loadText = rxLoadText(wod, sex);

  function submit() {
    if (!wod) return;
    const val = parseResult(result, wod.unit);
    if (val == null) return;
    onLogWod({ wodId: wod.id, value: val, scaling });
    setResult('');
  }

  return (
    <div className="card">
      <h2>Log a WOD</h2>
      <div className="row">
        <div className="field" style={{ flex: '1 1 140px' }}>
          <label htmlFor="wod-select">WOD</label>
          <select id="wod-select" value={id} onChange={(e) => setId(e.target.value)}>
            {wods.map((w) => (
              <option key={w.id} value={w.id}>
                {wodPublicName(w.id)} · {w.unit}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="wod-result">Result ({wod.unit})</label>
          <input id="wod-result" value={result} onChange={(e) => setResult(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="wod-scaling">Scaling</label>
          <select id="wod-scaling" value={scaling} onChange={(e) => setScaling(e.target.value as WodScaling)}>
            {SCALINGS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button className="btn" onClick={submit}>Log</button>
      </div>
      {loadText && (
        <p style={{ margin: '8px 0 0' }}>
          <span className="pill">{loadText}</span>
        </p>
      )}
      <p className="subtle" style={{ marginTop: 8 }}>
        Rx = prescribed load (full curve) · scaled = lighter load (capped at good, 70%) ·
        incomplete = scored on rep-equivalent. WODs are display-only (0% of the core score in v1).
      </p>
    </div>
  );
}
