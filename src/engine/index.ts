/**
 * HRS engine — public surface.
 *
 * Pure, framework-agnostic TypeScript. No real standards numbers anywhere; all
 * thresholds/weights arrive from /config (codegen'd from the Excel master).
 * Lift this folder into any app.
 */

export * from './types';
export { ANCHORS, BONUS_CAP, asResolved, scoreToPercentage } from './tier-curve';
export { HABS_MAX_LEVEL, HABS_LEVEL_STEP, habsLevelInfo, type HABSLevelInfo } from './levels';
export {
  resolveThresholds,
  applyAgeGrade,
  ageGradeFactor,
  calc1RMVal,
} from './normalize';
export {
  rawForBenchmark,
  scoreBenchmark,
  scoreComponent,
  computeHRS,
  validatePathwayWeights,
} from './score';
export type { ComputeHrsArgs, PathwayWeightValidation } from './score';
export { WOD_CORE_WEIGHT, scoreWod } from './wod';
export {
  predictWodPercent,
  computeCapacityIndex,
  toComponentScoreMap,
} from './capacity';
export type { ComponentScoreMap } from './capacity';
export { analyseWeaknesses } from './weakness';
export type { WeaknessOptions } from './weakness';
export {
  estimatedPercentile,
  percentileRank,
  ageBand,
  profileCell,
} from './percentile';
export type { AgeBand } from './percentile';
export {
  auditEntry,
  auditBodyweight,
  auditConsistency,
  trustScore,
  needsVerification,
  SANITY_BOUNDS,
  BODYWEIGHT_BOUNDS,
} from './audit';
export type { AuditLevel, AuditFinding, SubmissionContext } from './audit';
export {
  median,
  mad,
  robustBounds,
  isOutlier,
  quantile,
  winsorize,
  trustWeightedPercentile,
  weightedQuantile,
} from './stats';
