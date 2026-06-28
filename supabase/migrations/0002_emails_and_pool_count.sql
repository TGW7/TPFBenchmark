-- ---------------------------------------------------------------------------
-- 0002 — email capture (list building) + pool-size signal ("vs N athletes").
-- Additive to 0001; safe to run on a project that already has the benchmark_*
-- schema. Mirrors 0001's RLS conventions (anon may write, reads are gated).
-- ---------------------------------------------------------------------------

-- Email list. Anonymous inserts allowed; there is NO select policy, so rows are
-- write-only from the client — read them via the service role / dashboard only.
create table if not exists public.benchmark_emails (
  id         uuid primary key default gen_random_uuid(),
  email      text not null check (position('@' in email) > 1),
  brand      text not null,
  source     text,
  pathway    text,
  user_id    uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists benchmark_emails_email_idx on public.benchmark_emails (email);

alter table public.benchmark_emails enable row level security;

create policy "capture email" on public.benchmark_emails
  for insert with check (true);

-- ---------------------------------------------------------------------------
-- Pool size for a (brand, benchmark, sex, age_band) cell. Powers the
-- "vs N real athletes" trust signal next to the live percentile. Counts rows
-- (not trust-weighted) so it reflects real people, and mirrors the cell
-- selection in benchmark_percentile(). A bare count is safe to expose.
-- ---------------------------------------------------------------------------
create or replace function public.benchmark_pool_count(
  p_brand        text,
  p_benchmark_id text,
  p_sex          text,
  p_age_band     text
) returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.benchmark_submissions
  where brand = p_brand
    and benchmark_id = p_benchmark_id
    and sex is not distinct from p_sex
    and age_band is not distinct from p_age_band;
$$;
