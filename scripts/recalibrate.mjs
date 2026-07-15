/**
 * Tier recalibration — propose updated Lift standards from the live data pool.
 *
 * Run:  npm run recalibrate         (reads .env.local)
 *
 * For each (benchmark, sex) cell with enough TRUSTED submissions, it computes the
 * trust-weighted, winsorised values at the tier percentiles (50 / 70 / 85 / 98.5)
 * and compares them to the current standards — writing a review diff to
 * recalibration-proposal.md. PROPOSE-ONLY: it never overwrites the master. If a
 * cell hasn't enough data yet, it's skipped (no recalibrating on thin/biased data).
 *
 * Reading the whole pool needs the SERVICE_ROLE key (RLS hides other users' rows
 * from the anon key) — set SUPABASE_SERVICE_ROLE_KEY in .env.local for a real run.
 *
 * Lift-only. Operator standards are per-unit (and unisex) — a different
 * grouping — see `recalibrate-operator.mjs` (npm run recalibrate:operator).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIN_TRUST_N = 30; // min summed trust before a cell is eligible
const TIER_P = { pass: 0.5, good: 0.7, excellent: 0.85, elite: 0.985 };
const TIERS = ['pass', 'good', 'excellent', 'elite'];

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const key = serviceKey || process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('✗ Missing VITE_SUPABASE_URL / key. Add them to .env.local.');
  process.exit(1);
}

// ---- maths (mirrors src/engine/stats.ts weightedQuantile) ------------------
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
  if (u === 'xbw' || u === 'm' || u === 'multiplier') return 0.05;
  if (u === 'kg') return 2.5;
  return 1; // reps, cm, seconds
};
const round = (n, s) => Math.round(n / s) * s;
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const fmt = (unit, v) => (v == null ? '—' : String(unit).includes(':') ? clock(v) : unit === 'xBW' ? `${v}×BW` : `${v}${unit === 'kg' ? 'kg' : ''}`);

// ---- current standards -----------------------------------------------------
const lift = JSON.parse(readFileSync(resolve(REPO, 'src/config/generated/lift.data.json'), 'utf8'));
const meta = Object.fromEntries(lift.sourcing.map((b) => [b.id, b]));

// ---- pull the pool ---------------------------------------------------------
const supabase = createClient(url, key);
console.log(`Reading pool from ${url} (${serviceKey ? 'service-role' : 'anon — RLS will hide other users’ rows'})…\n`);
const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase
    .from('benchmark_submissions')
    .select('benchmark_id, sex, value, trust, lower_is_better')
    .eq('brand', 'lift')
    .range(from, from + 999);
  if (error) { console.error('✗ query failed:', error.message); process.exit(1); }
  rows.push(...data);
  if (data.length < 1000) break;
}

// ---- group + propose -------------------------------------------------------
const cells = new Map();
for (const r of rows) {
  if (String(r.benchmark_id).startsWith('overall:')) continue; // composite, not a tier
  const k = `${r.benchmark_id}|${r.sex}`;
  if (!cells.has(k)) cells.set(k, []);
  cells.get(k).push([Number(r.value), Number(r.trust) || 0]);
}

const proposals = [];
let insufficient = 0;
for (const [k, pairs] of cells) {
  const [id, sex] = k.split('|');
  const m = meta[id];
  if (!m) continue;
  const trustedN = pairs.reduce((s, [, w]) => s + w, 0);
  if (trustedN < MIN_TRUST_N) { insufficient++; continue; }
  // winsorise to tame outliers / inflated claims
  const lo = weightedQuantile(pairs, 0.025), hi = weightedQuantile(pairs, 0.975);
  const w = pairs.map(([v, t]) => [Math.min(hi, Math.max(lo, v)), t]);
  const step = roundStep(m.unit);
  const proposed = {};
  for (const tier of TIERS) {
    const p = m.lowerIsBetter ? 1 - TIER_P[tier] : TIER_P[tier];
    proposed[tier] = round(weightedQuantile(w, p), step);
  }
  const current = lift.standards[id]?.[sex] ?? {};
  proposals.push({ id, sex, unit: m.unit, n: pairs.length, trustedN, current, proposed });
}

// ---- report ----------------------------------------------------------------
let md = `# Tier recalibration proposal (Lift)\n\nMin trusted N per cell: ${MIN_TRUST_N}. Propose-only — review, then edit \`scripts/seed-standards.mjs\` (or the workbook) and \`npm run seed && npm run codegen\`.\n\n`;
if (proposals.length === 0) {
  md += `**No (benchmark, sex) cell has ≥${MIN_TRUST_N} trusted submissions yet** — nothing to recalibrate. ${insufficient} cell(s) below threshold. The job is wired and will surface proposals as the pool grows.\n`;
  console.log(`No cell meets the ≥${MIN_TRUST_N} trusted-submission threshold yet (${insufficient} below). Nothing to recalibrate.`);
} else {
  for (const p of proposals) {
    md += `## ${p.id} (${p.sex}) — n=${p.n}, trust=${p.trustedN.toFixed(1)}\n\n| tier | current | proposed |\n|---|---|---|\n`;
    for (const t of TIERS) md += `| ${t} | ${fmt(p.unit, p.current[t])} | ${fmt(p.unit, p.proposed[t])} |\n`;
    md += `\n`;
  }
  console.log(`Proposed changes for ${proposals.length} cell(s); ${insufficient} still below threshold. See recalibration-proposal.md`);
}
writeFileSync(resolve(REPO, 'recalibration-proposal.md'), md);
