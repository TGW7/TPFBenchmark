/**
 * Build anonymised pool submissions from a session's logs.
 *
 * One row per benchmark the athlete has a value for. Bodyweight benchmarks are
 * stored ×bodyweight so percentiles are bodyweight-fair within a cell. Each row
 * carries a trust weight (audit T3). Clearly-bad entries are dropped.
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
  userId?: string | null;
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
 *  Operator's score did not change, so its cells stay on v2. */
export function overallPoolKey(pathwayId: string, brand: Brand = 'lift'): string {
  return `overall:${pathwayId}:${brand === 'operator' ? 'v2' : 'v3'}`;
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
      bodyweight_kg: args.profile.bodyweightKg,
      value,
      lower_is_better: b.lowerIsBetter,
      trust: trustScore({
        signedIn: args.signedIn,
        withinPlausibleRange: audit.level === 'ok',
      }),
      user_id: args.userId ?? null,
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
      bodyweight_kg: args.profile.bodyweightKg,
      value: args.overall,
      lower_is_better: false,
      trust: trustScore({ signedIn: args.signedIn, withinPlausibleRange: true }),
      user_id: args.userId ?? null,
    });
  }
  return rows;
}
