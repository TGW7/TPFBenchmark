/**
 * Scoring pipeline.
 *
 *   raw input
 *     → per-benchmark % on the 50/70/85/100 tier curve (bw- & sex-adjusted)
 *     → per-component average
 *     → pathway-weighted, missing-data-normalised overall %.
 *
 * Components with no data are excluded and the remaining pathway weights are
 * re-normalised, so athletes are never penalised for untested components.
 * `coverage` reports the fraction of the pathway's weight actually tested.
 *
 * WODs and the Capacity Index sit alongside this score (wod.ts, capacity.ts) and
 * are never folded in (WOD_CORE_WEIGHT = 0 in v1).
 */

import { asResolved, scoreToPercentage } from './tier-curve';
import { applyAgeGrade, calc1RMVal, resolveThresholds } from './normalize';
import type {
  AthleteLogs,
  AthleteProfile,
  BenchmarkDef,
  BenchmarkScore,
  ComponentId,
  ComponentScore,
  EngineOptions,
  HrsResult,
  PathwayConfig,
} from './types';

/** Pick the athlete's best raw value for a benchmark, honouring direction. */
function bestRaw(candidates: number[], lowerIsBetter: boolean): number | null {
  if (candidates.length === 0) return null;
  return lowerIsBetter ? Math.min(...candidates) : Math.max(...candidates);
}

/** Resolve a benchmark's raw value from the appropriate store. */
export function rawForBenchmark(
  benchmark: BenchmarkDef,
  logs: AthleteLogs,
): number | null {
  switch (benchmark.source) {
    case 'orm': {
      const oneRms = logs.orm
        .filter((e) => e.benchmarkId === benchmark.id)
        .map((e) => calc1RMVal(e.weightKg, e.reps));
      return bestRaw(oneRms, benchmark.lowerIsBetter);
    }
    case 'race_times': {
      const times = logs.raceTimes
        .filter((e) => e.benchmarkId === benchmark.id)
        .map((e) => e.timeSec);
      return bestRaw(times, benchmark.lowerIsBetter);
    }
    case 'manual': {
      const vals = logs.manual
        .filter((e) => e.benchmarkId === benchmark.id)
        .map((e) => e.value);
      return bestRaw(vals, benchmark.lowerIsBetter);
    }
    case 'wod':
      // WODs are scored in the WOD layer, never as core components.
      return null;
  }
}

/** Score a single benchmark. percent === null means no data / thresholds TODO. */
export function scoreBenchmark(
  benchmark: BenchmarkDef,
  profile: AthleteProfile,
  logs: AthleteLogs,
  options: EngineOptions = {},
): BenchmarkScore {
  const raw = rawForBenchmark(benchmark, logs);
  if (raw == null) return { benchmarkId: benchmark.id, percent: null, raw: null };

  const resolved = asResolved(resolveThresholds(benchmark, profile));
  if (resolved == null) return { benchmarkId: benchmark.id, percent: null, raw };

  const adjusted = applyAgeGrade(raw, profile, options);
  const percent = scoreToPercentage(adjusted, resolved, benchmark.lowerIsBetter);
  return { benchmarkId: benchmark.id, percent, raw };
}

/** Average the logged, scoreable benchmarks within one component. */
export function scoreComponent(
  component: ComponentId,
  benchmarks: BenchmarkDef[],
  profile: AthleteProfile,
  logs: AthleteLogs,
  options: EngineOptions = {},
): ComponentScore {
  const inComponent = benchmarks.filter((b) => b.component === component);
  const scores = inComponent.map((b) => scoreBenchmark(b, profile, logs, options));
  const present = scores.filter((s): s is BenchmarkScore & { percent: number } => s.percent != null);
  const percent =
    present.length > 0
      ? present.reduce((sum, s) => sum + s.percent, 0) / present.length
      : null;
  return { component, percent, benchmarks: scores };
}

export interface ComputeHrsArgs {
  pathway: PathwayConfig;
  benchmarks: BenchmarkDef[];
  profile: AthleteProfile;
  logs: AthleteLogs;
  options?: EngineOptions;
}

/**
 * Pathway-weighted overall score with missing-data re-normalisation + coverage.
 * Returns overall === null when nothing scoreable is logged (the v1 placeholder
 * state, since all thresholds/weights start as TODO).
 */
export function computeHRS(args: ComputeHrsArgs): HrsResult {
  const { pathway, benchmarks, profile, logs, options } = args;

  // Components that carry weight in this pathway (null/0 weights are inert).
  const weighted = (Object.entries(pathway.weights) as [ComponentId, number | null][])
    .filter(([, w]) => w != null && w > 0) as [ComponentId, number][];

  const totalWeight = weighted.reduce((sum, [, w]) => sum + w, 0);

  const components: ComponentScore[] = weighted.map(([component]) =>
    scoreComponent(component, benchmarks, profile, logs, options),
  );

  let weightedSum = 0;
  let testedWeight = 0;
  for (const [component, weight] of weighted) {
    const cs = components.find((c) => c.component === component);
    if (cs && cs.percent != null) {
      weightedSum += weight * cs.percent;
      testedWeight += weight;
    }
  }

  const overall = testedWeight > 0 ? weightedSum / testedWeight : null;
  const coverage = totalWeight > 0 ? testedWeight / totalWeight : 0;

  return { pathway: pathway.id, overall, components, coverage };
}

export interface PathwayWeightValidation {
  sum: number;
  /** at least one non-null weight present (i.e. populated from the Excel). */
  populated: boolean;
  /** valid if not yet populated, or populated and summing to 100. */
  valid: boolean;
}

/**
 * Validate that a pathway's non-null component weights sum to 100. An
 * unpopulated pathway (all weights null/TODO) is considered valid so the app
 * builds against the empty master; once weights are filled they MUST sum to 100.
 */
export function validatePathwayWeights(pathway: PathwayConfig): PathwayWeightValidation {
  const values = Object.values(pathway.weights);
  const present = values.filter((w): w is number => w != null);
  const sum = present.reduce((a, b) => a + b, 0);
  const populated = present.length > 0;
  const valid = !populated || Math.round(sum) === 100;
  return { sum, populated, valid };
}
