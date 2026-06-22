/**
 * HRS_BENCHMARKS — the benchmark catalogue.
 *
 * Shape only. Sourcing metadata is populated; tier thresholds are null/TODO
 * until the Excel master is filled in. Everything here is derived from
 * generated/standards.generated.ts — do not hand-edit standards values.
 */

import type { BenchmarkDef, Sex, ThresholdSet } from '../engine/types';
import {
  BENCHMARK_SOURCING,
  STANDARDS_THRESHOLDS,
} from './generated/standards.generated';

const NULL_THRESHOLDS: ThresholdSet = {
  pass: null,
  good: null,
  excellent: null,
  elite: null,
};

function thresholdsFor(id: string): Record<Sex, ThresholdSet> {
  return STANDARDS_THRESHOLDS[id] ?? { M: NULL_THRESHOLDS, F: NULL_THRESHOLDS };
}

export const HRS_BENCHMARKS: BenchmarkDef[] = BENCHMARK_SOURCING.map((s) => ({
  id: s.id,
  component: s.component,
  source: s.source,
  unit: s.unit,
  lowerIsBetter: s.lowerIsBetter,
  normalization: s.normalization,
  thresholds: thresholdsFor(s.id),
  optional: s.optional,
  meta: {
    dataSource: s.dataSource,
    license: s.license,
    commercialUse: s.commercialUse,
    referencePopulation: s.referencePopulation,
    launchMethod: s.launchMethod,
    notes: s.notes,
  },
}));

export const HRS_BENCHMARKS_BY_ID: Record<string, BenchmarkDef> = Object.fromEntries(
  HRS_BENCHMARKS.map((b) => [b.id, b]),
);

/** Core (always-on) benchmarks — excludes the optional grip / rucking carry-overs. */
export const CORE_BENCHMARKS: BenchmarkDef[] = HRS_BENCHMARKS.filter((b) => !b.optional);
