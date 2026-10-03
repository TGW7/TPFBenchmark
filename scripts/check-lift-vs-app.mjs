/**
 * Cross-repo lockstep check — TPF Benchmark's Lift data vs the TPF app
 * (2026-10-03).
 *
 *   node scripts/check-lift-vs-app.mjs [path/to/tpf-app]
 *   npm run check:app-lift -- [path/to/tpf-app]
 *
 * The app path defaults to $TPF_APP_PATH, else ../tpf-app beside this repo.
 *
 * Why this exists: the Lift lockstep pins in src/test/pathway-standards.test.ts
 * ("matches the tpf-app base table", "WOD ladders shared with tpf-app") are
 * typed literals — they catch a change HERE, never the app moving. On
 * 2026-10-03 the app's plan 61 moved the HYROX ladders AND three HABS base
 * cells (women's overhead press and 20 / 40 km bike Beginners); the list of
 * values handed to this repository named only the first, and nothing here
 * could have noticed the second. This reads the app's real data — by running
 * the app's own `tsx` against the app's source, read-only — and diffs:
 *
 *   1. the WOD ladders this site shares with the app: Fran, Helen, Cindy and
 *      HYROX (the app's Benchmarks catalogue, src/lib/benchmark_tests.ts
 *      BENCHMARK_TESTS, the six-tier `hybridTiers` of its men's and women's
 *      events) against WOD_STANDARDS, both sexes, six tiers;
 *   2. the HABS base table (src/lib/habs.ts STANDARDS_MALE / STANDARDS_FEMALE)
 *      against STANDARDS_THRESHOLDS on every shared key — the 500 m row is
 *      derived from the 2 km on both sides, so the app's own derivation
 *      (riegelStd with RIEGEL_ROW_500_FROM_2K at 1 s steps, the one its
 *      standards links use) is applied to the app's 2 km and compared;
 *   3. the per-pathway overrides (src/lib/habs_pathway_standards.generated.ts,
 *      the app's literal override rows) against PATHWAY_STANDARD_OVERRIDES, in
 *      both directions for every shared key, with each pathway's derived 500 m
 *      row checked the same way.
 *
 * The vestigial four-tier `excellent` is not compared (the app has no such
 * tier on a six-tier ladder). Rows only this site has — TPF Benchmark's own
 * gap-fillers (front squat, snatch, clean & jerk, the gymnastics and skill
 * rows, Grace, Diane, Fight Gone Bad) — and keys only the app has are listed,
 * not reported as differences. Exit 0 = no differences.
 *
 * Like check-operator-vs-app.mjs it needs the app checked out with its
 * node_modules installed, and it is not part of `npm test` (CI has no app
 * checkout); run it after any Lift change in either repository.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP = resolve(process.argv[2] ?? process.env.TPF_APP_PATH ?? resolve(REPO, '../tpf-app'));

const TIERS6 = ['pass', 'novice', 'good', 'intermediate', 'advanced', 'elite'];

/** site WOD id → the app's Benchmarks test id and its [men's, women's] event ids. */
export const WOD_TO_APP = {
  fran: ['thruster_pullup_sprint', 'time', 'time_women'],
  helen: ['run_kb_pullup_triplet', 'time', 'time_women'],
  cindy: ['bw_amrap_20', 'rounds', 'rounds_women'],
  hyrox_race: ['hyrox_open', 'time_open', 'time_open_w'],
};

/** the app's HABS StdKey → the site's benchmark id. */
export const STD_TO_SITE = {
  back_squat: 'back_squat_1rm', deadlift: 'deadlift_1rm', bench_press: 'bench_1rm',
  strict_press: 'strict_press_1rm', power_clean: 'power_clean_1rm', barbell_row: 'barbell_row_1rm',
  run_1mi: 'run_1mi', run_5k: 'run_5k', row_2k: 'row_2k', swim_400m: 'swim_400m',
  swim_1500m: 'swim_1500m', bike_20k: 'bike_20k', bike_40k: 'bike_40k',
};
const SITE_TO_STD = Object.fromEntries(Object.entries(STD_TO_SITE).map(([a, s]) => [s, a]));
const SEX = { M: 'male', F: 'female' };

function loadApp(app) {
  const tsx = join(app, 'node_modules/.bin/tsx');
  const lib = join(app, 'src/lib');
  if (!existsSync(join(lib, 'benchmark_tests.ts'))) throw new Error(`no ${lib}/benchmark_tests.ts — pass the tpf-app path`);
  if (!existsSync(tsx)) throw new Error(`no ${tsx} — run npm ci in the app`);
  const dir = mkdtempSync(join(tmpdir(), 'tpf-lift-'));
  try {
    const entry = join(dir, 'dump.ts');
    const at = (f) => JSON.stringify(join(lib, f));
    writeFileSync(entry, `
import { BENCHMARK_TESTS } from ${at('benchmark_tests.ts')};
import { STANDARDS_MALE, STANDARDS_FEMALE, riegelStd } from ${at('habs.ts')};
import { RIEGEL_ROW_500_FROM_2K } from ${at('benchmark_derived_tiers.ts')};
import { GENERATED_HABS_PATHWAY_STANDARD_ROWS } from ${at('habs_pathway_standards.generated.ts')};
const wods = Object.fromEntries(${JSON.stringify(Object.values(WOD_TO_APP).map((v) => v[0]))}.map((id) => {
  const t = BENCHMARK_TESTS.find((x) => x.id === id);
  return [id, t ? Object.fromEntries(t.events.map((e) => [e.id, e.hybridTiers ?? null])) : null];
}));
const row500 = (std) => riegelStd(std, RIEGEL_ROW_500_FROM_2K, 1);
const pathways = GENERATED_HABS_PATHWAY_STANDARD_ROWS.map((r) => ({
  ...r, row500: r.stdKey === 'row_2k' ? row500(r) : null,
}));
process.stdout.write(JSON.stringify({
  wods,
  base: { male: STANDARDS_MALE, female: STANDARDS_FEMALE },
  base500: { male: row500(STANDARDS_MALE.row_2k), female: row500(STANDARDS_FEMALE.row_2k) },
  pathways,
}));
`);
    // cwd = the app, so its tsconfig (path aliases) applies.
    const r = spawnSync(tsx, [entry], { cwd: app, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.status !== 0) throw new Error(`tsx failed (${r.status}):\n${r.stderr}`);
    return JSON.parse(r.stdout);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const tiersOf = (t) => (t ? TIERS6.map((k) => t[k] ?? null) : null);
const fromHybrid = (list) => (list ? TIERS6.map((k) => list.find((x) => x.tier === k)?.value ?? null) : null);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const show = (t) => (t ? t.join(' / ') : '—');

/** Every difference between the app's data (the loader's shape) and the
 *  site's lift.data.json, plus the rows only one side has (information). */
export function compare(app, site) {
  const diffs = [];
  const onlySite = [];
  const onlyApp = [];

  // 1. WOD ladders.
  for (const [wod, [testId, menEv, womenEv]] of Object.entries(WOD_TO_APP)) {
    const events = app.wods[testId];
    const sw = site.wodStandards[wod];
    if (!events) { diffs.push(`WOD ${wod}: the app has no Benchmarks test "${testId}"`); continue; }
    if (!sw) { diffs.push(`WOD ${wod}: the site has no WOD "${wod}"`); continue; }
    for (const [sex, ev] of [['M', menEv], ['F', womenEv]]) {
      const a = fromHybrid(events[ev]);
      const s = tiersOf(sw.thresholds[sex]);
      if (!a) diffs.push(`WOD ${wod}/${sex}: the app's ${testId}.${ev} has no six-tier ladder`);
      else if (!same(a, s)) diffs.push(`WOD ${wod}/${sex}: app ${show(a)} · site ${show(s)}`);
    }
  }
  for (const id of Object.keys(site.wodStandards)) if (!WOD_TO_APP[id]) onlySite.push(`WOD ${id}`);

  // 2. The HABS base table.
  for (const [std, id] of Object.entries(STD_TO_SITE)) {
    for (const sex of ['M', 'F']) {
      const a = tiersOf(app.base[SEX[sex]][std]);
      const s = tiersOf(site.standards[id]?.[sex]);
      if (!a) diffs.push(`base ${id}/${sex}: the app has no ${std}`);
      else if (!same(a, s)) diffs.push(`base ${id}/${sex}: app ${show(a)} · site ${show(s)}`);
    }
  }
  for (const sex of ['M', 'F']) {
    const a = tiersOf(app.base500[SEX[sex]]);
    const s = tiersOf(site.standards.row_500m?.[sex]);
    if (!same(a, s)) diffs.push(`base row_500m/${sex} (derived from row_2k): app ${show(a)} · site ${show(s)}`);
  }
  for (const k of Object.keys(app.base.male)) if (!STD_TO_SITE[k]) onlyApp.push(`base ${k}`);
  for (const id of Object.keys(site.standards)) if (!SITE_TO_STD[id] && id !== 'row_500m') onlySite.push(`base ${id}`);

  // 3. Pathway overrides — the app's literal rows, then the site's rows for the
  //    shared keys (a site override the app does not have is a difference).
  const appRow = new Map();
  for (const r of app.pathways) {
    const id = STD_TO_SITE[r.stdKey];
    const sex = r.sex === 'male' ? 'M' : 'F';
    if (!id) { onlyApp.push(`${r.pathway} ${r.stdKey}/${sex}`); continue; }
    appRow.set(`${r.pathway}/${id}/${sex}`, r);
    const s = tiersOf(site.pathwayStandards[r.pathway]?.[id]?.[sex]);
    if (!same(tiersOf(r), s)) diffs.push(`${r.pathway} ${id}/${sex}: app ${show(tiersOf(r))} · site ${show(s)}`);
  }
  for (const [pathway, rows] of Object.entries(site.pathwayStandards)) {
    for (const [id, bySex] of Object.entries(rows)) {
      for (const sex of ['M', 'F']) {
        const s = tiersOf(bySex[sex]);
        if (!s || s.every((v) => v == null)) continue;
        if (id === 'row_500m') {
          const own = appRow.get(`${pathway}/row_2k/${sex}`);
          const a = own ? tiersOf(own.row500) : null;
          if (!a) diffs.push(`${pathway} row_500m/${sex}: the site has a derived override but the app's ${pathway} has no own 2 km row`);
          else if (!same(a, s)) diffs.push(`${pathway} row_500m/${sex} (derived from its row_2k): app ${show(a)} · site ${show(s)}`);
        } else if (!SITE_TO_STD[id]) {
          onlySite.push(`${pathway} ${id}/${sex}`);
        } else if (!appRow.has(`${pathway}/${id}/${sex}`)) {
          diffs.push(`${pathway} ${id}/${sex}: the site overrides it (${show(s)}); the app does not`);
        }
      }
    }
  }
  // An app pathway with its own 2 km row derives its own 500 m; the site must
  // hold that override too, or it scores that pathway's 500 m on the base.
  for (const [k, r] of appRow) {
    const [pathway, id, sex] = k.split('/');
    if (id === 'row_2k' && !tiersOf(site.pathwayStandards[pathway]?.row_500m?.[sex])) {
      diffs.push(`${pathway} row_500m/${sex}: the app derives it from its own 2 km (${show(tiersOf(r.row500))}); the site has no override`);
    }
  }
  return { diffs, onlySite, onlyApp };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const site = JSON.parse(readFileSync(resolve(REPO, 'src/config/generated/lift.data.json'), 'utf8'));
  const app = loadApp(APP);
  const { diffs, onlySite, onlyApp } = compare(app, site);
  console.log(`[check:app-lift] app ${APP}`);
  console.log(`[check:app-lift] not compared (site only): ${onlySite.join(', ') || '—'}`);
  console.log(`[check:app-lift] not compared (app only): ${onlyApp.join(', ') || '—'}`);
  for (const d of diffs) console.log(`  - ${d}`);
  const pathwayRows = app.pathways.filter((r) => STD_TO_SITE[r.stdKey]).length;
  console.log(`[check:app-lift] ${Object.keys(WOD_TO_APP).length} WODs × 2 sexes, ${Object.keys(STD_TO_SITE).length + 1} base keys × 2 sexes, ${pathwayRows} app pathway rows: ${diffs.length} difference(s)`);
  process.exit(diffs.length ? 1 : 0);
}
