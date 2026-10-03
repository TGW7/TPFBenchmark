/**
 * 2026-10-03 — where each HABS benchmark lives in the TPF app's inputs: the
 * 1RM lift name (`profiles.orm` key) or the race modality + event
 * (`profiles.race_times`), exactly the keys tpf-app's `computeHABS` reads
 * (src/lib/habs.ts COMPONENT_DEFS `ormKey` / `raceModality` + `raceEvent`).
 *
 * Used by scripts/check-habs-vs-app.mjs to hand the app the same athlete the
 * site scores, and pinned against the app sync's own maps
 * (src/data/appSync.ts ORM_TO_APP / RACE_TO_APP) by src/test/habs-app-map.test.ts,
 * so the check and the sync cannot drift apart.
 *
 * No imports, on purpose: the check script loads this file with Node's own
 * type-stripping, which cannot resolve extensionless imports.
 */

export type HabsAppKey = { orm: string } | { race: [modality: string, event: string] };

export const HABS_APP_KEYS: Record<string, HabsAppKey> = {
  back_squat_1rm: { orm: 'Back Squat' },
  deadlift_1rm: { orm: 'Deadlift' },
  power_clean_1rm: { orm: 'Power Clean' },
  bench_1rm: { orm: 'Bench Press' },
  strict_press_1rm: { orm: 'Overhead Press' },
  barbell_row_1rm: { orm: 'Barbell Row' },
  run_1mi: { race: ['run', 'mile'] },
  run_5k: { race: ['run', '5k'] },
  run_10k: { race: ['run', '10k'] },
  run_half: { race: ['run', 'half'] },
  swim_400m: { race: ['swim', '400m'] },
  swim_1500m: { race: ['swim', '1500m'] },
  bike_20k: { race: ['bike', '20k'] },
  bike_40k: { race: ['bike', '40k'] },
  row_2k: { race: ['row', '2k'] },
};

/** The app's StdKey for each (its standards tables are keyed by it). */
export const HABS_STD_KEYS: Record<string, string> = {
  back_squat_1rm: 'back_squat',
  deadlift_1rm: 'deadlift',
  power_clean_1rm: 'power_clean',
  bench_1rm: 'bench_press',
  strict_press_1rm: 'strict_press',
  barbell_row_1rm: 'barbell_row',
  run_1mi: 'run_1mi',
  run_5k: 'run_5k',
  run_10k: 'run_10k',
  run_half: 'run_half',
  swim_400m: 'swim_400m',
  swim_1500m: 'swim_1500m',
  bike_20k: 'bike_20k',
  bike_40k: 'bike_40k',
  row_2k: 'row_2k',
};

/**
 * 2026-10-03 — every race the lift / hybrid calculator can take, as the app's
 * (modality, event): the HABS races above PLUS the 500 m row, a TPF Benchmark
 * standard outside the score that the app still predicts FROM (a 500 m row
 * predicts the 2 km — 4×, inside the 4.1× rule). The predicted equivalents
 * (src/engine/habsPredict.ts) are built from these; pinned against the app
 * sync's RACE_TO_APP by src/test/habs-app-map.test.ts.
 */
export const PREDICTION_RACE_EVENTS: Record<string, { modality: string; event: string }> = {
  run_1mi: { modality: 'run', event: 'mile' },
  run_5k: { modality: 'run', event: '5k' },
  run_10k: { modality: 'run', event: '10k' },
  run_half: { modality: 'run', event: 'half' },
  row_2k: { modality: 'row', event: '2k' },
  row_500m: { modality: 'row', event: '500m' },
  swim_400m: { modality: 'swim', event: '400m' },
  swim_1500m: { modality: 'swim', event: '1500m' },
  bike_20k: { modality: 'bike', event: '20k' },
  bike_40k: { modality: 'bike', event: '40k' },
};
