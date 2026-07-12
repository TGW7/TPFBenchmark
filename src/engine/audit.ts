/**
 * Input auditing — first-line data-reliability for the user-submitted data pool.
 *
 * This is TIER 1 (input-time) of the wider reliability design:
 *   T1  input validation     — sanity bounds + plausibility + cross-benchmark
 *                              consistency  (this file, runs client + server)
 *   T2  statistical outliers — robust per-(benchmark,sex,age,bw-band) MAD/IQR
 *                              filtering once a pool exists  (server, ongoing)
 *   T3  trust weighting      — per-submission confidence; percentiles use
 *                              trust-weighted quantiles  (trustScore here)
 *   T4  verification         — optional video flag for high-percentile claims
 *
 * IMPORTANT: the bounds below are DATA-INTEGRITY GUARDRAILS (impossible/implausible
 * human extremes), NOT performance standards. They are not the pass/good/excellent
 * /elite percentile thresholds (those live in the Excel master and stay null).
 * Tune freely; they can move to config later.
 */

import type { AthleteProfile, BenchmarkDef } from './types';

export type AuditLevel = 'ok' | 'review' | 'reject';

export interface AuditFinding {
  benchmarkId: string;
  level: AuditLevel;
  message?: string;
}

/** Bounds in the benchmark's STORED unit (×BW for bodyweight defs, else native). */
interface Bounds {
  hardMin: number;
  hardMax: number;
  softMin?: number;
  softMax?: number;
}

/** Impossible-outside (reject) / implausible-outside (review) guardrails. */
export const SANITY_BOUNDS: Record<string, Bounds> = {
  // Lifts — ABSOLUTE kg (2026-07-12: standards converted from ×BW to
  // absolute; hard maxes sit just past all-time raw records).
  back_squat_1rm: { hardMin: 20, hardMax: 500, softMax: 320 },
  front_squat_1rm: { hardMin: 15, hardMax: 420, softMax: 280 },
  deadlift_1rm: { hardMin: 20, hardMax: 505, softMax: 360 },
  bench_1rm: { hardMin: 15, hardMax: 355, softMax: 230 },
  strict_press_1rm: { hardMin: 10, hardMax: 230, softMax: 140 },
  snatch_1rm: { hardMin: 10, hardMax: 230, softMax: 170 },
  clean_jerk_1rm: { hardMin: 10, hardMax: 275, softMax: 200 },
  power_clean_1rm: { hardMin: 10, hardMax: 250, softMax: 180 },
  // times (seconds)
  run_1mi: { hardMin: 220, hardMax: 1200, softMin: 240 },
  run_5k: { hardMin: 740, hardMax: 3600, softMin: 780 },
  row_2k: { hardMin: 320, hardMax: 720, softMin: 350 },
  row_500m: { hardMin: 60, hardMax: 180, softMin: 65 },
  plank_hold: { hardMin: 0, hardMax: 3600, softMax: 1200 },
  // reps / distance
  broad_jump: { hardMin: 30, hardMax: 400, softMax: 360 },
  strict_pullups: { hardMin: 0, hardMax: 100, softMax: 60 },
  hspu: { hardMin: 0, hardMax: 100, softMax: 60 },
  t2b: { hardMin: 0, hardMax: 150, softMax: 100 },
  du_unbroken: { hardMin: 0, hardMax: 1000, softMax: 500 },
  max_mu: { hardMin: 0, hardMax: 100, softMax: 50 },
};

/** Plausible human bodyweight range (kg). */
export const BODYWEIGHT_BOUNDS: Bounds = { hardMin: 30, hardMax: 300, softMin: 40, softMax: 200 };

/** Convert an absolute raw value into the benchmark's stored unit for bounding. */
function toStoredUnit(benchmark: BenchmarkDef, rawAbsolute: number, profile: AthleteProfile): number {
  if (benchmark.normalization === 'bodyweight' && profile.bodyweightKg > 0) {
    return rawAbsolute / profile.bodyweightKg;
  }
  return rawAbsolute;
}

/**
 * Validate one entry. `rawAbsolute` is in the benchmark's native unit as the user
 * enters it (kg for lifts, seconds for times, reps/cm for manual).
 */
export function auditEntry(
  benchmark: BenchmarkDef,
  rawAbsolute: number,
  profile: AthleteProfile,
): AuditFinding {
  const id = benchmark.id;
  if (!Number.isFinite(rawAbsolute) || rawAbsolute < 0) {
    return { benchmarkId: id, level: 'reject', message: 'Not a valid number.' };
  }
  const bounds = SANITY_BOUNDS[id];
  if (!bounds) return { benchmarkId: id, level: 'ok' };

  const v = toStoredUnit(benchmark, rawAbsolute, profile);
  if (v < bounds.hardMin || v > bounds.hardMax) {
    return { benchmarkId: id, level: 'reject', message: 'Outside the possible human range — please re-check.' };
  }
  if ((bounds.softMin != null && v < bounds.softMin) || (bounds.softMax != null && v > bounds.softMax)) {
    return { benchmarkId: id, level: 'review', message: 'Unusually high/low — flagged for verification.' };
  }
  return { benchmarkId: id, level: 'ok' };
}

/** Validate the athlete's bodyweight. */
export function auditBodyweight(bodyweightKg: number): AuditFinding {
  const b = BODYWEIGHT_BOUNDS;
  if (!Number.isFinite(bodyweightKg) || bodyweightKg < b.hardMin || bodyweightKg > b.hardMax) {
    return { benchmarkId: 'bodyweight', level: 'reject', message: 'Bodyweight looks implausible.' };
  }
  if ((b.softMin != null && bodyweightKg < b.softMin) || (b.softMax != null && bodyweightKg > b.softMax)) {
    return { benchmarkId: 'bodyweight', level: 'review' };
  }
  return { benchmarkId: 'bodyweight', level: 'ok' };
}

/**
 * Cross-benchmark consistency — physiological relationships that should hold.
 * `oneRmXbw` / `timeSec` maps are keyed by benchmark id (caller supplies the
 * athlete's best values). Returns findings for relationships that look off.
 */
export function auditConsistency(
  oneRmXbw: Partial<Record<string, number>>,
  timeSec: Partial<Record<string, number>>,
): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const review = (id: string, message: string) =>
    findings.push({ benchmarkId: id, level: 'review', message });

  // Strength ratios (almost always true for real athletes).
  if (oneRmXbw.bench_1rm != null && oneRmXbw.back_squat_1rm != null &&
      oneRmXbw.bench_1rm > oneRmXbw.back_squat_1rm) {
    review('bench_1rm', 'Bench above back squat is rare — re-check both.');
  }
  if (oneRmXbw.power_clean_1rm != null && oneRmXbw.clean_jerk_1rm != null &&
      oneRmXbw.power_clean_1rm > oneRmXbw.clean_jerk_1rm) {
    review('power_clean_1rm', 'Power clean above clean & jerk is unusual.');
  }
  if (oneRmXbw.snatch_1rm != null && oneRmXbw.clean_jerk_1rm != null &&
      oneRmXbw.snatch_1rm > oneRmXbw.clean_jerk_1rm) {
    review('snatch_1rm', 'Snatch above clean & jerk is very rare.');
  }
  // Pace consistency: a flat-out mile should be faster per-mile than 5k pace.
  if (timeSec.run_1mi != null && timeSec.run_5k != null) {
    const milePace = timeSec.run_1mi; // sec per mile
    const fiveKPace = timeSec.run_5k / 3.10686; // sec per mile in a 5k
    if (milePace > fiveKPace) {
      review('run_1mi', 'Mile time is slower than your 5k pace — re-check.');
    }
  }
  return findings;
}

/** Signals that raise/lower confidence in a submission. */
export interface SubmissionContext {
  signedIn?: boolean;
  /** Verified via video/photo flag. */
  verified?: boolean;
  /** Logged in the TPF app over time (vs a one-off web entry). */
  loggedInApp?: boolean;
  /** Passed cross-benchmark consistency checks. */
  internallyConsistent?: boolean;
  /** Within plausible (soft) ranges, not just possible (hard) ranges. */
  withinPlausibleRange?: boolean;
}

/**
 * Trust weight in [0,1] for a submission. Percentile computation should use
 * trust-weighted quantiles so low-trust entries contribute less, not zero.
 */
export function trustScore(ctx: SubmissionContext): number {
  let score = 0.15; // anonymous, unverified baseline
  if (ctx.signedIn) score += 0.2;
  if (ctx.loggedInApp) score += 0.15;
  if (ctx.internallyConsistent) score += 0.1;
  if (ctx.withinPlausibleRange) score += 0.1;
  if (ctx.verified) score += 0.35;
  return Math.min(1, score);
}

/** Whether a percentile claim is high enough to warrant verification. */
export function needsVerification(percentile: number | null, threshold = 95): boolean {
  return percentile != null && percentile >= threshold;
}
