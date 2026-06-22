/**
 * Operator (ORS) codegen — reads the curated master and emits per-unit config.
 *
 *   config/standards/TPF_Operator_Standards.xlsx  →  src/config/generated/operator.generated.ts
 *
 * The ORS model is per-UNIT: each pathway carries its own benchmark set with its
 * own thresholds (unisex, absolute). Units missing a Weights row get an even
 * split across the components they actually test (flagged for review).
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(REPO, 'config/standards/TPF_Operator_Standards.xlsx');
const OUT = resolve(REPO, 'src/config/generated/operator.generated.ts');

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const isTimey = (u) => /sec|min|:/.test(String(u || '').toLowerCase());
function toSec(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number') return raw < 10 ? Math.round(raw * 86400) : raw;
  const parts = String(raw).split(':').map(Number);
  if (parts.some(Number.isNaN)) return null;
  return parts.reduce((a, n) => a * 60 + n, 0);
}
const num = (raw, unit) => {
  if (raw == null || raw === '') return null;
  if (isTimey(unit)) return toSec(raw);
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};
function source(unit, component) {
  if (unit === 'kg') return 'orm';
  if (isTimey(unit) && ['running', 'rucking', 'swimming'].includes(component)) return 'race_times';
  return 'manual';
}

const wb = XLSX.read(readFileSync(SRC), { type: 'buffer' });
const S = XLSX.utils.sheet_to_json(wb.Sheets['Standards'], { header: 1, defval: null, blankrows: false });
const W = XLSX.utils.sheet_to_json(wb.Sheets['Weights'], { header: 1, defval: null, blankrows: false });

// Standards header row (skip the title row).
const sh = S.findIndex((r) => r[0] === 'region');
const H = S[sh];
const col = (name) => H.indexOf(name);
const C = {
  region: col('region'), pathway: col('pathway'), component: col('component'),
  benchmark: col('benchmark'), unit: col('unit'), direction: col('direction'),
  pass: col('pass'), good: col('good'), excellent: col('excellent'), elite: col('elite'),
};

const pathways = new Map(); // pathway label -> { region, benchmarks: [], components:Set }
for (let i = sh + 1; i < S.length; i++) {
  const r = S[i];
  const pathway = r[C.pathway];
  if (!pathway) continue;
  const unit = r[C.unit];
  const component = r[C.component];
  const thresholds = {
    pass: num(r[C.pass], unit), good: num(r[C.good], unit),
    excellent: num(r[C.excellent], unit), elite: num(r[C.elite], unit),
  };
  if (thresholds.pass == null && thresholds.good == null && thresholds.excellent == null && thresholds.elite == null) continue;
  if (!pathways.has(pathway)) pathways.set(pathway, { region: r[C.region], benchmarks: [], components: new Set() });
  const p = pathways.get(pathway);
  p.benchmarks.push({
    id: slug(r[C.benchmark]), name: r[C.benchmark], component,
    source: source(unit, component), unit, lowerIsBetter: /lower/.test(String(r[C.direction])),
    thresholds,
  });
  p.components.add(component);
}

// Weights sheet → per-pathway component weights.
const wh = W.findIndex((r) => r[0] === 'region');
const WH = W[wh];
const wCompCols = WH.map((h, i) => (i >= 2 && h !== 'SUM' ? { i, c: h } : null)).filter(Boolean);
const weightsByPathway = {};
for (let i = wh + 1; i < W.length; i++) {
  const r = W[i];
  if (!r[1]) continue;
  const w = {};
  for (const { i: ci, c } of wCompCols) {
    const v = Number(r[ci]);
    if (Number.isFinite(v) && v > 0) w[c] = v;
  }
  weightsByPathway[r[1]] = w;
}

// Build ordered pathway objects; even-split weights where a unit has none.
const ordered = [...pathways.entries()].sort((a, b) =>
  (a[1].region === b[1].region ? 0 : a[1].region === 'US' ? -1 : 1));
const out = ordered.map(([label, p]) => {
  let weights = weightsByPathway[label];
  let weightsInferred = false;
  if (!weights || Object.keys(weights).length === 0) {
    const comps = [...p.components];
    const each = Math.round((100 / comps.length) * 10) / 10;
    weights = Object.fromEntries(comps.map((c, idx) => [c, idx === comps.length - 1 ? Math.round((100 - each * (comps.length - 1)) * 10) / 10 : each]));
    weightsInferred = true;
  }
  return { id: slug(label), label, region: p.region, weights, weightsInferred, benchmarks: p.benchmarks };
});

const J = (v) => JSON.stringify(v, null, 2);
const ts = `// AUTO-GENERATED from config/standards/TPF_Operator_Standards.xlsx — do not edit.
// Regenerate with \`npm run codegen\`. Operator model: per-unit benchmarks,
// unisex (one threshold regardless of sex), absolute units.

import type { ComponentId, ThresholdSet } from '../../engine/types';

export interface OperatorBenchmark {
  id: string;
  name: string;
  component: ComponentId;
  source: 'orm' | 'race_times' | 'manual';
  unit: string;
  lowerIsBetter: boolean;
  /** Unisex thresholds (same standard for M/F). */
  thresholds: ThresholdSet;
}

export interface OperatorPathway {
  id: string;
  label: string;
  region: 'US' | 'UK';
  /** component → weight %; weightsInferred=true means an even split (no source row). */
  weights: Partial<Record<ComponentId, number>>;
  weightsInferred: boolean;
  benchmarks: OperatorBenchmark[];
}

export const OPERATOR_PATHWAYS: OperatorPathway[] = ${J(out)};
`;

const { writeFileSync } = await import('node:fs');
writeFileSync(OUT, ts);
const benchCount = out.reduce((n, p) => n + p.benchmarks.length, 0);
console.log(`[operator-codegen] ${out.length} pathways, ${benchCount} benchmark defs → ${OUT}`);
