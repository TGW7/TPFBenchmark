/**
 * Weakness analysis — rank components, flag limiters and coverage gaps.
 *
 * Drives the weakness radar and the "train this next" prompts. Pure: takes the
 * computed component scores + the pathway's weighted components.
 */

import type {
  ComponentId,
  ComponentScore,
  HrsResult,
  WeaknessReport,
} from './types';

export interface WeaknessOptions {
  /** How many of the weakest tested components to flag as limiters. */
  limiterCount?: number;
}

/**
 * Rank components weakest-first (untested components sort last), then surface the
 * lowest tested components as limiters and any weighted-but-untested components
 * as coverage gaps.
 */
export function analyseWeaknesses(
  result: HrsResult,
  options: WeaknessOptions = {},
): WeaknessReport {
  const limiterCount = options.limiterCount ?? 2;

  const ranked = [...result.components].sort((a, b) => {
    if (a.percent == null && b.percent == null) return 0;
    if (a.percent == null) return 1; // untested last
    if (b.percent == null) return -1;
    return a.percent - b.percent; // weakest first
  });

  const tested = ranked.filter(
    (c): c is ComponentScore & { percent: number } => c.percent != null,
  );
  const limiters: ComponentId[] = tested.slice(0, limiterCount).map((c) => c.component);

  const coverageGaps: ComponentId[] = result.components
    .filter((c) => c.percent == null)
    .map((c) => c.component);

  return { ranked, limiters, coverageGaps };
}
