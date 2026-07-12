// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: config/standards/TPF_HRS_Standards_v0_2026-06-21.xlsx
// Regenerate with `npm run codegen`. Edit the Excel master, never this file.
//
// Empty threshold / weight / mix cells in the workbook are emitted as `null`
// (TODO). The engine skips null benchmarks/components and re-normalises.

import type {
  ComponentId,
  Normalization,
  PathwayId,
  Sex,
  Source,
  ThresholdSet,
  WodId,
} from '../../engine/types';

export interface SourcingRow {
  id: string;
  component: ComponentId;
  source: Source;
  unit: string;
  lowerIsBetter: boolean;
  normalization: Normalization;
  optional: boolean;
  dataSource: string;
  license: string;
  commercialUse: string;
  referencePopulation: string;
  launchMethod: string;
  notes: string;
}

export interface WodStandard {
  unit: string;
  lowerIsBetter: boolean;
  thresholds: Record<Sex, ThresholdSet>;
  load?: { movement: string; M: number | null; F: number | null };
}

/** Populated sourcing plan (drives benchmark ids, source, unit, direction). */
export const BENCHMARK_SOURCING: SourcingRow[] = [
  {
    "id": "run_1mi",
    "component": "running",
    "source": "race_times",
    "unit": "mm:ss",
    "lowerIsBetter": true,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "WMA age-grade + open race data",
    "license": "CC BY 4.0",
    "commercialUse": "Yes (attribute WMA)",
    "referencePopulation": "General / masters runners",
    "launchMethod": "Licensed data + expert",
    "notes": "Age/sex normalised via WMA factors"
  },
  {
    "id": "run_5k",
    "component": "running",
    "source": "race_times",
    "unit": "mm:ss",
    "lowerIsBetter": true,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "WMA age-grade + open race distributions",
    "license": "CC BY 4.0",
    "commercialUse": "Yes (attribute WMA)",
    "referencePopulation": "General runners",
    "launchMethod": "Licensed data + expert",
    "notes": "parkrun aggregate distributions a useful reference — confirm their data policy first"
  },
  {
    "id": "row_2k",
    "component": "erg_engine",
    "source": "race_times",
    "unit": "mm:ss.s",
    "lowerIsBetter": true,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "Concept2 rankings (reference only)",
    "license": "Proprietary",
    "commercialUse": "License required",
    "referencePopulation": "Concept2 loggers (enthusiast-biased)",
    "launchMethod": "Own-data + expert",
    "notes": "Do NOT ingest C2 data commercially without written consent; seed tiers via expert + own users"
  },
  {
    "id": "row_500m",
    "component": "erg_engine",
    "source": "race_times",
    "unit": "mm:ss.s",
    "lowerIsBetter": true,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "Concept2 rankings (reference only)",
    "license": "Proprietary",
    "commercialUse": "License required",
    "referencePopulation": "Concept2 loggers",
    "launchMethod": "Own-data + expert",
    "notes": "As row_2k — license or skip; seed expert"
  },
  {
    "id": "back_squat_1rm",
    "component": "lower_strength",
    "source": "orm",
    "unit": "kg",
    "lowerIsBetter": false,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "StrengthLevel + Kilgore 2023 + IPF/USAPL (reference); expert-curated absolute tiers",
    "license": "CC0 / public domain",
    "commercialUse": "Yes (no restriction)",
    "referencePopulation": "Competitive lifters (strong-biased)",
    "launchMethod": "Licensed data (adjust for general pop)",
    "notes": "Squat contested in PL; rich by sex/BW/age | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW)"
  },
  {
    "id": "front_squat_1rm",
    "component": "lower_strength",
    "source": "orm",
    "unit": "kg",
    "lowerIsBetter": false,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "StrengthLevel + Kilgore 2023 + IPF/USAPL (reference); expert-curated absolute tiers",
    "license": "n/a",
    "commercialUse": "Yes",
    "referencePopulation": "Trained adults",
    "launchMethod": "Coach-curated (~0.82x back squat)",
    "notes": "Front squat 1RM | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW)"
  },
  {
    "id": "deadlift_1rm",
    "component": "lower_strength",
    "source": "orm",
    "unit": "kg",
    "lowerIsBetter": false,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "StrengthLevel + Kilgore 2023 + IPF/USAPL (reference); expert-curated absolute tiers",
    "license": "CC0 / public domain",
    "commercialUse": "Yes (no restriction)",
    "referencePopulation": "Competitive lifters",
    "launchMethod": "Licensed data (adjust)",
    "notes": "Contested in PL | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW)"
  },
  {
    "id": "bench_1rm",
    "component": "upper_strength",
    "source": "orm",
    "unit": "kg",
    "lowerIsBetter": false,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "StrengthLevel + Kilgore 2023 + IPF/USAPL (reference); expert-curated absolute tiers",
    "license": "CC0 / public domain",
    "commercialUse": "Yes (no restriction)",
    "referencePopulation": "Competitive lifters",
    "launchMethod": "Licensed data (adjust)",
    "notes": "Bench contested in PL | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW)"
  },
  {
    "id": "strict_press_1rm",
    "component": "upper_strength",
    "source": "orm",
    "unit": "kg",
    "lowerIsBetter": false,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "StrengthLevel + Kilgore 2023 + IPF/USAPL (reference); expert-curated absolute tiers",
    "license": "None",
    "commercialUse": "Expert",
    "referencePopulation": "Own users",
    "launchMethod": "Expert-curated + own-data",
    "notes": "Anchor ratio vs bench / bodyweight; refine from own data | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW)"
  },
  {
    "id": "snatch_1rm",
    "component": "olympic",
    "source": "orm",
    "unit": "kg",
    "lowerIsBetter": false,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "StrengthLevel + Kilgore 2023 + IPF/USAPL (reference); expert-curated absolute tiers",
    "license": "Proprietary / unclear",
    "commercialUse": "License required / expert",
    "referencePopulation": "Elite weightlifters",
    "launchMethod": "Expert-curated + own-data",
    "notes": "Comp data elite-biased; anchor with coaching ratios | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW)"
  },
  {
    "id": "clean_jerk_1rm",
    "component": "olympic",
    "source": "orm",
    "unit": "kg",
    "lowerIsBetter": false,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "StrengthLevel + Kilgore 2023 + IPF/USAPL (reference); expert-curated absolute tiers",
    "license": "Proprietary / unclear",
    "commercialUse": "License required / expert",
    "referencePopulation": "Elite weightlifters",
    "launchMethod": "Expert-curated + own-data",
    "notes": "As snatch | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW)"
  },
  {
    "id": "power_clean_1rm",
    "component": "power",
    "source": "orm",
    "unit": "kg",
    "lowerIsBetter": false,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "StrengthLevel + Kilgore 2023 + IPF/USAPL (reference); expert-curated absolute tiers",
    "license": "None",
    "commercialUse": "Expert",
    "referencePopulation": "Own users",
    "launchMethod": "Expert-curated + own-data",
    "notes": "Ratio vs clean & jerk; refine from own data | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW) | 2026-07-12: absolute kg (owner: fixed-load sports don't scale with BW)"
  },
  {
    "id": "broad_jump",
    "component": "power",
    "source": "manual",
    "unit": "cm",
    "lowerIsBetter": false,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "Athletic / combine normative data + expert",
    "license": "Mixed / public norms",
    "commercialUse": "Check per source",
    "referencePopulation": "Athletic test populations",
    "launchMethod": "Published norms + own-data",
    "notes": "Sex-split absolute distance"
  },
  {
    "id": "strict_pullups",
    "component": "gymnastics",
    "source": "manual",
    "unit": "reps",
    "lowerIsBetter": false,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "Expert-curated (no public dataset)",
    "license": "None",
    "commercialUse": "Expert",
    "referencePopulation": "Own users",
    "launchMethod": "Expert-curated + own-data",
    "notes": "Recalibrate from own data quickly"
  },
  {
    "id": "hspu",
    "component": "gymnastics",
    "source": "manual",
    "unit": "reps",
    "lowerIsBetter": false,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "Expert-curated",
    "license": "None",
    "commercialUse": "Expert",
    "referencePopulation": "Own users",
    "launchMethod": "Expert-curated + own-data",
    "notes": "Strict HSPU — head to floor, no kip, full lockout"
  },
  {
    "id": "t2b",
    "component": "gymnastics",
    "source": "manual",
    "unit": "reps",
    "lowerIsBetter": false,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "Expert-curated",
    "license": "None",
    "commercialUse": "Expert",
    "referencePopulation": "Own users",
    "launchMethod": "Expert-curated + own-data",
    "notes": ""
  },
  {
    "id": "du_unbroken",
    "component": "gymnastics",
    "source": "manual",
    "unit": "reps",
    "lowerIsBetter": false,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "Expert-curated",
    "license": "None",
    "commercialUse": "Expert",
    "referencePopulation": "Own users",
    "launchMethod": "Expert-curated + own-data",
    "notes": "Unbroken double-unders"
  },
  {
    "id": "max_mu",
    "component": "gymnastics",
    "source": "manual",
    "unit": "reps",
    "lowerIsBetter": false,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "Expert-curated",
    "license": "None",
    "commercialUse": "Expert",
    "referencePopulation": "Own users",
    "launchMethod": "Expert-curated + own-data",
    "notes": "Bar or ring — specify"
  },
  {
    "id": "plank_hold",
    "component": "core_endurance",
    "source": "manual",
    "unit": "mm:ss",
    "lowerIsBetter": false,
    "normalization": "absolute",
    "optional": false,
    "dataSource": "Normative fitness data + expert",
    "license": "Mixed",
    "commercialUse": "Expert",
    "referencePopulation": "Own users",
    "launchMethod": "Expert-curated + own-data",
    "notes": "Longer = better (higher_is_better)"
  },
  {
    "id": "grip_deadhang",
    "component": "grip",
    "source": "manual",
    "unit": "mm:ss",
    "lowerIsBetter": false,
    "normalization": "absolute",
    "optional": true,
    "dataSource": "Expert-curated",
    "license": "None",
    "commercialUse": "Expert",
    "referencePopulation": "Own users",
    "launchMethod": "Optional — off by default",
    "notes": "Carry-over from ORS"
  },
  {
    "id": "ruck_time",
    "component": "rucking",
    "source": "race_times",
    "unit": "mm:ss",
    "lowerIsBetter": true,
    "normalization": "absolute",
    "optional": true,
    "dataSource": "Expert / military standards",
    "license": "Mixed",
    "commercialUse": "Expert",
    "referencePopulation": "Own users",
    "launchMethod": "Optional — off by default",
    "notes": "Carry-over from ORS"
  }
];

/** Per-benchmark tier thresholds by sex. Values are TODO (null) until populated. */
export const STANDARDS_THRESHOLDS: Record<string, Record<Sex, ThresholdSet>> = {
  "run_1mi": {
    "M": {
      "pass": 545,
      "novice": 455,
      "good": 390,
      "excellent": 345,
      "intermediate": 370,
      "advanced": 330,
      "elite": 300
    },
    "F": {
      "pass": 620,
      "novice": 520,
      "good": 455,
      "excellent": 410,
      "intermediate": 435,
      "advanced": 395,
      "elite": 360
    }
  },
  "run_5k": {
    "M": {
      "pass": 1805,
      "novice": 1500,
      "good": 1320,
      "excellent": 1185,
      "intermediate": 1170,
      "advanced": 1140,
      "elite": 1050
    },
    "F": {
      "pass": 2080,
      "novice": 1735,
      "good": 1525,
      "excellent": 1380,
      "intermediate": 1355,
      "advanced": 1335,
      "elite": 1245
    }
  },
  "row_2k": {
    "M": {
      "pass": 555,
      "novice": 505,
      "good": 460,
      "excellent": 410,
      "intermediate": 425,
      "advanced": 405,
      "elite": 390
    },
    "F": {
      "pass": 640,
      "novice": 580,
      "good": 525,
      "excellent": 465,
      "intermediate": 485,
      "advanced": 455,
      "elite": 435
    }
  },
  "row_500m": {
    "M": {
      "pass": 110,
      "novice": null,
      "good": 100,
      "excellent": 93,
      "intermediate": null,
      "advanced": null,
      "elite": 85
    },
    "F": {
      "pass": 125,
      "novice": null,
      "good": 115,
      "excellent": 107,
      "intermediate": null,
      "advanced": null,
      "elite": 102
    }
  },
  "back_squat_1rm": {
    "M": {
      "pass": 80,
      "novice": 100,
      "good": 120,
      "excellent": 155,
      "intermediate": 145,
      "advanced": 165,
      "elite": 190
    },
    "F": {
      "pass": 50,
      "novice": 60,
      "good": 75,
      "excellent": 97,
      "intermediate": 90,
      "advanced": 105,
      "elite": 120
    }
  },
  "front_squat_1rm": {
    "M": {
      "pass": 70,
      "novice": 85,
      "good": 100,
      "excellent": 127,
      "intermediate": 120,
      "advanced": 135,
      "elite": 155
    },
    "F": {
      "pass": 40,
      "novice": 50,
      "good": 60,
      "excellent": 80,
      "intermediate": 75,
      "advanced": 85,
      "elite": 98
    }
  },
  "deadlift_1rm": {
    "M": {
      "pass": 95,
      "novice": 115,
      "good": 140,
      "excellent": 180,
      "intermediate": 165,
      "advanced": 195,
      "elite": 225
    },
    "F": {
      "pass": 65,
      "novice": 75,
      "good": 90,
      "excellent": 118,
      "intermediate": 110,
      "advanced": 125,
      "elite": 145
    }
  },
  "bench_1rm": {
    "M": {
      "pass": 70,
      "novice": 85,
      "good": 100,
      "excellent": 130,
      "intermediate": 120,
      "advanced": 140,
      "elite": 160
    },
    "F": {
      "pass": 40,
      "novice": 50,
      "good": 55,
      "excellent": 73,
      "intermediate": 65,
      "advanced": 80,
      "elite": 90
    }
  },
  "strict_press_1rm": {
    "M": {
      "pass": 40,
      "novice": 50,
      "good": 60,
      "excellent": 77,
      "intermediate": 70,
      "advanced": 85,
      "elite": 95
    },
    "F": {
      "pass": 20,
      "novice": 30,
      "good": 35,
      "excellent": 45,
      "intermediate": 40,
      "advanced": 50,
      "elite": 55
    }
  },
  "snatch_1rm": {
    "M": {
      "pass": 40,
      "novice": 50,
      "good": 65,
      "excellent": 81,
      "intermediate": 75,
      "advanced": 85,
      "elite": 100
    },
    "F": {
      "pass": 25,
      "novice": 35,
      "good": 40,
      "excellent": 50,
      "intermediate": 45,
      "advanced": 55,
      "elite": 62
    }
  },
  "clean_jerk_1rm": {
    "M": {
      "pass": 55,
      "novice": 65,
      "good": 80,
      "excellent": 105,
      "intermediate": 95,
      "advanced": 115,
      "elite": 130
    },
    "F": {
      "pass": 35,
      "novice": 45,
      "good": 50,
      "excellent": 66,
      "intermediate": 60,
      "advanced": 70,
      "elite": 82
    }
  },
  "power_clean_1rm": {
    "M": {
      "pass": 50,
      "novice": 60,
      "good": 75,
      "excellent": 97,
      "intermediate": 90,
      "advanced": 105,
      "elite": 120
    },
    "F": {
      "pass": 30,
      "novice": 40,
      "good": 50,
      "excellent": 63,
      "intermediate": 60,
      "advanced": 70,
      "elite": 78
    }
  },
  "broad_jump": {
    "M": {
      "pass": 200,
      "novice": null,
      "good": 230,
      "excellent": 260,
      "intermediate": null,
      "advanced": null,
      "elite": 285
    },
    "F": {
      "pass": 160,
      "novice": null,
      "good": 185,
      "excellent": 210,
      "intermediate": null,
      "advanced": null,
      "elite": 220
    }
  },
  "strict_pullups": {
    "M": {
      "pass": 5,
      "novice": null,
      "good": 11,
      "excellent": 18,
      "intermediate": null,
      "advanced": null,
      "elite": 25
    },
    "F": {
      "pass": 1,
      "novice": null,
      "good": 5,
      "excellent": 10,
      "intermediate": null,
      "advanced": null,
      "elite": 18
    }
  },
  "hspu": {
    "M": {
      "pass": 3,
      "novice": null,
      "good": 8,
      "excellent": 15,
      "intermediate": null,
      "advanced": null,
      "elite": 25
    },
    "F": {
      "pass": 1,
      "novice": null,
      "good": 4,
      "excellent": 8,
      "intermediate": null,
      "advanced": null,
      "elite": 15
    }
  },
  "t2b": {
    "M": {
      "pass": 8,
      "novice": null,
      "good": 18,
      "excellent": 30,
      "intermediate": null,
      "advanced": null,
      "elite": 45
    },
    "F": {
      "pass": 5,
      "novice": null,
      "good": 12,
      "excellent": 22,
      "intermediate": null,
      "advanced": null,
      "elite": 35
    }
  },
  "du_unbroken": {
    "M": {
      "pass": 20,
      "novice": null,
      "good": 50,
      "excellent": 100,
      "intermediate": null,
      "advanced": null,
      "elite": 150
    },
    "F": {
      "pass": 15,
      "novice": null,
      "good": 45,
      "excellent": 90,
      "intermediate": null,
      "advanced": null,
      "elite": 130
    }
  },
  "max_mu": {
    "M": {
      "pass": 1,
      "novice": null,
      "good": 4,
      "excellent": 9,
      "intermediate": null,
      "advanced": null,
      "elite": 14
    },
    "F": {
      "pass": 1,
      "novice": null,
      "good": 2,
      "excellent": 5,
      "intermediate": null,
      "advanced": null,
      "elite": 8
    }
  },
  "plank_hold": {
    "M": {
      "pass": 90,
      "novice": null,
      "good": 150,
      "excellent": 180,
      "intermediate": null,
      "advanced": null,
      "elite": 300
    },
    "F": {
      "pass": 90,
      "novice": null,
      "good": 150,
      "excellent": 180,
      "intermediate": null,
      "advanced": null,
      "elite": 300
    }
  }
};

/** Per-PATHWAY tier overrides (Standards_Pathway sheet). A populated
 *  benchmark+sex entry replaces the base tiers under that pathway; anything
 *  absent falls back to STANDARDS_THRESHOLDS. */
export const PATHWAY_STANDARD_OVERRIDES: Partial<Record<PathwayId, Record<string, Record<Sex, ThresholdSet>>>> = {
  "gym_goer": {
    "run_1mi": {
      "M": {
        "pass": 620,
        "novice": 545,
        "good": 470,
        "excellent": 390,
        "intermediate": 415,
        "advanced": 375,
        "elite": 345
      },
      "F": {
        "pass": 725,
        "novice": 635,
        "good": 550,
        "excellent": 460,
        "intermediate": 490,
        "advanced": 445,
        "elite": 410
      }
    },
    "run_5k": {
      "M": {
        "pass": 2080,
        "novice": 1815,
        "good": 1575,
        "excellent": 1290,
        "intermediate": 1385,
        "advanced": 1240,
        "elite": 1140
      },
      "F": {
        "pass": 2355,
        "novice": 2080,
        "good": 1825,
        "excellent": 1500,
        "intermediate": 1610,
        "advanced": 1450,
        "elite": 1350
      }
    },
    "row_2k": {
      "M": {
        "pass": 580,
        "novice": 530,
        "good": 485,
        "excellent": 425,
        "intermediate": 445,
        "advanced": 420,
        "elite": 405
      },
      "F": {
        "pass": 660,
        "novice": 605,
        "good": 550,
        "excellent": 485,
        "intermediate": 505,
        "advanced": 475,
        "elite": 460
      }
    }
  },
  "crossfit_generalist": {
    "back_squat_1rm": {
      "M": {
        "pass": 85,
        "novice": 110,
        "good": 135,
        "excellent": 175,
        "intermediate": 160,
        "advanced": 185,
        "elite": 210
      },
      "F": {
        "pass": 60,
        "novice": 75,
        "good": 90,
        "excellent": 120,
        "intermediate": 110,
        "advanced": 130,
        "elite": 150
      }
    },
    "front_squat_1rm": {
      "M": {
        "pass": 70,
        "novice": 95,
        "good": 115,
        "excellent": 148,
        "intermediate": 135,
        "advanced": 160,
        "elite": 180
      },
      "F": {
        "pass": 50,
        "novice": 60,
        "good": 75,
        "excellent": 103,
        "intermediate": 95,
        "advanced": 110,
        "elite": 128
      }
    },
    "deadlift_1rm": {
      "M": {
        "pass": 90,
        "novice": 115,
        "good": 140,
        "excellent": 175,
        "intermediate": 165,
        "advanced": 185,
        "elite": 210
      },
      "F": {
        "pass": 65,
        "novice": 75,
        "good": 95,
        "excellent": 120,
        "intermediate": 110,
        "advanced": 130,
        "elite": 150
      }
    },
    "bench_1rm": {
      "M": {
        "pass": 70,
        "novice": 85,
        "good": 100,
        "excellent": 122,
        "intermediate": 115,
        "advanced": 130,
        "elite": 140
      },
      "F": {
        "pass": 35,
        "novice": 45,
        "good": 50,
        "excellent": 72,
        "intermediate": 65,
        "advanced": 80,
        "elite": 90
      }
    },
    "snatch_1rm": {
      "M": {
        "pass": 45,
        "novice": 55,
        "good": 70,
        "excellent": 100,
        "intermediate": 90,
        "advanced": 110,
        "elite": 125
      },
      "F": {
        "pass": 30,
        "novice": 40,
        "good": 45,
        "excellent": 69,
        "intermediate": 60,
        "advanced": 75,
        "elite": 90
      }
    },
    "clean_jerk_1rm": {
      "M": {
        "pass": 60,
        "novice": 75,
        "good": 90,
        "excellent": 126,
        "intermediate": 115,
        "advanced": 135,
        "elite": 155
      },
      "F": {
        "pass": 40,
        "novice": 50,
        "good": 60,
        "excellent": 87,
        "intermediate": 80,
        "advanced": 95,
        "elite": 110
      }
    },
    "power_clean_1rm": {
      "M": {
        "pass": 55,
        "novice": 65,
        "good": 80,
        "excellent": 110,
        "intermediate": 100,
        "advanced": 120,
        "elite": 135
      },
      "F": {
        "pass": 35,
        "novice": 45,
        "good": 50,
        "excellent": 75,
        "intermediate": 65,
        "advanced": 80,
        "elite": 95
      }
    },
    "run_1mi": {
      "M": {
        "pass": 570,
        "novice": 505,
        "good": 440,
        "excellent": 360,
        "intermediate": 385,
        "advanced": 345,
        "elite": 330
      },
      "F": {
        "pass": 660,
        "novice": 580,
        "good": 500,
        "excellent": 415,
        "intermediate": 445,
        "advanced": 405,
        "elite": 380
      }
    },
    "run_5k": {
      "M": {
        "pass": 1870,
        "novice": 1670,
        "good": 1480,
        "excellent": 1230,
        "intermediate": 1315,
        "advanced": 1190,
        "elite": 1110
      },
      "F": {
        "pass": 2110,
        "novice": 1885,
        "good": 1670,
        "excellent": 1400,
        "intermediate": 1490,
        "advanced": 1365,
        "elite": 1290
      }
    },
    "row_2k": {
      "M": {
        "pass": 545,
        "novice": 495,
        "good": 450,
        "excellent": 400,
        "intermediate": 415,
        "advanced": 395,
        "elite": 380
      },
      "F": {
        "pass": 620,
        "novice": 565,
        "good": 520,
        "excellent": 465,
        "intermediate": 485,
        "advanced": 455,
        "elite": 440
      }
    }
  },
  "hyrox": {
    "back_squat_1rm": {
      "M": {
        "pass": 70,
        "novice": 85,
        "good": 105,
        "excellent": 140,
        "intermediate": 130,
        "advanced": 150,
        "elite": 170
      },
      "F": {
        "pass": 45,
        "novice": 55,
        "good": 70,
        "excellent": 90,
        "intermediate": 85,
        "advanced": 95,
        "elite": 110
      }
    },
    "front_squat_1rm": {
      "M": {
        "pass": 60,
        "novice": 75,
        "good": 90,
        "excellent": 115,
        "intermediate": 105,
        "advanced": 125,
        "elite": 140
      },
      "F": {
        "pass": 40,
        "novice": 50,
        "good": 55,
        "excellent": 74,
        "intermediate": 70,
        "advanced": 80,
        "elite": 90
      }
    },
    "deadlift_1rm": {
      "M": {
        "pass": 90,
        "novice": 115,
        "good": 135,
        "excellent": 172,
        "intermediate": 160,
        "advanced": 185,
        "elite": 210
      },
      "F": {
        "pass": 60,
        "novice": 70,
        "good": 85,
        "excellent": 115,
        "intermediate": 105,
        "advanced": 125,
        "elite": 140
      }
    },
    "bench_1rm": {
      "M": {
        "pass": 55,
        "novice": 65,
        "good": 80,
        "excellent": 102,
        "intermediate": 95,
        "advanced": 110,
        "elite": 125
      },
      "F": {
        "pass": 30,
        "novice": 40,
        "good": 50,
        "excellent": 62,
        "intermediate": 60,
        "advanced": 65,
        "elite": 75
      }
    },
    "strict_press_1rm": {
      "M": {
        "pass": 35,
        "novice": 45,
        "good": 50,
        "excellent": 66,
        "intermediate": 60,
        "advanced": 70,
        "elite": 80
      },
      "F": {
        "pass": 20,
        "novice": 25,
        "good": 30,
        "excellent": 43,
        "intermediate": 40,
        "advanced": 45,
        "elite": 52
      }
    },
    "power_clean_1rm": {
      "M": {
        "pass": 45,
        "novice": 55,
        "good": 65,
        "excellent": 86,
        "intermediate": 80,
        "advanced": 90,
        "elite": 105
      },
      "F": {
        "pass": 30,
        "novice": 40,
        "good": 45,
        "excellent": 59,
        "intermediate": 55,
        "advanced": 65,
        "elite": 72
      }
    }
  },
  "triathlete": {
    "back_squat_1rm": {
      "M": {
        "pass": 65,
        "novice": 75,
        "good": 90,
        "excellent": 118,
        "intermediate": 110,
        "advanced": 125,
        "elite": 145
      },
      "F": {
        "pass": 45,
        "novice": 55,
        "good": 70,
        "excellent": 91,
        "intermediate": 85,
        "advanced": 95,
        "elite": 110
      }
    },
    "front_squat_1rm": {
      "M": {
        "pass": 50,
        "novice": 60,
        "good": 75,
        "excellent": 97,
        "intermediate": 90,
        "advanced": 105,
        "elite": 119
      },
      "F": {
        "pass": 40,
        "novice": 50,
        "good": 55,
        "excellent": 74,
        "intermediate": 70,
        "advanced": 80,
        "elite": 90
      }
    },
    "deadlift_1rm": {
      "M": {
        "pass": 75,
        "novice": 95,
        "good": 110,
        "excellent": 146,
        "intermediate": 135,
        "advanced": 155,
        "elite": 180
      },
      "F": {
        "pass": 60,
        "novice": 70,
        "good": 85,
        "excellent": 111,
        "intermediate": 100,
        "advanced": 120,
        "elite": 135
      }
    },
    "bench_1rm": {
      "M": {
        "pass": 45,
        "novice": 55,
        "good": 65,
        "excellent": 85,
        "intermediate": 80,
        "advanced": 90,
        "elite": 105
      },
      "F": {
        "pass": 25,
        "novice": 40,
        "good": 45,
        "excellent": 57,
        "intermediate": 55,
        "advanced": 60,
        "elite": 70
      }
    },
    "strict_press_1rm": {
      "M": {
        "pass": 30,
        "novice": 40,
        "good": 45,
        "excellent": 57,
        "intermediate": 55,
        "advanced": 60,
        "elite": 70
      },
      "F": {
        "pass": 20,
        "novice": 25,
        "good": 30,
        "excellent": 39,
        "intermediate": 35,
        "advanced": 40,
        "elite": 48
      }
    },
    "power_clean_1rm": {
      "M": {
        "pass": 40,
        "novice": 50,
        "good": 55,
        "excellent": 73,
        "intermediate": 65,
        "advanced": 80,
        "elite": 90
      },
      "F": {
        "pass": 25,
        "novice": 35,
        "good": 40,
        "excellent": 55,
        "intermediate": 50,
        "advanced": 60,
        "elite": 66
      }
    },
    "row_2k": {
      "M": {
        "pass": 545,
        "novice": 495,
        "good": 450,
        "excellent": 400,
        "intermediate": 415,
        "advanced": 395,
        "elite": 380
      },
      "F": {
        "pass": 620,
        "novice": 565,
        "good": 515,
        "excellent": 455,
        "intermediate": 475,
        "advanced": 445,
        "elite": 425
      }
    },
    "run_1mi": {
      "M": {
        "pass": 515,
        "novice": 460,
        "good": 405,
        "excellent": 330,
        "intermediate": 355,
        "advanced": 315,
        "elite": 280
      },
      "F": {
        "pass": 600,
        "novice": 535,
        "good": 470,
        "excellent": 385,
        "intermediate": 415,
        "advanced": 365,
        "elite": 330
      }
    },
    "run_5k": {
      "M": {
        "pass": 1735,
        "novice": 1520,
        "good": 1325,
        "excellent": 1100,
        "intermediate": 1175,
        "advanced": 1060,
        "elite": 980
      },
      "F": {
        "pass": 2010,
        "novice": 1770,
        "good": 1545,
        "excellent": 1290,
        "intermediate": 1375,
        "advanced": 1245,
        "elite": 1160
      }
    }
  },
  "powerlifter": {
    "back_squat_1rm": {
      "M": {
        "pass": 105,
        "novice": 140,
        "good": 180,
        "excellent": 200,
        "intermediate": 225,
        "advanced": 280,
        "elite": 340
      },
      "F": {
        "pass": 70,
        "novice": 90,
        "good": 115,
        "excellent": 130,
        "intermediate": 145,
        "advanced": 175,
        "elite": 210
      }
    },
    "front_squat_1rm": {
      "M": {
        "pass": 85,
        "novice": 110,
        "good": 140,
        "excellent": 160,
        "intermediate": 175,
        "advanced": 220,
        "elite": 280
      },
      "F": {
        "pass": 60,
        "novice": 75,
        "good": 90,
        "excellent": 100,
        "intermediate": 115,
        "advanced": 140,
        "elite": 172
      }
    },
    "deadlift_1rm": {
      "M": {
        "pass": 125,
        "novice": 155,
        "good": 195,
        "excellent": 220,
        "intermediate": 240,
        "advanced": 300,
        "elite": 380
      },
      "F": {
        "pass": 80,
        "novice": 100,
        "good": 125,
        "excellent": 140,
        "intermediate": 155,
        "advanced": 195,
        "elite": 250
      }
    },
    "bench_1rm": {
      "M": {
        "pass": 85,
        "novice": 105,
        "good": 130,
        "excellent": 145,
        "intermediate": 160,
        "advanced": 195,
        "elite": 240
      },
      "F": {
        "pass": 50,
        "novice": 60,
        "good": 75,
        "excellent": 80,
        "intermediate": 90,
        "advanced": 110,
        "elite": 135
      }
    },
    "strict_press_1rm": {
      "M": {
        "pass": 55,
        "novice": 65,
        "good": 80,
        "excellent": 90,
        "intermediate": 95,
        "advanced": 110,
        "elite": 135
      },
      "F": {
        "pass": 35,
        "novice": 40,
        "good": 45,
        "excellent": 50,
        "intermediate": 55,
        "advanced": 65,
        "elite": 75
      }
    }
  },
  "bodybuilder": {
    "back_squat_1rm": {
      "M": {
        "pass": 80,
        "novice": 100,
        "good": 135,
        "excellent": 172,
        "intermediate": 160,
        "advanced": 185,
        "elite": 210
      },
      "F": {
        "pass": 50,
        "novice": 60,
        "good": 85,
        "excellent": 107,
        "intermediate": 100,
        "advanced": 115,
        "elite": 130
      }
    },
    "front_squat_1rm": {
      "M": {
        "pass": 70,
        "novice": 85,
        "good": 110,
        "excellent": 141,
        "intermediate": 130,
        "advanced": 150,
        "elite": 172
      },
      "F": {
        "pass": 40,
        "novice": 50,
        "good": 65,
        "excellent": 88,
        "intermediate": 80,
        "advanced": 95,
        "elite": 107
      }
    },
    "deadlift_1rm": {
      "M": {
        "pass": 95,
        "novice": 115,
        "good": 140,
        "excellent": 190,
        "intermediate": 175,
        "advanced": 205,
        "elite": 230
      },
      "F": {
        "pass": 65,
        "novice": 75,
        "good": 95,
        "excellent": 123,
        "intermediate": 115,
        "advanced": 130,
        "elite": 150
      }
    },
    "bench_1rm": {
      "M": {
        "pass": 70,
        "novice": 85,
        "good": 100,
        "excellent": 132,
        "intermediate": 120,
        "advanced": 140,
        "elite": 160
      },
      "F": {
        "pass": 40,
        "novice": 50,
        "good": 55,
        "excellent": 69,
        "intermediate": 65,
        "advanced": 75,
        "elite": 85
      }
    },
    "strict_press_1rm": {
      "M": {
        "pass": 40,
        "novice": 50,
        "good": 65,
        "excellent": 83,
        "intermediate": 75,
        "advanced": 90,
        "elite": 100
      },
      "F": {
        "pass": 20,
        "novice": 30,
        "good": 40,
        "excellent": 50,
        "intermediate": 45,
        "advanced": 55,
        "elite": 62
      }
    }
  }
};

/** Pathway component weights. TODO (null) until populated; must each sum to 100. */
export const PATHWAY_WEIGHTS: Partial<Record<PathwayId, Partial<Record<ComponentId, number | null>>>> = {
  "gym_goer": {
    "running": 10,
    "erg_engine": 10,
    "lower_strength": 20,
    "upper_strength": 20,
    "olympic": 5,
    "power": 10,
    "gymnastics": 15,
    "core_endurance": 10
  },
  "hybrid_athlete": {
    "running": 20,
    "erg_engine": 15,
    "lower_strength": 15,
    "upper_strength": 15,
    "olympic": 5,
    "power": 10,
    "gymnastics": 10,
    "core_endurance": 10
  },
  "crossfit_generalist": {
    "running": 12,
    "erg_engine": 12,
    "lower_strength": 14,
    "upper_strength": 12,
    "olympic": 16,
    "power": 12,
    "gymnastics": 16,
    "core_endurance": 6
  },
  "hyrox": {
    "running": 33,
    "erg_engine": 13,
    "lower_strength": 16,
    "upper_strength": 8,
    "olympic": 2,
    "power": 7,
    "gymnastics": 6,
    "core_endurance": 15
  },
  "powerlifter": {
    "running": 0,
    "erg_engine": 0,
    "lower_strength": 45,
    "upper_strength": 35,
    "olympic": 0,
    "power": 10,
    "gymnastics": 0,
    "core_endurance": 10
  },
  "bodybuilder": {
    "running": 0,
    "erg_engine": 0,
    "lower_strength": 35,
    "upper_strength": 35,
    "olympic": 0,
    "power": 10,
    "gymnastics": 10,
    "core_endurance": 10
  },
  "triathlete": {
    "running": 40,
    "erg_engine": 25,
    "lower_strength": 12,
    "upper_strength": 5,
    "olympic": 0,
    "power": 5,
    "gymnastics": 3,
    "core_endurance": 10
  }
};

/** Benchmark-WOD tiers by sex. TODO (null) until populated. */
export const WOD_STANDARDS: Record<WodId, WodStandard> = {
  "fran": {
    "unit": "mm:ss",
    "lowerIsBetter": true,
    "thresholds": {
      "M": {
        "pass": 360,
        "novice": null,
        "good": 240,
        "excellent": 210,
        "intermediate": null,
        "advanced": null,
        "elite": 165
      },
      "F": {
        "pass": 420,
        "novice": null,
        "good": 300,
        "excellent": 270,
        "intermediate": null,
        "advanced": null,
        "elite": 210
      }
    },
    "load": {
      "movement": "Thruster",
      "M": 43,
      "F": 30
    }
  },
  "grace": {
    "unit": "mm:ss",
    "lowerIsBetter": true,
    "thresholds": {
      "M": {
        "pass": 300,
        "novice": null,
        "good": 225,
        "excellent": 165,
        "intermediate": null,
        "advanced": null,
        "elite": 135
      },
      "F": {
        "pass": 360,
        "novice": null,
        "good": 240,
        "excellent": 165,
        "intermediate": null,
        "advanced": null,
        "elite": 145
      }
    },
    "load": {
      "movement": "Clean & jerk",
      "M": 61,
      "F": 43
    }
  },
  "helen": {
    "unit": "mm:ss",
    "lowerIsBetter": true,
    "thresholds": {
      "M": {
        "pass": 840,
        "novice": null,
        "good": 660,
        "excellent": 540,
        "intermediate": null,
        "advanced": null,
        "elite": 450
      },
      "F": {
        "pass": 960,
        "novice": null,
        "good": 780,
        "excellent": 630,
        "intermediate": null,
        "advanced": null,
        "elite": 510
      }
    },
    "load": {
      "movement": "Kettlebell swing",
      "M": 24,
      "F": 16
    }
  },
  "diane": {
    "unit": "mm:ss",
    "lowerIsBetter": true,
    "thresholds": {
      "M": {
        "pass": 600,
        "novice": null,
        "good": 390,
        "excellent": 285,
        "intermediate": null,
        "advanced": null,
        "elite": 210
      },
      "F": {
        "pass": 720,
        "novice": null,
        "good": 480,
        "excellent": 360,
        "intermediate": null,
        "advanced": null,
        "elite": 255
      }
    },
    "load": {
      "movement": "Deadlift",
      "M": 102,
      "F": 70
    }
  },
  "cindy": {
    "unit": "rounds",
    "lowerIsBetter": false,
    "thresholds": {
      "M": {
        "pass": 12,
        "novice": null,
        "good": 18,
        "excellent": 22,
        "intermediate": null,
        "advanced": null,
        "elite": 25
      },
      "F": {
        "pass": 10,
        "novice": null,
        "good": 16,
        "excellent": 20,
        "intermediate": null,
        "advanced": null,
        "elite": 22
      }
    },
    "load": {
      "movement": "Bodyweight",
      "M": null,
      "F": null
    }
  },
  "fight_gone_bad": {
    "unit": "reps",
    "lowerIsBetter": false,
    "thresholds": {
      "M": {
        "pass": 250,
        "novice": null,
        "good": 320,
        "excellent": 360,
        "intermediate": null,
        "advanced": null,
        "elite": 420
      },
      "F": {
        "pass": 200,
        "novice": null,
        "good": 270,
        "excellent": 310,
        "intermediate": null,
        "advanced": null,
        "elite": 370
      }
    },
    "load": {
      "movement": "Push press / SDHP / wall-ball",
      "M": 34,
      "F": 25
    }
  },
  "hyrox_race": {
    "unit": "h:mm:ss",
    "lowerIsBetter": true,
    "thresholds": {
      "M": {
        "pass": 5700,
        "novice": null,
        "good": 5160,
        "excellent": 4620,
        "intermediate": null,
        "advanced": null,
        "elite": 4080
      },
      "F": {
        "pass": 6600,
        "novice": null,
        "good": 6000,
        "excellent": 5340,
        "intermediate": null,
        "advanced": null,
        "elite": 4740
      }
    },
    "load": {
      "movement": "Full race (open, singles)",
      "M": null,
      "F": null
    }
  }
};

/** Capacity-Index quality-mix vectors. TODO (null) until populated; rows sum 1. */
export const QUALITY_MIX: Record<WodId, Partial<Record<ComponentId, number | null>>> = {
  "fran": {
    "running": 0,
    "erg_engine": 0,
    "lower_strength": 0.1,
    "upper_strength": 0.2,
    "olympic": 0,
    "power": 0.2,
    "gymnastics": 0.35,
    "core_endurance": 0.15
  },
  "grace": {
    "running": 0,
    "erg_engine": 0,
    "lower_strength": 0,
    "upper_strength": 0.15,
    "olympic": 0.5,
    "power": 0.25,
    "gymnastics": 0,
    "core_endurance": 0.1
  },
  "helen": {
    "running": 0.35,
    "erg_engine": 0,
    "lower_strength": 0,
    "upper_strength": 0,
    "olympic": 0,
    "power": 0.2,
    "gymnastics": 0.25,
    "core_endurance": 0.2
  },
  "diane": {
    "running": 0,
    "erg_engine": 0,
    "lower_strength": 0.35,
    "upper_strength": 0.35,
    "olympic": 0,
    "power": 0,
    "gymnastics": 0.2,
    "core_endurance": 0.1
  },
  "cindy": {
    "running": 0,
    "erg_engine": 0,
    "lower_strength": 0.2,
    "upper_strength": 0.25,
    "olympic": 0,
    "power": 0,
    "gymnastics": 0.4,
    "core_endurance": 0.15
  },
  "fight_gone_bad": {
    "running": 0,
    "erg_engine": 0.2,
    "lower_strength": 0.15,
    "upper_strength": 0.15,
    "olympic": 0,
    "power": 0.25,
    "gymnastics": 0.15,
    "core_endurance": 0.1
  },
  "hyrox_race": {
    "running": 0.5,
    "erg_engine": 0.15,
    "lower_strength": 0.1,
    "upper_strength": 0,
    "olympic": 0,
    "power": 0.1,
    "gymnastics": 0,
    "core_endurance": 0.15
  }
};
