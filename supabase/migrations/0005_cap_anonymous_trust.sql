-- ---------------------------------------------------------------------------
-- 0005 — cap anonymous submissions' self-reported trust.
--
-- benchmark_submissions' insert policy (0001) is `with check (true)` — any
-- request, including fully anonymous ones using the public anon key (it's
-- embedded in the client bundle, so this isn't a secret), can insert a row
-- with `trust` up to the column's own max of 1.0, bypassing the app's own
-- trustScore() entirely (src/engine/audit.ts): that function starts every
-- non-signed-in submission at 0.15 and only adds weight for signals (signed
-- in, cross-app verified, internally consistent, plausible range) an
-- anonymous request has none of. So 0.15 is the correct ceiling for a
-- genuinely anonymous row, not an arbitrary restriction — it's exactly what
-- the app itself would have computed.
--
-- Impact without this: the live "your percentile" number (fetchPercentile,
-- reading straight from the pool via a SECURITY DEFINER function, no human
-- review) can already be skewed by a bad-faith direct-API submission today.
-- Recalibration proposals are separately human-reviewed before being
-- applied, so that path was never at risk — this closes the live-read gap.
--
-- Authenticated inserts (auth.uid() present) keep the existing unrestricted
-- check: the app computes their trust server-side from richer signals, and
-- an authenticated actor is identity-tied (bannable) unlike an anonymous one.
-- ---------------------------------------------------------------------------

drop policy if exists "contribute submissions" on public.benchmark_submissions;

create policy "contribute submissions" on public.benchmark_submissions
  for insert
  with check (auth.uid() is not null or trust <= 0.15);
