/**
 * Normalisation resolver — NEW vs ORS, implemented as a clear seam.
 *
 * Before the tier curve runs, `resolveThresholds(benchmark, profile)` adjusts a
 * benchmark's stored tiers into absolute, athlete-specific thresholds:
 *
 *  - bodyweight benchmarks: tiers are stored as ×bodyweight per sex and are
 *    multiplied by the athlete's logged bodyweight.
 *  - absolute benchmarks (time / reps / distance): tiers are stored per sex and
 *    used as-is.
 *
 * Age-grading (WMA-style Masters multiplier) is scaffolded but OFF by default,
 * behind EngineOptions.ageGrading. It adjusts the RAW value before mapping.
 *
 * No real standards numbers live here.
 */

import type {
  AthleteProfile,
  BenchmarkDef,
  EngineOptions,
  ThresholdSet,
} from './types';

/** Multiply a (possibly null) stored threshold by a factor, preserving null. */
function scale(value: number | null, factor: number): number | null {
  return value == null ? null : value * factor;
}

/**
 * Resolve a benchmark's per-sex stored thresholds into absolute thresholds for
 * this athlete. Bodyweight defs are multiplied by bodyweight; absolute defs are
 * returned unchanged. Null anchors stay null (benchmark not yet populated).
 */
export function resolveThresholds(
  benchmark: BenchmarkDef,
  profile: AthleteProfile,
): ThresholdSet {
  const stored = benchmark.thresholds[profile.sex];
  if (benchmark.normalization === 'bodyweight') {
    const bw = profile.bodyweightKg;
    return {
      pass: scale(stored.pass, bw),
      good: scale(stored.good, bw),
      excellent: scale(stored.excellent, bw),
      elite: scale(stored.elite, bw),
    };
  }
  // absolute
  return { ...stored };
}

/**
 * WMA-style Masters age-grading scaffold. Returns a multiplier applied to the
 * raw value before mapping. Default (flag off, or no age) is 1 — a no-op.
 *
 * TODO: drop in real WMA age factors via codegen. The 1.0 here is a neutral
 * identity, not a standard.
 */
export function ageGradeFactor(
  _profile: AthleteProfile,
  options: EngineOptions = {},
): number {
  if (!options.ageGrading) return 1;
  // Placeholder identity until WMA factor tables are wired in.
  return 1;
}

/** Apply age-grading to a raw value (no-op unless the flag is on). */
export function applyAgeGrade(
  raw: number,
  profile: AthleteProfile,
  options: EngineOptions = {},
): number {
  return raw * ageGradeFactor(profile, options);
}

/**
 * Estimate a one-rep max from a weight × reps set (Epley). STUB: this is a
 * generic estimator formula, not a standard — swap for your preferred model.
 */
export function calc1RMVal(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  return weightKg * (1 + reps / 30);
}
