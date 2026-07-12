/**
 * HRS engine — core types.
 *
 * Lineage: these mirror the Operational Readiness Score (ORS) engine's naming
 * conventions. The HRS-specific additions are the normalisation resolver seam
 * (see normalize.ts) and the WOD / Capacity Index layers (wod.ts, capacity.ts).
 *
 * NO real standards numbers live here — thresholds and weights are typed as
 * `number | null` and arrive from /config (codegen'd from the Excel master).
 */

export type Sex = 'M' | 'F';

/** The eight scored components in v1, plus two optional ORS carry-overs. */
export type CoreComponentId =
  | 'running'
  | 'erg_engine'
  | 'lower_strength'
  | 'upper_strength'
  | 'olympic'
  | 'power'
  | 'gymnastics'
  | 'core_endurance';

export type OptionalComponentId = 'grip' | 'rucking';

/** Operator-only components (from the ORS model). */
export type OperatorComponentId = 'upper_endurance' | 'stability' | 'swimming';

/** 2026-07-13 — triathlete pathway discipline components (owner: swim 25 /
 *  bike 25 / run 25 / strength 25). `swimming` already existed above for
 *  the operator pathways and is reused; cycling is new here. */
export type EnduranceComponentId = 'cycling';

export type ComponentId = CoreComponentId | OptionalComponentId | OperatorComponentId | EnduranceComponentId;

export const CORE_COMPONENT_IDS: readonly CoreComponentId[] = [
  'running',
  'erg_engine',
  'lower_strength',
  'upper_strength',
  'olympic',
  'power',
  'gymnastics',
  'core_endurance',
] as const;

/** Where a benchmark's raw value is resolved from. `wod` is new vs ORS. */
export type Source = 'race_times' | 'orm' | 'manual' | 'wod';

/**
 * How thresholds are stored / resolved:
 *  - `bodyweight`: tiers stored as ×bodyweight per sex, multiplied by the
 *    athlete's logged bodyweight to get an absolute threshold.
 *  - `absolute`: tiers stored per sex in the benchmark's native unit.
 */
export type Normalization = 'bodyweight' | 'absolute';

/** Lift / general pathways (benchmark.takepointfitness.com). */
export type LiftPathwayId =
  | 'gym_goer'
  | 'hybrid_athlete'
  | 'crossfit_generalist'
  | 'hyrox'
  | 'powerlifter'
  | 'bodybuilder'
  | 'triathlete';

/** Operator pathway ids are unit slugs codegen'd from the ORS workbook, so the
 *  general PathwayId is a string; lift still uses the typed LiftPathwayId. */
export type PathwayId = string;

export type BenchmarkId = string;
export type WodId = string;

/**
 * Tier thresholds anchored at 50 / 70 / 85 / 100 % (four-tier, legacy) or
 * 50 / 60 / 70 / 80 / 90 / 100 % (six-tier, once `novice` is populated).
 * `null` = not yet populated in the Excel master (TODO). The engine skips any
 * benchmark whose resolved thresholds are incomplete.
 *
 * 2026-07-13 (round 8) — six tiers, not four: Beginner(pass) / Novice /
 * Experienced(good) / Intermediate / Advanced / Elite (owner — supersedes
 * an earlier five-tier attempt). `novice`/`intermediate`/`advanced` are
 * OPTIONAL/nullable rather than required: operator/WOD standards haven't
 * been given these values, so they keep scoring on the original four-tier
 * curve untouched (`excellent` stays required and is still USED there);
 * only benchmarks with a real `novice` number get the six-tier curve, where
 * `excellent` becomes vestigial (populated for type-completeness, ignored
 * by scoring). See tier-curve.ts for the dual-mode logic this enables.
 */
export interface ThresholdSet {
  pass: number | null;
  /** Optional: absent (undefined) on any threshold set that predates this
   *  tier (e.g. generated operator/WOD data) — NOT the same as explicit
   *  `null`, but treated identically by the engine (`novice != null`). */
  novice?: number | null;
  good: number | null;
  excellent: number | null;
  intermediate?: number | null;
  advanced?: number | null;
  elite: number | null;
}

/** A fully-resolved threshold set — the four REQUIRED legacy anchors known
 *  (post-resolution). The three new tiers stay optional/nullable even
 *  here: `novice`'s presence is the signal for which scoring curve
 *  (four-tier vs six-tier) applies. */
export interface ResolvedThresholds {
  pass: number;
  novice?: number | null;
  good: number;
  excellent: number;
  intermediate?: number | null;
  advanced?: number | null;
  elite: number;
}

export interface BenchmarkMeta {
  dataSource?: string;
  license?: string;
  commercialUse?: string;
  referencePopulation?: string;
  launchMethod?: string;
  notes?: string;
}

export interface BenchmarkDef {
  id: BenchmarkId;
  component: ComponentId;
  source: Source;
  /** Native unit, e.g. 'mm:ss', 'xBW', 'reps', 'cm'. */
  unit: string;
  lowerIsBetter: boolean;
  normalization: Normalization;
  /** Per-sex tier thresholds (in the stored unit — ×BW for bodyweight defs). */
  thresholds: Record<Sex, ThresholdSet>;
  /** Optional carry-over components (grip, rucking) ship off by default. */
  optional?: boolean;
  meta?: BenchmarkMeta;
}

export interface PathwayConfig {
  id: PathwayId;
  label: string;
  /** component → weight. `null` = TODO. Present (non-null) weights must sum 100. */
  weights: Partial<Record<ComponentId, number | null>>;
  /** Optional grouping for the picker (e.g. 'US' / 'UK' for operator units). */
  group?: string;
  /** Radar axes: 'components' (default) or 'benchmarks' (per-lift, for strength pathways). */
  radar?: 'components' | 'benchmarks';
  /** Whether benchmark WODs + the Capacity Index apply (off for pure-strength). */
  showWods?: boolean;
}

/** Prescribed Rx load for a WOD: the movement + weight (kg) per sex. */
export interface WodLoad {
  movement: string;
  M: number | null;
  F: number | null;
}

export type WodScalingOption = 'rx' | 'scaled' | 'incomplete';

export interface WodDef {
  id: WodId;
  unit: string;
  lowerIsBetter: boolean;
  thresholds: Record<Sex, ThresholdSet>;
  /** Capacity-Index vector: component → fraction of the WOD's demand (rows sum 1). */
  qualityMix: Partial<Record<ComponentId, number | null>>;
  /** Prescribed Rx load(s). Null weights = bodyweight (e.g. Cindy). */
  loads?: WodLoad[];
}

export interface AthleteProfile {
  sex: Sex;
  bodyweightKg: number;
  ageYears?: number;
}

/** Toggle seams kept off by default (see normalize.ts). */
export interface EngineOptions {
  /** WMA-style Masters age-grading applied to raw value before mapping. */
  ageGrading?: boolean;
  /** Optional ORS carry-over components (grip, rucking). */
  includeOptionalComponents?: boolean;
}

// ---- logged data -----------------------------------------------------------

export interface OrmEntry {
  benchmarkId: BenchmarkId;
  weightKg: number;
  reps: number;
}

export interface RaceTimeEntry {
  benchmarkId: BenchmarkId;
  /** e.g. 'run' | 'row' | 'ski' | 'bike' | 'swim' */
  modality: string;
  /** e.g. '1mi' | '5k' | '2k' | '500m' */
  event: string;
  timeSec: number;
}

export interface ManualEntry {
  benchmarkId: BenchmarkId;
  /** value in the benchmark's native unit (reps, cm, seconds for holds, …). */
  value: number;
}

export type WodScaling = 'rx' | 'scaled' | 'incomplete';

export interface WodEntry {
  wodId: WodId;
  /** Result in the WOD's native unit (seconds, reps, rounds). */
  value: number;
  scaling: WodScaling;
  /** For `incomplete`: reps completed and the prescribed total, for rep-equivalent. */
  repsCompleted?: number;
  repsPrescribed?: number;
}

export interface AthleteLogs {
  orm: OrmEntry[];
  raceTimes: RaceTimeEntry[];
  manual: ManualEntry[];
  wod: WodEntry[];
}

// ---- engine outputs --------------------------------------------------------

export interface BenchmarkScore {
  benchmarkId: BenchmarkId;
  /** null = no data or thresholds not yet populated (skipped). */
  percent: number | null;
  raw: number | null;
}

export interface ComponentScore {
  component: ComponentId;
  /** Average of logged benchmark %s in this component, or null if none. */
  percent: number | null;
  benchmarks: BenchmarkScore[];
}

export interface HrsResult {
  pathway: PathwayId;
  /** Overall readiness %, 0–110, or null when nothing scoreable is logged. */
  overall: number | null;
  components: ComponentScore[];
  /** Fraction (0–1) of the pathway's weight that was actually tested. */
  coverage: number;
}

export interface WodScore {
  wodId: WodId;
  percent: number | null;
  scaling: WodScaling;
}

export interface CapacityResult {
  /** mean(actualWodPct − predictedWodPct) across logged WODs, or null. */
  index: number | null;
  perWod: Array<{
    wodId: WodId;
    actual: number | null;
    predicted: number | null;
    delta: number | null;
  }>;
}

export interface WeaknessReport {
  /** Components ranked weakest-first (nulls — untested — sorted last). */
  ranked: ComponentScore[];
  /** Lowest-scoring tested components (limiters to train). */
  limiters: ComponentId[];
  /** Pathway components carrying weight but with no data logged. */
  coverageGaps: ComponentId[];
}
