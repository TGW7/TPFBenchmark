/**
 * Publish the current codegen'd standards (HABS + ORS) to the shared
 * `benchmark_published_standards` table — the single source of truth both
 * tpf-benchmark and (once wired) tpf-app read from.
 *
 * Run after `npm run codegen` whenever a standards change should go live:
 *   npm run publish-standards
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY in .env.local — the table only allows
 * service_role writes (see supabase/migrations/0003_published_standards.sql).
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('✗ Missing keys. Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('  (the anon key cannot write here — RLS restricts this table to service_role).');
  process.exit(1);
}

let sourceCommit = null;
try {
  sourceCommit = execSync('git rev-parse HEAD', { cwd: import.meta.dirname + '/..' }).toString().trim();
} catch {
  // not fatal — traceability only
}

const supabase = createClient(url, serviceKey);

const PAYLOADS = {
  lift: 'src/config/generated/lift.data.json',
  operator: 'src/config/generated/operator.data.json',
};

console.log(`Publishing to ${url} …\n`);
let ok = true;
for (const [brand, path] of Object.entries(PAYLOADS)) {
  const payload = JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url)));
  const { error } = await supabase
    .from('benchmark_published_standards')
    .upsert({ brand, payload, source_commit: sourceCommit, published_at: new Date().toISOString() });
  if (error) {
    console.log(`  ✗ ${brand}: ${error.message}`);
    ok = false;
  } else {
    console.log(`  ✓ ${brand} — published from ${path}${sourceCommit ? ` @ ${sourceCommit.slice(0, 7)}` : ''}`);
  }
}

console.log(ok
  ? '\n✅ Published. tpf-app can read this the moment it\'s wired to the table — see docs/SHARED-STANDARDS.md.'
  : '\n⚠️  One or more brands failed to publish — check the service-role key + migration 0003 is applied.');
process.exit(ok ? 0 : 1);
