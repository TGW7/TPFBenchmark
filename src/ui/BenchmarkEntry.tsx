/** Log a lift (orm), a time (race_times) or a manual rep/distance/hold value. */

import { useMemo, useState } from 'react';
import { auditEntry, calc1RMVal } from '../engine';
import type { AuditFinding } from '../engine';
import type {
  AthleteProfile,
  BenchmarkDef,
  ManualEntry,
  OrmEntry,
  RaceTimeEntry,
} from '../engine/types';

interface Props {
  benchmarks: BenchmarkDef[];
  profile: AthleteProfile;
  onLogOrm: (e: OrmEntry) => void;
  onLogRaceTime: (e: RaceTimeEntry) => void;
  onLogManual: (e: ManualEntry) => void;
}

function parseTimeInput(s: string): number | null {
  const str = s.trim();
  if (!str) return null;
  if (!str.includes(':')) {
    const n = Number(str);
    return Number.isFinite(n) ? n : null;
  }
  const parts = str.split(':').map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

export function BenchmarkEntry({ benchmarks, profile, onLogOrm, onLogRaceTime, onLogManual }: Props) {
  const list = useMemo(() => benchmarks.filter((b) => !b.optional), [benchmarks]);
  const [id, setId] = useState(list[0]?.id ?? '');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('1');
  const [time, setTime] = useState('');
  const [value, setValue] = useState('');
  const [finding, setFinding] = useState<AuditFinding | null>(null);

  const bench = list.find((b) => b.id === id);
  if (!bench) return null;

  // The absolute value an entry represents, for the reliability audit.
  function auditableValue(): number | null {
    if (!bench) return null;
    if (bench.source === 'orm') {
      const w = Number(weight);
      const r = Number(reps);
      if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(r) || r < 1) return null;
      return calc1RMVal(w, r);
    }
    if (bench.source === 'race_times') return parseTimeInput(time);
    if (bench.source === 'manual') {
      const v = Number(value);
      return Number.isFinite(v) ? v : null;
    }
    return null;
  }

  function submit() {
    if (!bench) return;
    const v = auditableValue();
    if (v == null) {
      setFinding({ benchmarkId: bench.id, level: 'reject', message: 'Enter a valid value.' });
      return;
    }
    const audit = auditEntry(bench, v, profile);
    if (audit.level === 'reject') {
      setFinding(audit);
      return; // block clearly-bad data from the pool
    }
    setFinding(audit.level === 'review' ? audit : null);

    if (bench.source === 'orm') {
      onLogOrm({ benchmarkId: bench.id, weightKg: Number(weight), reps: Number(reps) });
      setWeight('');
    } else if (bench.source === 'race_times') {
      onLogRaceTime({ benchmarkId: bench.id, modality: bench.component, event: bench.id, timeSec: v });
      setTime('');
    } else if (bench.source === 'manual') {
      onLogManual({ benchmarkId: bench.id, value: v });
      setValue('');
    }
  }

  return (
    <div className="card">
      <h2>Log a benchmark</h2>
      <div className="row">
        <div className="field" style={{ flex: '1 1 180px' }}>
          <label htmlFor="bench-select">Benchmark</label>
          <select id="bench-select" value={id} onChange={(e) => { setId(e.target.value); setFinding(null); }}>
            {list.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id} · {b.unit}
              </option>
            ))}
          </select>
        </div>

        {bench.source === 'orm' && (
          <>
            <div className="field">
              <label htmlFor="w">Weight (kg)</label>
              <input id="w" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="r">Reps</label>
              <input id="r" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} />
            </div>
          </>
        )}
        {bench.source === 'race_times' && (
          <div className="field">
            <label htmlFor="t">Time (mm:ss)</label>
            <input id="t" placeholder="22:00" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        )}
        {bench.source === 'manual' && (
          <div className="field">
            <label htmlFor="v">Value ({bench.unit})</label>
            <input id="v" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
        )}

        <button className="btn" onClick={submit}>Log</button>
      </div>

      {finding && (
        <p className={`subtle ${finding.level === 'reject' ? '' : ''}`}
          style={{ marginTop: 8, color: finding.level === 'reject' ? 'var(--alert)' : 'var(--fg)' }}>
          {finding.level === 'reject' ? '⛔ ' : '⚠️ '}
          {finding.message}
          {finding.level === 'review' && ' (logged, but flagged for verification)'}
        </p>
      )}
      <p className="subtle" style={{ marginTop: 8 }}>
        {bench.lowerIsBetter ? 'Lower is better' : 'Higher is better'} ·{' '}
        {bench.normalization === 'bodyweight' ? '×bodyweight, sex-adjusted' : 'absolute, sex-adjusted'}
      </p>
    </div>
  );
}
