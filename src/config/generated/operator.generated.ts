// AUTO-GENERATED from config/standards/TPF_Operator_Standards.xlsx — do not edit.
// Regenerate with `npm run codegen`. Operator model: per-unit benchmarks,
// unisex (one threshold regardless of sex), absolute units.

import type { ComponentId, ThresholdSet } from '../../engine/types';

export interface OperatorBenchmark {
  id: string;
  name: string;
  component: ComponentId;
  source: 'orm' | 'race_times' | 'manual';
  unit: string;
  lowerIsBetter: boolean;
  /** Unisex thresholds (same standard for M/F). */
  thresholds: ThresholdSet;
}

export interface OperatorPathway {
  id: string;
  label: string;
  region: 'US' | 'UK';
  /** component → weight %; weightsInferred=true means an even split (no source row). */
  weights: Partial<Record<ComponentId, number>>;
  weightsInferred: boolean;
  benchmarks: OperatorBenchmark[];
}

export const OPERATOR_PATHWAYS: OperatorPathway[] = [
  {
    "id": "us_marine_corps_pft_cft",
    "label": "US Marine Corps (PFT/CFT)",
    "region": "US",
    "weights": {
      "running": 31,
      "lower_strength": 13,
      "upper_strength": 6,
      "upper_endurance": 31,
      "stability": 19
    },
    "weightsInferred": false,
    "benchmarks": [
      {
        "id": "3_mile_run",
        "name": "3-mile run",
        "component": "running",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 1660,
          "good": 1260,
          "excellent": 1170,
          "elite": 1080
        }
      },
      {
        "id": "back_squat",
        "name": "Back Squat",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 95,
          "good": 125,
          "excellent": 145,
          "elite": 170
        }
      },
      {
        "id": "hex_bar_dl",
        "name": "Hex-bar DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 120,
          "good": 150,
          "excellent": 175,
          "elite": 195
        }
      },
      {
        "id": "conventional_dl",
        "name": "Conventional DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 105,
          "good": 135,
          "excellent": 160,
          "elite": 180
        }
      },
      {
        "id": "bench_press",
        "name": "Bench Press",
        "component": "upper_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 75,
          "good": 95,
          "excellent": 115,
          "elite": 130
        }
      },
      {
        "id": "pull_ups_no_time",
        "name": "Pull-ups (no time)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 3,
          "good": 12,
          "excellent": 18,
          "elite": 23
        }
      },
      {
        "id": "push_ups_2_min",
        "name": "Push-ups (2 min)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 42,
          "good": 60,
          "excellent": 75,
          "elite": 87
        }
      },
      {
        "id": "plank_front",
        "name": "Plank (front)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 63,
          "good": 180,
          "excellent": 210,
          "elite": 225
        }
      },
      {
        "id": "side_plank_per_side",
        "name": "Side plank (per side)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 60,
          "good": 90,
          "excellent": 120,
          "elite": 180
        }
      },
      {
        "id": "dead_hang_grip",
        "name": "Dead hang (grip)",
        "component": "grip",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 30,
          "good": 60,
          "excellent": 90,
          "elite": 120
        }
      },
      {
        "id": "power_clean",
        "name": "Power Clean",
        "component": "power",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 60,
          "good": 80,
          "excellent": 95,
          "elite": 115
        }
      },
      {
        "id": "broad_jump",
        "name": "Broad Jump",
        "component": "power",
        "source": "manual",
        "unit": "m",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 1.8,
          "good": 2,
          "excellent": 2.2,
          "elite": 2.4
        }
      }
    ]
  },
  {
    "id": "us_army_airborne",
    "label": "US Army Airborne",
    "region": "US",
    "weights": {
      "running": 25,
      "rucking": 25,
      "lower_strength": 10,
      "upper_strength": 5,
      "upper_endurance": 15,
      "core_endurance": 10,
      "stability": 10
    },
    "weightsInferred": false,
    "benchmarks": [
      {
        "id": "2_mile_run",
        "name": "2-mile run",
        "component": "running",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 954,
          "good": 870,
          "excellent": 810,
          "elite": 750
        }
      },
      {
        "id": "8_km_ruck",
        "name": "8 km ruck",
        "component": "rucking",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 5400,
          "good": 4900,
          "excellent": 4500,
          "elite": 4100
        }
      },
      {
        "id": "back_squat",
        "name": "Back Squat",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 105,
          "good": 125,
          "excellent": 145,
          "elite": 165
        }
      },
      {
        "id": "hex_bar_dl",
        "name": "Hex-bar DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 115,
          "good": 145,
          "excellent": 185,
          "elite": 205
        }
      },
      {
        "id": "conventional_dl",
        "name": "Conventional DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 110,
          "good": 140,
          "excellent": 165,
          "elite": 185
        }
      },
      {
        "id": "bench_press",
        "name": "Bench Press",
        "component": "upper_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 80,
          "good": 95,
          "excellent": 115,
          "elite": 135
        }
      },
      {
        "id": "pull_ups_no_time",
        "name": "Pull-ups (no time)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 5,
          "good": 10,
          "excellent": 14,
          "elite": 18
        }
      },
      {
        "id": "push_ups_2_min",
        "name": "Push-ups (2 min)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 42,
          "good": 60,
          "excellent": 75,
          "elite": 95
        }
      },
      {
        "id": "sit_ups_2_min",
        "name": "Sit-ups (2 min)",
        "component": "core_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 53,
          "good": 70,
          "excellent": 85,
          "elite": 100
        }
      },
      {
        "id": "plank_front",
        "name": "Plank (front)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 90,
          "good": 150,
          "excellent": 210,
          "elite": 270
        }
      },
      {
        "id": "side_plank_per_side",
        "name": "Side plank (per side)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 60,
          "good": 90,
          "excellent": 120,
          "elite": 180
        }
      },
      {
        "id": "dead_hang_grip",
        "name": "Dead hang (grip)",
        "component": "grip",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 30,
          "good": 60,
          "excellent": 90,
          "elite": 120
        }
      },
      {
        "id": "power_clean",
        "name": "Power Clean",
        "component": "power",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 60,
          "good": 80,
          "excellent": 95,
          "elite": 115
        }
      },
      {
        "id": "broad_jump",
        "name": "Broad Jump",
        "component": "power",
        "source": "manual",
        "unit": "m",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 1.8,
          "good": 2,
          "excellent": 2.2,
          "elite": 2.4
        }
      }
    ]
  },
  {
    "id": "us_army_ranger_rasp_entry",
    "label": "US Army Ranger RASP (Entry)",
    "region": "US",
    "weights": {
      "running": 20,
      "rucking": 25,
      "swimming": 15,
      "upper_endurance": 25,
      "core_endurance": 15
    },
    "weightsInferred": false,
    "benchmarks": [
      {
        "id": "5_mile_run",
        "name": "5-mile run",
        "component": "running",
        "source": "race_times",
        "unit": "min:sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 2400,
          "good": 2240,
          "excellent": 2100,
          "elite": 1920
        }
      },
      {
        "id": "12_mile_ruck_35_lb",
        "name": "12-mile ruck (35 lb)",
        "component": "rucking",
        "source": "race_times",
        "unit": "h:mm:ss",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 10800,
          "good": 10200,
          "excellent": 9900,
          "elite": 9000
        }
      },
      {
        "id": "cwst_pass_fail",
        "name": "CWST (pass/fail)",
        "component": "swimming",
        "source": "manual",
        "unit": "pass=1",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 1,
          "good": null,
          "excellent": null,
          "elite": null
        }
      },
      {
        "id": "pull_ups_no_time",
        "name": "Pull-ups (no time)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 6,
          "good": 11,
          "excellent": 12,
          "elite": 20
        }
      },
      {
        "id": "push_ups_2_min",
        "name": "Push-ups (2 min)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 49,
          "good": 63,
          "excellent": 70,
          "elite": 90
        }
      },
      {
        "id": "sit_ups_2_min",
        "name": "Sit-ups (2 min)",
        "component": "core_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 59,
          "good": 73,
          "excellent": 80,
          "elite": 100
        }
      }
    ]
  },
  {
    "id": "us_army_special_forces_sfas",
    "label": "US Army Special Forces (SFAS)",
    "region": "US",
    "weights": {
      "running": 10,
      "rucking": 25,
      "lower_strength": 15,
      "upper_strength": 10,
      "upper_endurance": 15,
      "core_endurance": 5,
      "stability": 10,
      "grip": 5,
      "power": 5
    },
    "weightsInferred": false,
    "benchmarks": [
      {
        "id": "2_mile_run",
        "name": "2-mile run",
        "component": "running",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 912,
          "good": 840,
          "excellent": 780,
          "elite": 720
        }
      },
      {
        "id": "5_mile_run",
        "name": "5-mile run",
        "component": "running",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 2400,
          "good": 2160,
          "excellent": 1980,
          "elite": 1800
        }
      },
      {
        "id": "12_mile_ruck",
        "name": "12-mile ruck",
        "component": "rucking",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 10800,
          "good": 9900,
          "excellent": 9000,
          "elite": 8100
        }
      },
      {
        "id": "back_squat",
        "name": "Back Squat",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 120,
          "good": 150,
          "excellent": 180,
          "elite": 210
        }
      },
      {
        "id": "hex_bar_dl",
        "name": "Hex-bar DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 145,
          "good": 180,
          "excellent": 210,
          "elite": 235
        }
      },
      {
        "id": "conventional_dl",
        "name": "Conventional DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 130,
          "good": 165,
          "excellent": 195,
          "elite": 215
        }
      },
      {
        "id": "bench_press",
        "name": "Bench Press",
        "component": "upper_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 90,
          "good": 110,
          "excellent": 130,
          "elite": 155
        }
      },
      {
        "id": "overhead_press",
        "name": "Overhead Press",
        "component": "upper_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 50,
          "good": 70,
          "excellent": 90,
          "elite": 105
        }
      },
      {
        "id": "pull_ups_no_time",
        "name": "Pull-ups (no time)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 6,
          "good": 12,
          "excellent": 18,
          "elite": 25
        }
      },
      {
        "id": "push_ups_2_min",
        "name": "Push-ups (2 min)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 49,
          "good": 65,
          "excellent": 80,
          "elite": 100
        }
      },
      {
        "id": "sit_ups_2_min",
        "name": "Sit-ups (2 min)",
        "component": "core_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 59,
          "good": 75,
          "excellent": 90,
          "elite": 100
        }
      },
      {
        "id": "plank_front",
        "name": "Plank (front)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 90,
          "good": 150,
          "excellent": 210,
          "elite": 270
        }
      },
      {
        "id": "side_plank_per_side",
        "name": "Side plank (per side)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 60,
          "good": 90,
          "excellent": 120,
          "elite": 180
        }
      },
      {
        "id": "dead_hang_grip",
        "name": "Dead hang (grip)",
        "component": "grip",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 45,
          "good": 75,
          "excellent": 110,
          "elite": 150
        }
      },
      {
        "id": "power_clean",
        "name": "Power Clean",
        "component": "power",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 80,
          "good": 100,
          "excellent": 120,
          "elite": 140
        }
      },
      {
        "id": "broad_jump",
        "name": "Broad Jump",
        "component": "power",
        "source": "manual",
        "unit": "m",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 1.8,
          "good": 2,
          "excellent": 2.2,
          "elite": 2.4
        }
      }
    ]
  },
  {
    "id": "navy_seal_bud_s",
    "label": "Navy SEAL (BUD/S)",
    "region": "US",
    "weights": {
      "running": 20,
      "swimming": 25,
      "lower_strength": 5,
      "upper_strength": 5,
      "upper_endurance": 20,
      "core_endurance": 15,
      "stability": 10
    },
    "weightsInferred": false,
    "benchmarks": [
      {
        "id": "1_5_mile_run",
        "name": "1.5-mile run",
        "component": "running",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 630,
          "good": 570,
          "excellent": 540,
          "elite": 510
        }
      },
      {
        "id": "500_m_swim",
        "name": "500 m swim",
        "component": "swimming",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 750,
          "good": 600,
          "excellent": 540,
          "elite": 480
        }
      },
      {
        "id": "back_squat",
        "name": "Back Squat",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 100,
          "good": 135,
          "excellent": 150,
          "elite": 180
        }
      },
      {
        "id": "hex_bar_dl",
        "name": "Hex-bar DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 130,
          "good": 160,
          "excellent": 190,
          "elite": 215
        }
      },
      {
        "id": "conventional_dl",
        "name": "Conventional DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 115,
          "good": 145,
          "excellent": 175,
          "elite": 195
        }
      },
      {
        "id": "bench_press",
        "name": "Bench Press",
        "component": "upper_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 80,
          "good": 100,
          "excellent": 120,
          "elite": 140
        }
      },
      {
        "id": "pull_ups_no_time",
        "name": "Pull-ups (no time)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 8,
          "good": 13,
          "excellent": 18,
          "elite": 22
        }
      },
      {
        "id": "push_ups_2_min",
        "name": "Push-ups (2 min)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 50,
          "good": 65,
          "excellent": 80,
          "elite": 100
        }
      },
      {
        "id": "sit_ups_2_min",
        "name": "Sit-ups (2 min)",
        "component": "core_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 50,
          "good": 75,
          "excellent": 90,
          "elite": 110
        }
      },
      {
        "id": "plank_front",
        "name": "Plank (front)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 90,
          "good": 150,
          "excellent": 210,
          "elite": 270
        }
      },
      {
        "id": "side_plank_per_side",
        "name": "Side plank (per side)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 60,
          "good": 90,
          "excellent": 120,
          "elite": 180
        }
      },
      {
        "id": "dead_hang_grip",
        "name": "Dead hang (grip)",
        "component": "grip",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 45,
          "good": 75,
          "excellent": 110,
          "elite": 150
        }
      },
      {
        "id": "power_clean",
        "name": "Power Clean",
        "component": "power",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 65,
          "good": 85,
          "excellent": 100,
          "elite": 120
        }
      },
      {
        "id": "broad_jump",
        "name": "Broad Jump",
        "component": "power",
        "source": "manual",
        "unit": "m",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 1.8,
          "good": 2,
          "excellent": 2.2,
          "elite": 2.4
        }
      }
    ]
  },
  {
    "id": "usaf_pararescue_pj",
    "label": "USAF Pararescue (PJ)",
    "region": "US",
    "weights": {
      "running": 20,
      "rucking": 10,
      "swimming": 30,
      "lower_strength": 10,
      "upper_endurance": 15,
      "core_endurance": 5,
      "stability": 10
    },
    "weightsInferred": false,
    "benchmarks": [
      {
        "id": "1_5_mile_run",
        "name": "1.5-mile run",
        "component": "running",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 610,
          "good": 570,
          "excellent": 540,
          "elite": 510
        }
      },
      {
        "id": "8_km_ruck",
        "name": "8 km ruck",
        "component": "rucking",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 5400,
          "good": 4500,
          "excellent": 3600,
          "elite": 3000
        }
      },
      {
        "id": "500_m_swim",
        "name": "500 m swim",
        "component": "swimming",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 720,
          "good": 660,
          "excellent": 600,
          "elite": 570
        }
      },
      {
        "id": "back_squat",
        "name": "Back Squat",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 95,
          "good": 120,
          "excellent": 145,
          "elite": 175
        }
      },
      {
        "id": "hex_bar_dl",
        "name": "Hex-bar DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 115,
          "good": 140,
          "excellent": 170,
          "elite": 195
        }
      },
      {
        "id": "bench_press",
        "name": "Bench Press",
        "component": "upper_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 75,
          "good": 95,
          "excellent": 115,
          "elite": 135
        }
      },
      {
        "id": "pull_ups_no_time",
        "name": "Pull-ups (no time)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 8,
          "good": 12,
          "excellent": 18,
          "elite": 22
        }
      },
      {
        "id": "push_ups_2_min",
        "name": "Push-ups (2 min)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 50,
          "good": 70,
          "excellent": 85,
          "elite": 100
        }
      },
      {
        "id": "sit_ups_2_min",
        "name": "Sit-ups (2 min)",
        "component": "core_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 54,
          "good": 70,
          "excellent": 90,
          "elite": 100
        }
      },
      {
        "id": "plank_front",
        "name": "Plank (front)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 90,
          "good": 150,
          "excellent": 210,
          "elite": 270
        }
      },
      {
        "id": "side_plank_per_side",
        "name": "Side plank (per side)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 60,
          "good": 90,
          "excellent": 120,
          "elite": 180
        }
      },
      {
        "id": "dead_hang_grip",
        "name": "Dead hang (grip)",
        "component": "grip",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 45,
          "good": 75,
          "excellent": 110,
          "elite": 150
        }
      },
      {
        "id": "power_clean",
        "name": "Power Clean",
        "component": "power",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 60,
          "good": 80,
          "excellent": 95,
          "elite": 110
        }
      },
      {
        "id": "broad_jump",
        "name": "Broad Jump",
        "component": "power",
        "source": "manual",
        "unit": "m",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 1.8,
          "good": 2,
          "excellent": 2.2,
          "elite": 2.4
        }
      }
    ]
  },
  {
    "id": "us_infantry",
    "label": "US Infantry",
    "region": "US",
    "weights": {
      "running": 15,
      "rucking": 25,
      "lower_strength": 15,
      "upper_strength": 5,
      "upper_endurance": 20,
      "core_endurance": 5,
      "stability": 10,
      "grip": 5
    },
    "weightsInferred": false,
    "benchmarks": [
      {
        "id": "2_mile_run",
        "name": "2-mile run",
        "component": "running",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 960,
          "good": 840,
          "excellent": 750,
          "elite": 690
        }
      },
      {
        "id": "12_mile_ruck_35_lb",
        "name": "12-mile ruck (35 lb)",
        "component": "rucking",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 12600,
          "good": 10800,
          "excellent": 9900,
          "elite": 9000
        }
      },
      {
        "id": "back_squat",
        "name": "Back Squat",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 100,
          "good": 130,
          "excellent": 155,
          "elite": 175
        }
      },
      {
        "id": "hex_bar_dl",
        "name": "Hex-bar DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 120,
          "good": 155,
          "excellent": 185,
          "elite": 210
        }
      },
      {
        "id": "conventional_dl",
        "name": "Conventional DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 110,
          "good": 140,
          "excellent": 170,
          "elite": 195
        }
      },
      {
        "id": "bench_press",
        "name": "Bench Press",
        "component": "upper_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 75,
          "good": 95,
          "excellent": 115,
          "elite": 135
        }
      },
      {
        "id": "pull_ups_no_time",
        "name": "Pull-ups (no time)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 6,
          "good": 12,
          "excellent": 18,
          "elite": 25
        }
      },
      {
        "id": "push_ups_2_min",
        "name": "Push-ups (2 min)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 45,
          "good": 65,
          "excellent": 80,
          "elite": 100
        }
      },
      {
        "id": "sit_ups_2_min",
        "name": "Sit-ups (2 min)",
        "component": "core_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 50,
          "good": 70,
          "excellent": 90,
          "elite": 110
        }
      },
      {
        "id": "plank_front",
        "name": "Plank (front)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 90,
          "good": 150,
          "excellent": 210,
          "elite": 270
        }
      },
      {
        "id": "side_plank_per_side",
        "name": "Side plank (per side)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 60,
          "good": 90,
          "excellent": 120,
          "elite": 180
        }
      },
      {
        "id": "dead_hang_grip",
        "name": "Dead hang (grip)",
        "component": "grip",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 35,
          "good": 60,
          "excellent": 90,
          "elite": 120
        }
      }
    ]
  },
  {
    "id": "us_police_pft",
    "label": "US Police PFT",
    "region": "US",
    "weights": {
      "running": 25,
      "lower_strength": 10,
      "upper_strength": 5,
      "upper_endurance": 25,
      "core_endurance": 10,
      "stability": 10,
      "grip": 10,
      "power": 5
    },
    "weightsInferred": false,
    "benchmarks": [
      {
        "id": "1_5_mile_run",
        "name": "1.5-mile run",
        "component": "running",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 750,
          "good": 690,
          "excellent": 630,
          "elite": 570
        }
      },
      {
        "id": "back_squat",
        "name": "Back Squat",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 80,
          "good": 100,
          "excellent": 120,
          "elite": 140
        }
      },
      {
        "id": "hex_bar_dl",
        "name": "Hex-bar DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 100,
          "good": 125,
          "excellent": 150,
          "elite": 170
        }
      },
      {
        "id": "conventional_dl",
        "name": "Conventional DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 90,
          "good": 115,
          "excellent": 140,
          "elite": 160
        }
      },
      {
        "id": "bench_press",
        "name": "Bench Press",
        "component": "upper_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 65,
          "good": 80,
          "excellent": 95,
          "elite": 110
        }
      },
      {
        "id": "pull_ups_no_time",
        "name": "Pull-ups (no time)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 4,
          "good": 8,
          "excellent": 12,
          "elite": 15
        }
      },
      {
        "id": "push_ups_1_min",
        "name": "Push-ups (1 min)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 30,
          "good": 45,
          "excellent": 60,
          "elite": 75
        }
      },
      {
        "id": "sit_ups_1_min",
        "name": "Sit-ups (1 min)",
        "component": "core_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 30,
          "good": 45,
          "excellent": 60,
          "elite": 75
        }
      },
      {
        "id": "plank_front",
        "name": "Plank (front)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 60,
          "good": 90,
          "excellent": 150,
          "elite": 210
        }
      },
      {
        "id": "side_plank_per_side",
        "name": "Side plank (per side)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 45,
          "good": 60,
          "excellent": 90,
          "elite": 120
        }
      },
      {
        "id": "dead_hang",
        "name": "Dead hang",
        "component": "grip",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 30,
          "good": 50,
          "excellent": 75,
          "elite": 100
        }
      },
      {
        "id": "power_clean",
        "name": "Power Clean",
        "component": "power",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 45,
          "good": 60,
          "excellent": 75,
          "elite": 90
        }
      },
      {
        "id": "broad_jump",
        "name": "Broad Jump",
        "component": "power",
        "source": "manual",
        "unit": "m",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 1.7,
          "good": 1.9,
          "excellent": 2.1,
          "elite": 2.3
        }
      }
    ]
  },
  {
    "id": "us_swat",
    "label": "US SWAT",
    "region": "US",
    "weights": {
      "running": 15,
      "lower_strength": 15,
      "upper_strength": 10,
      "upper_endurance": 20,
      "core_endurance": 5,
      "stability": 15,
      "grip": 10,
      "power": 10
    },
    "weightsInferred": false,
    "benchmarks": [
      {
        "id": "1_5_mile_run",
        "name": "1.5-mile run",
        "component": "running",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 660,
          "good": 600,
          "excellent": 540,
          "elite": 510
        }
      },
      {
        "id": "back_squat",
        "name": "Back Squat",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 100,
          "good": 125,
          "excellent": 150,
          "elite": 175
        }
      },
      {
        "id": "hex_bar_dl",
        "name": "Hex-bar DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 130,
          "good": 160,
          "excellent": 185,
          "elite": 210
        }
      },
      {
        "id": "conventional_dl",
        "name": "Conventional DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 115,
          "good": 145,
          "excellent": 170,
          "elite": 195
        }
      },
      {
        "id": "bench_press",
        "name": "Bench Press",
        "component": "upper_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 80,
          "good": 100,
          "excellent": 120,
          "elite": 140
        }
      },
      {
        "id": "overhead_press",
        "name": "Overhead Press",
        "component": "upper_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 50,
          "good": 65,
          "excellent": 80,
          "elite": 95
        }
      },
      {
        "id": "pull_ups_no_time",
        "name": "Pull-ups (no time)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 8,
          "good": 12,
          "excellent": 16,
          "elite": 22
        }
      },
      {
        "id": "push_ups_1_min",
        "name": "Push-ups (1 min)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 40,
          "good": 55,
          "excellent": 70,
          "elite": 90
        }
      },
      {
        "id": "sit_ups_2_min",
        "name": "Sit-ups (2 min)",
        "component": "core_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 40,
          "good": 55,
          "excellent": 70,
          "elite": 90
        }
      },
      {
        "id": "plank_front",
        "name": "Plank (front)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 90,
          "good": 150,
          "excellent": 210,
          "elite": 270
        }
      },
      {
        "id": "side_plank_per_side",
        "name": "Side plank (per side)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 60,
          "good": 90,
          "excellent": 120,
          "elite": 180
        }
      },
      {
        "id": "dead_hang",
        "name": "Dead hang",
        "component": "grip",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 45,
          "good": 75,
          "excellent": 100,
          "elite": 130
        }
      },
      {
        "id": "power_clean",
        "name": "Power Clean",
        "component": "power",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 65,
          "good": 85,
          "excellent": 100,
          "elite": 120
        }
      },
      {
        "id": "broad_jump",
        "name": "Broad Jump",
        "component": "power",
        "source": "manual",
        "unit": "m",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 1.9,
          "good": 2.1,
          "excellent": 2.3,
          "elite": 2.5
        }
      }
    ]
  },
  {
    "id": "uk_parachute_regiment_p_coy",
    "label": "UK Parachute Regiment (P Coy)",
    "region": "UK",
    "weights": {
      "running": 30,
      "rucking": 30,
      "lower_strength": 10,
      "upper_strength": 5,
      "upper_endurance": 10,
      "core_endurance": 5,
      "stability": 10
    },
    "weightsInferred": false,
    "benchmarks": [
      {
        "id": "2_km_run_best_effort",
        "name": "2 km run (best effort)",
        "component": "running",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 495,
          "good": 465,
          "excellent": 435,
          "elite": 405
        }
      },
      {
        "id": "10_mile_ruck",
        "name": "10-mile ruck",
        "component": "rucking",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 7200,
          "good": 6600,
          "excellent": 6120,
          "elite": 5700
        }
      },
      {
        "id": "back_squat",
        "name": "Back Squat",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 100,
          "good": 120,
          "excellent": 140,
          "elite": 160
        }
      },
      {
        "id": "hex_bar_dl",
        "name": "Hex-bar DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 110,
          "good": 140,
          "excellent": 180,
          "elite": 200
        }
      },
      {
        "id": "conventional_dl",
        "name": "Conventional DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 105,
          "good": 135,
          "excellent": 160,
          "elite": 180
        }
      },
      {
        "id": "bench_press",
        "name": "Bench Press",
        "component": "upper_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 75,
          "good": 90,
          "excellent": 110,
          "elite": 130
        }
      },
      {
        "id": "pull_ups_no_time",
        "name": "Pull-ups (no time)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 5,
          "good": 8,
          "excellent": 12,
          "elite": 20
        }
      },
      {
        "id": "push_ups_2_min",
        "name": "Push-ups (2 min)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 25,
          "good": 40,
          "excellent": 60,
          "elite": 80
        }
      },
      {
        "id": "sit_ups_2_min",
        "name": "Sit-ups (2 min)",
        "component": "core_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 30,
          "good": 50,
          "excellent": 65,
          "elite": 80
        }
      },
      {
        "id": "plank_front",
        "name": "Plank (front)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 90,
          "good": 150,
          "excellent": 210,
          "elite": 270
        }
      },
      {
        "id": "side_plank_per_side",
        "name": "Side plank (per side)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 60,
          "good": 90,
          "excellent": 120,
          "elite": 180
        }
      },
      {
        "id": "dead_hang_grip",
        "name": "Dead hang (grip)",
        "component": "grip",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 30,
          "good": 60,
          "excellent": 90,
          "elite": 120
        }
      },
      {
        "id": "power_clean",
        "name": "Power Clean",
        "component": "power",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 55,
          "good": 75,
          "excellent": 90,
          "elite": 110
        }
      },
      {
        "id": "broad_jump",
        "name": "Broad Jump",
        "component": "power",
        "source": "manual",
        "unit": "m",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 1.8,
          "good": 2,
          "excellent": 2.2,
          "elite": 2.4
        }
      }
    ]
  },
  {
    "id": "uk_royal_marines_cdo_course",
    "label": "UK Royal Marines (Cdo Course)",
    "region": "UK",
    "weights": {
      "running": 15,
      "rucking": 15,
      "swimming": 5,
      "lower_strength": 10,
      "upper_strength": 5,
      "upper_endurance": 15,
      "core_endurance": 10,
      "stability": 15,
      "grip": 5,
      "power": 5
    },
    "weightsInferred": false,
    "benchmarks": [
      {
        "id": "1_5_mile_run",
        "name": "1.5-mile run",
        "component": "running",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 630,
          "good": 570,
          "excellent": 540,
          "elite": 510
        }
      },
      {
        "id": "10_mile_ruck",
        "name": "10-mile ruck",
        "component": "rucking",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 7560,
          "good": 6930,
          "excellent": 6426,
          "elite": 5985
        }
      },
      {
        "id": "500_m_swim",
        "name": "500 m swim",
        "component": "swimming",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 863,
          "good": 690,
          "excellent": 621,
          "elite": 552
        }
      },
      {
        "id": "back_squat",
        "name": "Back Squat",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 100,
          "good": 135,
          "excellent": 150,
          "elite": 180
        }
      },
      {
        "id": "hex_bar_dl",
        "name": "Hex-bar DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 130,
          "good": 160,
          "excellent": 190,
          "elite": 215
        }
      },
      {
        "id": "conventional_dl",
        "name": "Conventional DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 115,
          "good": 145,
          "excellent": 175,
          "elite": 195
        }
      },
      {
        "id": "bench_press",
        "name": "Bench Press",
        "component": "upper_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 80,
          "good": 100,
          "excellent": 120,
          "elite": 140
        }
      },
      {
        "id": "pull_ups_no_time",
        "name": "Pull-ups (no time)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 8,
          "good": 13,
          "excellent": 18,
          "elite": 22
        }
      },
      {
        "id": "push_ups_2_min",
        "name": "Push-ups (2 min)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 50,
          "good": 65,
          "excellent": 80,
          "elite": 100
        }
      },
      {
        "id": "sit_ups_2_min",
        "name": "Sit-ups (2 min)",
        "component": "core_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 50,
          "good": 75,
          "excellent": 90,
          "elite": 110
        }
      },
      {
        "id": "plank_front",
        "name": "Plank (front)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 90,
          "good": 150,
          "excellent": 210,
          "elite": 270
        }
      },
      {
        "id": "side_plank_per_side",
        "name": "Side plank (per side)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 60,
          "good": 90,
          "excellent": 120,
          "elite": 180
        }
      },
      {
        "id": "dead_hang_grip",
        "name": "Dead hang (grip)",
        "component": "grip",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 45,
          "good": 75,
          "excellent": 110,
          "elite": 150
        }
      },
      {
        "id": "power_clean",
        "name": "Power Clean",
        "component": "power",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 65,
          "good": 85,
          "excellent": 100,
          "elite": 120
        }
      },
      {
        "id": "broad_jump",
        "name": "Broad Jump",
        "component": "power",
        "source": "manual",
        "unit": "m",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 1.8,
          "good": 2,
          "excellent": 2.2,
          "elite": 2.4
        }
      }
    ]
  },
  {
    "id": "uk_special_forces_sas_sbs",
    "label": "UK Special Forces (SAS/SBS)",
    "region": "UK",
    "weights": {
      "running": 10,
      "rucking": 30,
      "lower_strength": 10,
      "upper_strength": 5,
      "upper_endurance": 15,
      "core_endurance": 5,
      "stability": 20,
      "grip": 5
    },
    "weightsInferred": false,
    "benchmarks": [
      {
        "id": "2_km_run_best_effort",
        "name": "2 km run (best effort)",
        "component": "running",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 522,
          "good": 472,
          "excellent": 447,
          "elite": 399
        }
      },
      {
        "id": "5_mile_ruck_30_kg",
        "name": "5-mile ruck (30 kg)",
        "component": "rucking",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 4500,
          "good": 4200,
          "excellent": 3900,
          "elite": 3600
        }
      },
      {
        "id": "fan_dance_24_km_35_lb_rifle_optional",
        "name": "Fan Dance (24 km @ 35 lb + rifle) — optional",
        "component": "rucking",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 14400,
          "good": 12600,
          "excellent": 11700,
          "elite": 10800
        }
      },
      {
        "id": "back_squat",
        "name": "Back Squat",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 100,
          "good": 125,
          "excellent": 140,
          "elite": 165
        }
      },
      {
        "id": "hex_bar_dl",
        "name": "Hex-bar DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 130,
          "good": 160,
          "excellent": 175,
          "elite": 200
        }
      },
      {
        "id": "conventional_dl",
        "name": "Conventional DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 115,
          "good": 145,
          "excellent": 165,
          "elite": 185
        }
      },
      {
        "id": "bench_press",
        "name": "Bench Press",
        "component": "upper_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 80,
          "good": 95,
          "excellent": 110,
          "elite": 140
        }
      },
      {
        "id": "pull_ups_no_time",
        "name": "Pull-ups (no time)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 8,
          "good": 13,
          "excellent": 18,
          "elite": 22
        }
      },
      {
        "id": "push_ups_2_min",
        "name": "Push-ups (2 min)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 50,
          "good": 65,
          "excellent": 80,
          "elite": 100
        }
      },
      {
        "id": "sit_ups_2_min",
        "name": "Sit-ups (2 min)",
        "component": "core_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 50,
          "good": 75,
          "excellent": 90,
          "elite": 110
        }
      },
      {
        "id": "plank_front",
        "name": "Plank (front)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 90,
          "good": 150,
          "excellent": 210,
          "elite": 270
        }
      },
      {
        "id": "side_plank_per_side",
        "name": "Side plank (per side)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 60,
          "good": 90,
          "excellent": 120,
          "elite": 180
        }
      },
      {
        "id": "dead_hang_grip",
        "name": "Dead hang (grip)",
        "component": "grip",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 45,
          "good": 75,
          "excellent": 110,
          "elite": 150
        }
      }
    ]
  },
  {
    "id": "uk_infantry",
    "label": "UK Infantry",
    "region": "UK",
    "weights": {
      "running": 15,
      "rucking": 25,
      "lower_strength": 15,
      "upper_strength": 5,
      "upper_endurance": 20,
      "core_endurance": 5,
      "stability": 10,
      "grip": 5
    },
    "weightsInferred": false,
    "benchmarks": [
      {
        "id": "2_km_run_best_effort",
        "name": "2 km run (best effort)",
        "component": "running",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 615,
          "good": 525,
          "excellent": 465,
          "elite": 435
        }
      },
      {
        "id": "8_mile_loaded_march_25_kg",
        "name": "8-mile loaded march (25 kg)",
        "component": "rucking",
        "source": "race_times",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 7200,
          "good": 6900,
          "excellent": 6600,
          "elite": 6000
        }
      },
      {
        "id": "back_squat",
        "name": "Back Squat",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 100,
          "good": 130,
          "excellent": 155,
          "elite": 175
        }
      },
      {
        "id": "hex_bar_dl",
        "name": "Hex-bar DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 120,
          "good": 155,
          "excellent": 185,
          "elite": 210
        }
      },
      {
        "id": "conventional_dl",
        "name": "Conventional DL",
        "component": "lower_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 110,
          "good": 140,
          "excellent": 170,
          "elite": 195
        }
      },
      {
        "id": "bench_press",
        "name": "Bench Press",
        "component": "upper_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 75,
          "good": 95,
          "excellent": 115,
          "elite": 135
        }
      },
      {
        "id": "pull_ups_no_time",
        "name": "Pull-ups (no time)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 6,
          "good": 12,
          "excellent": 18,
          "elite": 25
        }
      },
      {
        "id": "push_ups_2_min",
        "name": "Push-ups (2 min)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 45,
          "good": 65,
          "excellent": 80,
          "elite": 100
        }
      },
      {
        "id": "sit_ups_2_min",
        "name": "Sit-ups (2 min)",
        "component": "core_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 50,
          "good": 70,
          "excellent": 90,
          "elite": 110
        }
      },
      {
        "id": "plank_front",
        "name": "Plank (front)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 90,
          "good": 150,
          "excellent": 210,
          "elite": 270
        }
      },
      {
        "id": "side_plank_per_side",
        "name": "Side plank (per side)",
        "component": "stability",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 60,
          "good": 90,
          "excellent": 120,
          "elite": 180
        }
      },
      {
        "id": "dead_hang_grip",
        "name": "Dead hang (grip)",
        "component": "grip",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 35,
          "good": 60,
          "excellent": 90,
          "elite": 120
        }
      }
    ]
  },
  {
    "id": "uk_police_jrft",
    "label": "UK Police JRFT",
    "region": "UK",
    "weights": {
      "running": 50,
      "upper_strength": 50
    },
    "weightsInferred": false,
    "benchmarks": [
      {
        "id": "multi_stage_bleep_test",
        "name": "Multi-stage bleep test",
        "component": "running",
        "source": "manual",
        "unit": "level",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 5.4,
          "good": 7.6,
          "excellent": 10,
          "elite": 12.3
        }
      },
      {
        "id": "pull_dynamometer",
        "name": "Pull (dynamometer)",
        "component": "upper_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 35,
          "good": 45,
          "excellent": 52.5,
          "elite": 62.5
        }
      },
      {
        "id": "push_dynamometer",
        "name": "Push (dynamometer)",
        "component": "upper_strength",
        "source": "orm",
        "unit": "kg",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 34,
          "good": 42.5,
          "excellent": 50,
          "elite": 60
        }
      }
    ]
  },
  {
    "id": "uk_aru_sco19",
    "label": "UK ARU / SCO19",
    "region": "UK",
    "weights": {
      "running": 40,
      "upper_endurance": 35,
      "power": 25
    },
    "weightsInferred": false,
    "benchmarks": [
      {
        "id": "bleep_test_with_armour_vest_7_kg",
        "name": "Bleep test (with armour vest ~7 kg)",
        "component": "running",
        "source": "manual",
        "unit": "level",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 7.6,
          "good": 9,
          "excellent": 10.5,
          "elite": 11.9
        }
      },
      {
        "id": "vested_1_mile_run_7_kg",
        "name": "Vested 1-mile run (~7 kg)",
        "component": "running",
        "source": "race_times",
        "unit": "min:sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 540,
          "good": 450,
          "excellent": 360,
          "elite": 270
        }
      },
      {
        "id": "casualty_drag_75_kg_dummy_15_m",
        "name": "Casualty drag (75 kg dummy, 15 m)",
        "component": "power",
        "source": "manual",
        "unit": "sec",
        "lowerIsBetter": true,
        "thresholds": {
          "pass": 30,
          "good": 20,
          "excellent": 12,
          "elite": 8
        }
      },
      {
        "id": "pull_ups",
        "name": "Pull-ups",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 6,
          "good": 10,
          "excellent": 14,
          "elite": 18
        }
      },
      {
        "id": "push_ups_1_min",
        "name": "Push-ups (1 min)",
        "component": "upper_endurance",
        "source": "manual",
        "unit": "reps",
        "lowerIsBetter": false,
        "thresholds": {
          "pass": 30,
          "good": 50,
          "excellent": 70,
          "elite": 90
        }
      }
    ]
  }
];
