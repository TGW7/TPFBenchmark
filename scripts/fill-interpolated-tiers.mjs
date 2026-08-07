/**
 * Fill the missing six-tier cells in the Excel master by INTERPOLATION.
 *
 * 2026-08-07 (owner request): every benchmark/WOD row should carry the full
 * Beginner(pass) / Novice / Experienced(good) / Intermediate / Advanced /
 * Elite ladder — no more "—" holes in the Browse Standards table between the
 * Novice and Intermediate columns. Rows that predate the round-8 six-tier
 * conversion (row_500m, broad_jump, strict_pullups, hspu, t2b, du_unbroken,
 * max_mu, plank_hold + all WODs) only have pass/good/excellent/elite.
 *
 * No clear external data exists for those mid tiers, so they are derived by
 * linear interpolation on the anchor scale (pass 50 / good 70 / excellent 85 /
 * elite 100 → novice 60 / intermediate 80 / advanced 90):
 *
 *   novice       = pass      + (good      - pass)      * (60-50)/(70-50)
 *   intermediate = good      + (excellent - good)      * (80-70)/(85-70)
 *   advanced     = excellent + (elite     - excellent) * (90-85)/(100-85)
 *
 * The interpolated knots sit ON the legacy four-tier curve, so scoring is
 * unchanged (up to rounding); only the displayed ladder gains rungs. Filled
 * cells are marked in the row's notes column. Existing values are NEVER
 * touched — re-running is a no-op once everything is populated.
 *
 * Idempotent. Run:  node scripts/fill-interpolated-tiers.mjs && npm run codegen
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from '@e965/xlsx';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const XLSX_PATH = resolve(REPO, 'config/standards/TPF_HRS_Standards_v0_2026-06-21.xlsx');

const PROVENANCE = 'novice/intermediate/advanced interpolated from pass/good/excellent/elite (2026-08-07)';

// Anchor fractions between the neighbouring known knots (see header).
const F_NOVICE = (60 - 50) / (70 - 50);
const F_INTERMEDIATE = (80 - 70) / (85 - 70);
const F_ADVANCED = (90 - 85) / (100 - 85);

// ---- value parsing / formatting (mirrors scripts/codegen.mjs) --------------

const isTime = (unit) => String(unit ?? '').includes(':');

function parseTimeToSeconds(raw) {
  const parts = String(raw).split(':').map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

function parseVal(raw, unit) {
  if (raw == null || (typeof raw === 'string' && raw.trim() === '')) return null;
  if (isTime(unit)) {
    if (typeof raw === 'number') return raw < 10 ? Math.round(raw * 86400) : raw;
    return parseTimeToSeconds(raw);
  }
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

const clock = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.round(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
};

const emit = (v, unit) => (isTime(unit) ? clock(v) : v);

// ---- interpolation ---------------------------------------------------------

const lerp = (a, b, f) => a + (b - a) * f;
const strictlyBetween = (lo, x, hi) => (lo < x && x < hi) || (lo > x && x > hi);

/** Rounding step: kg 2.5; otherwise match the row's own granularity — 5 when
 *  every known value is a multiple of 5 (times in seconds), else 1. */
function rowStep(unit, known) {
  if (unit === 'kg') return 2.5;
  if (unit === 'xBW') return 0.05;
  return known.every((v) => v % 5 === 0) ? 5 : 1;
}

/** Round to `step`, falling back to step 1 and then the exact value so the
 *  result always stays STRICTLY between its chain neighbours (codegen's
 *  monotonicity validation would otherwise reject the workbook). */
function fit(exact, step, lo, hi) {
  for (const s of [step, 1]) {
    const r = Math.round(exact / s) * s;
    if (strictlyBetween(lo, r, hi)) return r;
  }
  return exact;
}

/** Derive the three mid tiers from pass/good/excellent/elite. */
function midTiers({ pass, good, excellent, elite }, unit) {
  const step = rowStep(unit, [pass, good, excellent, elite]);
  const novice = fit(lerp(pass, good, F_NOVICE), step, pass, good);
  const advanced = fit(lerp(excellent, elite, F_ADVANCED), step, excellent, elite);
  // Chain order skips excellent (vestigial on the six-tier path), so
  // intermediate's upper neighbour is the FINAL advanced value.
  const intermediate = fit(lerp(good, excellent, F_INTERMEDIATE), step, good, advanced);
  return { novice, intermediate, advanced };
}

// ---- sheet editing ---------------------------------------------------------

const norm = (c) => (c == null ? '' : String(c).trim().toLowerCase());
const findCol = (head, name) => head.findIndex((c) => norm(c).startsWith(name));

/** Fill null novice/intermediate/advanced cells in a sheet that already has
 *  all seven tier columns (Standards). Returns the number of rows filled. */
function fillStandardsSheet(wb, sheetName) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: null, blankrows: false });
  const head = rows[1];
  const C = Object.fromEntries(
    ['benchmark_id', 'unit', 'pass', 'novice', 'good', 'excellent', 'intermediate', 'advanced', 'elite', 'notes']
      .map((k) => [k, findCol(head, k)]),
  );
  let filled = 0;
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i] || [];
    if (!r[C.benchmark_id]) continue;
    if (r[C.novice] != null && r[C.intermediate] != null && r[C.advanced] != null) continue;
    const unit = r[C.unit];
    const base = {
      pass: parseVal(r[C.pass], unit),
      good: parseVal(r[C.good], unit),
      excellent: parseVal(r[C.excellent], unit),
      elite: parseVal(r[C.elite], unit),
    };
    if (Object.values(base).some((v) => v == null)) continue; // not scoreable yet — leave TODO
    const mid = midTiers(base, unit);
    if (r[C.novice] == null) r[C.novice] = emit(mid.novice, unit);
    if (r[C.intermediate] == null) r[C.intermediate] = emit(mid.intermediate, unit);
    if (r[C.advanced] == null) r[C.advanced] = emit(mid.advanced, unit);
    r[C.notes] = r[C.notes] ? `${r[C.notes]} | ${PROVENANCE}` : PROVENANCE;
    rows[i] = r;
    filled++;
    console.log(`  ${r[C.benchmark_id]} (${r[findCol(head, 'sex')]}): novice=${r[C.novice]} intermediate=${r[C.intermediate]} advanced=${r[C.advanced]}`);
  }
  if (filled) wb.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(rows);
  return filled;
}

/** WOD_Standards predates the six-tier ladder entirely — add the three
 *  columns (same layout as Standards: novice after pass, intermediate +
 *  advanced after excellent) and fill every row by interpolation. */
function fillWodSheet(wb) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets['WOD_Standards'], { header: 1, defval: null, blankrows: false });
  const head = rows[1];
  if (findCol(head, 'novice') !== -1) {
    console.log('  WOD_Standards already has six-tier columns — nothing to add.');
    return 0;
  }
  const passCol = findCol(head, 'pass');
  const excCol = findCol(head, 'excellent');
  // Insert right-to-left so earlier indices stay valid.
  for (const row of rows) {
    while (row.length < head.length) row.push(null);
    row.splice(excCol + 1, 0, null, null); // intermediate, advanced
    row.splice(passCol + 1, 0, null);      // novice
  }
  head[passCol + 1] = 'novice (60%)';
  head[excCol + 2] = 'intermediate (80%)';
  head[excCol + 3] = 'advanced (90%)';
  rows[0][0] = `${rows[0][0]} · novice/intermediate/advanced interpolated (2026-08-07)`;

  const C = Object.fromEntries(
    ['wod_id', 'unit', 'pass', 'novice', 'good', 'excellent', 'intermediate', 'advanced', 'elite']
      .map((k) => [k, findCol(head, k)]),
  );
  let filled = 0;
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r[C.wod_id]) continue;
    const unit = r[C.unit];
    const base = {
      pass: parseVal(r[C.pass], unit),
      good: parseVal(r[C.good], unit),
      excellent: parseVal(r[C.excellent], unit),
      elite: parseVal(r[C.elite], unit),
    };
    if (Object.values(base).some((v) => v == null)) continue;
    const mid = midTiers(base, unit);
    r[C.novice] = emit(mid.novice, unit);
    r[C.intermediate] = emit(mid.intermediate, unit);
    r[C.advanced] = emit(mid.advanced, unit);
    filled++;
    console.log(`  ${r[C.wod_id]} (${r[findCol(head, 'sex')]}): novice=${r[C.novice]} intermediate=${r[C.intermediate]} advanced=${r[C.advanced]}`);
  }
  wb.Sheets['WOD_Standards'] = XLSX.utils.aoa_to_sheet(rows);
  return filled;
}

// ---- run -------------------------------------------------------------------

const wb = XLSX.read(readFileSync(XLSX_PATH), { type: 'buffer' });
console.log('[fill] Standards:');
const s = fillStandardsSheet(wb, 'Standards');
console.log('[fill] WOD_Standards:');
const w = fillWodSheet(wb);
if (s + w === 0) {
  console.log('[fill] nothing to fill — workbook already complete.');
} else {
  // XLSX.writeFile can't always find `fs` under ESM — write the buffer ourselves.
  writeFileSync(XLSX_PATH, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  console.log(`[fill] filled ${s} Standards row(s) + ${w} WOD row(s); wrote ${XLSX_PATH}`);
  console.log('[fill] run `npm run codegen` to flow these into /config.');
}
