/**
 * HRS config codegen.
 *
 * Reads the Excel master (the single source of truth for standards) and emits:
 *   - src/config/generated/standards.generated.ts   (typed data; blanks -> null)
 *   - src/config/README.md                          (provenance doc)
 *
 * Run via `npm run codegen` (also runs automatically on predev / prebuild).
 *
 * The workbook path is configurable via the HRS_STANDARDS_XLSX env var; it
 * defaults to the copy committed under config/standards/.
 *
 * NEVER hand-edit the generated files — edit the Excel master and re-run.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');

const DEFAULT_XLSX = resolve(
  REPO,
  'config/standards/TPF_HRS_Standards_v0_2026-06-21.xlsx',
);
const XLSX_PATH = process.env.HRS_STANDARDS_XLSX
  ? resolve(process.env.HRS_STANDARDS_XLSX)
  : DEFAULT_XLSX;

const GEN_TS = resolve(REPO, 'src/config/generated/standards.generated.ts');
const README = resolve(REPO, 'src/config/README.md');

// Structural constants (NOT standards) used only to filter rows.
const CORE_COMPONENTS = [
  'running',
  'erg_engine',
  'lower_strength',
  'upper_strength',
  'olympic',
  'power',
  'gymnastics',
  'core_endurance',
  // 2026-07-13 — triathlete discipline components (swim 25 / bike 25 /
  // run 25 / strength 25, owner spec). Zero-weighted on every other
  // lift/hybrid pathway.
  'swimming',
  'cycling',
];
const PATHWAYS = ['gym_goer', 'hybrid_athlete', 'crossfit_generalist', 'hyrox', 'powerlifter', 'bodybuilder', 'triathlete'];

// ---- helpers ---------------------------------------------------------------

function sheetRows(wb, name) {
  const ws = wb.Sheets[name];
  if (!ws) {
    console.warn(`[codegen] sheet "${name}" not found — skipping`);
    return [];
  }
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false });
}

function findHeaderRow(rows, key) {
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || [];
    if (r.some((c) => c != null && String(c).trim().toLowerCase() === key)) return i;
  }
  return -1;
}

function findCol(headerRow, predicate) {
  for (let i = 0; i < headerRow.length; i++) {
    const c = headerRow[i];
    if (c != null && predicate(String(c).trim().toLowerCase())) return i;
  }
  return -1;
}

const cell = (row, idx) => (idx >= 0 && row[idx] != null ? row[idx] : null);
const str = (v) => (v == null ? '' : String(v).trim());

function parseTimeToSeconds(raw) {
  const parts = String(raw).split(':').map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

function parseThreshold(raw, unit) {
  if (raw == null || (typeof raw === 'string' && raw.trim() === '')) return null;
  if (unit && unit.includes(':')) {
    if (typeof raw === 'number') {
      // Excel often stores mm:ss / h:mm:ss as a day-fraction (< 1). Real second
      // counts are >= 10, so treat small numbers as serials and scale to seconds.
      return raw < 10 ? Math.round(raw * 86400) : raw;
    }
    return parseTimeToSeconds(raw); // handles mm:ss and h:mm:ss
  }
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

function normaliseComponent(component) {
  const stripped = component.replace(/\s*\(optional\)\s*/i, '').trim();
  return { component: stripped, optional: /optional/i.test(component) };
}

// 2026-07-13 (round 8) — six tiers, not four: Beginner(pass) / Novice /
// Experienced(good) / Intermediate / Advanced / Elite (owner). `excellent`
// stays for legacy/backward-compat (still USED on the four-tier path,
// vestigial on the six-tier path). Optional: a row without "novice (60%)"
// / "intermediate (80%)" / "advanced (90%)" column values yields nulls,
// which the engine treats as legacy four-tier data (tier-curve.ts DUAL
// MODE) — so existing WOD/operator rows keep scoring exactly as before.
const thresholdSet = (pass, novice, good, excellent, intermediate, advanced, elite) =>
  ({ pass, novice, good, excellent, intermediate, advanced, elite });
const NULL_TS = thresholdSet(null, null, null, null, null, null, null);

// ---- parsers ---------------------------------------------------------------

function parseSourcing(wb) {
  const rows = sheetRows(wb, 'Benchmarks_Sourcing');
  const h = findHeaderRow(rows, 'benchmark_id');
  if (h < 0) return [];
  const head = rows[h];
  const C = {
    id: findCol(head, (s) => s === 'benchmark_id'),
    component: findCol(head, (s) => s === 'component'),
    source: findCol(head, (s) => s === 'source'),
    unit: findCol(head, (s) => s === 'unit'),
    lib: findCol(head, (s) => s === 'lower_is_better'),
    norm: findCol(head, (s) => s === 'normalization'),
    dataSource: findCol(head, (s) => s === 'data_source'),
    license: findCol(head, (s) => s === 'license'),
    commercial: findCol(head, (s) => s === 'commercial_use'),
    refPop: findCol(head, (s) => s === 'reference_population'),
    launch: findCol(head, (s) => s === 'launch_method'),
    notes: findCol(head, (s) => s === 'notes'),
  };
  const out = [];
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const id = str(cell(r, C.id));
    if (!id) continue;
    const { component, optional } = normaliseComponent(str(cell(r, C.component)));
    out.push({
      id,
      component,
      source: str(cell(r, C.source)),
      unit: str(cell(r, C.unit)),
      lowerIsBetter: Number(cell(r, C.lib)) === 1,
      normalization: str(cell(r, C.norm)) || 'absolute',
      optional,
      dataSource: str(cell(r, C.dataSource)),
      license: str(cell(r, C.license)),
      commercialUse: str(cell(r, C.commercial)),
      referencePopulation: str(cell(r, C.refPop)),
      launchMethod: str(cell(r, C.launch)),
      notes: str(cell(r, C.notes)),
    });
  }
  return out;
}

function parseStandards(wb) {
  const rows = sheetRows(wb, 'Standards');
  const h = findHeaderRow(rows, 'benchmark_id');
  if (h < 0) return {};
  const head = rows[h];
  const C = {
    id: findCol(head, (s) => s === 'benchmark_id'),
    sex: findCol(head, (s) => s === 'sex'),
    unit: findCol(head, (s) => s === 'unit'),
    pass: findCol(head, (s) => s.startsWith('pass')),
    novice: findCol(head, (s) => s.startsWith('novice')),
    good: findCol(head, (s) => s.startsWith('good')),
    excellent: findCol(head, (s) => s.startsWith('excellent')),
    intermediate: findCol(head, (s) => s.startsWith('intermediate')),
    advanced: findCol(head, (s) => s.startsWith('advanced')),
    elite: findCol(head, (s) => s.startsWith('elite')),
  };
  const opt = (col, unit, r) => (col >= 0 ? parseThreshold(cell(r, col), unit) : null);
  const byId = {};
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const id = str(cell(r, C.id));
    const sex = str(cell(r, C.sex)).toUpperCase();
    if (!id || (sex !== 'M' && sex !== 'F')) continue;
    const unit = str(cell(r, C.unit));
    byId[id] = byId[id] || { M: NULL_TS, F: NULL_TS };
    byId[id][sex] = thresholdSet(
      parseThreshold(cell(r, C.pass), unit),
      opt(C.novice, unit, r),
      parseThreshold(cell(r, C.good), unit),
      parseThreshold(cell(r, C.excellent), unit),
      opt(C.intermediate, unit, r),
      opt(C.advanced, unit, r),
      parseThreshold(cell(r, C.elite), unit),
    );
  }
  return byId;
}

/**
 * 2026-07-12 — per-PATHWAY tier overrides (Standards_Pathway sheet).
 * Rows: benchmark_id | pathway | sex | unit | pass..elite | source_ref | notes.
 * A row overrides the base Standards tier set for that benchmark+sex under
 * that pathway only; benchmarks/sexes without a row keep the base tiers.
 * Sheet absent → empty object (backward compatible).
 */
function parsePathwayStandards(wb) {
  const rows = sheetRows(wb, 'Standards_Pathway');
  const h = findHeaderRow(rows, 'benchmark_id');
  if (h < 0) return {};
  const head = rows[h];
  const C = {
    id: findCol(head, (s) => s === 'benchmark_id'),
    pathway: findCol(head, (s) => s === 'pathway'),
    sex: findCol(head, (s) => s === 'sex'),
    unit: findCol(head, (s) => s === 'unit'),
    pass: findCol(head, (s) => s.startsWith('pass')),
    novice: findCol(head, (s) => s.startsWith('novice')),
    good: findCol(head, (s) => s.startsWith('good')),
    excellent: findCol(head, (s) => s.startsWith('excellent')),
    intermediate: findCol(head, (s) => s.startsWith('intermediate')),
    advanced: findCol(head, (s) => s.startsWith('advanced')),
    elite: findCol(head, (s) => s.startsWith('elite')),
  };
  const opt = (col, unit, r) => (col >= 0 ? parseThreshold(cell(r, col), unit) : null);
  const byPathway = {};
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const id = str(cell(r, C.id));
    const pathway = str(cell(r, C.pathway));
    const sex = str(cell(r, C.sex)).toUpperCase();
    if (!id || (sex !== 'M' && sex !== 'F')) continue;
    if (!PATHWAYS.includes(pathway)) {
      if (pathway) console.warn(`[codegen] Standards_Pathway: unknown pathway "${pathway}" (row ${i + 1}) — skipped`);
      continue;
    }
    const unit = str(cell(r, C.unit));
    byPathway[pathway] = byPathway[pathway] || {};
    byPathway[pathway][id] = byPathway[pathway][id] || { M: NULL_TS, F: NULL_TS };
    byPathway[pathway][id][sex] = thresholdSet(
      parseThreshold(cell(r, C.pass), unit),
      opt(C.novice, unit, r),
      parseThreshold(cell(r, C.good), unit),
      parseThreshold(cell(r, C.excellent), unit),
      opt(C.intermediate, unit, r),
      opt(C.advanced, unit, r),
      parseThreshold(cell(r, C.elite), unit),
    );
  }
  return byPathway;
}

function parseWeights(wb) {
  const rows = sheetRows(wb, 'Weights');
  const h = findHeaderRow(rows, 'component');
  const result = Object.fromEntries(PATHWAYS.map((p) => [p, {}]));
  if (h < 0) return result;
  const head = rows[h];
  const compCol = findCol(head, (s) => s === 'component');
  const pathCols = Object.fromEntries(
    PATHWAYS.map((p) => [p, findCol(head, (s) => s === p)]),
  );
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const comp = str(cell(r, compCol));
    if (!CORE_COMPONENTS.includes(comp)) continue; // skips TOTAL / Note rows
    for (const p of PATHWAYS) {
      const raw = cell(r, pathCols[p]);
      const n = raw == null || raw === '' ? null : Number(raw);
      result[p][comp] = Number.isFinite(n) ? n : null;
    }
  }
  return result;
}

function parseWodStandards(wb) {
  const rows = sheetRows(wb, 'WOD_Standards');
  const h = findHeaderRow(rows, 'wod_id');
  if (h < 0) return {};
  const head = rows[h];
  const C = {
    id: findCol(head, (s) => s === 'wod_id'),
    sex: findCol(head, (s) => s === 'sex'),
    unit: findCol(head, (s) => s === 'unit'),
    lib: findCol(head, (s) => s === 'lower_is_better'),
    pass: findCol(head, (s) => s.startsWith('pass')),
    good: findCol(head, (s) => s.startsWith('good')),
    excellent: findCol(head, (s) => s.startsWith('excellent')),
    elite: findCol(head, (s) => s.startsWith('elite')),
    load: findCol(head, (s) => s === 'rx_load_kg'),
    move: findCol(head, (s) => s === 'load_movement'),
  };
  const byId = {};
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const id = str(cell(r, C.id));
    const sex = str(cell(r, C.sex)).toUpperCase();
    if (!id || (sex !== 'M' && sex !== 'F')) continue;
    const unit = str(cell(r, C.unit));
    byId[id] = byId[id] || {
      unit,
      lowerIsBetter: Number(cell(r, C.lib)) === 1,
      thresholds: { M: NULL_TS, F: NULL_TS },
      load: { movement: '', M: null, F: null },
    };
    // WODs stay four-tier — no "solid" column on this sheet.
    byId[id].thresholds[sex] = thresholdSet(
      parseThreshold(cell(r, C.pass), unit),
      null,
      parseThreshold(cell(r, C.good), unit),
      parseThreshold(cell(r, C.excellent), unit),
      null,
      null,
      parseThreshold(cell(r, C.elite), unit),
    );
    const move = str(cell(r, C.move));
    if (move) byId[id].load.movement = move;
    const loadVal = cell(r, C.load);
    byId[id].load[sex] = loadVal == null || loadVal === '' ? null : Number(loadVal);
  }
  return byId;
}

function parseQualityMix(wb, wodIds) {
  const rows = sheetRows(wb, 'Quality_Mix');
  const h = findHeaderRow(rows, 'wod_id');
  if (h < 0) return {};
  const head = rows[h];
  const idCol = findCol(head, (s) => s === 'wod_id');
  const compCols = Object.fromEntries(
    CORE_COMPONENTS.map((c) => [c, findCol(head, (s) => s === c)]),
  );
  const byId = {};
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const id = str(cell(r, idCol));
    if (!wodIds.includes(id)) continue; // skips the trailing note row
    const mix = {};
    for (const c of CORE_COMPONENTS) {
      const raw = cell(r, compCols[c]);
      const n = raw == null || raw === '' ? null : Number(raw);
      mix[c] = Number.isFinite(n) ? n : null;
    }
    byId[id] = mix;
  }
  return byId;
}

// ---- emit ------------------------------------------------------------------

const J = (v) => JSON.stringify(v, null, 2);

function renderTs(data, sourceName) {
  return `// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: config/standards/${sourceName}
// Regenerate with \`npm run codegen\`. Edit the Excel master, never this file.
//
// Empty threshold / weight / mix cells in the workbook are emitted as \`null\`.
// The engine skips null benchmarks/components and re-normalises.

import type {
  ComponentId,
  Normalization,
  PathwayId,
  Sex,
  Source,
  ThresholdSet,
  WodId,
} from '../../engine/types';

export interface SourcingRow {
  id: string;
  component: ComponentId;
  source: Source;
  unit: string;
  lowerIsBetter: boolean;
  normalization: Normalization;
  optional: boolean;
  dataSource: string;
  license: string;
  commercialUse: string;
  referencePopulation: string;
  launchMethod: string;
  notes: string;
}

export interface WodStandard {
  unit: string;
  lowerIsBetter: boolean;
  thresholds: Record<Sex, ThresholdSet>;
  load?: { movement: string; M: number | null; F: number | null };
}

/** Populated sourcing plan (drives benchmark ids, source, unit, direction). */
export const BENCHMARK_SOURCING: SourcingRow[] = ${J(data.sourcing)};

/** Per-benchmark tier thresholds by sex, from the Standards sheet. A benchmark
 *  not yet given real values shows \`null\` for every tier. */
export const STANDARDS_THRESHOLDS: Record<string, Record<Sex, ThresholdSet>> = ${J(data.standards)};

/** Per-PATHWAY tier overrides (Standards_Pathway sheet). A populated
 *  benchmark+sex entry replaces the base tiers under that pathway; anything
 *  absent falls back to STANDARDS_THRESHOLDS. */
export const PATHWAY_STANDARD_OVERRIDES: Partial<Record<PathwayId, Record<string, Record<Sex, ThresholdSet>>>> = ${J(data.pathwayStandards)};

/** Pathway component weights, from the Weights sheet — each pathway's
 *  populated weights must sum to 100 (enforced by \`validate()\` above). */
export const PATHWAY_WEIGHTS: Partial<Record<PathwayId, Partial<Record<ComponentId, number | null>>>> = ${J(data.weights)};

/** Benchmark-WOD tiers by sex, from the WOD_Standards sheet. */
export const WOD_STANDARDS: Record<WodId, WodStandard> = ${J(data.wodStandards)};

/** Capacity-Index quality-mix vectors, from the Quality_Mix sheet — each row sums to 1. */
export const QUALITY_MIX: Record<WodId, Partial<Record<ComponentId, number | null>>> = ${J(data.qualityMix)};
`;
}

function renderReadme(data, sourceName) {
  const benchCount = data.sourcing.length;
  const wodCount = Object.keys(data.wodStandards).length;
  // Computed fresh each run so this table can't go stale the way a hand-typed
  // "TODO (null)" claim did — it just describes whatever's true right now.
  const fillState = (total, filled) => (filled === total ? 'populated' : filled === 0 ? 'empty' : `${filled}/${total} populated`);
  const standardsFilled = Object.values(data.standards).filter((s) => [s.M, s.F].some((t) => t.pass != null)).length;
  const weightsFilled = Object.values(data.weights).filter((w) => Object.values(w).some((v) => v != null)).length;
  const wodFilled = Object.values(data.wodStandards).filter((w) => [w.thresholds.M, w.thresholds.F].some((t) => t.pass != null)).length;
  const mixFilled = Object.values(data.qualityMix).filter((m) => Object.values(m).some((v) => v != null)).length;
  return `# /config — generated from the Excel master

**Do not hand-edit the generated values.** They are produced by
\`scripts/codegen.mjs\` from the single source of truth:

\`\`\`
config/standards/${sourceName}
\`\`\`

To change any standard, edit that workbook and run:

\`\`\`bash
npm run codegen
\`\`\`

(\`codegen\` also runs automatically on \`predev\` and \`prebuild\`.) Override the
workbook location with the \`HRS_STANDARDS_XLSX\` env var.

## What is generated

\`generated/standards.generated.ts\` — typed, framework-agnostic data:

| Export | From sheet | State |
|--------|-----------|-------|
| \`BENCHMARK_SOURCING\` (${benchCount}) | Benchmarks_Sourcing | populated |
| \`STANDARDS_THRESHOLDS\` | Standards | ${fillState(benchCount, standardsFilled)} |
| \`PATHWAY_STANDARD_OVERRIDES\` | Standards_Pathway | per-pathway tier overrides |
| \`PATHWAY_WEIGHTS\` | Weights | ${fillState(Object.keys(data.weights).length, weightsFilled)}, each col → 100 |
| \`WOD_STANDARDS\` (${wodCount}) | WOD_Standards | ${fillState(wodCount, wodFilled)} |
| \`QUALITY_MIX\` | Quality_Mix | ${fillState(wodCount, mixFilled)}, rows → 1 |

## The hand-authored shape

\`benchmarks.ts\`, \`pathways.ts\`, \`wods.ts\` import the generated data and adapt it
into the engine-facing constants (\`HRS_BENCHMARKS\`, \`HRS_PATHWAY_CONFIGS\`,
\`HRS_WODS\`). They contain **structure only — no standards numbers**; every real
value flows in from the workbook via codegen. Any cell still empty stays
\`null\` and the engine skips it rather than erroring.
`;
}

// ---- run -------------------------------------------------------------------

/**
 * Fail loudly on data the sheets/comments claim is required but nothing was
 * actually enforcing: pathway weights summing to 100, and tier thresholds
 * increasing (or decreasing, for lower-is-better) monotonically. A typo in
 * the Excel master used to ship silently — collects every violation across
 * both checks so one run surfaces all of them, not just the first.
 */
function validate({ sourcing, standards, pathwayStandards, weights }) {
  const errors = [];
  const EPS = 0.01;

  for (const [pathwayId, w] of Object.entries(weights)) {
    const sum = Object.values(w).reduce((s, v) => s + (v ?? 0), 0);
    if (Math.abs(sum - 100) > EPS) {
      errors.push(`Weights: pathway "${pathwayId}" sums to ${sum}, must be 100`);
    }
  }

  const meta = Object.fromEntries(sourcing.map((s) => [s.id, s]));
  const TIER_KEYS = ['pass', 'novice', 'good', 'intermediate', 'advanced', 'elite'];
  function checkMonotonic(pathwayLabel, id, sex, t) {
    const m = meta[id];
    if (!m) return; // unknown id — parseStandards/parsePathwayStandards already warn
    const seq = TIER_KEYS.map((k) => t[k]).filter((v) => v != null);
    for (let i = 1; i < seq.length; i++) {
      const ok = m.lowerIsBetter ? seq[i] < seq[i - 1] : seq[i] > seq[i - 1];
      if (!ok) {
        errors.push(`Standards: ${pathwayLabel} "${id}" (${sex}) tiers not monotonic: [${seq.join(', ')}]`);
      }
    }
  }
  for (const [id, sexes] of Object.entries(standards)) {
    for (const sex of ['M', 'F']) if (sexes[sex]) checkMonotonic('base', id, sex, sexes[sex]);
  }
  for (const [pathwayId, benches] of Object.entries(pathwayStandards)) {
    for (const [id, sexes] of Object.entries(benches)) {
      for (const sex of ['M', 'F']) if (sexes[sex]) checkMonotonic(pathwayId, id, sex, sexes[sex]);
    }
  }

  if (errors.length) {
    console.error(`[codegen] ${errors.length} validation error(s) in the Excel master:`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}

async function main() {
  if (!existsSync(XLSX_PATH)) {
    console.error(`[codegen] workbook not found at: ${XLSX_PATH}`);
    process.exit(1);
  }
  const sourceName = XLSX_PATH.split('/').pop();
  const buf = await readFile(XLSX_PATH);
  const wb = XLSX.read(buf, { type: 'buffer' });

  const sourcing = parseSourcing(wb);
  const standards = parseStandards(wb);
  const pathwayStandards = parsePathwayStandards(wb);
  const weights = parseWeights(wb);
  const wodStandards = parseWodStandards(wb);
  const qualityMix = parseQualityMix(wb, Object.keys(wodStandards));

  const data = { sourcing, standards, pathwayStandards, weights, wodStandards, qualityMix };
  validate(data);

  await writeFile(GEN_TS, renderTs(data, sourceName), 'utf8');
  await writeFile(README, renderReadme(data, sourceName), 'utf8');
  await writeFile(resolve(REPO, 'src/config/generated/lift.data.json'), JSON.stringify(data, null, 2), 'utf8');

  const filled = Object.values(standards).filter((s) =>
    [s.M, s.F].some((t) => t.pass != null),
  ).length;
  console.log(
    `[codegen] ${sourcing.length} benchmarks, ${Object.keys(wodStandards).length} WODs, ` +
      `${filled}/${Object.keys(standards).length} benchmark thresholds populated.`,
  );
  console.log(`[codegen] wrote ${GEN_TS}`);
  console.log(`[codegen] wrote ${README}`);
}

main().catch((err) => {
  console.error('[codegen] failed:', err);
  process.exit(1);
});
