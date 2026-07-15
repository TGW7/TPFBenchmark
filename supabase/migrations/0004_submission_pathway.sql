-- ---------------------------------------------------------------------------
-- 0004 — pathway context on pool submissions, needed to recalibrate Operator
-- standards correctly.
--
-- Lift's per-benchmark tiers are pathway-INDEPENDENT (back_squat_1rm has one
-- universal tier set; only the pathway WEIGHT changes). Operator's are
-- pathway-DEPENDENT: the same benchmark id (e.g. "back_squat") has genuinely
-- different correct thresholds per unit (USMC 100/125/150/175 kg vs SEAL
-- 100/135/150/180 kg — different roles, different bar). Without knowing which
-- unit a submission was scored under, recalibration can't tell which tier set
-- a value should be validated against, and pooling two units' submissions
-- under one benchmark_id would silently blend two different standards.
--
-- Nullable, additive: existing Lift rows are unaffected (NULL = "not
-- pathway-specific", matching their actual semantics); only new Operator-
-- brand submissions populate it going forward (see src/data/pool.ts).
-- ---------------------------------------------------------------------------

alter table public.benchmark_submissions
  add column if not exists pathway_id text;

comment on column public.benchmark_submissions.pathway_id is
  'Operator brand only: the unit id (e.g. navy_seal_bud_s) a benchmark was '
  'scored under. NULL for Lift/Hybrid, where tiers are pathway-independent.';

-- Recalibration groups Operator cells by (pathway_id, benchmark_id) — index
-- for that access pattern, mirroring the existing (brand, benchmark_id, sex,
-- age_band) index from 0001.
create index if not exists benchmark_submissions_pathway_idx
  on public.benchmark_submissions (brand, pathway_id, benchmark_id)
  where pathway_id is not null;
