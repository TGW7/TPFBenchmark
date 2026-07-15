-- ---------------------------------------------------------------------------
-- 0003 — published standards: the shared single source of truth for HABS +
-- ORS config, readable by both tpf-benchmark and tpf-app from the same
-- Supabase project they already share.
--
-- Why this exists: HABS (Lift pathway weights) and ORS (Operator standards)
-- were each independently duplicated into tpf-app as hardcoded TS constants
-- (habs_pathways.ts, operational_readiness.ts), manually kept in sync by
-- comment-convention ("SOURCE OF TRUTH: tpf-benchmark... update in the same
-- pass") with no enforcement. This table is the mechanism that removes the
-- manual step: tpf-benchmark PUBLISHES its codegen output here on every
-- standards change (`npm run publish-standards`); tpf-app can then READ from
-- here instead of hardcoding its own copy — one publish updates both, once
-- tpf-app is wired to consume it (see docs/SHARED-STANDARDS.md).
--
-- One row per brand, always the CURRENT published config (upserted, not
-- versioned history — "latest publish" IS the source of truth). The full
-- codegen'd JSON (weights + thresholds + benchmark sourcing) is stored as a
-- single JSONB payload rather than normalised into many small rows — simpler
-- to publish and simpler for a consumer to destructure, and matches how both
-- repos already pass this data around internally.
-- ---------------------------------------------------------------------------

create table if not exists public.benchmark_published_standards (
  brand         text primary key check (brand in ('lift', 'operator')),
  payload       jsonb not null,
  source_commit text,                              -- git SHA at publish time, for traceability
  published_at  timestamptz not null default now()
);

comment on table public.benchmark_published_standards is
  'Shared source of truth for HABS (brand=lift) and ORS (brand=operator) '
  'config — weights + tier thresholds, codegen output from the Excel masters. '
  'tpf-benchmark publishes; tpf-app (once wired) and this site both read the '
  'same row instead of each keeping its own copy.';

alter table public.benchmark_published_standards enable row level security;

-- Public read — this is training-standards data, not user data; both apps
-- (and anyone else) can read it without auth. No anon/authenticated write
-- policy is defined, so only the service_role (used by the publish script)
-- can insert/update — RLS defaults to deny when no policy matches.
create policy "anyone can read published standards"
  on public.benchmark_published_standards
  for select using (true);
