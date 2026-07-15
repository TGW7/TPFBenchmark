/**
 * Tier recalibration — propose updated Operator (ORS) standards from the live
 * data pool. Sibling to `recalibrate.mjs` (Lift), split out because ORS has a
 * different grouping: unisex (pool M+F together) and PER-UNIT (the same
 * benchmark id, e.g. "back_squat", has genuinely different correct tiers
 * across units — USMC vs SEAL — so cells group by (pathway_id, benchmark_id),
 * not just benchmark_id). Needs migration 0004 (pathway_id column) applied
 * and populated — submissions logged before that migration have no pathway
 * tag and are skipped (can't attribute them to a unit).
 *
 * Run:  npm run recalibrate:operator     (reads .env.local)
 *
 * For each (pathway, benchmark) cell with enough TRUSTED submissions, computes
 * the trust-weighted, winsorised values at the tier percentiles and compares
 * to the current standards — writing a review diff to
 * recalibration-proposal-operator.md. PROPOSE-ONLY: never overwrites the
 * master (config/standards/TPF_Operator_Standards.xlsx). If a cell hasn't
 * enough data yet, it's skipped.
 *
 * Reading the whole pool needs the SERVICE_ROLE key (RLS hides other users'
 * rows from the anon key) — set SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIN_TRUST_N = 30;
const TIER_P = { pass: 0.5, good: 0.7, excellent: 0.85, elite: 0.985 };
const TIERS = ['pass', 'good', 'excellent', 'elite'];

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const key = serviceKey || process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('✗ Missing VITE_SUPABASE_URL / key. Add them to .env.local.');
  process.exit(1);
}

// ---- maths (identical to recalibrate.mjs — kept in sync by hand; both
// mirror src/engine/stats.ts weightedQuantile) -------------------------------
function weightedQuantile(pairs, q) {
  const pts = pairs.filter(([, w]) => w > 0).sort((a, b) => a[0] - b[0]);
  const total = pts.reduce((s, [, w]) => s + w, 0);
  if (total <= 0) return null;
  const target = Math.min(1, Math.max(0, q)) * total;
  let cum = 0;
  for (const [v, w] of pts) { cum += w; if (cum >= target) return v; }
  return pts[pts.length - 1][0];
}
const roundStep = (unit) => {
  const u = String(unit || '').toLowerCase();
  if (u === 'm' || u === 'multiplier') return 0.05;
  if (u === 'kg') return 2.5;
  return 1; // reps, sec, inches, level
};
const round = (n, s) => Math.round(n / s) * s;
const clock = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.round(s % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
};
const fmt = (unit, v) => (v == null ? '—' : unit === 'sec' ? clock(v) : `${v}${unit === 'kg' ? 'kg' : unit === 'm' ? 'm' : ''}`);

// ---- current standards (per-unit, unisex) ----------------------------------
const units = JSON.parse(readFileSync(resolve(REPO, 'src/config/generated/operator.data.json'), 'utf8'));
const meta = new Map(); // `${pathwayId}|${benchmarkId}` -> {unit, lowerIsBetter, current, unitLabel}
for (const u of units) {
  for (const b of u.benchmarks) {
    meta.set(`${u.id}|${b.id}`, {
      unit: b.unit, lowerIsBetter: b.lowerIsBetter, current: b.thresholds, unitLabel: u.label, benchmarkName: b.name,
    });
  }
}

// ---- pull the pool ----------------------------------------------------------
const supabase = createClient(url, key);
console.log(`Reading Operator pool from ${url} (${serviceKey ? 'service-role' : 'anon — RLS will hide other users’ rows'})…\n`);
const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase
    .from('benchmark_submissions')
    .select('pathway_id, benchmark_id, value, trust, lower_is_better')
    .eq('brand', 'operator')
    .not('pathway_id', 'is', null)
    .range(from, from + 999);
  if (error) {
    if (/column .*pathway_id.* does not exist/i.test(error.message)) {
      console.error('✗ migration 0004 (pathway_id column) isn’t applied yet — nothing to read.');
      process.exit(1);
    }
    console.error('✗ query failed:', error.message);
    process.exit(1);
  }
  rows.push(...data);
  if (data.length < 1000) break;
}

// ---- group (unisex — no sex split) + propose --------------------------------
const cells = new Map();
for (const r of rows) {
  const k = `${r.pathway_id}|${r.benchmark_id}`;
  if (!cells.has(k)) cells.set(k, []);
  cells.get(k).push([Number(r.value), Number(r.trust) || 0]);
}

const proposals = [];
let insufficient = 0;
let unknownCell = 0;
for (const [k, pairs] of cells) {
  const m = meta.get(k);
  if (!m) { unknownCell++; continue; } // pathway/benchmark no longer exists (renamed/removed since logged)
  const trustedN = pairs.reduce((s, [, w]) => s + w, 0);
  if (trustedN < MIN_TRUST_N) { insufficient++; continue; }
  const lo = weightedQuantile(pairs, 0.025), hi = weightedQuantile(pairs, 0.975);
  const w = pairs.map(([v, t]) => [Math.min(hi, Math.max(lo, v)), t]);
  const step = roundStep(m.unit);
  const proposed = {};
  for (const tier of TIERS) {
    const p = m.lowerIsBetter ? 1 - TIER_P[tier] : TIER_P[tier];
    proposed[tier] = round(weightedQuantile(w, p), step);
  }
  const [pathwayId, benchmarkId] = k.split('|');
  proposals.push({ pathwayId, unitLabel: m.unitLabel, benchmarkId, benchmarkName: m.benchmarkName, unit: m.unit, n: pairs.length, trustedN, current: m.current, proposed });
}

// ---- report ------------------------------------------------------------------
let md = `# Tier recalibration proposal (Operator / ORS)\n\nMin trusted N per cell: ${MIN_TRUST_N}. Unisex (M+F pooled), grouped per unit — the same benchmark id can propose different values across units. Propose-only — review, then edit \`config/standards/TPF_Operator_Standards.xlsx\` and \`npm run codegen\`.\n\n`;
if (proposals.length === 0) {
  md += `**No (unit, benchmark) cell has ≥${MIN_TRUST_N} trusted submissions yet** — nothing to recalibrate. ${insufficient} cell(s) below threshold${unknownCell ? `, ${unknownCell} cell(s) reference a since-removed unit/benchmark` : ''}. The job is wired and will surface proposals as the Operator pool grows.\n`;
  console.log(`No cell meets the ≥${MIN_TRUST_N} trusted-submission threshold yet (${insufficient} below, ${unknownCell} stale). Nothing to recalibrate.`);
} else {
  for (const p of proposals) {
    md += `## ${p.unitLabel} — ${p.benchmarkName} (\`${p.pathwayId}\` / \`${p.benchmarkId}\`) — n=${p.n}, trust=${p.trustedN.toFixed(1)}\n\n| tier | current | proposed |\n|---|---|---|\n`;
    for (const t of TIERS) md += `| ${t} | ${fmt(p.unit, p.current[t])} | ${fmt(p.unit, p.proposed[t])} |\n`;
    md += `\n`;
  }
  console.log(`Proposed changes for ${proposals.length} cell(s); ${insufficient} still below threshold. See recalibration-proposal-operator.md`);
}
writeFileSync(resolve(REPO, 'recalibration-proposal-operator.md'), md);
