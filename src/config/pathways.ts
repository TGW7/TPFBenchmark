/**
 * HRS_PATHWAY_CONFIGS — the seven Lift/Hybrid pathways.
 *
 * Weights are codegen'd from the Excel master's Weights sheet; each
 * pathway's weights must sum to 100 — enforced at codegen time (see
 * `validate()` in scripts/codegen.mjs) and covered by the pathways test.
 */

import type { LiftPathwayId, PathwayConfig } from '../engine/types';
import { PATHWAY_WEIGHTS } from './generated/standards.generated';

const PATHWAY_LABELS: Record<LiftPathwayId, string> = {
  gym_goer: 'General',
  hybrid_athlete: 'Hybrid Athlete',
  crossfit_generalist: 'CrossFit Generalist',
  hyrox: 'HYROX',
  powerlifter: 'Powerlifter',
  bodybuilder: 'Bodybuilder',
  triathlete: 'Triathlete',
};

/** Strength pathways show per-lift axes on the radar; others show components. */
const RADAR_MODE: Partial<Record<LiftPathwayId, 'components' | 'benchmarks'>> = {
  powerlifter: 'benchmarks',
  bodybuilder: 'benchmarks',
};

export const PATHWAY_IDS = Object.keys(PATHWAY_LABELS) as LiftPathwayId[];

export const HRS_PATHWAY_CONFIGS: Record<LiftPathwayId, PathwayConfig> = Object.fromEntries(
  PATHWAY_IDS.map((id) => [
    id,
    {
      id,
      label: PATHWAY_LABELS[id],
      weights: PATHWAY_WEIGHTS[id] ?? {},
      radar: RADAR_MODE[id] ?? 'components',
      // Pure-strength pathways (per-lift radar) don't do WODs / Capacity Index.
      showWods: RADAR_MODE[id] !== 'benchmarks',
    },
  ]),
) as Record<LiftPathwayId, PathwayConfig>;

export const HRS_PATHWAY_LIST: PathwayConfig[] = PATHWAY_IDS.map(
  (id) => HRS_PATHWAY_CONFIGS[id],
);
