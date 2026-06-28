/**
 * Build a clean, curated Operator (ORS) standards workbook from the raw matrix.
 *
 * Source: config/standards/TPF_ORS_Standards_2026-05-21.xlsx (copied from Dropbox)
 * Output: config/standards/TPF_Operator_Standards.xlsx (the editable master)
 *
 * Per the user's instructions:
 *   - Curate to specific units, split into US / UK (drop the generic "general
 *     army" US Army + UK Army, plus Tactical/Police PT/SWAT-Tactical-Team).
 *   - Keep Navy SEAL. US SWAT stays (borrows the SWAT/Tactical-Team strength
 *     matrix as its pattern source).
 *   - Merge absolute-kg strength in from the "Strength by pathway" sheet.
 *   - Disambiguate times (runs/swims/planks = mm:ss; rucks = h:mm[:ss]; fix
 *     Excel-coerced serials).
 *   - Fill blank tiers using documented patterns; flag every inferred cell.
 *
 * Re-runnable. Edit the OUTPUT workbook by hand afterwards if you like — it is
 * the source of truth going forward.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(REPO, 'config/standards/TPF_ORS_Standards_2026-05-21.xlsx');
const OUT = resolve(REPO, 'config/standards/TPF_Operator_Standards.xlsx');

// --- curation: kept unit → region. Order = display order. -------------------
const REGION = {
  // US
  'US Marine Corps (PFT/CFT)': 'US',
  'US Army Airborne': 'US',
  'US Army Ranger RASP (Entry)': 'US',
  'US Army Special Forces (SFAS)': 'US',
  'Navy SEAL (BUD/S)': 'US',
  'USAF Pararescue (PJ)': 'US',
  'US Infantry': 'US',
  'US Police PFT': 'US',
  'US SWAT': 'US',
  // UK
  'UK Parachute Regiment (P Coy)': 'UK',
  'UK Royal Marines (Cdo Course)': 'UK',
  'UK Special Forces (SAS/SBS)': 'UK',
  'UK Infantry': 'UK',
  'UK Police JRFT': 'UK',
  'UK ARU / SCO19': 'UK',
};
// Removed: US Army, UK Army (general army); Tactical (generic), Police PT,
// SWAT / Tactical Team (generic — but its strength feeds US SWAT below).
const STRENGTH_PATTERN_SOURCE = { 'US SWAT': 'SWAT / Tactical Team' };

// Benchmark label fixes (the PST swim is 500 yards, not metres).
const BENCHMARK_RENAME = { '500 m swim': '500 yd swim' };

// Expert component weights for the police / armed-response units (absent from
// the source Weights sheet — otherwise codegen even-splits them). Each sums 100,
// over only the components the unit actually tests.
const POLICE_WEIGHTS = {
  'US Police PFT': { running: 35, upper_endurance: 30, core_endurance: 20, power: 15 },
  'US SWAT': { running: 20, upper_endurance: 20, lower_strength: 15, upper_strength: 10, power: 15, core_endurance: 10, grip: 10 },
  'UK Police JRFT': { running: 50, upper_strength: 50 },
  'UK ARU / SCO19': { running: 40, upper_endurance: 35, power: 25 },
  'US Army Ranger RASP (Entry)': { rucking: 25, running: 20, upper_endurance: 25, core_endurance: 15, swimming: 15 },
};

const STRENGTH = [
  ['Back Squat', 'lower_strength', 'kg'],
  ['Hex-bar DL', 'lower_strength', 'kg'],
  ['Conventional DL', 'lower_strength', 'kg'],
  ['Bench Press', 'upper_strength', 'kg'],
  ['Overhead Press', 'upper_strength', 'kg'],
  ['Power Clean', 'power', 'kg'],
  ['Broad Jump', 'power', 'm'],
  ['Dead hang (grip)', 'grip', 'sec'],
];
const STRENGTH_NAMES = new Set(STRENGTH.map((s) => s[0]));
const TIERS = ['pass', 'good', 'excellent', 'elite'];

// --- time parsing (component-aware) -----------------------------------------
function isTimey(unit) {
  const u = String(unit || '').toLowerCase();
  return u.includes('sec') || u.includes('min') || u.includes(':');
}
function parseTimeSec(raw, component) {
  if (raw == null || raw === '' || raw === '—') return null;
  if (typeof raw === 'number') {
    let sec = Math.round(raw * 86400); // Excel day-fraction → seconds
    if (component === 'running' && sec > 1800) sec = Math.round(sec / 60); // mis-coerced hours
    return sec;
  }
  const parts = String(raw).split(':').map(Number);
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) {
    return component === 'rucking' ? parts[0] * 3600 + parts[1] * 60 : parts[0] * 60 + parts[1];
  }
  return Number(raw);
}
function parseVal(raw, unit, component) {
  if (raw == null || raw === '' || raw === '—') return null;
  if (isTimey(unit)) return parseTimeSec(raw, component);
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
function clock(sec, component) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (component === 'rucking' || h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}
const fmt = (sec, unit, component) => (sec == null ? '' : isTimey(unit) ? clock(sec, component) : sec);

// --- read raw workbook ------------------------------------------------------
const wb = XLSX.read(readFileSync(SRC), { type: 'buffer' });
const stdRows = XLSX.utils.sheet_to_json(wb.Sheets['Standards'], { header: 1, defval: null, blankrows: false });
const strRows = XLSX.utils.sheet_to_json(wb.Sheets['Strength by pathway'], { header: 1, defval: null, blankrows: false });
const wtRows = XLSX.utils.sheet_to_json(wb.Sheets['Weights'], { header: 1, defval: null, blankrows: false });

// Strength-by-pathway: header "Benchmark (Tier)" → {pathway: {bench: {tier:val}}}
const strHeader = strRows[0];
const strColMap = strHeader.map((h) => {
  const m = h && String(h).match(/^(.*) \((Pass|Good|Excellent|Elite)\)$/);
  return m ? { bench: m[1], tier: m[2].toLowerCase() } : null;
});
const strengthByPathway = {};
for (let i = 1; i < strRows.length; i++) {
  const r = strRows[i];
  const pathway = r[0];
  if (!pathway) continue;
  const obj = {};
  r.forEach((cell, ci) => {
    const map = strColMap[ci];
    if (!map || cell == null || cell === '' || cell === '—') return;
    const comp = STRENGTH.find((s) => s[0] === map.bench);
    obj[map.bench] = obj[map.bench] || {};
    obj[map.bench][map.tier] = parseVal(cell, comp ? comp[2] : 'kg', comp ? comp[1] : 'lower_strength');
  });
  strengthByPathway[pathway] = obj;
}

// --- fill helpers (documented heuristics) -----------------------------------
const roundStep = (unit) => {
  const u = String(unit || '').toLowerCase();
  if (u === 'kg') return 2.5;
  if (u === 'm' || u === 'multiplier') return 0.05;
  if (u === 'level') return 0.1;
  return 1; // reps, sec, inches, …
};
const round = (n, step) => Math.round(n / step) * step;

/**
 * Fill a 4-tier set from whatever is present, staying monotonic in the tier's
 * direction. Uses the linear step between known tiers (or ±a fraction of the
 * single known value), anchored to the nearest known neighbour. Unit-aware
 * rounding. Returns {tiers, inferred:Set}.
 */
function fillTiers(raw, higherIsBetter, unit) {
  const out = { ...raw };
  const inferred = new Set();
  if (String(unit || '').toLowerCase().includes('pass')) return { tiers: out, inferred }; // binary pass/fail — don't fill
  const known = TIERS.map((k, i) => (out[k] != null ? i : -1)).filter((i) => i >= 0);
  if (known.length === 0) return { tiers: out, inferred };
  const step = roundStep(unit);
  let inc;
  if (known.length >= 2) {
    const a = known[0];
    const b = known[known.length - 1];
    inc = (out[TIERS[b]] - out[TIERS[a]]) / (b - a); // signed per-tier step from data
  } else {
    const base = Math.abs(out[TIERS[known[0]]]);
    inc = (higherIsBetter ? 0.25 : -0.07) * base; // +25%/tier, or ~7% faster/tier
  }
  for (let i = 0; i < TIERS.length; i++) {
    if (out[TIERS[i]] != null) continue;
    const ref = known.reduce((best, j) => (Math.abs(j - i) < Math.abs(best - i) ? j : best), known[0]);
    out[TIERS[i]] = round(out[TIERS[ref]] + (i - ref) * inc, step);
    inferred.add(TIERS[i]);
  }
  return { tiers: out, inferred };
}

/** Derive a full strength matrix for a pathway, filling lift gaps from patterns. */
function strengthMatrix(pathway) {
  const src = strengthByPathway[STRENGTH_PATTERN_SOURCE[pathway] ?? pathway] || {};
  const m = {};
  const inferred = {};
  const squat = src['Back Squat'] || {};
  const sq = fillTiers(squat, true, 'kg').tiers;
  const haveSquat = Object.keys(squat).length > 0;
  for (const [bench, , unit] of STRENGTH) {
    const raw = src[bench] || {};
    if (Object.keys(raw).length === 0 && !haveSquat) { m[bench] = null; continue; } // unit doesn't lift-test
    let tiers, inf;
    if (bench === 'Hex-bar DL' && Object.keys(raw).length === 0) {
      tiers = Object.fromEntries(TIERS.map((k) => [k, round(sq[k] * 1.2, 2.5)])); inf = new Set(TIERS); // hex ≈ squat ×1.2
    } else if (bench === 'Conventional DL' && Object.keys(raw).length === 0) {
      const hex = m['Hex-bar DL']?.tiers ?? Object.fromEntries(TIERS.map((k) => [k, round(sq[k] * 1.2, 2.5)]));
      tiers = Object.fromEntries(TIERS.map((k) => [k, round(hex[k] * 0.91, 2.5)])); inf = new Set(TIERS); // conv = hex /1.1
    } else if (bench === 'Overhead Press' && Object.keys(raw).length === 0) {
      const benchT = fillTiers(src['Bench Press'] || {}, true, 'kg').tiers;
      tiers = Object.fromEntries(TIERS.map((k) => [k, round(benchT[k] * 0.62, 2.5)])); inf = new Set(TIERS); // OHP ≈ bench ×0.62
    } else {
      const f = fillTiers(raw, true, unit);
      tiers = f.tiers; inf = f.inferred;
    }
    m[bench] = { tiers, inferred: inf };
    inferred[bench] = inf;
  }
  return m;
}

// --- assemble curated rows --------------------------------------------------
const stdHeader = stdRows[0]; // Pathway|Component|Benchmark|Unit|Direction|Pass|Good|Excellent|Elite|Notes|App status
const out = [];
const seen = new Set();
for (let i = 1; i < stdRows.length; i++) {
  const r = stdRows[i];
  const [pathway, component, benchmarkRaw, unit, direction, p, g, e, el] = r;
  if (!pathway || !REGION[pathway] || STRENGTH_NAMES.has(benchmarkRaw)) continue; // strength handled separately
  if (benchmarkRaw === 'Bench press (× bodyweight)') continue; // US SWAT: covered by the borrowed kg bench
  const benchmark = BENCHMARK_RENAME[benchmarkRaw] ?? benchmarkRaw;
  const hib = !/lower/.test(String(direction));
  const raw = { pass: parseVal(p, unit, component), good: parseVal(g, unit, component), excellent: parseVal(e, unit, component), elite: parseVal(el, unit, component) };
  const { tiers, inferred } = fillTiers(raw, hib, unit);
  out.push({ region: REGION[pathway], pathway, component, benchmark, unit, direction, tiers, inferred, src: 'ORS' });
  seen.add(`${pathway}|${component}|${benchmark}`);
}
// strength rows (merged + filled)
for (const pathway of Object.keys(REGION)) {
  const m = strengthMatrix(pathway);
  for (const [bench, component, unit] of STRENGTH) {
    const cell = m[bench];
    if (!cell) continue; // not lift-tested
    out.push({ region: REGION[pathway], pathway, component, benchmark: bench, unit, direction: 'higher-is-better', tiers: cell.tiers, inferred: cell.inferred, src: 'strength' });
  }
}
// order: region, then pathway order, then a stable component order
const pOrder = Object.keys(REGION);
const cOrder = ['running', 'rucking', 'swimming', 'lower_strength', 'upper_strength', 'power', 'upper_endurance', 'core_endurance', 'stability', 'grip'];
out.sort((a, b) =>
  (a.region === b.region ? 0 : a.region === 'US' ? -1 : 1) ||
  pOrder.indexOf(a.pathway) - pOrder.indexOf(b.pathway) ||
  cOrder.indexOf(a.component) - cOrder.indexOf(b.component) ||
  a.benchmark.localeCompare(b.benchmark));

// --- write workbook ---------------------------------------------------------
const stdAoa = [
  ['TPF Operator (ORS) Standards — curated US/UK · unisex · absolute kg · v1'],
  ['region', 'pathway', 'component', 'benchmark', 'unit', 'direction', 'pass', 'good', 'excellent', 'elite', 'inferred', 'source'],
];
for (const row of out) {
  const inf = TIERS.filter((k) => row.inferred.has?.(k)).join('+');
  stdAoa.push([
    row.region, row.pathway, row.component, row.benchmark, row.unit, row.direction,
    fmt(row.tiers.pass, row.unit, row.component), fmt(row.tiers.good, row.unit, row.component),
    fmt(row.tiers.excellent, row.unit, row.component), fmt(row.tiers.elite, row.unit, row.component),
    inf || '', row.src,
  ]);
}

// weights (curated rows only, with region + SUM)
const wtHeader = wtRows.find((r) => r[0] === 'Pathway');
const compCols = wtHeader.slice(1).filter((c) => c && c !== 'SUM');
const wtAoa = [['region', 'pathway', ...compCols, 'SUM']];
for (const r of wtRows) {
  if (!REGION[r[0]]) continue;
  const vals = compCols.map((_, i) => r[i + 1] ?? 0);
  wtAoa.push([REGION[r[0]], r[0], ...vals, vals.reduce((a, b) => a + (Number(b) || 0), 0)]);
}
// police / armed-response units (not in the source Weights sheet)
for (const [pathway, w] of Object.entries(POLICE_WEIGHTS)) {
  if (!REGION[pathway]) continue;
  const vals = compCols.map((c) => w[c] ?? 0);
  wtAoa.push([REGION[pathway], pathway, ...vals, vals.reduce((a, b) => a + b, 0)]);
}

const readme = [
  ['TPF Operator Standards — curated from TPF_ORS_Standards_2026-05-21.xlsx'],
  [''],
  ['Model: UNISEX (one standard regardless of sex), ABSOLUTE kg strength (not ×BW), per-unit benchmarks.'],
  ['Units: curated to specific roles, split US / UK. Removed: US Army, UK Army (general army),'],
  ['  Tactical (generic), Police PT, SWAT / Tactical Team (generic). Navy SEAL kept. US SWAT kept'],
  ['  (its strength matrix is borrowed from the SWAT/Tactical-Team pattern).'],
  [''],
  ['Times: runs / swims / planks = mm:ss; rucks = h:mm:ss. Source Excel time quirks (mm:ss vs h:mm vs'],
  ['  auto-coerced serials) were disambiguated by component.'],
  [''],
  ['"inferred" column: which tiers were FILLED from patterns (not in the source) — REVIEW THESE.'],
  ['Fill heuristics: squat tiers ×1.25/1.5/1.75 off pass; Hex DL ≈ squat ×1.2; Conventional DL ≈ Hex /1.1'],
  ['  (Cholewa 2019); Overhead Press ≈ bench ×0.62; sparse run/rep tiers interpolated/extrapolated.'],
  [''],
  ['Edit any value here. This workbook is the editable master for operator standards.'],
];

const nwb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(nwb, XLSX.utils.aoa_to_sheet(readme), 'README');
XLSX.utils.book_append_sheet(nwb, XLSX.utils.aoa_to_sheet(stdAoa), 'Standards');
XLSX.utils.book_append_sheet(nwb, XLSX.utils.aoa_to_sheet(wtAoa), 'Weights');
XLSX.writeFile(nwb, OUT);

const usCount = new Set(out.filter((r) => r.region === 'US').map((r) => r.pathway)).size;
const ukCount = new Set(out.filter((r) => r.region === 'UK').map((r) => r.pathway)).size;
const infCount = out.filter((r) => [...TIERS].some((k) => r.inferred.has?.(k))).length;
console.log(`[operator] ${out.length} benchmark rows · ${usCount} US + ${ukCount} UK pathways · ${infCount} rows with ≥1 inferred tier`);
console.log(`[operator] wrote ${OUT}`);
