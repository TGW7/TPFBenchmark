/**
 * Cross-repo lockstep check — TPF Benchmark's Operator data vs the TPF app's
 * live ORS config (2026-10-02).
 *
 *   node scripts/check-operator-vs-app.mjs [path/to/tpf-app]
 *   npm run check:app-ors -- [path/to/tpf-app]
 *
 * The app path defaults to $TPF_APP_PATH, else ../tpf-app beside this repo.
 *
 * Why this exists: src/test/operator-lockstep.test.ts diffs the generated data
 * against a frozen snapshot of ITSELF, so it catches an accidental change here
 * but cannot see the app move. Until now "in lockstep with the app" was
 * checked by reading tpf-app's operational_readiness.ts by eye. This reads the
 * app's real `ORS_PATHWAY_CONFIGS` — by running the app's own `tsx` against
 * the app's source, read-only — and diffs every mirrored unit's weights,
 * benchmarks, tiers, direction and alternative groups against
 * src/config/generated/operator.data.json. Exit 0 = no differences.
 *
 * It needs the app checked out with its node_modules installed. It is not
 * part of `npm test` (CI has no app checkout); run it after any ORS change in
 * either repository.
 *
 * Scoring note: matching numbers do not make the two SCORES identical — the
 * site re-normalises over the components you test with no penalty and caps
 * every benchmark at 100; the app takes 5 % off per unscored category and lets
 * a benchmark read up to 110 before capping the component. See
 * docs/STANDARDS.md "Operator (ORS) standards".
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP = resolve(process.argv[2] ?? process.env.TPF_APP_PATH ?? resolve(REPO, '../tpf-app'));

/** app pathway → site unit. The app's other pathways (us_army, uk_army,
 *  tactical, firefighter, air_force) are not mirrored: the site's curated set
 *  drops the generic units (docs/APP-ALIGNMENT-AUDIT-2026-07.md §2). The site's
 *  own us_army_ranger_rasp_entry, uk_police_jrft and uk_aru_sco19 have no app
 *  pathway. */
export const APP_TO_SITE = {
  usmc: 'us_marine_corps_pft_cft',
  navy: 'us_navy_prt',
  us_airborne: 'us_army_airborne',
  green_berets: 'us_army_special_forces_sfas',
  seal: 'navy_seal_bud_s',
  pararescue: 'usaf_pararescue_pj',
  us_infantry: 'us_infantry',
  police: 'us_police_pft',
  swat: 'us_swat',
  para_reg: 'uk_parachute_regiment_p_coy',
  royal_marines: 'uk_royal_marines_cdo_course',
  uksf: 'uk_special_forces_sas_sbs',
  uk_infantry: 'uk_infantry',
};

/** `app pathway/app benchmark id` → site benchmark id, where the site's id is
 *  not simply the slug of the app's label. */
const ID_ALIAS = {
  'seal/swim_500m': '500_m_swim',
  'navy/row_2k': 'row_2k',
  'navy/swim_500yd': '500_yd_swim_alternate',
  'navy/swim_450m': '450_m_swim_alternate',
  'navy/plank': 'plank_front',
};

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

function loadAppConfigs(app) {
  const tsx = join(app, 'node_modules/.bin/tsx');
  const src = join(app, 'src/lib/operational_readiness.ts');
  if (!existsSync(src)) throw new Error(`no ${src} — pass the tpf-app path`);
  if (!existsSync(tsx)) throw new Error(`no ${tsx} — run npm ci in the app`);
  const dir = mkdtempSync(join(tmpdir(), 'tpf-ors-'));
  try {
    const entry = join(dir, 'dump.ts');
    writeFileSync(entry,
      `import { ORS_PATHWAY_CONFIGS } from ${JSON.stringify(src)};\n` +
      `process.stdout.write(JSON.stringify(ORS_PATHWAY_CONFIGS));\n`);
    // cwd = the app, so its tsconfig (path aliases) applies.
    const r = spawnSync(tsx, [entry], { cwd: app, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.status !== 0) throw new Error(`tsx failed (${r.status}):\n${r.stderr}`);
    return JSON.parse(r.stdout);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function compare(appConfigs, siteUnits) {
  const diffs = [];
  for (const [a, s] of Object.entries(APP_TO_SITE)) {
    const ac = appConfigs[a];
    const sp = siteUnits.find((p) => p.id === s);
    if (!ac) { diffs.push(`app has no pathway "${a}"`); continue; }
    if (!sp) { diffs.push(`site has no unit "${s}" (app "${a}")`); continue; }
    // Zero-weight components are never scored by either engine.
    const aw = Object.fromEntries(Object.entries(ac.weights).filter(([, v]) => v > 0));
    const sw = Object.fromEntries(Object.entries(sp.weights).filter(([, v]) => v > 0));
    const key = (o) => JSON.stringify(Object.entries(o).sort());
    if (key(aw) !== key(sw)) diffs.push(`${s} weights: app ${JSON.stringify(aw)} · site ${JSON.stringify(sw)}`);
    const matched = new Set();
    for (const [comp, list] of Object.entries(ac.benchmarks)) {
      if (!(aw[comp] > 0)) continue;
      for (const b of list) {
        const id = ID_ALIAS[`${a}/${b.id}`] ?? slug(b.label);
        const sb = sp.benchmarks.find((x) => x.id === id && x.component === comp);
        if (!sb) { diffs.push(`${s}: app ${comp}/${b.id} ("${b.label}") has no site benchmark "${id}"`); continue; }
        matched.add(`${comp}/${sb.id}`);
        const at = [b.pass, b.good, b.excellent, b.elite];
        const st = ['pass', 'good', 'excellent', 'elite'].map((k) => sb.thresholds[k]);
        if (JSON.stringify(at) !== JSON.stringify(st)) diffs.push(`${s} ${comp}/${id}: app ${at.join(' / ')} · site ${st.join(' / ')}`);
        if ((b.direction === 'lower-is-better') !== sb.lowerIsBetter) diffs.push(`${s} ${comp}/${id}: direction differs`);
        if ((b.alternativeGroup ?? null) !== (sb.alternativeGroup ?? null)) {
          diffs.push(`${s} ${comp}/${id}: alternative group app ${b.alternativeGroup ?? '—'} · site ${sb.alternativeGroup ?? '—'}`);
        }
      }
    }
    for (const sb of sp.benchmarks) {
      if (sw[sb.component] > 0 && !matched.has(`${sb.component}/${sb.id}`)) {
        diffs.push(`${s}: site benchmark ${sb.component}/${sb.id} has no app counterpart`);
      }
    }
  }
  return diffs;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const site = JSON.parse(readFileSync(resolve(REPO, 'src/config/generated/operator.data.json'), 'utf8'));
  const app = loadAppConfigs(APP);
  const diffs = compare(app, site);
  const units = Object.keys(APP_TO_SITE).length;
  const defs = Object.values(APP_TO_SITE).reduce((n, s) => n + (site.find((p) => p.id === s)?.benchmarks.length ?? 0), 0);
  console.log(`[check:app-ors] app ${APP}`);
  console.log(`[check:app-ors] not mirrored (app only): ${Object.keys(app).filter((k) => !APP_TO_SITE[k]).join(', ') || '—'}`);
  console.log(`[check:app-ors] not mirrored (site only): ${site.map((p) => p.id).filter((id) => !Object.values(APP_TO_SITE).includes(id)).join(', ') || '—'}`);
  for (const d of diffs) console.log(`  - ${d}`);
  console.log(`[check:app-ors] ${units} mirrored units, ${defs} site benchmark defs: ${diffs.length} difference(s)`);
  process.exit(diffs.length ? 1 : 0);
}
