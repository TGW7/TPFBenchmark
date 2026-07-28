/**
 * Single source of truth for a benchmark's human-facing label, SEO slug and
 * "how to improve" tip category — previously hand-duplicated across
 * src/ui/format.ts (BENCH_LABEL_OVERRIDES) and scripts/build-seo.mjs (BENCH +
 * TIP_CAT), independently, with no compiler/test tying them together. Node's
 * native TS type-stripping (unflagged as of this project's Node version)
 * lets scripts/build-seo.mjs import this file directly despite running as a
 * plain script, not through Vite/tsc — no build step or JS mirror needed.
 *
 * `slug`/`tip` are only set for benchmarks with a real /standards/ SEO page
 * (see liftBench in build-seo.mjs) — the rest (swim/bike/grip/ruck) are
 * label-only today, kept here so a future SEO page doesn't have to
 * reinvent the label.
 */

export interface BenchmarkDisplay {
  label: string;
  slug?: string;
  tip?: string;
}

export const BENCHMARK_DISPLAY: Record<string, BenchmarkDisplay> = {
  back_squat_1rm: { label: 'Back Squat', slug: 'back-squat', tip: 'barbell' },
  front_squat_1rm: { label: 'Front Squat', slug: 'front-squat', tip: 'barbell' },
  deadlift_1rm: { label: 'Deadlift', slug: 'deadlift', tip: 'barbell' },
  bench_1rm: { label: 'Bench Press', slug: 'bench-press', tip: 'barbell' },
  // "Overhead Press" is the more-searched public/SEO term; format.ts keeps a
  // local override to "Strict Press" for in-app display (the CrossFit-precise
  // term) — a deliberate divergence, not missed duplication.
  strict_press_1rm: { label: 'Overhead Press', slug: 'overhead-press', tip: 'barbell' },
  barbell_row_1rm: { label: 'Barbell Row', slug: 'barbell-row', tip: 'barbell' },
  snatch_1rm: { label: 'Snatch', slug: 'snatch', tip: 'oly' },
  clean_jerk_1rm: { label: 'Clean & Jerk', slug: 'clean-and-jerk', tip: 'oly' },
  power_clean_1rm: { label: 'Power Clean', slug: 'power-clean', tip: 'oly' },
  run_1mi: { label: '1-Mile Run', slug: '1-mile-run', tip: 'engine' },
  run_5k: { label: '5k Run', slug: '5k-run', tip: 'engine' },
  row_2k: { label: '2k Row', slug: '2k-row', tip: 'engine' },
  row_500m: { label: '500m Row', slug: '500m-row', tip: 'power_engine' },
  hspu: { label: 'Handstand Push-ups', slug: 'handstand-push-ups', tip: 'press_bw' },
  t2b: { label: 'Toes-to-Bar', slug: 'toes-to-bar', tip: 'core_bw' },
  du_unbroken: { label: 'Double-Unders', slug: 'double-unders', tip: 'skill' },
  max_mu: { label: 'Muscle-ups', slug: 'muscle-ups', tip: 'pull' },
  strict_pullups: { label: 'Strict Pull-ups', slug: 'strict-pull-ups', tip: 'pull' },
  plank_hold: { label: 'Plank Hold', slug: 'plank', tip: 'core' },
  broad_jump: { label: 'Broad Jump', slug: 'broad-jump', tip: 'power' },
  // No dedicated SEO page today — label only (see build-seo.mjs's liftBench filter).
  swim_400m: { label: '400m Swim' },
  swim_1500m: { label: '1500m Swim' },
  bike_20k: { label: '20km Bike TT' },
  bike_40k: { label: '40km Bike TT' },
  grip_deadhang: { label: 'Dead Hang' },
  ruck_time: { label: 'Ruck' },
};
