/**
 * WOD layer — separate from the core HRS.
 *
 * Benchmark WODs (fran, grace, helen, cindy, diane, fight_gone_bad, …) use the
 * same tier curve (lower-is-better for time-based). Scaling is explicit:
 *   - rx        → full curve
 *   - scaled    → capped at the good (70 %) ceiling
 *   - incomplete→ scored on a rep-equivalent (fraction of prescribed work)
 *
 * WOD weight in the core HRS is 0 % in v1 (display-only). It is a config value
 * so a small capped weight can be enabled later — but WODs are never folded into
 * the core score in v1.
 */

import { ANCHORS, asResolved, scoreToPercentage } from './tier-curve';
import { resolveThresholds } from './normalize';
import type {
  AthleteProfile,
  BenchmarkDef,
  WodDef,
  WodEntry,
  WodScore,
} from './types';

/** v1: WODs contribute 0 % to the core HRS. Config value, not a standard. */
export const WOD_CORE_WEIGHT = 0;

/** A WOD reuses the absolute/sex resolution path (WODs are always `absolute`). */
function wodAsBenchmark(wod: WodDef): BenchmarkDef {
  return {
    id: wod.id,
    component: 'gymnastics', // unused for resolution; WODs are absolute/per-sex
    source: 'wod',
    unit: wod.unit,
    lowerIsBetter: wod.lowerIsBetter,
    normalization: 'absolute',
    thresholds: wod.thresholds,
  };
}

/**
 * Score one logged WOD result. Returns percent === null if the WOD's thresholds
 * are not yet populated (TODO in the Excel master).
 */
export function scoreWod(
  wod: WodDef,
  entry: WodEntry,
  profile: AthleteProfile,
): WodScore {
  const resolved = asResolved(resolveThresholds(wodAsBenchmark(wod), profile));
  if (resolved == null) {
    return { wodId: wod.id, percent: null, scaling: entry.scaling };
  }

  if (entry.scaling === 'incomplete') {
    // Rep-equivalent: fraction of prescribed work, mapped below the pass tier.
    const done = entry.repsCompleted ?? 0;
    const total = entry.repsPrescribed ?? 0;
    const fraction = total > 0 ? Math.min(1, done / total) : 0;
    return { wodId: wod.id, percent: fraction * ANCHORS.pass, scaling: 'incomplete' };
  }

  const full = scoreToPercentage(entry.value, resolved, wod.lowerIsBetter);
  const percent =
    entry.scaling === 'scaled' ? Math.min(full, ANCHORS.good) : full;
  return { wodId: wod.id, percent, scaling: entry.scaling };
}
