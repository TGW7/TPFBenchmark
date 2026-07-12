/**
 * ⚠️ SYNTHETIC DEMO DATA — NOT REAL STANDARDS. ⚠️
 *
 * Every number in this file is made up so the UI renders a populated dashboard
 * before the Excel master is filled in. These values are NOT in /config and are
 * NOT claimed to be calibrated standards — they are the UI equivalent of the
 * synthetic thresholds the engine tests use.
 *
 * The real catalogue (HRS_BENCHMARKS / HRS_WODS / pathways) stays null/TODO and
 * is the source of truth once the workbook is populated.
 */

import type {
  AthleteLogs,
  AthleteProfile,
  BenchmarkDef,
  PathwayConfig,
  Sex,
  ThresholdSet,
  WodDef,
  WodId,
} from '../engine/types';
import { CORE_BENCHMARKS } from '../config/benchmarks';
import { HRS_WODS } from '../config/wods';

export const DEMO_BANNER =
  'Demo data — thresholds, weights & WOD tiers below are SYNTHETIC, not real standards.';

/** ts(pass, good, excellent, elite). For lower-is-better, pass > … > elite. */
const ts = (
  pass: number,
  good: number,
  excellent: number,
  elite: number,
): ThresholdSet => ({ pass, good, excellent, elite });

/** Synthetic per-sex tiers for the 8 demoed benchmarks (one per component). */
const DEMO_THRESHOLDS: Record<string, Record<Sex, ThresholdSet>> = {
  // times in seconds (lower is better)
  run_5k: { M: ts(1560, 1350, 1200, 1050), F: ts(1680, 1470, 1320, 1170) },
  row_2k: { M: ts(500, 460, 430, 400), F: ts(545, 505, 475, 445) },
  // ×bodyweight (higher is better)
  back_squat_1rm: { M: ts(1.25, 1.5, 1.75, 2.0), F: ts(1.0, 1.25, 1.5, 1.75) },
  bench_1rm: { M: ts(1.0, 1.25, 1.5, 1.75), F: ts(0.6, 0.8, 1.0, 1.2) },
  clean_jerk_1rm: { M: ts(1.0, 1.2, 1.4, 1.6), F: ts(0.7, 0.9, 1.1, 1.3) },
  power_clean_1rm: { M: ts(0.9, 1.1, 1.3, 1.5), F: ts(0.6, 0.8, 1.0, 1.2) },
  // reps / seconds (higher is better)
  strict_pullups: { M: ts(5, 10, 15, 22), F: ts(3, 7, 12, 18) },
  plank_hold: { M: ts(60, 120, 180, 240), F: ts(60, 120, 180, 240) },
};

/** Synthetic WOD tiers + quality-mix vectors for two demoed WODs. */
const DEMO_WOD_THRESHOLDS: Record<string, Record<Sex, ThresholdSet>> = {
  fran: { M: ts(360, 240, 180, 120), F: ts(420, 300, 210, 150) },
  cindy: { M: ts(12, 18, 22, 28), F: ts(10, 15, 19, 24) },
};
const DEMO_QUALITY_MIX: Record<string, WodDef['qualityMix']> = {
  fran: { gymnastics: 0.4, upper_strength: 0.2, power: 0.2, core_endurance: 0.2 },
  cindy: { gymnastics: 0.4, upper_strength: 0.3, lower_strength: 0.2, core_endurance: 0.1 },
};

/** Real catalogue with synthetic thresholds overlaid on the demoed benchmarks. */
export const DEMO_BENCHMARKS: BenchmarkDef[] = CORE_BENCHMARKS.map((b) =>
  DEMO_THRESHOLDS[b.id] ? { ...b, thresholds: DEMO_THRESHOLDS[b.id] } : b,
);

/** Real WOD defs with synthetic thresholds + quality-mix overlaid on two WODs. */
export const DEMO_WODS: Record<WodId, WodDef> = Object.fromEntries(
  Object.entries(HRS_WODS).map(([id, w]) => [
    id,
    DEMO_WOD_THRESHOLDS[id]
      ? { ...w, thresholds: DEMO_WOD_THRESHOLDS[id], qualityMix: DEMO_QUALITY_MIX[id] ?? w.qualityMix }
      : w,
  ]),
) as Record<WodId, WodDef>;

export const DEMO_WOD_LIST: WodDef[] = Object.values(DEMO_WODS);

/** Synthetic pathway weights (each column sums to 100). */
export const DEMO_PATHWAYS: Record<string, PathwayConfig> = {
  gym_goer: {
    id: 'gym_goer',
    label: 'General',
    weights: {
      running: 10, erg_engine: 10, lower_strength: 20, upper_strength: 20,
      olympic: 5, power: 10, gymnastics: 15, core_endurance: 10,
    },
  },
  powerlifter: {
    id: 'powerlifter',
    label: 'Powerlifter',
    weights: {
      running: 0, erg_engine: 0, lower_strength: 45, upper_strength: 35,
      olympic: 5, power: 10, gymnastics: 0, core_endurance: 5,
    },
  },
  crossfit_generalist: {
    id: 'crossfit_generalist',
    label: 'CrossFit Generalist',
    weights: {
      running: 15, erg_engine: 15, lower_strength: 15, upper_strength: 10,
      olympic: 15, power: 10, gymnastics: 15, core_endurance: 5,
    },
  },
  hyrox: {
    id: 'hyrox',
    label: 'HYROX',
    weights: {
      running: 30, erg_engine: 25, lower_strength: 15, upper_strength: 5,
      olympic: 0, power: 5, gymnastics: 5, core_endurance: 15,
    },
  },
};

export const DEMO_PATHWAY_LIST: PathwayConfig[] = Object.values(DEMO_PATHWAYS);

export const DEMO_PROFILE: AthleteProfile = { sex: 'M', bodyweightKg: 84, ageYears: 31 };

/** A worked sample athlete: one logged benchmark per component + two WODs. */
export const DEMO_LOGS: AthleteLogs = {
  orm: [
    { benchmarkId: 'back_squat_1rm', weightKg: 150, reps: 1 },
    { benchmarkId: 'bench_1rm', weightKg: 110, reps: 1 },
    { benchmarkId: 'clean_jerk_1rm', weightKg: 120, reps: 1 },
    { benchmarkId: 'power_clean_1rm', weightKg: 100, reps: 1 },
  ],
  raceTimes: [
    { benchmarkId: 'run_5k', modality: 'run', event: '5k', timeSec: 1320 },
    { benchmarkId: 'row_2k', modality: 'row', event: '2k', timeSec: 445 },
  ],
  manual: [
    { benchmarkId: 'strict_pullups', value: 14 },
    { benchmarkId: 'plank_hold', value: 150 },
  ],
  wod: [
    { wodId: 'fran', value: 210, scaling: 'rx' },
    { wodId: 'cindy', value: 20, scaling: 'rx' },
  ],
};
