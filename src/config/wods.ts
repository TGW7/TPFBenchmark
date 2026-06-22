/**
 * HRS_WODS — benchmark WOD definitions + Capacity-Index quality-mix vectors.
 *
 * Thresholds and quality-mix vectors are null/TODO until the Excel master's
 * WOD_Standards / Quality_Mix sheets are filled in. WODs never feed the core
 * HRS in v1 (WOD_CORE_WEIGHT = 0); they are display-only diagnostics.
 */

import type { WodDef, WodId } from '../engine/types';
import { QUALITY_MIX, WOD_STANDARDS } from './generated/standards.generated';

export const HRS_WODS: Record<WodId, WodDef> = Object.fromEntries(
  Object.entries(WOD_STANDARDS).map(([id, w]) => [
    id,
    {
      id,
      unit: w.unit,
      lowerIsBetter: w.lowerIsBetter,
      thresholds: w.thresholds,
      qualityMix: QUALITY_MIX[id] ?? {},
      loads: w.load && w.load.movement
        ? [{ movement: w.load.movement, M: w.load.M, F: w.load.F }]
        : undefined,
    },
  ]),
) as Record<WodId, WodDef>;

export const HRS_WOD_LIST: WodDef[] = Object.values(HRS_WODS);

/**
 * Licensing-safe PUBLIC names for the benchmark WODs.
 *
 * The internal ids (fran, grace, …) match the Excel master, but the named
 * CrossFit® benchmark workouts are trademarked. The public site must surface
 * neutral, descriptive names instead. `name` is the coined label; `spec` is the
 * (non-proprietary, factual) movement/rep description.
 */
export interface WodPublicName {
  name: string;
  spec: string;
}

export const WOD_PUBLIC_NAMES: Record<WodId, WodPublicName> = {
  fran: { name: 'The 21-15-9 Couplet', spec: '21-15-9 thrusters & pull-ups, for time' },
  grace: { name: '30 Clean & Jerks', spec: '30 clean & jerks at a fixed load, for time' },
  helen: { name: 'Run · Swing · Pull', spec: '3 rounds: 400 m run, 21 kettlebell swings, 12 pull-ups' },
  diane: { name: 'Deadlift & HSPU (21-15-9)', spec: '21-15-9 deadlifts & handstand push-ups, for time' },
  cindy: { name: '20-min Bodyweight AMRAP', spec: 'AMRAP 20: 5 pull-ups, 10 push-ups, 15 air squats' },
  fight_gone_bad: { name: 'Five Stations', spec: '3 rounds of 5 one-minute stations, max reps' },
};

export function wodPublicName(id: WodId): string {
  return WOD_PUBLIC_NAMES[id]?.name ?? id;
}

