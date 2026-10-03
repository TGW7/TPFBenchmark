/**
 * 2026-10-02 — what a result may say about a percentile.
 *
 * Every tier on this site is TPF's own standard (owner-set, checked against a
 * permitted anchor where one exists — docs/STANDARDS.md, "Provenance"). The
 * tiers are NOT population percentiles, so a score of 84 is not "the 84th
 * percentile" of anyone.
 *
 * The rule: a percentile is shown ONLY when it is measured — the trust-weighted
 * pool percentile from `fetchPercentile` (src/data/remote.ts), which the
 * server's `benchmark_percentile()` returns only once the athlete's
 * (sex, age-band) cell holds enough trusted submissions (30 by default,
 * supabase/migrations/0001_benchmark_init.sql). With no measured percentile the
 * result shows the score, tier and level, and makes no percentile claim.
 *
 * Until 2026-10-02 the dashboard and the copied result fell back to
 * `estimatedPercentile(score)`, a fixed mapping of tier score to "percentile"
 * (pass ≈ 50th … elite ≈ 99th). That mapping described no population, and it
 * was removed from the engine the same day.
 */
import { formatPercentile, scoreTier } from './format';

export interface LivePercentileLine {
  /** e.g. "73rd percentile" */
  main: string;
  /** e.g. "live — vs 1,240 results" */
  context: string;
}

/** The measured-percentile line, or null when there is no pool percentile.
 *
 *  2026-10-03 — "vs N athletes" → "vs N results". `poolN` is
 *  benchmark_pool_count(): a count of pool ROWS, and one athlete who adds
 *  their numbers on two visits is two rows (the pool keeps no link to anyone
 *  since migration 0007, so it cannot count people). docs/LEGAL-FIXES-2026-10-03.md §7. */
export function livePercentileLine(pct: number | null, poolN: number | null = null): LivePercentileLine | null {
  if (pct == null || !Number.isFinite(pct)) return null;
  return {
    main: `${formatPercentile(pct)} percentile`,
    context: poolN ? `live — vs ${poolN.toLocaleString()} results` : 'live — vs real results',
  };
}

/**
 * Shown under the score when there is no measured percentile. Says what the
 * score IS (against TPF's standards) and that it is not a ranking — and, only
 * when the pool exists, that a percentile can appear later.
 */
export function noPercentileNote(poolAvailable: boolean): string {
  const base = 'Scored against TPF’s own standards — not a ranking against other athletes.';
  return poolAvailable
    ? `${base} A percentile appears once enough athletes of your sex and age have added their numbers.`
    : base;
}

export interface ShareTextArgs {
  scoreLabel: string;
  pathwayLabel: string;
  overall: number;
  /** The measured pool percentile, or null. Never an estimate. */
  livePercentile: number | null;
  poolN?: number | null;
  /** Weakest components, already labelled. */
  weak: string;
  site: string;
}

/** The text the "copy result" button puts on the clipboard. */
export function resultShareText(a: ShareTextArgs): string {
  const tier = scoreTier(a.overall);
  const live = livePercentileLine(a.livePercentile, a.poolN ?? null);
  const pct = live ? `, ${live.main}${a.poolN ? ` of ${a.poolN.toLocaleString()} results` : ''}` : '';
  return (
    `My ${a.scoreLabel} — ${a.pathwayLabel}: ${Math.round(a.overall)}/100 ` +
    `(${tier}${pct}). Weakest: ${a.weak || '—'}. ` +
    `Score yours free → ${a.site}`
  );
}
