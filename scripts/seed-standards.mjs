/**
 * Seed the Excel master with v1 BETA standards, then `npm run codegen` flows
 * them into /config. Re-runnable (idempotent): edit the values here, re-run.
 *
 * PROVENANCE / HONESTY:
 *   These are EXPERT-CURATED STARTER tiers for a trained-adult population,
 *   anchored to the methodology (pass≈50th / good≈70th / excellent≈85th /
 *   elite≈top 1–2% percentile). Powerlifts lean on OpenPowerlifting (CC0)
 *   distributions adjusted toward a general population; runs on WMA/open-race
 *   norms; the rest are coach-curated ratios. They are NOT copied from any
 *   proprietary table (Strength Level, BTWB) and are NOT authoritative —
 *   label "beta" in the UI and recalibrate against own-user data once volume
 *   allows (see the workbook Read me + ROADMAP Phase 4).
 *
 * Times are written as SECONDS (numbers); the engine/codegen treat them as
 * lower-is-better via Benchmarks_Sourcing.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const XLSX_PATH = resolve(REPO, 'config/standards/TPF_HRS_Standards_v0_2026-06-21.xlsx');

const COMPONENTS = [
  'running', 'erg_engine', 'lower_strength', 'upper_strength',
  'olympic', 'power', 'gymnastics', 'core_endurance',
];
const PATHWAYS = ['gym_goer', 'hybrid_athlete', 'crossfit_generalist', 'hyrox', 'powerlifter', 'bodybuilder'];

// Human-readable times: write seconds as mm:ss (or h:mm:ss) in the workbook so
// the master is easy to read/edit. Codegen parses them back to seconds.
const clock = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
};
const fmt = (unit, v) => (typeof v === 'number' && unit.includes(':') ? clock(v) : v);

// --- Standards: [id, unit, lower_is_better, M[p,g,e,el], F[p,g,e,el], source] ---
const STANDARDS = [
  ['run_1mi', 'mm:ss', 1, [540, 435, 390, 330], [600, 495, 432, 390], 'WMA + open race'],
  ['run_5k', 'mm:ss', 1, [1800, 1440, 1290, 1110], [2010, 1680, 1440, 1290], 'WMA + open race'],
  ['row_2k', 'mm:ss.s', 1, [480, 450, 420, 400], [540, 510, 480, 460], 'Expert + own-data'],
  ['row_500m', 'mm:ss.s', 1, [110, 100, 93, 85], [125, 115, 107, 102], 'Expert + own-data'],
  ['back_squat_1rm', 'xBW', 0, [1.35, 1.6, 2.0, 2.5], [1.0, 1.3, 1.6, 2.0], 'OpenPowerlifting (adj.)'],
  ['front_squat_1rm', 'xBW', 0, [1.1, 1.35, 1.65, 2.05], [0.8, 1.05, 1.3, 1.65], 'Coaching ratios (≈0.82× back squat)'],
  ['deadlift_1rm', 'xBW', 0, [1.65, 1.9, 2.3, 2.8], [1.2, 1.5, 1.9, 2.4], 'OpenPowerlifting (adj.)'],
  ['bench_1rm', 'xBW', 0, [1.0, 1.25, 1.6, 2.0], [0.6, 0.8, 1.0, 1.3], 'OpenPowerlifting (adj.)'],
  ['strict_press_1rm', 'xBW', 0, [0.65, 0.8, 1.0, 1.25], [0.4, 0.55, 0.7, 0.9], 'Expert-curated'],
  ['snatch_1rm', 'xBW', 0, [0.7, 0.95, 1.2, 1.5], [0.5, 0.65, 0.85, 1.05], 'Expert + coaching ratios'],
  ['clean_jerk_1rm', 'xBW', 0, [0.9, 1.2, 1.5, 1.85], [0.65, 0.85, 1.05, 1.3], 'Expert + coaching ratios'],
  ['power_clean_1rm', 'xBW', 0, [0.8, 1.05, 1.35, 1.65], [0.55, 0.75, 0.95, 1.15], 'Expert-curated'],
  ['broad_jump', 'cm', 0, [200, 230, 260, 285], [160, 185, 210, 220], 'Combine norms + expert'],
  ['strict_pullups', 'reps', 0, [5, 11, 18, 25], [1, 5, 10, 18], 'Expert-curated'],
  ['hspu', 'reps', 0, [3, 8, 15, 25], [1, 4, 8, 15], 'Expert-curated'],
  ['t2b', 'reps', 0, [8, 18, 30, 45], [5, 12, 22, 35], 'Expert-curated'],
  ['du_unbroken', 'reps', 0, [20, 50, 100, 150], [15, 45, 90, 130], 'Expert-curated'],
  ['max_mu', 'reps', 0, [1, 4, 9, 14], [1, 2, 5, 8], 'Expert-curated'],
  ['plank_hold', 'mm:ss', 0, [90, 150, 180, 300], [90, 150, 180, 300], 'Norms + expert'],
];

// --- Weights: each pathway column sums to 100 ---
const WEIGHTS = {
  gym_goer: { running: 10, erg_engine: 10, lower_strength: 20, upper_strength: 20, olympic: 5, power: 10, gymnastics: 15, core_endurance: 10 },
  hybrid_athlete: { running: 20, erg_engine: 15, lower_strength: 15, upper_strength: 15, olympic: 5, power: 10, gymnastics: 10, core_endurance: 10 },
  crossfit_generalist: { running: 12, erg_engine: 12, lower_strength: 14, upper_strength: 12, olympic: 16, power: 12, gymnastics: 16, core_endurance: 6 },
  hyrox: { running: 33, erg_engine: 13, lower_strength: 16, upper_strength: 8, olympic: 2, power: 7, gymnastics: 6, core_endurance: 15 },
  // Strength pathways: NO cardio (running/erg = 0). Scored on lifts only.
  powerlifter: { running: 0, erg_engine: 0, lower_strength: 45, upper_strength: 35, olympic: 0, power: 10, gymnastics: 0, core_endurance: 10 },
  bodybuilder: { running: 0, erg_engine: 0, lower_strength: 35, upper_strength: 35, olympic: 0, power: 10, gymnastics: 10, core_endurance: 10 },
};

// --- WOD standards: tiers M/F + prescribed Rx load (kg) per sex ---
const WODS = {
  fran: { unit: 'mm:ss', lib: 1, M: [360, 240, 210, 165], F: [420, 300, 270, 210], move: 'Thruster', loadM: 43, loadF: 30 },
  grace: { unit: 'mm:ss', lib: 1, M: [300, 225, 165, 135], F: [360, 240, 165, 145], move: 'Clean & jerk', loadM: 61, loadF: 43 },
  helen: { unit: 'mm:ss', lib: 1, M: [840, 660, 540, 450], F: [960, 780, 630, 510], move: 'Kettlebell swing', loadM: 24, loadF: 16 },
  diane: { unit: 'mm:ss', lib: 1, M: [600, 390, 285, 210], F: [720, 480, 360, 255], move: 'Deadlift', loadM: 102, loadF: 70 },
  cindy: { unit: 'rounds', lib: 0, M: [12, 18, 22, 25], F: [10, 16, 20, 22], move: 'Bodyweight', loadM: null, loadF: null },
  fight_gone_bad: { unit: 'reps', lib: 0, M: [250, 320, 360, 420], F: [200, 270, 310, 370], move: 'Push press / SDHP / wall-ball', loadM: 34, loadF: 25 },
  hyrox_race: { unit: 'h:mm:ss', lib: 1, M: [5700, 5160, 4620, 4080], F: [6600, 6000, 5340, 4740], move: 'Full race (open, singles)', loadM: null, loadF: null },
};

// --- Quality-mix: component → fraction of the WOD's demand (rows sum 1) ---
const QMIX = {
  fran: { gymnastics: 0.35, upper_strength: 0.2, power: 0.2, lower_strength: 0.1, core_endurance: 0.15 },
  grace: { olympic: 0.5, power: 0.25, upper_strength: 0.15, core_endurance: 0.1 },
  helen: { running: 0.35, gymnastics: 0.25, power: 0.2, core_endurance: 0.2 },
  diane: { lower_strength: 0.35, upper_strength: 0.35, gymnastics: 0.2, core_endurance: 0.1 },
  cindy: { gymnastics: 0.4, upper_strength: 0.25, lower_strength: 0.2, core_endurance: 0.15 },
  fight_gone_bad: { power: 0.25, erg_engine: 0.2, gymnastics: 0.15, upper_strength: 0.15, lower_strength: 0.15, core_endurance: 0.1 },
  hyrox_race: { running: 0.5, erg_engine: 0.15, lower_strength: 0.1, power: 0.1, core_endurance: 0.15 },
};

// --- build sheets -----------------------------------------------------------

function standardsSheet() {
  const rows = [
    ['Tier thresholds · v1 EXPERT-SEEDED BETA · recalibrate with own data'],
    ['benchmark_id', 'sex', 'unit', 'lower_is_better', 'pass (50%)', 'good (70%)', 'excellent (85%)', 'elite (100%)', 'source_ref', 'notes'],
  ];
  for (const [id, unit, lib, M, F, src] of STANDARDS) {
    rows.push([id, 'M', unit, lib, ...M.map((v) => fmt(unit, v)), src, '']);
    rows.push([id, 'F', unit, lib, ...F.map((v) => fmt(unit, v)), src, '']);
  }
  return XLSX.utils.aoa_to_sheet(rows);
}

function weightsSheet() {
  const rows = [
    ['Pathway component weights · each column sums to 100 · v1 beta'],
    ['component', ...PATHWAYS],
  ];
  for (const c of COMPONENTS) rows.push([c, ...PATHWAYS.map((p) => WEIGHTS[p][c])]);
  rows.push(['TOTAL (must = 100)', ...PATHWAYS.map((p) => COMPONENTS.reduce((s, c) => s + WEIGHTS[p][c], 0))]);
  return XLSX.utils.aoa_to_sheet(rows);
}

function wodSheet() {
  const rows = [
    ['Benchmark-WOD tiers + Rx loads · v1 beta · do NOT scrape community data'],
    ['wod_id', 'sex', 'unit', 'lower_is_better', 'scaling', 'pass (50%)', 'good (70%)', 'excellent (85%)', 'elite (100%)', 'data_source', 'license_note', 'rx_load_kg', 'load_movement'],
  ];
  for (const [id, w] of Object.entries(WODS)) {
    const note = 'Expert + own-data; community data proprietary — do not scrape';
    rows.push([id, 'M', w.unit, w.lib, 'Rx', ...w.M.map((v) => fmt(w.unit, v)), 'Expert + own-data', note, w.loadM ?? '', w.move]);
    rows.push([id, 'F', w.unit, w.lib, 'Rx', ...w.F.map((v) => fmt(w.unit, v)), 'Expert + own-data', note, w.loadF ?? '', w.move]);
  }
  return XLSX.utils.aoa_to_sheet(rows);
}

function qmixSheet() {
  const rows = [
    ['Capacity Index — per-WOD component vectors · rows sum 1 · v1 beta'],
    ['wod_id', ...COMPONENTS, 'row total'],
  ];
  for (const [id, mix] of Object.entries(QMIX)) {
    const vals = COMPONENTS.map((c) => mix[c] ?? 0);
    rows.push([id, ...vals, vals.reduce((a, b) => a + b, 0)]);
  }
  return XLSX.utils.aoa_to_sheet(rows);
}

// --- write ------------------------------------------------------------------

const wb = XLSX.read(readFileSync(XLSX_PATH), { type: 'buffer' });
wb.Sheets['Standards'] = standardsSheet();
wb.Sheets['Weights'] = weightsSheet();
wb.Sheets['WOD_Standards'] = wodSheet();
wb.Sheets['Quality_Mix'] = qmixSheet();
XLSX.writeFile(wb, XLSX_PATH);

console.log(`[seed] populated ${STANDARDS.length} benchmarks, ${PATHWAYS.length} pathways, ${Object.keys(WODS).length} WODs`);
console.log(`[seed] wrote ${XLSX_PATH}`);
console.log('[seed] run `npm run codegen` to flow these into /config.');
