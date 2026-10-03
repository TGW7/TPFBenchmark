/**
 * Percentiles + age bands.
 *
 * There is ONE way to get a percentile: percentileRank(value, samples) — a TRUE
 * percentile against a real sample distribution, the hook for the user-data
 * pool (see audit.ts and stats.ts; production reads it server-side through
 * benchmark_percentile()). It returns null until there are enough samples for
 * the (sex, age-band) cell, and then no percentile is shown.
 *
 * 2026-10-02 — `estimatedPercentile(score)` was REMOVED. It mapped a tier score
 * onto a "percentile" through fixed knots (pass ≈ 50th, good ≈ 70th, excellent
 * ≈ 85th, elite ≈ 99th), and the site showed that as "≈ Nth percentile" whenever
 * the pool had no data. Since the 2026-10-02 standards rebuild every tier is
 * TPF's own standard (docs/STANDARDS.md), not a population percentile, so the
 * mapping described no population at all. Do not reintroduce a score-to-
 * percentile estimate; src/ui/resultCopy.ts states the display rule and
 * src/test/no-percentile-claims.test.ts pins it.
 */

import type { AthleteProfile } from './types';

export type AgeBand = 'u20' | '20-29' | '30-39' | '40-49' | '50-59' | '60+';

export function ageBand(ageYears?: number): AgeBand | null {
  if (ageYears == null) return null;
  if (ageYears < 20) return 'u20';
  if (ageYears < 30) return '20-29';
  if (ageYears < 40) return '30-39';
  if (ageYears < 50) return '40-49';
  if (ageYears < 60) return '50-59';
  return '60+';
}

export function profileCell(profile: AthleteProfile): string {
  return `${profile.sex}:${ageBand(profile.ageYears) ?? 'all'}`;
}

/**
 * True percentile rank of a value within a real sample distribution.
 * `lowerIsBetter` flips the direction (faster time = higher percentile).
 * Returns null below `minSamples` — don't show a percentile we can't support.
 */
export function percentileRank(
  value: number,
  samples: number[],
  lowerIsBetter = false,
  minSamples = 30,
): number | null {
  if (samples.length < minSamples) return null;
  const better = samples.filter((v) => (lowerIsBetter ? v > value : v < value)).length;
  const equal = samples.filter((v) => v === value).length;
  // mid-rank for ties
  return ((better + equal / 2) / samples.length) * 100;
}
