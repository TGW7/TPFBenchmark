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
import { CORE_COMPONENT_IDS } from '../engine/types';
import type { Brand } from '../brand';
import { HRS_BENCHMARKS, withPathwayStandards } from '../config/benchmarks';
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
}

const LIFT_BANNER = 'v1 beta standards — expert-seeded, recalibrating as athletes log in.';
const OPERATOR_BANNER = 'Operator standards (beta) — real US/UK unit benchmarks · unisex & absolute.';
const HYBRID_BANNER = 'Hybrid athlete standards (beta) — balanced strength + engine benchmarks.';

const HYBRID_PATHWAY_ORDER = [
  'hybrid_athlete', 'crossfit_generalist', 'hyrox', 'triathlete',
  'gym_goer', 'powerlifter', 'bodybuilder',
] as const;

/** Benchmarks a lift/hybrid pathway scores: only components it weights,
 *  with any per-pathway standards overrides applied (2026-07-12). */
function hrsBenchmarksFor(id: string): BenchmarkDef[] {
  const weights: Partial<Record<ComponentId, number | null>> =
    (HRS_PATHWAY_CONFIGS as Record<string, PathwayConfig>)[id]?.weights ?? {};
  return withPathwayStandards(
    id,
    HRS_BENCHMARKS.filter((b) => (weights[b.component] ?? 0) > 0),
  );
}

export function brandConfig(brand: Brand): BrandConfig {
  if (brand === 'hybrid') {
    const hybridPathwayList = HYBRID_PATHWAY_ORDER
      .map(id => (HRS_PATHWAY_CONFIGS as Record<string, PathwayConfig>)[id])
      .filter(Boolean);
    return {
      pathways: HRS_PATHWAY_CONFIGS,
      pathwayList: hybridPathwayList,
      components: [...CORE_COMPONENT_IDS],
      benchmarksFor: hrsBenchmarksFor,
      wods: HRS_WODS,
      wodList: HRS_WOD_LIST,
      sampleProfile: DEMO_PROFILE,
      sampleLogs: DEMO_LOGS,
      banner: HYBRID_BANNER,
      synthetic: false,
      unisex: false,
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
    };
  }
  return {
    pathways: HRS_PATHWAY_CONFIGS,
    pathwayList: HRS_PATHWAY_LIST,
    components: [...CORE_COMPONENT_IDS],
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
  };
}
