/**
 * Percentile estimation + age bands.
 *
 * Two ways to get a percentile:
 *   1. estimatedPercentile(score) — derive an ESTIMATE from the tier curve, using
 *      the standards methodology's anchoring (pass≈50th, good≈70th, excellent≈85th,
 *      elite≈top 5%). Works today with zero population data.
 *   2. percentileRank(value, samples) — a TRUE percentile against a real sample
 *      distribution. This is the hook for the user-data pool (see audit.ts); it
 *      returns null until there are enough samples for the (sex, age-band) cell.
 *
 * The overall HRS is a pathway-weighted blend of tier %s, so estimatedPercentile
 * of the overall is an ESTIMATE of where the athlete sits, not a measured
 * composite percentile. A measured one needs the data pool.
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

// tier % -> percentile knots, from the standards methodology.
const KNOTS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [50, 50], // pass
  [70, 70], // good
  [85, 85], // excellent
  [95, 90], // excellent→elite midpoint
  [100, 95], // elite ≈ top 5%
  [110, 99], // bonus ceiling
];

/** Estimate a population percentile (0–99.9) from an HRS score (0–110). */
export function estimatedPercentile(score: number | null): number | null {
  if (score == null) return null;
  const s = Math.max(0, Math.min(110, score));
  for (let i = 1; i < KNOTS.length; i++) {
    const [x0, y0] = KNOTS[i - 1];
    const [x1, y1] = KNOTS[i];
    if (s <= x1) return y0 + ((s - x0) / (x1 - x0)) * (y1 - y0);
  }
  return 99.9;
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
