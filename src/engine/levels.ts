/**
 * 2026-07-11 — the unified HABS 20-level ladder, mirrored from the TPF
 * app (tpf-app src/lib/hybrid_readiness.ts, Phase 103/107). One profile
 * across both products: the number is the same, the level is the same.
 *
 * One level per 5 score points, so the ladder reads at a glance:
 *   Level 10 = 50 (pass) · Level 14 = 70 (good) · Level 17 = 85
 *   (excellent) · Level 20 = 100 (elite — the hard ceiling; no bonus
 *   tier). Under 5 reads as Level 0 (unranked).
 */

export const HABS_MAX_LEVEL = 20;
export const HABS_LEVEL_STEP = 5;

export interface HABSLevelInfo {
  /** 0 (unranked) … 20. */
  level: number;
  /** Score needed for the NEXT level; null at Level 20. */
  nextThreshold: number | null;
  /** Points to the next level; 0 at Level 20. */
  toNext: number;
  /** 0–1 progress from the current level's floor toward the next. */
  progress: number;
}

export function habsLevelInfo(score: number | null | undefined): HABSLevelInfo {
  const s = Math.max(0, Math.min(100, score ?? 0));
  const level = Math.min(HABS_MAX_LEVEL, Math.floor(s / HABS_LEVEL_STEP));
  if (level >= HABS_MAX_LEVEL) {
    return { level: HABS_MAX_LEVEL, nextThreshold: null, toNext: 0, progress: 1 };
  }
  const floor = level * HABS_LEVEL_STEP;
  const next = floor + HABS_LEVEL_STEP;
  return {
    level,
    nextThreshold: next,
    toNext: Math.max(0, next - s),
    progress: (s - floor) / HABS_LEVEL_STEP,
  };
}
