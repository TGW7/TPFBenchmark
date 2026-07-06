/** Display helpers + human labels for the UI. */

import type { ComponentId } from '../engine/types';

export const COMPONENT_LABELS: Record<ComponentId, string> = {
  running: 'Running',
  erg_engine: 'Erg Engine',
  lower_strength: 'Lower Strength',
  upper_strength: 'Upper Strength',
  olympic: 'Olympic',
  power: 'Power',
  gymnastics: 'Gymnastics',
  core_endurance: 'Core Endurance',
  grip: 'Grip',
  rucking: 'Rucking',
  upper_endurance: 'Upper Endurance',
  stability: 'Stability',
  swimming: 'Swimming',
};

export const componentLabel = (c: ComponentId): string => COMPONENT_LABELS[c] ?? c;

const BENCH_LABEL_OVERRIDES: Record<string, string> = {
  back_squat_1rm: 'Back Squat', front_squat_1rm: 'Front Squat', deadlift_1rm: 'Deadlift', bench_1rm: 'Bench Press',
  strict_press_1rm: 'Strict Press', power_clean_1rm: 'Power Clean',
  snatch_1rm: 'Snatch', clean_jerk_1rm: 'Clean & Jerk',
  run_1mi: '1-mile run', run_5k: '5k run', row_2k: '2k row', row_500m: '500m row',
  hspu: 'HSPU', t2b: 'T2B', du_unbroken: 'Double-unders', max_mu: 'Muscle-ups',
  strict_pullups: 'Strict Pull-ups', plank_hold: 'Plank', broad_jump: 'Broad Jump',
  grip_deadhang: 'Dead Hang', ruck_time: 'Ruck',
};

/**
 * A short display label for a benchmark. Explicit overrides win first, so a
 * lift's real name is never shadowed by its `notes` annotation (e.g. Deadlift's
 * "Contested in PL"). Operator units — not in the override map — keep their real
 * name in `notes`, so that fallback still applies to them.
 */
export function benchmarkLabel(b: { id: string; meta?: { notes?: string } }): string {
  if (BENCH_LABEL_OVERRIDES[b.id]) return BENCH_LABEL_OVERRIDES[b.id];
  const note = b.meta?.notes;
  if (note && note.length <= 24 && !/[.;,]/.test(note)) return note; // operator stores the real name here
  return b.id.replace(/_1rm$/, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatPercent(p: number | null): string {
  return p == null ? '—' : `${Math.round(p)}%`;
}

/** Traffic-light colour for a 0–100+ score, banded on the scoring tiers. */
export function scoreColor(value: number | null): string {
  if (value == null) return 'var(--fg-muted)';
  if (value < 50) return '#d92626'; // below pass — red
  if (value < 70) return '#de8a10'; // pass — amber
  if (value < 85) return '#6ba32b'; // good — lime
  if (value < 100) return '#158a44'; // excellent — green
  return '#0d9488'; // elite (top ~5%) — teal
}

/** Named scoring tier for a 0–100+ score. Elite = meeting the elite standard (≈ top 5%). */
export function scoreTier(value: number | null): string | null {
  if (value == null) return null;
  if (value < 50) return 'Below pass';
  if (value < 70) return 'Pass';
  if (value < 85) return 'Good';
  if (value < 100) return 'Excellent';
  return 'Elite';
}

export function formatSeconds(totalSec: number): string {
  const sign = totalSec < 0 ? '-' : '';
  const s = Math.abs(totalSec);
  const h = Math.floor(s / 3600);
  const rest = s - h * 3600;
  const m = Math.floor(rest / 60);
  const remSec = rest - m * 60;
  const remStr = Number.isInteger(remSec) ? String(remSec).padStart(2, '0') : remSec.toFixed(1).padStart(4, '0');
  return h > 0 ? `${sign}${h}:${String(m).padStart(2, '0')}:${remStr}` : `${sign}${m}:${remStr}`;
}

/** Format a raw value in its native unit for display. */
export function formatValue(value: number, unit: string): string {
  if (unit.includes(':')) return formatSeconds(value);
  if (unit === 'xBW') return `${value.toFixed(2)}×BW`;
  if (unit === 'cm') return `${Math.round(value)} cm`;
  if (unit === 'reps') return `${Math.round(value)} reps`;
  if (unit === 'rounds') return `${value} rounds`;
  return String(value);
}

/** Signed one-decimal number for the Capacity Index. */
export function formatSigned(n: number | null): string {
  if (n == null) return '—';
  const v = Math.round(n * 10) / 10;
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}`;
}

/** Ordinal percentile, e.g. 73 -> "73rd". */
export function formatPercentile(p: number | null): string {
  if (p == null) return '—';
  const r = Math.round(p);
  const mod100 = r % 100;
  const mod10 = r % 10;
  let suffix = 'th';
  if (mod100 < 11 || mod100 > 13) {
    if (mod10 === 1) suffix = 'st';
    else if (mod10 === 2) suffix = 'nd';
    else if (mod10 === 3) suffix = 'rd';
  }
  return `${r}${suffix}`;
}
