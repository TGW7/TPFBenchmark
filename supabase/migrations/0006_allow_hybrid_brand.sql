-- ---------------------------------------------------------------------------
-- 0006 — allow the 'hybrid' brand (2026-10-03, the owner: "Fix benchmark bug").
--
-- WRITTEN, NOT APPLIED. Apply it to the Supabase project the site points at —
-- the TPF app's own project (.env.example, DEPLOY.md: "the SAME project as the
-- TPF app") — in the SQL editor or with `supabase db push`. It is safe to run
-- more than once.
--
-- The bug: 0001 created `brand text ... check (brand in ('lift', 'operator'))`
-- on benchmark_profiles, benchmark_entries and benchmark_submissions. The
-- hybrid brand (any hostname containing "hybrid", src/brand.ts detectBrand)
-- writes brand = 'hybrid' to all three, so on a database that matches 0001
-- every hybrid Save was REJECTED (whether a hybrid hostname is live was not
-- checked):
--   - benchmark_profiles upsert   → rejected (the athlete's details not saved);
--   - benchmark_entries           → the client DELETED the athlete's saved
--                                   entries first, then the insert was
--                                   rejected — saved numbers were lost
--                                   (src/data/remote.ts, fixed the same day:
--                                   it now inserts first);
--   - benchmark_submissions       → rejected (no hybrid pool rows exist).
-- None of it was shown: the client ignored every error and said "Saved"
-- (fixed the same day — src/data/save.ts).
--
-- Not changed: benchmark_published_standards keeps ('lift', 'operator') —
-- scripts/publish-standards.mjs writes only those two brands to it.
-- benchmark_emails has no brand check.
--
-- The brand values the client writes are exactly src/brand.ts's
-- `Brand = 'lift' | 'operator' | 'hybrid'`; src/test/migrations-2026-10-03.test.ts
-- pins this file against that list.
-- ---------------------------------------------------------------------------

begin;

-- Drop whichever brand CHECK each table has, by definition rather than by
-- name: 0001 declared them inline, so Postgres named them, and a project set
-- up by hand may have named them differently.
do $$
declare
  r record;
begin
  for r in
    select c.conrelid::regclass as tbl, c.conname
    from pg_constraint c
    where c.contype = 'c'
      and c.conrelid in (
        'public.benchmark_profiles'::regclass,
        'public.benchmark_entries'::regclass,
        'public.benchmark_submissions'::regclass
      )
      and pg_get_constraintdef(c.oid) ~* '\mbrand\M'
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
  end loop;
end
$$;

alter table public.benchmark_profiles
  add constraint benchmark_profiles_brand_check
  check (brand in ('lift', 'operator', 'hybrid'));

alter table public.benchmark_entries
  add constraint benchmark_entries_brand_check
  check (brand in ('lift', 'operator', 'hybrid'));

alter table public.benchmark_submissions
  add constraint benchmark_submissions_brand_check
  check (brand in ('lift', 'operator', 'hybrid'));

commit;
