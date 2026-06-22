/**
 * Capacity Index — the signature diagnostic.
 *
 * Each WOD carries a quality-mix vector (which components it taxes). From the
 * athlete's component scores we compute a PREDICTED WOD %, then compare to ACTUAL:
 *
 *   CI = mean( actualWodPct − predictedWodPct )  across logged WODs.
 *
 * Positive  = punches above raw numbers (pacing / skill / fatigue resistance).
 * Negative  = under-expresses potential.
 *
 * Reported ALONGSIDE the HRS, never inside it. Quality-mix vectors are
 * placeholders for now, so predictions return null until populated.
 */

import { scoreWod } from './wod';
import type {
  AthleteProfile,
  CapacityResult,
  ComponentId,
  ComponentScore,
  WodDef,
  WodEntry,
} from './types';

export type ComponentScoreMap = Partial<Record<ComponentId, number | null>>;

/** Build a component → % lookup from computed component scores. */
export function toComponentScoreMap(components: ComponentScore[]): ComponentScoreMap {
  const map: ComponentScoreMap = {};
  for (const c of components) map[c.component] = c.percent;
  return map;
}

/**
 * Predicted WOD % = quality-mix-weighted blend of the component scores it taxes.
 * Components with a null mix weight or no score are dropped and the remaining
 * mix weights re-normalised. Returns null if nothing usable (e.g. mix is TODO).
 */
export function predictWodPercent(
  wod: WodDef,
  scores: ComponentScoreMap,
): number | null {
  let weightedSum = 0;
  let usedWeight = 0;
  for (const [component, mix] of Object.entries(wod.qualityMix) as [
    ComponentId,
    number | null,
  ][]) {
    const score = scores[component];
    if (mix == null || mix <= 0 || score == null) continue;
    weightedSum += mix * score;
    usedWeight += mix;
  }
  return usedWeight > 0 ? weightedSum / usedWeight : null;
}

/**
 * Compute the Capacity Index across the athlete's logged WODs. `wodDefs` is
 * keyed by WOD id. Returns index === null when no WOD has both an actual score
 * and a prediction.
 */
export function computeCapacityIndex(
  wodDefs: Record<string, WodDef>,
  entries: WodEntry[],
  componentScores: ComponentScoreMap,
  profile: AthleteProfile,
): CapacityResult {
  const perWod = entries.map((entry) => {
    const wod = wodDefs[entry.wodId];
    if (!wod) {
      return { wodId: entry.wodId, actual: null, predicted: null, delta: null };
    }
    const actual = scoreWod(wod, entry, profile).percent;
    const predicted = predictWodPercent(wod, componentScores);
    const delta = actual != null && predicted != null ? actual - predicted : null;
    return { wodId: entry.wodId, actual, predicted, delta };
  });

  const deltas = perWod
    .map((w) => w.delta)
    .filter((d): d is number => d != null);
  const index =
    deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : null;

  return { index, perWod };
}
