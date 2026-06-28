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
];
const PATHWAYS = ['gym_goer', 'hybrid_athlete', 'crossfit_generalist', 'hyrox', 'powerlifter', 'bodybuilder'];

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

const thresholdSet = (pass, good, excellent, elite) => ({ pass, good, excellent, elite });
const NULL_TS = thresholdSet(null, null, null, null);

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
    good: findCol(head, (s) => s.startsWith('good')),
    excellent: findCol(head, (s) => s.startsWith('excellent')),
    elite: findCol(head, (s) => s.startsWith('elite')),
  };
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
      parseThreshold(cell(r, C.good), unit),
      parseThreshold(cell(r, C.excellent), unit),
      parseThreshold(cell(r, C.elite), unit),
    );
  }
  return byId;
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
    byId[id].thresholds[sex] = thresholdSet(
      parseThreshold(cell(r, C.pass), unit),
      parseThreshold(cell(r, C.good), unit),
      parseThreshold(cell(r, C.excellent), unit),
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
// Empty threshold / weight / mix cells in the workbook are emitted as \`null\`
// (TODO). The engine skips null benchmarks/components and re-normalises.

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

/** Per-benchmark tier thresholds by sex. Values are TODO (null) until populated. */
export const STANDARDS_THRESHOLDS: Record<string, Record<Sex, ThresholdSet>> = ${J(data.standards)};

/** Pathway component weights. TODO (null) until populated; must each sum to 100. */
export const PATHWAY_WEIGHTS: Partial<Record<PathwayId, Partial<Record<ComponentId, number | null>>>> = ${J(data.weights)};

/** Benchmark-WOD tiers by sex. TODO (null) until populated. */
export const WOD_STANDARDS: Record<WodId, WodStandard> = ${J(data.wodStandards)};

/** Capacity-Index quality-mix vectors. TODO (null) until populated; rows sum 1. */
export const QUALITY_MIX: Record<WodId, Partial<Record<ComponentId, number | null>>> = ${J(data.qualityMix)};
`;
}

function renderReadme(data, sourceName) {
  const benchCount = data.sourcing.length;
  const wodCount = Object.keys(data.wodStandards).length;
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
| \`STANDARDS_THRESHOLDS\` | Standards | thresholds TODO (null) |
| \`PATHWAY_WEIGHTS\` | Weights | weights TODO (null), each col → 100 |
| \`WOD_STANDARDS\` (${wodCount}) | WOD_Standards | thresholds TODO (null) |
| \`QUALITY_MIX\` | Quality_Mix | vectors TODO (null), rows → 1 |

## The hand-authored shape

\`benchmarks.ts\`, \`pathways.ts\`, \`wods.ts\` import the generated data and adapt it
into the engine-facing constants (\`HRS_BENCHMARKS\`, \`HRS_PATHWAY_CONFIGS\`,
\`HRS_WODS\`). They contain **structure only — no standards numbers**; every real
value flows in from the workbook via codegen. Empty cells stay \`null\` and the
engine skips them, so the app builds and tests pass against the mostly-empty
master.
`;
}

// ---- run -------------------------------------------------------------------

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
  const weights = parseWeights(wb);
  const wodStandards = parseWodStandards(wb);
  const qualityMix = parseQualityMix(wb, Object.keys(wodStandards));

  const data = { sourcing, standards, weights, wodStandards, qualityMix };

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
