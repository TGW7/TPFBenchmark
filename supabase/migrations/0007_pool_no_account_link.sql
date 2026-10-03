-- ---------------------------------------------------------------------------
-- 0007 — the percentile pool keeps no link to an account (2026-10-03; the
-- TPF app's docs/LEGAL_REVIEW_FOR_COUNSEL_2026-10-03.md, H1; this repo's
-- docs/LEGAL-FIXES-2026-10-03.md §3).
--
-- WRITTEN, NOT APPLIED. Apply it to the Supabase project the site points at —
-- the TPF app's own project (.env.example, DEPLOY.md) — in the SQL editor or
-- with `supabase db push`, AFTER 0006. It is safe to run more than once.
--
-- What it does, and why:
--
-- 1. `pre_opt_in` marks every row that exists when this runs. Until
--    2026-10-03 the "add my numbers to the pool" box was TICKED BY DEFAULT,
--    so these rows were not collected on an opt-in. The mark is not an
--    identifier (it is the same value on every old row); it exists so that
--    if counsel or the owner decides those rows must go, one statement removes
--    them — after steps 2–4 nothing else could tell them apart:
--        delete from public.benchmark_submissions where pre_opt_in;
--    DEFAULT (owner question in docs/LEGAL-FIXES-2026-10-03.md): they are
--    kept, de-linked, and still count toward percentiles.
--
-- 2. `user_id` is set to null on every existing row, and forced to null on
--    every new or updated row by the trigger below. The client stopped
--    sending it the same day (src/data/pool.ts); the trigger also strips it
--    from an old browser tab still running the previous bundle, rather than
--    rejecting that tab's save. The column itself is left in place for that
--    reason; dropping it is a later, separate step once no old tab can be
--    open (a column that does not exist would make such an insert fail).
--
-- 3. `bodyweight_kg` is set to null, and forced to null, the same way.
--    Nothing reads it: not benchmark_percentile(), not
--    benchmark_pool_count(), not scripts/recalibrate*.mjs. A bodyweight to
--    0.01 kg is the sharpest quasi-identifier the row had. (A benchmark
--    defined per kg of bodyweight is already stored as that ratio in
--    `value`.)
--
-- 4. `created_at` is truncated to the first of its month, and new rows get
--    the month only. Every row of one save was inserted in one statement and
--    so shared an exact timestamp: that grouped a save's rows into one
--    athlete's full set of numbers — a fingerprint that could be matched
--    against the same athlete's own saved entries (benchmark_entries, which
--    do carry the account). Nothing reads the timestamp.
--
-- 5. The "read own submissions" policy is dropped: with no user_id it can
--    match nothing, and no code reads it.
--
-- What it does NOT do, and cannot: a pooled value is still a value — a
-- 5 km time of 22:13 in the pool and the same 22:13 in someone's saved
-- entries can be lined up by whoever can read both tables (TPF). That is
-- why the site no longer calls the pool "anonymised" (for counsel:
-- docs/LEGAL-FIXES-2026-10-03.md §3).
--
-- Every value below is pinned against the client by
-- src/test/migrations-2026-10-03.test.ts (and src/test/pool.test.ts).
-- ---------------------------------------------------------------------------

begin;

alter table public.benchmark_submissions
  add column if not exists pre_opt_in boolean not null default false;

comment on column public.benchmark_submissions.pre_opt_in is
  'True for rows that existed when migration 0007 ran (2026-10-03): collected '
  'while the pool box was ticked by default. Not an identifier. '
  'Delete with: delete from benchmark_submissions where pre_opt_in;';

-- Only on the first run: a re-run must not mark rows added since.
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'benchmark_submissions_unlink'
      and tgrelid = 'public.benchmark_submissions'::regclass
  ) then
    update public.benchmark_submissions set pre_opt_in = true;
  end if;
end
$$;

update public.benchmark_submissions
  set user_id = null,
      bodyweight_kg = null,
      created_at = date_trunc('month', created_at)
  where user_id is not null
     or bodyweight_kg is not null
     or created_at <> date_trunc('month', created_at);

create or replace function public.benchmark_submissions_unlink()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.user_id := null;
  new.bodyweight_kg := null;
  new.created_at := date_trunc('month', coalesce(new.created_at, now()));
  return new;
end
$$;

drop trigger if exists benchmark_submissions_unlink on public.benchmark_submissions;
create trigger benchmark_submissions_unlink
  before insert or update on public.benchmark_submissions
  for each row execute function public.benchmark_submissions_unlink();

drop policy if exists "read own submissions" on public.benchmark_submissions;

comment on column public.benchmark_submissions.user_id is
  'Always null since migration 0007 (2026-10-03) — forced by the '
  'benchmark_submissions_unlink trigger. Kept only so an old client that '
  'still sends it is stripped rather than rejected; drop it later.';

commit;
