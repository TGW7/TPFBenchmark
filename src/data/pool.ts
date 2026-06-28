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

    rows.push({
      brand: args.brand,
      benchmark_id: b.id,
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
    });
  }

  // Composite "overall" row per pathway → powers the data-driven overall percentile.
  if (args.pathwayId && args.overall != null) {
    rows.push({
      brand: args.brand,
      benchmark_id: `overall:${args.pathwayId}`,
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
