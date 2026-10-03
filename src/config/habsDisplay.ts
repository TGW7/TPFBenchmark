/**
 * 2026-10-03 — HABS display strings, shared by the UI and scripts/build-seo.mjs.
 *
 * No imports, on purpose: build-seo.mjs loads this file with Node's own
 * type-stripping (as it does benchmarkDisplay.ts), which cannot resolve
 * extensionless imports.
 *
 * The labels are the TPF app's (tpf-app src/lib/habs.ts HABS_COMPONENT_LABEL),
 * so a component reads the same on the site and in the app;
 * `npm run check:app-habs` compares them.
 */

export const HABS_COMPONENT_LABEL: Record<string, string> = {
  lower_strength: 'Lower-body strength',
  power: 'Power',
  upper_push: 'Upper-body push',
  upper_pull: 'Upper-body pull',
  run_intensity: 'Running (intensity)',
  run_distance: 'Running (distance)',
  swimming: 'Swimming',
  cycling: 'Cycling',
  erg: 'Rowing / erg',
};

/** Heading over the TPF Benchmark standards the calculator lists but the
 *  HABS score does not count (front squat, snatch, gymnastics, …). */
export const HABS_OUTSIDE_HEADING = 'TPF Benchmark standards — not in the HABS score';

export const HABS_OUTSIDE_NOTE =
  'Scored on their own against TPF’s standards. They don’t change your HABS score, which counts the same ' +
  'lifts and times, with the same weights, as the TPF app.';
