-- HRS Benchmark — initial schema for the shared TPF Supabase project.
--
-- This repo OWNS the `benchmark_*` tables. It shares `auth.users` with the TPF
-- app (so a benchmark sign-up is a TPF account) but never alters app-owned
-- tables. Syncing 1RMs/times into the app's own tables is a separate, explicit
-- contract (see src/data/remote.ts / ROADMAP.md).
--
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.

-- ---------------------------------------------------------------------------
-- Per-user benchmark profile (sex / bodyweight / age / chosen pathway).
-- ---------------------------------------------------------------------------
create table if not exists public.benchmark_profiles (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  brand         text not null default 'lift' check (brand in ('lift', 'operator')),
  sex           text check (sex in ('M', 'F')),
  bodyweight_kg numeric(6, 2),
  age_years     int check (age_years between 10 and 100),
  pathway       text,
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Per-user saved entries (the athlete's own data; powers Layer 2 persistence).
-- ---------------------------------------------------------------------------
create table if not exists public.benchmark_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  brand        text not null default 'lift' check (brand in ('lift', 'operator')),
  kind         text not null check (kind in ('orm', 'race', 'manual', 'wod')),
  benchmark_id text not null,
  payload      jsonb not null,
  created_at   timestamptz not null default now()
);
create index if not exists benchmark_entries_user_idx on public.benchmark_entries (user_id);

-- ---------------------------------------------------------------------------
-- The data pool: anonymised submissions that drive population percentiles.
-- May be contributed anonymously (user_id null). `trust` weights each row.
-- ---------------------------------------------------------------------------
create table if not exists public.benchmark_submissions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users (id) on delete set null,
  brand           text not null default 'lift' check (brand in ('lift', 'operator')),
  benchmark_id    text not null,
  sex             text check (sex in ('M', 'F')),
  age_band        text,
  bodyweight_kg   numeric(6, 2),
  value           numeric not null,
  lower_is_better boolean not null default false,
  trust           numeric not null default 0.15 check (trust >= 0 and trust <= 1),
  verified        boolean not null default false,
  source          text not null default 'web' check (source in ('web', 'app')),
  created_at      timestamptz not null default now()
);
create index if not exists benchmark_submissions_cell_idx
  on public.benchmark_submissions (brand, benchmark_id, sex, age_band);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.benchmark_profiles    enable row level security;
alter table public.benchmark_entries     enable row level security;
alter table public.benchmark_submissions enable row level security;

-- Profiles: a user sees and edits only their own row.
create policy "own profile" on public.benchmark_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Entries: a user sees and edits only their own rows.
create policy "own entries" on public.benchmark_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Submissions: anyone (incl. anon) may contribute; nobody reads rows directly
-- (percentiles come from the SECURITY DEFINER function below). A user may read
-- back their own contributed rows.
create policy "contribute submissions" on public.benchmark_submissions
  for insert with check (true);
create policy "read own submissions" on public.benchmark_submissions
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Trust-weighted percentile, gated on a minimum trusted sample size.
-- Returns null until the (brand, benchmark, sex, age_band) cell has enough data.
-- ---------------------------------------------------------------------------
create or replace function public.benchmark_percentile(
  p_brand           text,
  p_benchmark_id    text,
  p_sex             text,
  p_age_band        text,
  p_value           numeric,
  p_lower_is_better boolean,
  p_min_trust_n     numeric default 30
) returns numeric
language sql
stable
security definer
set search_path = public
as $$
  with cell as (
    select value, trust
    from public.benchmark_submissions
    where brand = p_brand
      and benchmark_id = p_benchmark_id
      and sex is not distinct from p_sex
      and age_band is not distinct from p_age_band
  ), totals as (
    select coalesce(sum(trust), 0) as trust_n,
           coalesce(sum(trust) filter (
             where case when p_lower_is_better then value > p_value else value < p_value end
           ), 0) as trust_below,
           coalesce(sum(trust) filter (where value = p_value), 0) as trust_equal
    from cell
  )
  select case
    when trust_n < p_min_trust_n then null
    else round(((trust_below + trust_equal / 2) / trust_n) * 100, 1)
  end
  from totals;
$$;
