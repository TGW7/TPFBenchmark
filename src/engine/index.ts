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
export {
  HABS_COMPONENT_IDS,
  HABS_EPLEY_DIVISOR,
  HABS_OLY_REP_DIVISOR,
  habsLadder,
  habsScoreValue,
  habsOneRepMax,
  habsRawValue,
  habsBenchmarkScore,
  computeHabs,
  habsAsHrsResult,
} from './habs';
export type {
  HabsLadder,
  HabsBenchmarkResult,
  HabsComponentResult,
  HabsResult,
  ComputeHabsArgs,
} from './habs';
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
// 2026-10-03 — the app's predicted race equivalents for HABS
// (docs/LEGAL-FIXES-2026-10-03.md §6).
export {
  raceTimesWithEquivalents,
  predictRaceTime,
  predictRiegel,
  withinPredictionRange,
  isPredictableDistance,
  MAX_PREDICTION_DISTANCE_RATIO,
  MAX_PREDICTED_METRES,
} from './racePrediction';
export type { RaceStore, ModalityRecords, PredictionSource, EquivModality } from './racePrediction';
export { predictMissingRaces, buildRaceStore, appSexOf } from './habsPredict';
export type { RacePrediction, RaceEventRef, PredictArgs } from './habsPredict';
