/** Display helpers + human labels for the UI. */

import type { ComponentId, ThresholdSet } from '../engine/types';
import { BENCHMARK_DISPLAY } from '../config/benchmarkDisplay';

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
  cycling: 'Cycling',
  // 2026-10-03 — the HABS-only components (the TPF app's labels; the HABS
  // brands read src/config/habsDisplay.ts, which also relabels
  // lower_strength as the app's "Lower-body strength").
  upper_push: 'Upper-body push',
  upper_pull: 'Upper-body pull',
  run_intensity: 'Running (intensity)',
  run_distance: 'Running (distance)',
  erg: 'Rowing / erg',
};

export const componentLabel = (c: ComponentId): string => COMPONENT_LABELS[c] ?? c;

/**
 * In-app text deliberately differs from BENCHMARK_DISPLAY's canonical/SEO
 * label for a few ids — brevity in a dense table (HSPU, T2B, Plank), the
 * CrossFit-precise term over the more-searched public one (Strict Press vs.
 * Overhead Press), or inline-sentence style over a heading's Title Case
 * (run/row/swim/bike). Not missed duplication — everything else comes
 * straight from the shared map.
 */
const LOCAL_LABEL_OVERRIDES: Record<string, string> = {
  strict_press_1rm: 'Strict Press',
  hspu: 'HSPU', t2b: 'T2B', plank_hold: 'Plank',
  run_1mi: '1-mile run', run_5k: '5k run', run_10k: '10k run', run_half: 'Half marathon',
  row_2k: '2k row', row_500m: '500m row',
  swim_400m: '400m swim', swim_1500m: '1500m swim', bike_20k: '20km bike TT', bike_40k: '40km bike TT',
  // 2026-10-03 — two Operator ids. Plan 55 gave these rows the app's longer
  // names (the unit pages print them in full), which are too long for the
  // `notes` fallback below, so without an entry the grid would show the id:
  // "500 M Swim" for SEAL and Pararescue (it showed "500 m swim" before), and
  // for the Fan Dance an id that still spells the old 35 lb load — the id is
  // kept because ids are stored (submissions, logs, the app sync).
  '500_m_swim': '500 m swim',
  fan_dance_24_km_35_lb_rifle_optional: 'Fan Dance (18 kg + rifle) — optional',
  // 2026-10-03 — Operator names the fallback below refuses (a full stop or a
  // comma in the name, or over 24 characters), which the grid showed as the
  // title-cased id ("1 5 Mile Run").
  '1_5_mile_run': '1.5-mile run',
  '8_mile_loaded_march_25_kg': '8-mile march (25 kg)',
  bleep_test_with_armour_vest_7_kg: 'Bleep test (vest)',
  vested_1_mile_run_7_kg: 'Vested 1-mile (7 kg)',
  casualty_drag_75_kg_dummy_15_m: 'Casualty drag (75 kg)',
};

/**
 * A short display label for a benchmark. Local overrides win first, then the
 * shared canonical label, so a lift's real name is never shadowed by its
 * `notes` annotation (e.g. Deadlift's "Contested in PL"). Operator units —
 * not in either map — keep their real name in `notes`, so that fallback
 * still applies to them.
 */
export function benchmarkLabel(b: { id: string; meta?: { notes?: string } }): string {
  if (LOCAL_LABEL_OVERRIDES[b.id]) return LOCAL_LABEL_OVERRIDES[b.id];
  if (BENCHMARK_DISPLAY[b.id]) return BENCHMARK_DISPLAY[b.id].label;
  const note = b.meta?.notes;
  if (note && note.length <= 24 && !/[.;,]/.test(note)) return note; // operator stores the real name here
  return b.id.replace(/_1rm$/, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** HABS/ORS numbers are SCORES on a 0–100 scale, not percentages — render
 *  them bare (2026-08-07, owner). Use plain string interpolation for the few
 *  genuine percentages (coverage, weights). */
export function formatScore(p: number | null): string {
  return p == null ? '—' : String(Math.round(p));
}

/**
 * Traffic-light colour for a 0–100+ score, banded on the scoring tiers.
 *
 * 2026-07-13 (round 8) — six bands, not four (owner: the old jumps between
 * named tiers felt too big; supersedes an earlier five-band attempt):
 * Beginner 50 / Novice 60 / Experienced 70 / Intermediate 80 / Advanced 90 /
 * Elite 100 — same naming as the app's `TIER_LABEL`. Benchmarks still on the
 * legacy four-tier curve (no `novice` value — operator/WOD) score cleanly
 * into one of these bands too, just landing on whichever side of
 * 60/70/80/90 their continuous score happens to fall — the bands are a
 * display convenience, not tied to which curve produced the number.
 */
export function scoreColor(value: number | null): string {
  if (value == null) return 'var(--fg-muted)';
  if (value < 50) return '#d92626'; // below beginner — red
  if (value < 60) return '#de6a10'; // beginner — orange
  if (value < 70) return '#d9a017'; // novice — amber
  if (value < 80) return '#a8a02a'; // experienced — olive
  if (value < 90) return '#6ba32b'; // intermediate — lime
  if (value < 100) return '#158a44'; // advanced — green
  return '#0d9488'; // elite — teal
}

/** Named scoring tier for a 0–100+ score. Elite = meeting TPF's elite standard.
 *  (A tier is TPF's own standard, not a population percentile — 2026-10-02.) */
export function scoreTier(value: number | null): string | null {
  if (value == null) return null;
  if (value < 50) return 'Below Beginner';
  if (value < 60) return 'Beginner';
  if (value < 70) return 'Novice';
  if (value < 80) return 'Experienced';
  if (value < 90) return 'Intermediate';
  if (value < 100) return 'Advanced';
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
  // A tier threshold can be fractional (interpolated — e.g. max_mu F novice
  // 1.5): show one decimal rather than rounding onto its neighbour tier.
  if (unit === 'reps') return `${Number.isInteger(value) ? value : value.toFixed(1)} reps`;
  if (unit === 'rounds') return `${value} rounds`;
  // 2026-10-02 — Operator times and holds are stored as plain seconds
  // ('sec'): a 13:30 run read "810". A minute or more reads as m:ss; a short
  // sprint or hold keeps seconds.
  if (unit === 'sec') return value >= 60 ? formatSeconds(value) : `${Number.isInteger(value) ? value : value.toFixed(1)} s`;
  return String(value);
}

/**
 * One monotonic tier column set for display tables, using the same ladder
 * names as the score badge (`scoreTier`) and the SEO pages' TIER6_LABEL:
 * Beginner(pass) / Novice / Experienced(good) / Intermediate / Advanced /
 * Elite — not the seven raw ThresholdSet fields in storage order. Six-tier
 * benchmarks (`novice` populated) drop `excellent` entirely — it's vestigial
 * there, never read by the scoring engine (src/engine/tier-curve.ts), and
 * showing it at its legacy position breaks the visible ordering (e.g. a back
 * squat reading 80/100/120/155/145/165/190 — a real dip, since 155 doesn't
 * sit between 120 and 145). Legacy four-tier benchmarks (no `novice` — now
 * only the Operator standards) have no Intermediate/Advanced distinction, so
 * their one real upper-mid tier (`excellent`) is shown under Advanced, the
 * closer of the two anchors (85% vs. Intermediate's 80% / Advanced's 90%) —
 * Novice and Intermediate render null (displayed as "—") for these rows.
 */
export const TIER_COLUMNS = ['Beginner', 'Novice', 'Experienced', 'Intermediate', 'Advanced', 'Elite'] as const;

export function tierCells(t: ThresholdSet, unit: string): string[] {
  const raw = t.novice != null
    ? [t.pass, t.novice, t.good, t.intermediate, t.advanced, t.elite]
    : [t.pass, null, t.good, null, t.excellent, t.elite];
  return raw.map((v) => (v == null ? '—' : formatValue(v, unit)));
}

/** Signed one-decimal number for the Capacity Index. */
export function formatSigned(n: number | null): string {
  if (n == null) return '—';
  const v = Math.round(n * 10) / 10;
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}`;
}

/** Ordinal percentile, e.g. 73 -> "73rd". Only ever for a MEASURED pool
 *  percentile (src/ui/resultCopy.ts) — never for a tier score. */
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
