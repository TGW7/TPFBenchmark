/**
 * Tier curve — reused verbatim from ORS.
 *
 * Every benchmark defines four thresholds — pass / good / excellent / elite —
 * anchored at 50 / 70 / 85 / 100 %. `scoreToPercentage` maps a raw value onto
 * that piecewise-linear curve, with a small linear bonus to a 110 % cap for
 * beating elite, and an inverted curve for lower-is-better benchmarks
 * (run / row / swim / WOD times — faster = higher %).
 *
 * These curve constants are ENGINE LOGIC, not standards. No real benchmark
 * numbers appear here; thresholds are supplied by the caller.
 */

import type { ResolvedThresholds, ThresholdSet } from './types';

/** Anchor percentages for the four tiers. */
export const ANCHORS = {
  pass: 50,
  good: 70,
  excellent: 85,
  elite: 100,
} as const;

/** 2026-07-11 — unified HABS model (app Phase 107): elite = the hard
 *  ceiling. Beating elite reads 100, same as hitting it exactly — no
 *  bonus tier. Constant kept (=100) so consumers clamp consistently. */
export const BONUS_CAP = 100;

/**
 * Bonus slope: matching/just-beating elite earns ~0; beating elite by 100 %
 * (e.g. twice the elite value, or half the elite time) reaches the +10 cap.
 * This is a synthetic curve convention — confirm/tune later, it is not a
 * standard.
 */
const BONUS_FULL_AT_FRACTION = 1.0; // fraction over elite that maxes the bonus
const MAX_BONUS = BONUS_CAP - ANCHORS.elite; // 10

/**
 * Sub-pass floor for lower-is-better: a result twice as slow as the pass
 * threshold scores 0 %. (Higher-is-better uses a literal 0 floor instead.)
 * Synthetic convention, not a standard.
 */
const LOWER_FLOOR_MULTIPLE = 2;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Linear interpolation of % between two (value, anchor) tier knots. */
function lerp(
  raw: number,
  loVal: number,
  hiVal: number,
  loPct: number,
  hiPct: number,
): number {
  if (hiVal === loVal) return loPct;
  return loPct + ((raw - loVal) / (hiVal - loVal)) * (hiPct - loPct);
}

/**
 * Narrow a (possibly null-filled) ThresholdSet to fully-resolved numbers, or
 * return null if any anchor is missing. Used by callers to decide whether a
 * benchmark is scoreable yet.
 */
export function asResolved(t: ThresholdSet): ResolvedThresholds | null {
  if (t.pass == null || t.good == null || t.excellent == null || t.elite == null) {
    return null;
  }
  return { pass: t.pass, good: t.good, excellent: t.excellent, elite: t.elite };
}

/**
 * Map a raw value to a 0–110 % readiness score against four tier thresholds.
 *
 * @param raw            athlete's raw value, in the same unit as the thresholds
 * @param t              resolved pass/good/excellent/elite thresholds
 * @param lowerIsBetter  true for time-based benchmarks (faster = higher %)
 */
export function scoreToPercentage(
  raw: number,
  t: ResolvedThresholds,
  lowerIsBetter: boolean,
): number {
  const pct = lowerIsBetter
    ? scoreLowerIsBetter(raw, t)
    : scoreHigherIsBetter(raw, t);
  return clamp(pct, 0, BONUS_CAP);
}

function bonusAboveElite(overshootFraction: number): number {
  // overshootFraction = how far past elite, as a fraction of elite (>= 0)
  return clamp(
    (overshootFraction / BONUS_FULL_AT_FRACTION) * MAX_BONUS,
    0,
    MAX_BONUS,
  );
}

function scoreHigherIsBetter(raw: number, t: ResolvedThresholds): number {
  const { pass, good, excellent, elite } = t;
  if (raw >= elite) {
    return ANCHORS.elite + bonusAboveElite((raw - elite) / elite);
  }
  if (raw >= excellent) return lerp(raw, excellent, elite, ANCHORS.excellent, ANCHORS.elite);
  if (raw >= good) return lerp(raw, good, excellent, ANCHORS.good, ANCHORS.excellent);
  if (raw >= pass) return lerp(raw, pass, good, ANCHORS.pass, ANCHORS.good);
  // Below pass: linear from 0 % at raw = 0 to 50 % at pass.
  if (raw <= 0) return 0;
  return (raw / pass) * ANCHORS.pass;
}

function scoreLowerIsBetter(raw: number, t: ResolvedThresholds): number {
  const { pass, good, excellent, elite } = t;
  // For lower-is-better, smaller is better: elite < excellent < good < pass.
  if (raw <= elite) {
    return ANCHORS.elite + bonusAboveElite((elite - raw) / elite);
  }
  if (raw <= excellent) return lerp(raw, elite, excellent, ANCHORS.elite, ANCHORS.excellent);
  if (raw <= good) return lerp(raw, excellent, good, ANCHORS.excellent, ANCHORS.good);
  if (raw <= pass) return lerp(raw, good, pass, ANCHORS.good, ANCHORS.pass);
  // Slower than pass: linear from 50 % at pass down to 0 % at LOWER_FLOOR_MULTIPLE × pass.
  const floor = pass * LOWER_FLOOR_MULTIPLE;
  if (raw >= floor) return 0;
  return lerp(raw, pass, floor, ANCHORS.pass, 0);
}
