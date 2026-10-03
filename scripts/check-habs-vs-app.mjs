/**
 * Cross-repo check — TPF Benchmark's HABS score vs the TPF app's
 * (2026-10-03; the owner: "make HABS score align").
 *
 *   node scripts/check-habs-vs-app.mjs [path/to/tpf-app]
 *   npm run check:app-habs -- [path/to/tpf-app]
 *
 * The app path defaults to $TPF_APP_PATH, else ../tpf-app beside this repo.
 *
 * check:app-lift compares the LADDERS; this compares the SCORE. It runs the
 * app's own `computeHABS` (tpf-app src/lib/habs.ts) — with the app's `tsx`,
 * against the app's source, read-only, exactly as the app's HABS card calls
 * it: `computeHABS(orm, raceTimes, sex, HABS_PATHWAY_WEIGHTS[p],
 * habsStandardsFor(p, sex))` — and this site's `computeHabs`
 * (src/engine/habs.ts, with src/config/habs.ts) on the same synthetic
 * athletes, and requires:
 *
 *   - the model data: the pathway list, every pathway's nine weights, the
 *     component labels, which benchmark feeds which component (and in what
 *     order), every pathway × sex × benchmark ladder, and which lifts use the
 *     Olympic 1RM divisor — all equal;
 *   - the scores: for every athlete, the overall within ± 0.5 and the
 *     breakdown identical — the same components in the same order, each with
 *     the same weight, data flag and score, and the same benchmarks with the
 *     same values and scores (± 1e-9), the same weight covered and weak link.
 *
 * The athletes: a hand-written set (full coverage at three levels, below
 * Beginner, past Elite, exactly on anchors, lifts only, runs only, one
 * benchmark, the triathlete's swim and bike, multi-rep and Olympic sets,
 * pound-converted weights, the TPF Benchmark standards outside HABS, empty)
 * on every pathway and both sexes, plus seeded random partial athletes.
 *
 * Reported, not counted as a difference: how often the APP's predicted
 * equivalents (auto_benchmark_inputs.ts raceTimesWithEquivalents — a missing
 * race filled from a nearby one) would move the app's number for the same
 * typed inputs. The site does not predict (docs/HABS-ALIGNMENT-2026-10-03.md
 * D19, an owner question).
 *
 * It needs the app checked out with its node_modules installed, and is not
 * part of `npm test` (CI has no app checkout). Exit 0 = no differences.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HABS_APP_KEYS, HABS_STD_KEYS } from '../src/config/habsAppMap.ts';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP = resolve(process.argv[2] ?? process.env.TPF_APP_PATH ?? resolve(REPO, '../tpf-app'));
const PATHWAYS = ['gym_goer', 'hybrid_athlete', 'crossfit_generalist', 'hyrox', 'powerlifter', 'bodybuilder', 'triathlete'];
const SEXES = ['M', 'F'];
const TIERS6 = ['pass', 'novice', 'good', 'intermediate', 'advanced', 'elite'];
const EPS = 1e-9;
const LB = 0.45359237;

// ---- synthetic athletes (site ids; lifts [kg, reps], races seconds) -------

const FIXED = {
  full_mid: {
    lifts: { back_squat_1rm: [130, 1], deadlift_1rm: [160, 1], bench_1rm: [95, 1], strict_press_1rm: [60, 1], barbell_row_1rm: [85, 1], power_clean_1rm: [80, 1] },
    races: { run_1mi: 420, run_5k: 1380, run_10k: 2900, run_half: 6400, row_2k: 455, swim_400m: 420, swim_1500m: 1700, bike_20k: 2200, bike_40k: 4600 },
  },
  full_strong: {
    lifts: { back_squat_1rm: [200, 1], deadlift_1rm: [240, 1], bench_1rm: [170, 1], strict_press_1rm: [100, 1], barbell_row_1rm: [140, 1], power_clean_1rm: [130, 1] },
    races: { run_1mi: 290, run_5k: 1000, run_10k: 2100, run_half: 4700, row_2k: 380, swim_400m: 270, swim_1500m: 1100, bike_20k: 1600, bike_40k: 3300 },
  },
  full_novice_women: {
    lifts: { back_squat_1rm: [60, 1], deadlift_1rm: [75, 1], bench_1rm: [45, 1], strict_press_1rm: [30, 1], barbell_row_1rm: [40, 1], power_clean_1rm: [40, 1] },
    races: { run_1mi: 520, run_5k: 1735, run_10k: 3620, run_half: 7980, row_2k: 580, swim_400m: 530, swim_1500m: 2150, bike_20k: 2670, bike_40k: 5530 },
  },
  below_beginner: {
    lifts: { back_squat_1rm: [20, 1], deadlift_1rm: [30, 3], bench_1rm: [10, 1], strict_press_1rm: [5, 1], barbell_row_1rm: [15, 2], power_clean_1rm: [10, 5] },
    races: { run_1mi: 700, run_5k: 2000, run_10k: 9000, run_half: 30000, row_2k: 700, swim_400m: 2000, bike_20k: 9000 },
  },
  far_below_beginner_times: { lifts: {}, races: { run_1mi: 3000, run_5k: 9999, row_2k: 2000, run_10k: 4500 } },
  past_elite: {
    lifts: { back_squat_1rm: [400, 1], deadlift_1rm: [300, 5], bench_1rm: [300, 1], power_clean_1rm: [200, 3] },
    races: { run_1mi: 200, run_5k: 800, row_2k: 300, swim_1500m: 700, bike_40k: 2500 },
  },
  lifts_only_multirep: {
    lifts: { back_squat_1rm: [100, 5], deadlift_1rm: [140, 3], bench_1rm: [80, 8], strict_press_1rm: [50, 6], barbell_row_1rm: [70, 10], power_clean_1rm: [70, 3] },
    races: {},
  },
  pounds: {
    lifts: { back_squat_1rm: [315 * LB, 3], deadlift_1rm: [405 * LB, 1], bench_1rm: [225 * LB, 5], power_clean_1rm: [185 * LB, 2] },
    races: { run_5k: 1299.5, row_2k: 433.7 },
  },
  runs_only: { lifts: {}, races: { run_1mi: 380, run_5k: 1300, run_10k: 2700, run_half: 6000 } },
  run_distance_only: { lifts: {}, races: { run_half: 5800 } },
  single_lift: { lifts: { deadlift_1rm: [180, 1] }, races: {} },
  single_race: { lifts: {}, races: { row_2k: 410 } },
  tri_discipline: { lifts: { back_squat_1rm: [90, 1] }, races: { swim_400m: 360, swim_1500m: 1450, bike_20k: 1950, bike_40k: 4040, run_10k: 2450 } },
  with_outside_standards: {
    lifts: { back_squat_1rm: [120, 1], front_squat_1rm: [200, 1], snatch_1rm: [150, 1], clean_jerk_1rm: [30, 2] },
    races: { run_5k: 1320, row_500m: 85 },
    manual: { strict_pullups: 40, plank_hold: 30, broad_jump: 300 },
  },
  fractional_reps: { lifts: { bench_1rm: [90, 2.5], power_clean_1rm: [60, 0] }, races: { run_1mi: 450.25 } },
  empty: { lifts: {}, races: {} },
};

/** Lifts on each pathway's own anchors (scored exactly 50…100). */
function anchorAthlete(std, sex, tier) {
  const lifts = {};
  const races = {};
  for (const [id, key] of Object.entries(HABS_STD_KEYS)) {
    const t = std[sex][key];
    if (!t) continue;
    if ('orm' in HABS_APP_KEYS[id]) lifts[id] = [t[tier], 1];
    else races[id] = t[tier];
  }
  return { lifts, races };
}

/** Seeded random partial athletes (mulberry32). */
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const RANGES = {
  back_squat_1rm: [20, 350], deadlift_1rm: [30, 400], bench_1rm: [15, 260], strict_press_1rm: [10, 150],
  barbell_row_1rm: [15, 200], power_clean_1rm: [15, 170],
  run_1mi: [240, 900], run_5k: [900, 3600], run_10k: [1800, 7500], run_half: [4000, 15000],
  row_2k: [330, 800], swim_400m: [220, 1000], swim_1500m: [900, 3200], bike_20k: [1500, 3800], bike_40k: [3000, 7800],
};
function randomAthlete(r) {
  const lifts = {};
  const races = {};
  for (const [id, [lo, hi]] of Object.entries(RANGES)) {
    if (r() < 0.45) continue;
    const v = Math.round((lo + r() * (hi - lo)) * 4) / 4;
    if ('orm' in HABS_APP_KEYS[id]) lifts[id] = [v, r() < 0.5 ? 1 : 1 + Math.floor(r() * 12)];
    else races[id] = v;
  }
  return { lifts, races };
}

// ---- the two engines ------------------------------------------------------

function runTsx(tsx, cwd, code, input) {
  const dir = mkdtempSync(join(tmpdir(), 'tpf-habs-'));
  try {
    const entry = join(dir, 'dump.ts');
    const inFile = join(dir, 'in.json');
    writeFileSync(entry, code);
    writeFileSync(inFile, JSON.stringify(input));
    const r = spawnSync(tsx, [entry, inFile], { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
    if (r.status !== 0) throw new Error(`tsx failed in ${cwd} (${r.status}):\n${r.stderr}`);
    return JSON.parse(r.stdout);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function appModel(tsx) {
  const at = (f) => JSON.stringify(join(APP, 'src/lib', f));
  return runTsx(tsx, APP, `
import { readFileSync } from 'node:fs';
import { HABS_COMPONENT_LABEL, HABS_ORM_WHATIF_BENCHMARKS, HABS_RACE_WHATIF_BENCHMARKS } from ${at('habs.ts')};
import { ALL_HABS_PATHWAYS, HABS_PATHWAY_WEIGHTS } from ${at('habs_pathways.ts')};
import { habsStandardsFor } from ${at('habs_pathway_standards.ts')};
import { isOlympicOrmLift } from ${at('constants.ts')};
const lifts = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const standards = {};
for (const p of ALL_HABS_PATHWAYS) standards[p] = { M: habsStandardsFor(p, 'male'), F: habsStandardsFor(p, 'female') };
process.stdout.write(JSON.stringify({
  pathways: ALL_HABS_PATHWAYS, weights: HABS_PATHWAY_WEIGHTS, labels: HABS_COMPONENT_LABEL,
  members: [
    ...HABS_ORM_WHATIF_BENCHMARKS.map((b) => ({ component: b.component, key: 'orm:' + b.ormKey })),
    ...HABS_RACE_WHATIF_BENCHMARKS.map((b) => ({ component: b.component, key: 'race:' + b.raceModality + ':' + b.raceEvent })),
  ],
  standards,
  olympic: Object.fromEntries(lifts.map((n) => [n, isOlympicOrmLift(n)])),
}));
`, ['Back Squat', 'Deadlift', 'Power Clean', 'Bench Press', 'Overhead Press', 'Barbell Row', 'Snatch', 'Clean & Jerk', 'Front Squat']);
}

function appScores(tsx, cases) {
  const at = (f) => JSON.stringify(join(APP, 'src/lib', f));
  return runTsx(tsx, APP, `
import { readFileSync } from 'node:fs';
import { computeHABS } from ${at('habs.ts')};
import { HABS_PATHWAY_WEIGHTS } from ${at('habs_pathways.ts')};
import { habsStandardsFor } from ${at('habs_pathway_standards.ts')};
import { raceTimesWithEquivalents } from ${at('auto_benchmark_inputs.ts')};
const cases = JSON.parse(readFileSync(process.argv[2], 'utf8'));
process.stdout.write(JSON.stringify(cases.map((c) => {
  const w = HABS_PATHWAY_WEIGHTS[c.pathway];
  const std = habsStandardsFor(c.pathway, c.sex);
  const r = computeHABS(c.orm, c.race, c.sex, w, std);
  const p = computeHABS(c.orm, raceTimesWithEquivalents(c.race, null, c.sex), c.sex, w, std);
  return { id: c.id, r, predicted: { score: p.score, weightCovered: p.weightCovered } };
})));
`, cases);
}

function siteRun(tsx, cases) {
  const at = (f) => JSON.stringify(join(REPO, 'src', f));
  return runTsx(tsx, REPO, `
import { readFileSync } from 'node:fs';
import { computeHabs } from ${at('engine/habs.ts')};
import { HABS_OLYMPIC_IDS, habsWeightsFor, liftBenchmarksFor } from ${at('config/habs.ts')};
import { HABS_COMPONENT_LABEL } from ${at('config/habsDisplay.ts')};
import { HRS_BENCHMARKS, withPathwayStandards } from ${at('config/benchmarks.ts')};
import { PATHWAY_IDS } from ${at('config/pathways.ts')};
const cases = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const standards = {};
for (const p of PATHWAY_IDS) {
  const defs = withPathwayStandards(p, HRS_BENCHMARKS).filter((b) => b.habsComponent);
  standards[p] = Object.fromEntries(defs.map((b) => [b.id, { M: b.thresholds.M, F: b.thresholds.F, lowerIsBetter: b.lowerIsBetter }]));
}
process.stdout.write(JSON.stringify({
  pathways: PATHWAY_IDS,
  weights: Object.fromEntries(PATHWAY_IDS.map((p) => [p, habsWeightsFor(p)])),
  labels: HABS_COMPONENT_LABEL,
  members: HRS_BENCHMARKS.filter((b) => b.habsComponent).map((b) => ({ id: b.id, component: b.habsComponent })),
  standards,
  olympic: [...HABS_OLYMPIC_IDS],
  results: cases.map((c) => ({ id: c.id, r: computeHabs({
    benchmarks: liftBenchmarksFor(c.pathway), weights: habsWeightsFor(c.pathway), sex: c.sex, logs: c.logs, olympicIds: HABS_OLYMPIC_IDS,
  }) })),
}));
`, cases);
}

// ---- build the cases ------------------------------------------------------

/** One athlete in both vocabularies: the site's logs and the app's stores. */
function toCase(id, pathway, sex, a) {
  const logs = { orm: [], raceTimes: [], manual: [], wod: [] };
  const orm = {};
  const race = { run: {}, row: {}, bike: {}, swim: {}, ruck: {} };
  for (const [bid, [kg, reps]] of Object.entries(a.lifts ?? {})) {
    logs.orm.push({ benchmarkId: bid, weightKg: kg, reps });
    const k = HABS_APP_KEYS[bid];
    if (k && 'orm' in k) orm[k.orm] = { w: String(kg), r: String(reps) }; // as the app sync writes them
  }
  for (const [bid, sec] of Object.entries(a.races ?? {})) {
    logs.raceTimes.push({ benchmarkId: bid, modality: 'x', event: bid, timeSec: sec });
    const k = HABS_APP_KEYS[bid];
    if (k && 'race' in k) race[k.race[0]][k.race[1]] = { timeSec: sec, updatedAt: '2026-10-03T00:00:00.000Z' };
  }
  for (const [bid, v] of Object.entries(a.manual ?? {})) logs.manual.push({ benchmarkId: bid, value: v });
  return { id, pathway, siteSex: sex, appSex: sex === 'F' ? 'female' : 'male', logs, orm, race };
}

/** Every athlete the check scores, in both vocabularies. `appStandards` =
 *  the app's resolved ladders (for the on-anchor athletes). */
export function buildCases(appStandards) {
  const cases = [];
  for (const p of PATHWAYS) {
    for (const sex of SEXES) {
      for (const [name, a] of Object.entries(FIXED)) cases.push(toCase(`${p}/${sex}/${name}`, p, sex, a));
      for (const tier of TIERS6) cases.push(toCase(`${p}/${sex}/anchors_${tier}`, p, sex, anchorAthlete(appStandards[p], sex, tier)));
    }
  }
  const r = rng(20261003);
  for (let i = 0; i < 400; i++) {
    const p = PATHWAYS[Math.floor(r() * PATHWAYS.length)];
    const sex = r() < 0.5 ? 'M' : 'F';
    cases.push(toCase(`random_${i}/${p}/${sex}`, p, sex, randomAthlete(r)));
  }
  return cases;
}

export { appModel, appScores, runTsx };

// ---- compare --------------------------------------------------------------

const near = (a, b, eps = EPS) => Math.abs(a - b) <= eps;
const show = (t) => (t ? TIERS6.map((k) => t[k]).join(' / ') : '—');

export function compareModel(app, site) {
  const diffs = [];
  if (JSON.stringify(app.pathways) !== JSON.stringify(site.pathways)) diffs.push(`pathways: app ${app.pathways} · site ${site.pathways}`);
  for (const p of app.pathways) {
    const aw = app.weights[p] ?? {};
    const sw = site.weights[p] ?? {};
    for (const c of new Set([...Object.keys(aw), ...Object.keys(sw)])) {
      if ((aw[c] ?? 0) !== (sw[c] ?? 0)) diffs.push(`weight ${p}/${c}: app ${aw[c] ?? 0} · site ${sw[c] ?? 0}`);
    }
  }
  for (const c of new Set([...Object.keys(app.labels), ...Object.keys(site.labels)])) {
    if (app.labels[c] !== site.labels[c]) diffs.push(`label ${c}: app "${app.labels[c]}" · site "${site.labels[c]}"`);
  }
  // Membership and order: the app's (component, key) list vs the site's.
  const keyOf = (id) => { const k = HABS_APP_KEYS[id]; return k ? ('orm' in k ? `orm:${k.orm}` : `race:${k.race[0]}:${k.race[1]}`) : `site:${id}`; };
  // The app's members come from two exported lists (lifts, then races), each
  // in COMPONENT_DEFS order; a component is all lifts or all races, so its
  // order survives.
  const appBy = {};
  for (const m of app.members) (appBy[m.component] ??= []).push(m.key);
  const siteBy = {};
  for (const m of site.members) (siteBy[m.component] ??= []).push(keyOf(m.id));
  for (const c of new Set([...Object.keys(appBy), ...Object.keys(siteBy)])) {
    if (JSON.stringify(appBy[c] ?? []) !== JSON.stringify(siteBy[c] ?? [])) {
      diffs.push(`members ${c}: app [${(appBy[c] ?? []).join(', ')}] · site [${(siteBy[c] ?? []).join(', ')}]`);
    }
  }
  // Ladders: every pathway × sex × HABS benchmark, as each engine resolves it.
  for (const p of app.pathways) {
    for (const sex of SEXES) {
      for (const [id, key] of Object.entries(HABS_STD_KEYS)) {
        const a = app.standards[p]?.[sex]?.[key];
        const s = site.standards[p]?.[id];
        const st = s?.[sex];
        if (!a || !st) { diffs.push(`ladder ${p} ${id}/${sex}: ${a ? 'site' : 'app'} has none`); continue; }
        if (TIERS6.some((t) => a[t] !== st[t])) diffs.push(`ladder ${p} ${id}/${sex}: app ${show(a)} · site ${show(st)}`);
        if (Boolean(a.lowerIsBetter) !== Boolean(s.lowerIsBetter)) diffs.push(`direction ${p} ${id}: app ${Boolean(a.lowerIsBetter)} · site ${s.lowerIsBetter}`);
      }
    }
  }
  // The Olympic divisor.
  const siteOly = new Set(site.olympic);
  const NAME = { power_clean_1rm: 'Power Clean', snatch_1rm: 'Snatch', clean_jerk_1rm: 'Clean & Jerk', back_squat_1rm: 'Back Squat', deadlift_1rm: 'Deadlift', bench_1rm: 'Bench Press', strict_press_1rm: 'Overhead Press', barbell_row_1rm: 'Barbell Row', front_squat_1rm: 'Front Squat' };
  for (const [id, name] of Object.entries(NAME)) {
    if (app.olympic[name] !== siteOly.has(id)) diffs.push(`Olympic 1RM divisor ${id} (${name}): app ${app.olympic[name]} · site ${siteOly.has(id)}`);
  }
  return diffs;
}

export function compareScores(cases, appRes, siteRes) {
  const diffs = [];
  let identical = 0;
  let maxDiff = 0;
  const siteById = Object.fromEntries(siteRes.map((x) => [x.id, x.r]));
  for (const c of cases) {
    const a = appRes.find((x) => x.id === c.id).r;
    const s = siteById[c.id];
    const tag = `${c.id}`;
    const d = Math.abs(a.score - s.score);
    maxDiff = Math.max(maxDiff, d);
    const before = diffs.length;
    if (d > 0.5) diffs.push(`${tag}: score app ${a.score} · site ${s.score}`);
    if (!near(a.weightCovered, s.weightCovered)) diffs.push(`${tag}: weight covered app ${a.weightCovered} · site ${s.weightCovered}`);
    if (a.weakLink !== s.weakLink) diffs.push(`${tag}: weak link app ${a.weakLink} · site ${s.weakLink}`);
    if (a.components.length !== s.components.length || a.components.some((x, i) => x.id !== s.components[i].id)) {
      diffs.push(`${tag}: components app [${a.components.map((x) => x.id)}] · site [${s.components.map((x) => x.id)}]`);
    } else {
      a.components.forEach((ac, i) => {
        const sc = s.components[i];
        if (ac.weight !== sc.weight || ac.hasData !== sc.hasData || !near(ac.score, sc.score)) {
          diffs.push(`${tag} ${ac.id}: app w${ac.weight} ${ac.hasData} ${ac.score} · site w${sc.weight} ${sc.hasData} ${sc.score}`);
        }
        // The app labels its benchmarks; the site ids them. Map by order + value.
        if (ac.benchmarks.length !== sc.benchmarks.length) {
          diffs.push(`${tag} ${ac.id}: benchmarks app ${ac.benchmarks.length} · site ${sc.benchmarks.length}`);
        } else {
          ac.benchmarks.forEach((ab, j) => {
            const sb = sc.benchmarks[j];
            if (ab.kind !== sb.kind || !near(ab.value, sb.value) || !near(ab.score, sb.score)) {
              diffs.push(`${tag} ${ac.id} #${j} (${ab.label} / ${sb.benchmarkId}): app ${ab.value} → ${ab.score} · site ${sb.value} → ${sb.score}`);
            }
          });
        }
      });
    }
    if (diffs.length === before && a.score === s.score) identical++;
  }
  return { diffs, identical, maxDiff };
}

// ---- main -----------------------------------------------------------------

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const tsx = join(APP, 'node_modules/.bin/tsx');
  if (!existsSync(join(APP, 'src/lib/habs.ts'))) throw new Error(`no ${APP}/src/lib/habs.ts — pass the tpf-app path`);
  if (!existsSync(tsx)) throw new Error(`no ${tsx} — run npm ci in the app`);

  const app = appModel(tsx);
  const cases = buildCases(app.standards);

  const appRes = appScores(tsx, cases.map((c) => ({ id: c.id, pathway: c.pathway, sex: c.appSex, orm: c.orm, race: c.race })));
  const site = siteRun(tsx, cases.map((c) => ({ id: c.id, pathway: c.pathway, sex: c.siteSex, logs: c.logs })));

  const modelDiffs = compareModel(app, site);
  const { diffs, identical, maxDiff } = compareScores(cases, appRes, site.results);
  const scored = appRes.filter((x) => x.r.weightCovered > 0).length;
  const moved = appRes.filter((x) => Math.abs(x.predicted.score - x.r.score) > 0.5);
  const maxMove = Math.max(0, ...appRes.map((x) => Math.abs(x.predicted.score - x.r.score)));

  console.log(`[check:app-habs] app ${APP}`);
  for (const d of [...modelDiffs, ...diffs]) console.log(`  - ${d}`);
  console.log(`[check:app-habs] model: ${app.pathways.length} pathways × 9 weights, ${Object.keys(app.labels).length} labels, ${app.members.length} benchmark memberships, ${app.pathways.length * 2 * Object.keys(HABS_STD_KEYS).length} ladders, 9 Olympic-divisor flags: ${modelDiffs.length} difference(s)`);
  console.log(`[check:app-habs] scores: ${cases.length} athletes (${scored} with a score; ${PATHWAYS.length} pathways × 2 sexes × ${Object.keys(FIXED).length + TIERS6.length} fixed + 400 random), ${identical} bit-identical, max |Δ| ${maxDiff}: ${diffs.length} difference(s)`);
  console.log(`[check:app-habs] not compared (information): with the app's predicted equivalents for missing races, ${moved.length} of ${cases.length} athletes' app score moves by more than 0.5 (max ${maxMove.toFixed(1)}) — the site does not predict (docs/HABS-ALIGNMENT-2026-10-03.md D19)`);
  process.exit(modelDiffs.length + diffs.length ? 1 : 0);
}
