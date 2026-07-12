/**
 * Browse Standards — Strength-Level-style reference tables. No input needed:
 * pick a sex and read the tier thresholds per benchmark.
 *
 * Uses whatever standards are loaded (synthetic demo today; real Excel later).
 * Benchmarks/WODs with null tiers render "—".
 *
 * 2026-07-13 (round 8) — six tiers, not four: every row shows all seven raw
 * fields (Pass/Novice/Good/Excellent/Intermediate/Advanced/Elite). Lift/hybrid
 * benchmarks populate all seven; legacy operator/WOD-style benchmarks (no
 * `novice`) only populate Pass/Good/Excellent/Elite and render "—" for the
 * rest — same dual-mode split as the scoring engine (see tier-curve.ts).
 */

import type { BenchmarkDef, Sex, ThresholdSet, WodDef } from '../engine/types';
import { wodPublicName, wodPublicSpec } from '../config/wods';
import { formatValue, benchmarkLabel } from './format';

interface Props {
  benchmarks: BenchmarkDef[];
  wods: WodDef[];
  sex: Sex;
  /** Operator standards are unisex — hide the M/F toggle. */
  unisex?: boolean;
  onSexChange: (s: Sex) => void;
}

function cell(t: ThresholdSet, key: keyof ThresholdSet, unit: string): string {
  const v = t[key];
  return v == null ? '—' : formatValue(v, unit);
}

function Table({ rows }: { rows: Array<{ label: string; sub?: string; t: ThresholdSet; unit: string }> }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr>
            {['Benchmark', 'Pass', 'Novice', 'Good', 'Excellent', 'Intermediate', 'Advanced', 'Elite'].map((h, i) => (
              <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '6px 8px', borderBottom: '2px solid var(--primary)', color: 'var(--fg-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td style={{ padding: '7px 8px', borderBottom: '1px solid var(--line)' }}>
                {r.label}
                {r.sub && <div className="subtle" style={{ fontSize: '0.72rem' }}>{r.sub}</div>}
              </td>
              {(['pass', 'novice', 'good', 'excellent', 'intermediate', 'advanced', 'elite'] as const).map((k) => (
                <td key={k} style={{ padding: '7px 8px', textAlign: 'right', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>
                  {cell(r.t, k, r.unit)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BrowseStandards({ benchmarks, wods, sex, unisex, onSexChange }: Props) {
  const liftRows = benchmarks
    .filter((b) => !b.optional)
    .map((b) => ({
      label: benchmarkLabel(b),
      sub: b.normalization === 'bodyweight' ? '×bodyweight' : undefined,
      t: b.thresholds[sex],
      unit: b.unit,
    }));
  const wodRows = wods.map((w) => {
    const load = w.loads?.[0];
    const rx = load && load[sex] != null ? ` · Rx ${load[sex]} kg` : '';
    const sub = `${wodPublicSpec(w.id)}${rx}`;
    return { label: wodPublicName(w.id), sub, t: w.thresholds[sex], unit: w.unit };
  });

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Benchmark standards{unisex ? ' · unisex' : ''}</h2>
        {!unisex && (
          <div className="row">
            <button className={`btn ${sex === 'M' ? '' : 'ghost'}`} onClick={() => onSexChange('M')}>Male</button>
            <button className={`btn ${sex === 'F' ? '' : 'ghost'}`} onClick={() => onSexChange('F')}>Female</button>
          </div>
        )}
      </div>
      <Table rows={liftRows} />
      <h3 style={{ marginTop: 20 }}>Benchmark workouts</h3>
      <Table rows={wodRows} />
      <p className="subtle" style={{ marginTop: 12 }}>
        Thresholds shown are the selected pathway&apos;s tiers at the
        50 / 60 / 70 / 80 / 90 / 100 anchor levels (Excellent is a legacy
        85% checkpoint, kept for reference — WOD-style benchmarks without a
        Novice value still score against it). All values are absolute — kg
        for lifts, times for runs and the erg (fixed-load sports don&apos;t
        scale with bodyweight, so the standards don&apos;t either). Enter
        your stats in the Calculator to see your scores and percentile.
      </p>
    </div>
  );
}
