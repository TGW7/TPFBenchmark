/**
 * HABS — the TPF app's HABS score, ported to compute the SAME number
 * (2026-10-03; the owner: "make HABS score align").
 *
 * Source: tpf-app src/lib/habs.ts (`computeHABS`, `scoreValue`) and
 * src/lib/calc.ts (`calc1RMVal`), read at 226b018a. Every expression below is
 * written the way the app writes it — same operations, same order — so a score
 * here is bit-for-bit the app's for the same inputs, not merely close.
 * `npm run check:app-habs -- <path to tpf-app>` runs both engines on a fixed
 * set of synthetic athletes and requires identical results.
 *
 * The model (docs/HABS-ALIGNMENT-2026-10-03.md §1):
 *   - nine components (HABS_COMPONENT_IDS); a benchmark feeds one through its
 *     `habsComponent` (the workbook's Benchmarks_Sourcing.habs_component);
 *   - a result → 0–100 on six anchors (50 / 60 / 70 / 80 / 90 / 100), hard
 *     capped at 100; below Beginner a lift falls to 0 at zero, a time falls to
 *     0 one Beginner–Novice gap past Beginner;
 *   - a lift is its estimated 1RM: Epley ÷ 30, ÷ 25 for an Olympic lift, to
 *     0.1 kg;
 *   - a component = the mean of its scored benchmarks; zero-weight components
 *     are dropped; the score = the weighted mean over SCORED components,
 *     renormalised, min(100). No missing-category penalty.
 *
 * What it does NOT do, by design: the app's input layer — logged e1RMs and
 * runs beating typed values, the six-month "current" window (§1.8–1.9 of that
 * document). This engine scores the values it is given. Since 2026-10-03 the
 * site gives it what the athlete typed PLUS the app's predicted equivalents
 * for missing races (src/engine/habsPredict.ts — the owner's "1 yes"; the
 * prediction is a separate step, so this file's numbers did not change).
 *
 * Pure: no React, no config imports.
 */

import type {
  AthleteLogs,
  BenchmarkDef,
  BenchmarkScore,
  ComponentScore,
  HabsComponentId,
  HrsResult,
  Sex,
  ThresholdSet,
} from './types';

/** The app's COMPONENT_DEFS order — also the summation order of the score. */
export const HABS_COMPONENT_IDS: readonly HabsComponentId[] = [
  'lower_strength',
  'power',
  'upper_push',
  'upper_pull',
  'run_intensity',
  'run_distance',
  'swimming',
  'cycling',
  'erg',
] as const;

/** Epley rep-max divisor (tpf-app calc.ts) and the Olympic one (e1rm.ts OLY_REP_DIVISOR). */
export const HABS_EPLEY_DIVISOR = 30;
export const HABS_OLY_REP_DIVISOR = 25;

/** A complete six-tier ladder (the app's `Standard`). */
export interface HabsLadder {
  pass: number;
  novice: number;
  good: number;
  intermediate: number;
  advanced: number;
  elite: number;
  lowerIsBetter?: boolean;
}

/** The six tiers of a threshold set, or null if any is missing — the app's
 *  ladders are always complete; a site row that is not is skipped, never
 *  guessed. (`excellent` is the four-tier curve's and is never read.) */
export function habsLadder(t: ThresholdSet | undefined, lowerIsBetter: boolean): HabsLadder | null {
  if (!t) return null;
  const { pass, novice, good, intermediate, advanced, elite } = t;
  if (pass == null || novice == null || good == null || intermediate == null || advanced == null || elite == null) {
    return null;
  }
  return lowerIsBetter
    ? { pass, novice, good, intermediate, advanced, elite, lowerIsBetter: true }
    : { pass, novice, good, intermediate, advanced, elite };
}

/** tpf-app habs.ts `scoreValue`, verbatim. */
export function habsScoreValue(value: number, std: HabsLadder): number {
  const { pass, novice, good, intermediate, advanced, elite, lowerIsBetter: lib } = std;
  if (lib) {
    if (value <= elite)        return 100;
    if (value <= advanced)     return 90 + 10 * (advanced     - value) / (advanced     - elite);
    if (value <= intermediate) return 80 + 10 * (intermediate - value) / (intermediate - advanced);
    if (value <= good)         return 70 + 10 * (good         - value) / (good         - intermediate);
    if (value <= novice)       return 60 + 10 * (novice       - value) / (novice       - good);
    if (value <= pass)         return 50 + 10 * (pass         - value) / (pass         - novice);
    const floor = pass + (pass - novice);
    return Math.max(0, 50 * (floor - value) / Math.max(1, floor - pass));
  }
  if (value >= elite)        return 100;
  if (value >= advanced)     return 90 + 10 * (value - advanced)     / (elite        - advanced);
  if (value >= intermediate) return 80 + 10 * (value - intermediate) / (advanced     - intermediate);
  if (value >= good)         return 70 + 10 * (value - good)         / (intermediate - good);
  if (value >= novice)       return 60 + 10 * (value - novice)       / (good         - novice);
  if (value >= pass)         return 50 + 10 * (value - pass)         / (novice       - pass);
  return Math.max(0, 50 * value / Math.max(1, pass));
}

/**
 * tpf-app calc.ts `calc1RMVal` for a weight the site holds as a number: reps
 * are read as `parseInt(r) || 1` there (the site syncs `String(reps)`), one rep
 * is the weight itself, otherwise Epley rounded to 0.1 kg.
 */
export function habsOneRepMax(weightKg: number, reps: number, olympic: boolean): number | null {
  if (!weightKg) return null;
  const rr = Math.trunc(reps) || 1;
  const div = olympic ? HABS_OLY_REP_DIVISOR : HABS_EPLEY_DIVISOR;
  return rr === 1 ? weightKg : +(weightKg * (1 + rr / div)).toFixed(1);
}

/** The value a benchmark is scored on: the best estimated 1RM, or the best
 *  (lowest) positive, finite time. null = nothing usable entered. */
export function habsRawValue(
  b: BenchmarkDef,
  logs: AthleteLogs,
  olympicIds: ReadonlySet<string> = new Set(),
): number | null {
  if (b.source === 'orm') {
    const vals = logs.orm
      .filter((e) => e.benchmarkId === b.id)
      .map((e) => habsOneRepMax(e.weightKg, e.reps, olympicIds.has(b.id)))
      .filter((v): v is number => v != null && v > 0);
    return vals.length ? Math.max(...vals) : null;
  }
  if (b.source === 'race_times') {
    const vals = logs.raceTimes
      .filter((e) => e.benchmarkId === b.id)
      .map((e) => e.timeSec)
      .filter((t) => t > 0 && Number.isFinite(t));
    return vals.length ? Math.min(...vals) : null;
  }
  // Manual reps / holds and WODs never feed HABS in the app.
  return null;
}

/** One benchmark's 0–100 on the HABS curve (used for the TPF Benchmark
 *  standards outside the score, too), or null with no value / no ladder. */
export function habsBenchmarkScore(
  b: BenchmarkDef,
  sex: Sex,
  logs: AthleteLogs,
  olympicIds?: ReadonlySet<string>,
): number | null {
  const value = habsRawValue(b, logs, olympicIds);
  if (value == null || !(value > 0)) return null;
  const ladder = habsLadder(b.thresholds[sex], b.lowerIsBetter);
  return ladder ? habsScoreValue(value, ladder) : null;
}

export interface HabsBenchmarkResult {
  benchmarkId: string;
  value: number;
  score: number;
  kind: 'kg' | 'time';
}

export interface HabsComponentResult {
  id: HabsComponentId;
  weight: number;
  score: number;
  benchmarks: HabsBenchmarkResult[];
  hasData: boolean;
}

/** The app's `HABSResult` (labels live in src/config/habsDisplay.ts). */
export interface HabsResult {
  score: number;
  /** Sum of the scored components' weights (out of the pathway's 100). */
  weightCovered: number;
  components: HabsComponentResult[];
  /** Lowest-scoring scored component, only when two or more are scored. */
  weakLink: HabsComponentId | null;
}

export interface ComputeHabsArgs {
  /** The pathway's benchmark defs with its standards applied. Within a
   *  component, this order is the scoring order (the app's COMPONENT_DEFS). */
  benchmarks: BenchmarkDef[];
  /** The pathway's HABS weights (the HABS_Weights sheet). */
  weights: Partial<Record<HabsComponentId, number | null>>;
  sex: Sex;
  logs: AthleteLogs;
  /** Benchmark ids estimated with the Olympic divisor (the app's OLYMPIC_ORM_LIFTS). */
  olympicIds?: ReadonlySet<string>;
}

/** tpf-app habs.ts `computeHABS`, same rule, same order. */
export function computeHabs(args: ComputeHabsArgs): HabsResult {
  const { benchmarks, weights, sex, logs, olympicIds } = args;
  const w = (id: HabsComponentId) => weights[id] ?? 0;

  // Zero-weight components are dropped entirely (not shown, never the weak link).
  const active = HABS_COMPONENT_IDS.filter((id) => w(id) > 0);

  const components: HabsComponentResult[] = active.map((id) => {
    const results: HabsBenchmarkResult[] = [];
    for (const b of benchmarks) {
      if (b.habsComponent !== id) continue;
      const value = habsRawValue(b, logs, olympicIds);
      if (value != null && value > 0) {
        const ladder = habsLadder(b.thresholds[sex], b.lowerIsBetter);
        if (!ladder) continue;
        results.push({ benchmarkId: b.id, value, score: habsScoreValue(value, ladder), kind: b.source === 'orm' ? 'kg' : 'time' });
      }
    }
    const hasData = results.length > 0;
    const score = hasData ? results.reduce((s, r) => s + r.score, 0) / results.length : 0;
    return { id, weight: w(id), score, benchmarks: results, hasData };
  });

  const scored = components.filter((c) => c.hasData);
  const totalWeight = scored.reduce((s, c) => s + c.weight, 0);
  const score = totalWeight > 0
    ? scored.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight
    : 0;
  const weakLink = scored.length > 1
    ? scored.reduce((lo, c) => (c.score < lo.score ? c : lo), scored[0]).id
    : null;

  return { score: Math.min(100, score), weightCovered: totalWeight, components, weakLink };
}

/**
 * The HABS result in the shape the site's dashboard, radar, weakness analysis,
 * share card and pool already read (`HrsResult`). `overall` is null until
 * something is scored (the app shows nothing until `weightCovered > 0`);
 * `coverage` is the scored share of the pathway's weight.
 */
export function habsAsHrsResult(pathwayId: string, r: HabsResult): HrsResult {
  const total = r.components.reduce((s, c) => s + c.weight, 0);
  const components: ComponentScore[] = r.components.map((c) => ({
    component: c.id,
    percent: c.hasData ? c.score : null,
    benchmarks: c.benchmarks.map((b): BenchmarkScore => ({ benchmarkId: b.benchmarkId, percent: b.score, raw: b.value })),
  }));
  return {
    pathway: pathwayId,
    overall: r.weightCovered > 0 ? r.score : null,
    components,
    coverage: total > 0 ? r.weightCovered / total : 0,
  };
}
