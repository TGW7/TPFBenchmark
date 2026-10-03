/**
 * Brand → active dataset selector. The engine is generic; this picks the
 * pathways / benchmarks / components / sample data the UI runs on, by brand.
 *
 * Lift: shared benchmark catalogue + per-pathway weights, real v1-beta standards.
 * Operator: per-UNIT benchmarks (each unit its own set + thresholds), unisex,
 * absolute — real ORS standards codegen'd from the curated workbook.
 */

import type {
  AthleteLogs,
  AthleteProfile,
  BenchmarkDef,
  ComponentId,
  PathwayConfig,
  WodDef,
  WodId,
} from '../engine/types';
import { HABS_COMPONENT_IDS } from '../engine/habs';
import type { Brand } from '../brand';
import { liftBenchmarksFor } from '../config/habs';
import { HRS_PATHWAY_CONFIGS, HRS_PATHWAY_LIST } from '../config/pathways';
import { HRS_WODS, HRS_WOD_LIST } from '../config/wods';
import {
  OPERATOR_BENCHMARKS_BY_PATHWAY,
  OPERATOR_ALL_BENCHMARKS,
  OPERATOR_COMPONENTS,
  OPERATOR_PATHWAY_CONFIGS,
  OPERATOR_PATHWAY_LIST,
  OPERATOR_SAMPLE_LOGS,
  OPERATOR_SAMPLE_PROFILE,
} from '../config/operator';
import { DEMO_LOGS, DEMO_PROFILE } from './demo';

export interface BrandConfig {
  pathways: Record<string, PathwayConfig>;
  pathwayList: PathwayConfig[];
  /** Component display order for the radar (brand-specific). */
  components: ComponentId[];
  /** Benchmarks to score against for a given pathway (operator is per-unit). */
  benchmarksFor: (pathwayId: string) => BenchmarkDef[];
  wods: Record<WodId, WodDef>;
  wodList: WodDef[];
  sampleProfile: AthleteProfile;
  sampleLogs: AthleteLogs;
  banner: string;
  synthetic: boolean;
  /** Operator standards are unisex — hide the sex toggle where it's irrelevant. */
  unisex: boolean;
  /** 2026-10-03 — the lift / hybrid brands score the TPF app's HABS model
   *  (src/engine/habs.ts, src/config/habs.ts); Operator keeps computeHRS. */
  habs: boolean;
}

const LIFT_BANNER = 'v1 beta standards — expert-seeded, recalibrating as athletes log in.';
const OPERATOR_BANNER = 'Operator standards (beta) — real US/UK unit benchmarks · unisex & absolute.';
const HYBRID_BANNER = 'Hybrid athlete standards (beta) — balanced strength + engine benchmarks.';

const HYBRID_PATHWAY_ORDER = [
  'hybrid_athlete', 'crossfit_generalist', 'hyrox', 'triathlete',
  'gym_goer', 'powerlifter', 'bodybuilder',
] as const;

/** Benchmarks a lift/hybrid pathway lists: the HABS benchmarks it weights,
 *  then the TPF Benchmark standards outside HABS it always listed, with any
 *  per-pathway standards applied (src/config/habs.ts, 2026-10-03). */
const hrsBenchmarksFor = (id: string): BenchmarkDef[] => liftBenchmarksFor(id);

export function brandConfig(brand: Brand): BrandConfig {
  if (brand === 'hybrid') {
    const hybridPathwayList = HYBRID_PATHWAY_ORDER
      .map(id => (HRS_PATHWAY_CONFIGS as Record<string, PathwayConfig>)[id])
      .filter(Boolean);
    return {
      pathways: HRS_PATHWAY_CONFIGS,
      pathwayList: hybridPathwayList,
      components: [...HABS_COMPONENT_IDS],
      benchmarksFor: hrsBenchmarksFor,
      wods: HRS_WODS,
      wodList: HRS_WOD_LIST,
      sampleProfile: DEMO_PROFILE,
      sampleLogs: DEMO_LOGS,
      banner: HYBRID_BANNER,
      synthetic: false,
      unisex: false,
      habs: true,
    };
  }
  if (brand === 'operator') {
    return {
      pathways: OPERATOR_PATHWAY_CONFIGS,
      pathwayList: OPERATOR_PATHWAY_LIST,
      components: OPERATOR_COMPONENTS,
      benchmarksFor: (id) => OPERATOR_BENCHMARKS_BY_PATHWAY[id] ?? OPERATOR_ALL_BENCHMARKS,
      wods: {},
      wodList: [],
      sampleProfile: OPERATOR_SAMPLE_PROFILE,
      sampleLogs: OPERATOR_SAMPLE_LOGS,
      banner: OPERATOR_BANNER,
      synthetic: false,
      unisex: true,
      habs: false,
    };
  }
  return {
    pathways: HRS_PATHWAY_CONFIGS,
    pathwayList: HRS_PATHWAY_LIST,
    components: [...HABS_COMPONENT_IDS],
    // Only the benchmarks whose component the pathway actually weights — so
    // strength pathways (powerlifter/bodybuilder) drop cardio entirely.
    benchmarksFor: hrsBenchmarksFor,
    wods: HRS_WODS,
    wodList: HRS_WOD_LIST,
    sampleProfile: DEMO_PROFILE,
    sampleLogs: DEMO_LOGS,
    banner: LIFT_BANNER,
    synthetic: false,
    unisex: false,
    habs: true,
  };
}
