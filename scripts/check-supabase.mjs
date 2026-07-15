/**
 * Verify the Supabase wiring after you add keys (step 1) and run the migration
 * (step 2). Run:  npm run check:supabase
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('✗ Missing keys. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then re-run.');
  process.exit(1);
}

console.log(`Connecting to ${url} …\n`);
const supabase = createClient(url, key);
let ok = true;

for (const t of ['benchmark_profiles', 'benchmark_entries', 'benchmark_submissions']) {
  const { error } = await supabase.from(t).select('*', { count: 'exact', head: true });
  if (error) { console.log(`  ✗ table ${t}: ${error.message}`); ok = false; }
  else console.log(`  ✓ table ${t}`);
}

const { error: rpcErr } = await supabase.rpc('benchmark_percentile', {
  p_brand: 'lift', p_benchmark_id: 'check', p_sex: 'M', p_age_band: '30-39',
  p_value: 1, p_lower_is_better: false,
});
if (rpcErr) { console.log(`  ✗ function benchmark_percentile: ${rpcErr.message}`); ok = false; }
else console.log('  ✓ function benchmark_percentile');

// 0002 — email capture + pool-size signal ("vs N athletes").
{
  const { error } = await supabase.from('benchmark_emails').select('*', { count: 'exact', head: true });
  if (error) { console.log(`  ✗ table benchmark_emails: ${error.message}`); ok = false; }
  else console.log('  ✓ table benchmark_emails');
}
const { error: pcErr } = await supabase.rpc('benchmark_pool_count', {
  p_brand: 'lift', p_benchmark_id: 'check', p_sex: 'M', p_age_band: '30-39',
});
if (pcErr) { console.log(`  ✗ function benchmark_pool_count: ${pcErr.message}`); ok = false; }
else console.log('  ✓ function benchmark_pool_count');

// 0003 — shared published-standards table (HABS + ORS single source of truth).
{
  const { error } = await supabase.from('benchmark_published_standards').select('*', { count: 'exact', head: true });
  if (error) { console.log(`  ✗ table benchmark_published_standards: ${error.message}`); ok = false; }
  else console.log('  ✓ table benchmark_published_standards');
}

console.log(ok
  ? '\n✅ All good — accounts, the percentile pool, email capture, "vs N" + published standards are wired up.'
  : '\n⚠️  Something is missing. If tables/functions are absent, that migration hasn’t run yet.');
process.exit(ok ? 0 : 1);
