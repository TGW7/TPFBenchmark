/**
 * HABS — the lift / hybrid brands' score, aligned with the TPF app
 * (2026-10-03, docs/HABS-ALIGNMENT-2026-10-03.md).
 *
 * Structure only — every number arrives from the workbook via codegen:
 *   - which benchmark feeds which HABS component: Benchmarks_Sourcing
 *     `habs_component` (→ BenchmarkDef.habsComponent);
 *   - the weights: the HABS_Weights sheet (→ HABS_PATHWAY_WEIGHTS), the app's
 *     literal HABS_PATHWAY_WEIGHTS;
 *   - the ladders: Standards / Standards_Pathway, as before.
 *
 * The 8-component Weights sheet (PATHWAY_WEIGHTS) is NOT the HABS score any
 * more. It still decides which TPF Benchmark standards outside the score a
 * pathway lists (front squat, snatch, gymnastics, …) and feeds the Capacity
 * Index, both unchanged.
 */

import type { BenchmarkDef, HabsComponentId, PathwayConfig } from '../engine/types';
import { HABS_PATHWAY_WEIGHTS } from './generated/standards.generated';
import { HRS_BENCHMARKS, withPathwayStandards } from './benchmarks';
import { HRS_PATHWAY_CONFIGS } from './pathways';

/** The site's ids for the lifts the app estimates with its Olympic divisor
 *  (tpf-app constants.ts OLYMPIC_ORM_LIFTS, through the app sync's lift names
 *  — Power Clean, Snatch, Clean & Jerk). Of HABS's lifts only the power clean;
 *  the other two matter for their own standard's score. Checked by
 *  `npm run check:app-habs`. */
export const HABS_OLYMPIC_IDS: ReadonlySet<string> = new Set(['power_clean_1rm', 'snatch_1rm', 'clean_jerk_1rm']);

/** A pathway's HABS weights (zeros kept; the engine drops them). */
export function habsWeightsFor(pathwayId: string): Partial<Record<HabsComponentId, number>> {
  const w = (HABS_PATHWAY_WEIGHTS as Record<string, Partial<Record<HabsComponentId, number | null>>>)[pathwayId] ?? {};
  const out: Partial<Record<HabsComponentId, number>> = {};
  for (const [k, v] of Object.entries(w)) if (v != null) out[k as HabsComponentId] = v;
  return out;
}

/** True when a benchmark counts toward a pathway's HABS score. */
export function inHabsScore(b: BenchmarkDef, pathwayId: string): boolean {
  return b.habsComponent != null && (habsWeightsFor(pathwayId)[b.habsComponent] ?? 0) > 0;
}

/**
 * What the calculator lists for a lift / hybrid pathway, with that pathway's
 * standards applied:
 *   - every benchmark of a HABS component the pathway weights (the score), and
 *   - the TPF Benchmark standards outside HABS (no `habsComponent`) whose own
 *     component the Weights sheet weights for this pathway — the rule the
 *     calculator always used, so each pathway keeps the extras it had.
 * Optional carry-overs (grip, ruck) stay off, as before.
 */
export function liftBenchmarksFor(pathwayId: string): BenchmarkDef[] {
  const old: Partial<Record<string, number | null>> =
    (HRS_PATHWAY_CONFIGS as Record<string, PathwayConfig>)[pathwayId]?.weights ?? {};
  return withPathwayStandards(
    pathwayId,
    HRS_BENCHMARKS.filter((b) =>
      b.habsComponent != null
        ? inHabsScore(b, pathwayId)
        : (old[b.component] ?? 0) > 0,
    ),
  );
}
