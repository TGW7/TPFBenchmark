/**
 * 2026-07-12 — per-pathway absolute standards (Standards_Pathway sheet).
 *
 * Owner decisions under test: all lift tiers absolute kg (no ×BW), each
 * pathway carries its own calibration (drug-tested feds for powerlifter),
 * anything not overridden falls back to the base Standards sheet, and the
 * app + benchmark stay in lockstep on the shared anchors.
 */
import { describe, expect, it } from 'vitest';
import { HRS_BENCHMARKS, withPathwayStandards } from '../config/benchmarks';
import {
  PATHWAY_STANDARD_OVERRIDES,
  STANDARDS_THRESHOLDS,
  BENCHMARK_SOURCING,
} from '../config/generated/standards.generated';
import { brandConfig } from '../data/brandConfig';

const byId = (id: string) => HRS_BENCHMARKS.find((b) => b.id === id)!;

describe('absolute standards (2026-07-12 conversion)', () => {
  it('no lift is bodyweight-normalised any more', () => {
    for (const s of BENCHMARK_SOURCING) {
      expect(s.normalization, `${s.id} must be absolute`).toBe('absolute');
      expect(s.unit, `${s.id} must not be xBW`).not.toBe('xBW');
    }
  });

  it('base = hybrid calibration with the 5-500-club anchors (225 kg DL, 5:00 mile)', () => {
    expect(STANDARDS_THRESHOLDS.deadlift_1rm.M.elite).toBe(225);
    expect(STANDARDS_THRESHOLDS.back_squat_1rm.M.elite).toBe(190);
    expect(STANDARDS_THRESHOLDS.run_1mi.M.elite).toBe(300); // 5:00
    expect(STANDARDS_THRESHOLDS.run_5k.M.elite).toBe(1050); // 17:30
  });

  it('matches the tpf-app base tables on every shared benchmark', () => {
    // hybrid_readiness.ts STANDARDS_MALE/FEMALE — update BOTH in one pass.
    const shared: Record<string, { M: number[]; F: number[] }> = {
      back_squat_1rm:   { M: [95, 125, 155, 190],  F: [60, 78, 97, 120] },
      deadlift_1rm:     { M: [110, 145, 180, 225], F: [72, 95, 118, 145] },
      bench_1rm:        { M: [80, 105, 130, 160],  F: [45, 59, 73, 90] },
      strict_press_1rm: { M: [45, 62, 77, 95],     F: [28, 36, 45, 55] },
      power_clean_1rm:  { M: [60, 78, 97, 120],    F: [38, 51, 63, 78] },
      run_1mi:          { M: [470, 400, 345, 300], F: [540, 465, 410, 360] },
      run_5k:           { M: [1560, 1350, 1185, 1050], F: [1800, 1560, 1380, 1245] },
      row_2k:           { M: [480, 440, 410, 390], F: [550, 500, 465, 435] },
    };
    for (const [id, tiers] of Object.entries(shared)) {
      for (const sex of ['M', 'F'] as const) {
        const t = STANDARDS_THRESHOLDS[id][sex];
        expect([t.pass, t.good, t.excellent, t.elite], `${id}/${sex}`).toEqual(tiers[sex]);
      }
    }
  });
});

describe('per-pathway overrides', () => {
  it('powerlifter elite = world-top-100 tested territory (M 340/240/380 S/B/D)', () => {
    // Owner calibration 2026-07-12: IPF classic raw WRs 321-363 kg in the
    // mid classes — elite means world-class, not top-percentile club lifter.
    const pl = PATHWAY_STANDARD_OVERRIDES.powerlifter!;
    expect(pl.back_squat_1rm.M.elite).toBe(340);
    expect(pl.bench_1rm.M.elite).toBe(240);
    expect(pl.deadlift_1rm.M.elite).toBe(380);
    expect(pl.back_squat_1rm.F.elite).toBe(210);
  });

  it('withPathwayStandards swaps overridden tiers and keeps the rest on base', () => {
    const defs = withPathwayStandards('powerlifter', HRS_BENCHMARKS);
    const squat = defs.find((b) => b.id === 'back_squat_1rm')!;
    expect(squat.thresholds.M.elite).toBe(340);
    // run_5k has no powerlifter override → base tiers.
    const run = defs.find((b) => b.id === 'run_5k')!;
    expect(run.thresholds).toEqual(byId('run_5k').thresholds);
    // Unknown pathway → untouched defs.
    expect(withPathwayStandards('nope', HRS_BENCHMARKS)).toEqual(HRS_BENCHMARKS);
  });

  it('every override tier set is complete and correctly ordered', () => {
    for (const [pathway, overrides] of Object.entries(PATHWAY_STANDARD_OVERRIDES)) {
      for (const [id, bySex] of Object.entries(overrides!)) {
        const def = byId(id);
        expect(def, `${pathway} overrides unknown benchmark ${id}`).toBeTruthy();
        for (const sex of ['M', 'F'] as const) {
          const t = bySex[sex];
          if (t.pass == null) continue; // sex not overridden → base
          const tiers = [t.pass, t.good, t.excellent, t.elite];
          expect(tiers.every((v) => v != null), `${pathway}/${id}/${sex} incomplete`).toBe(true);
          const sorted = def.lowerIsBetter
            ? [...tiers].sort((a, b) => b! - a!)
            : [...tiers].sort((a, b) => a! - b!);
          expect(tiers, `${pathway}/${id}/${sex} tier order`).toEqual(sorted);
        }
      }
    }
  });

  it('lift/hybrid brand configs serve pathway-resolved benchmarks', () => {
    for (const brand of ['lift', 'hybrid'] as const) {
      const cfg = brandConfig(brand);
      const squatFor = (p: string) =>
        cfg.benchmarksFor(p).find((b) => b.id === 'back_squat_1rm')!.thresholds.M.elite;
      expect(squatFor('powerlifter')).toBe(340);
      expect(squatFor('hyrox')).toBe(170);
      expect(squatFor('crossfit_generalist')).toBe(210); // owner-pegged (participation skew)
      expect(squatFor('hybrid_athlete')).toBe(190); // base, no override
    }
  });

  it('hybrid brand pathway list includes the triathlete (2026-07-12 fix)', () => {
    expect(brandConfig('hybrid').pathwayList.map((p) => p.id)).toContain('triathlete');
  });
});
