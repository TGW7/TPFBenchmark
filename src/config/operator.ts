/**
 * Operator config — adapts the codegen'd ORS data into engine-facing types.
 *
 * Per-unit benchmarks (each pathway has its own set + thresholds), unisex
 * (M = F), absolute units. The UI scores against the selected unit's benchmarks.
 */

import type {
  AthleteLogs,
  AthleteProfile,
  BenchmarkDef,
  ComponentId,
  PathwayConfig,
} from '../engine/types';
import { OPERATOR_PATHWAYS, type OperatorBenchmark } from './generated/operator.generated';

/** Component display order for the operator radar / lists. */
export const OPERATOR_COMPONENTS: ComponentId[] = [
  'running', 'rucking', 'swimming', 'lower_strength', 'upper_strength',
  'power', 'upper_endurance', 'core_endurance', 'stability', 'grip',
];

function toBenchmarkDef(b: OperatorBenchmark): BenchmarkDef {
  return {
    id: b.id,
    component: b.component,
    source: b.source,
    unit: b.unit,
    lowerIsBetter: b.lowerIsBetter,
    normalization: 'absolute',
    thresholds: { M: b.thresholds, F: b.thresholds }, // unisex
    meta: { notes: b.name },
  };
}

export const OPERATOR_PATHWAY_CONFIGS: Record<string, PathwayConfig> = Object.fromEntries(
  OPERATOR_PATHWAYS.map((p) => [p.id, { id: p.id, label: p.label, group: p.region, weights: p.weights }]),
);
export const OPERATOR_PATHWAY_LIST: PathwayConfig[] = OPERATOR_PATHWAYS.map(
  (p) => OPERATOR_PATHWAY_CONFIGS[p.id],
);

export const OPERATOR_BENCHMARKS_BY_PATHWAY: Record<string, BenchmarkDef[]> = Object.fromEntries(
  OPERATOR_PATHWAYS.map((p) => [p.id, p.benchmarks.map(toBenchmarkDef)]),
);

/** All operator benchmarks (deduped by id) — for the entry form catalogue. */
export const OPERATOR_ALL_BENCHMARKS: BenchmarkDef[] = (() => {
  const byId = new Map<string, BenchmarkDef>();
  for (const p of OPERATOR_PATHWAYS) for (const b of p.benchmarks) if (!byId.has(b.id)) byId.set(b.id, toBenchmarkDef(b));
  return [...byId.values()];
})();

export const OPERATOR_DEFAULT_PATHWAY: string = OPERATOR_PATHWAYS[0]?.id ?? '';

export const OPERATOR_SAMPLE_PROFILE: AthleteProfile = { sex: 'M', bodyweightKg: 85, ageYears: 30 };

/** A sample operator athlete sitting at the "good" tier of the default unit. */
export const OPERATOR_SAMPLE_LOGS: AthleteLogs = (() => {
  const logs: AthleteLogs = { orm: [], raceTimes: [], manual: [], wod: [] };
  const benchmarks = OPERATOR_BENCHMARKS_BY_PATHWAY[OPERATOR_DEFAULT_PATHWAY] ?? [];
  for (const b of benchmarks) {
    const good = b.thresholds.M.good;
    if (good == null) continue;
    if (b.source === 'orm') logs.orm.push({ benchmarkId: b.id, weightKg: good, reps: 1 });
    else if (b.source === 'race_times') logs.raceTimes.push({ benchmarkId: b.id, modality: b.component, event: b.id, timeSec: good });
    else logs.manual.push({ benchmarkId: b.id, value: good });
  }
  return logs;
})();
