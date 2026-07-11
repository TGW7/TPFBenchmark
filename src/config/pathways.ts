/**
 * HRS_PATHWAY_CONFIGS — the four v1 pathways.
 *
 * Weights are null/TODO until the Excel master's Weights sheet is filled in.
 * Once populated, each pathway's non-null weights MUST sum to 100 — enforced by
 * validatePathwayWeights() and the pathways test.
 */

import type { LiftPathwayId, PathwayConfig } from '../engine/types';
import { PATHWAY_WEIGHTS } from './generated/standards.generated';

const PATHWAY_LABELS: Record<LiftPathwayId, string> = {
  gym_goer: 'Gym-Goer',
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
