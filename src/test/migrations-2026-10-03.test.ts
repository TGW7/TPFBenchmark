/**
 * 2026-10-03 — the two migrations written (NOT applied) that day, held to the
 * client code they serve (docs/LEGAL-FIXES-2026-10-03.md §3–§4):
 *
 *   0006 — the `brand` CHECK must allow every brand the client writes
 *          (src/brand.ts `Brand`), on every table the client writes it to;
 *   0007 — the percentile pool keeps no account id, no bodyweight and only the
 *          month, for old rows and new ones.
 *
 * Text checks: this suite has no database. Whether the SQL runs is NOT tested
 * here (docs/LEGAL-FIXES-2026-10-03.md §9).
 */
import { describe, expect, it } from 'vitest';
import { BRAND_META } from '../brand';

const SQL = import.meta.glob(['../../supabase/migrations/*.sql'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const sql = (name: string): string => {
  const t = SQL[`../../supabase/migrations/${name}`];
  if (t == null) throw new Error(`no migration ${name}`);
  return t;
};
const REMOTE = import.meta.glob(['../data/remote.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
/** SQL without `--` comments. */
const code = (s: string) => s.split('\n').map((l) => l.replace(/--.*$/, '')).join('\n');

describe('0006 — the brand CHECK allows every brand the client writes', () => {
  const m = code(sql('0006_allow_hybrid_brand.sql'));
  const brands = Object.keys(BRAND_META).sort();

  it('the client\'s brands are lift, operator and hybrid', () => {
    expect(brands).toEqual(['hybrid', 'lift', 'operator']);
  });

  it('each table the client writes a brand to gets a CHECK listing exactly those brands', () => {
    const remote = REMOTE['../data/remote.ts'];
    // The tables src/data/remote.ts writes `brand` into.
    for (const t of ['benchmark_profiles', 'benchmark_entries', 'benchmark_submissions']) {
      expect(remote, t).toContain(`from('${t}')`);
      const re = new RegExp(`alter table public\\.${t}\\s+add constraint ${t}_brand_check\\s+check \\(brand in \\(([^)]*)\\)\\)`);
      const hit = re.exec(m);
      expect(hit, t).not.toBeNull();
      const listed = [...hit![1].matchAll(/'([^']+)'/g)].map((x) => x[1]).sort();
      expect(listed, t).toEqual(brands);
    }
  });

  it('drops the old CHECK by definition (0001 named them implicitly) and runs in one transaction', () => {
    expect(m).toMatch(/pg_get_constraintdef\(c\.oid\) ~\* '\\mbrand\\M'/);
    expect(m.trim().startsWith('begin;')).toBe(true);
    expect(m.trim().endsWith('commit;')).toBe(true);
  });

  it('the old CHECK really was lift / operator only (what made every hybrid save fail)', () => {
    expect(sql('0001_benchmark_init.sql')).toContain("check (brand in ('lift', 'operator'))");
  });
});

describe('0007 — the pool keeps no link to an account', () => {
  const m = code(sql('0007_pool_no_account_link.sql'));

  it('marks the rows collected while the box was ticked by default, once only', () => {
    expect(m).toContain('add column if not exists pre_opt_in boolean not null default false');
    expect(m).toMatch(/if not exists \(\s*select 1 from pg_trigger\s+where tgname = 'benchmark_submissions_unlink'/);
    expect(m).toContain('update public.benchmark_submissions set pre_opt_in = true;');
  });

  it('de-links the existing rows: no account id, no bodyweight, the month only', () => {
    expect(m).toMatch(/set user_id = null,\s*bodyweight_kg = null,\s*created_at = date_trunc\('month', created_at\)/);
  });

  it('a trigger strips the same from every new or updated row', () => {
    expect(m).toMatch(/new\.user_id := null;/);
    expect(m).toMatch(/new\.bodyweight_kg := null;/);
    expect(m).toMatch(/new\.created_at := date_trunc\('month', coalesce\(new\.created_at, now\(\)\)\);/);
    expect(m).toMatch(/before insert or update on public\.benchmark_submissions\s+for each row execute function public\.benchmark_submissions_unlink\(\)/);
  });

  it('drops the policy that let an account read "its own" pool rows', () => {
    expect(m).toContain('drop policy if exists "read own submissions" on public.benchmark_submissions;');
  });

  it('keeps the trust cap from 0005 (not touched)', () => {
    expect(m).not.toMatch(/contribute submissions/);
  });
});
