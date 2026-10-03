/**
 * Build percentile-pool submissions from a session's logs.
 *
 * One row per benchmark the athlete has a value for. Bodyweight benchmarks are
 * stored ×bodyweight so percentiles are bodyweight-fair within a cell. Each row
 * carries a trust weight (audit T3). Clearly-bad entries are dropped.
 *
 * 2026-10-03 (the TPF app's legal review, H1; docs/LEGAL-FIXES-2026-10-03.md
 * §3) — a row carries NO account id and NO bodyweight. Until then each row
 * stored `user_id` (so the pool was not anonymous, whatever the checkbox
 * said) and the bodyweight to 0.01 kg, which nothing reads. What a row holds
 * now is exactly what the percentile needs: brand, benchmark cell, sex, age
 * band, value, direction, trust (+ the Operator unit). Migration 0007 nulls
 * both columns on old rows and strips them from any new one. Contributing is
 * opt-in and unticked by default (POOL_OPT_IN_DEFAULT).
 *
 * No per-submission token either, on purpose: nothing needs to group a save's
 * rows, and grouping them would turn a save into one athlete's full set of
 * numbers — a fingerprint that could be matched against that athlete's own
 * saved entries.
 */

import { ageBand, auditEntry, rawForBenchmark, trustScore } from '../engine';
import type { AthleteLogs, AthleteProfile, BenchmarkDef } from '../engine/types';
import type { Brand } from '../brand';
import type { PoolRow } from './remote';

export interface BuildPoolArgs {
  brand: Brand;
  benchmarks: BenchmarkDef[];
  profile: AthleteProfile;
  logs: AthleteLogs;
  signedIn: boolean;
  /** Pathway + overall score → also pool a composite row for overall percentile. */
  pathwayId?: string;
  overall?: number | null;
}

/** Pool cell key for the composite overall score. Versioned: v2 =
 *  2026-07-12 absolute per-pathway recalibration — old rows scored on the
 *  ×BW calibration must not mix into the new percentile cells. v3 =
 *  2026-10-03, the HABS brands only — the HABS score moved to the TPF app's
 *  model (other components, other weights; docs/HABS-ALIGNMENT-2026-10-03.md),
 *  so a v2 HABS composite is a different number and must not rank a v3 one.
 *  The v2 rows are left in the table untouched (nothing here rewrites stored
 *  data); the per-benchmark rows are raw values and keep their cells.
 *  Operator's score did not change, so its cells stay on v2. v4 = later the
 *  same day: the HABS score now fills a missing race with the app's predicted
 *  equivalent (docs/LEGAL-FIXES-2026-10-03.md §6), so a partial athlete's
 *  score changed again; v3 rows are left untouched too. */
export function overallPoolKey(pathwayId: string, brand: Brand = 'lift'): string {
  return `overall:${pathwayId}:${brand === 'operator' ? 'v2' : 'v4'}`;
}

/** 2026-10-03 — contributing to the pool is OPT-IN: the box starts
 *  unticked. It was ticked by default until this date, which is not consent
 *  (UK GDPR Recital 32) — the TPF app's legal review, H1. */
export const POOL_OPT_IN_DEFAULT = false;

/** A stable signature of a set of pool rows. The page skips a second
 *  submission of exactly the same rows in one visit (the pool keeps no link
 *  to anyone, so the server cannot tell a repeat save from a new athlete). */
export function poolSubmissionSignature(rows: PoolRow[]): string {
  return JSON.stringify(
    rows
      .map((r) => [r.brand, r.benchmark_id, r.sex, r.age_band, r.value, r.lower_is_better, r.pathway_id ?? null])
      .sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1)),
  );
}

export function buildPoolSubmissions(args: BuildPoolArgs): PoolRow[] {
  const band = ageBand(args.profile.ageYears) ?? null;
  const rows: PoolRow[] = [];

  for (const b of args.benchmarks) {
    const raw = rawForBenchmark(b, args.logs);
    if (raw == null) continue;

    const audit = auditEntry(b, raw, args.profile);
    if (audit.level === 'reject') continue; // never pool implausible data

    const value =
      b.normalization === 'bodyweight' && args.profile.bodyweightKg > 0
        ? raw / args.profile.bodyweightKg
        : raw;

    // 2026-07-12 — lifts flipped ×BW → absolute kg: partition their pool
    // cells by unit so historical ×BW rows can't pollute kg percentiles.
    const cellId = b.source === 'orm' && b.unit === 'kg' ? `${b.id}:kg` : b.id;

    rows.push({
      brand: args.brand,
      benchmark_id: cellId,
      sex: args.profile.sex,
      age_band: band,
      value,
      lower_is_better: b.lowerIsBetter,
      trust: trustScore({
        signedIn: args.signedIn,
        withinPlausibleRange: audit.level === 'ok',
      }),
      // Operator tiers are per-unit (same benchmark id, different thresholds
      // across units) — tag the unit so recalibration can group correctly.
      // Lift/Hybrid tiers are pathway-independent, so this stays null there.
      pathway_id: args.brand === 'operator' ? args.pathwayId ?? null : null,
    });
  }

  // Composite "overall" row per pathway → powers the data-driven overall percentile.
  if (args.pathwayId && args.overall != null) {
    rows.push({
      brand: args.brand,
      benchmark_id: overallPoolKey(args.pathwayId, args.brand),
      sex: args.profile.sex,
      age_band: band,
      value: args.overall,
      lower_is_better: false,
      trust: trustScore({ signedIn: args.signedIn, withinPlausibleRange: true }),
    });
  }
  return rows;
}
