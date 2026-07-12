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

  it('matches the tpf-app base tables on every shared benchmark (6-tier)', () => {
    // hybrid_readiness.ts STANDARDS_MALE/FEMALE — update BOTH in one pass.
    // Tuple order: pass, novice, good, intermediate, advanced, elite
    // (excellent omitted — vestigial once novice/intermediate/advanced exist).
    const shared: Record<string, { M: number[]; F: number[] }> = {
      back_squat_1rm:   { M: [80, 100, 120, 145, 165, 190],   F: [50, 60, 75, 90, 105, 120] },
      deadlift_1rm:     { M: [95, 115, 140, 165, 195, 225],   F: [65, 75, 90, 110, 125, 145] },
      bench_1rm:        { M: [70, 85, 100, 120, 140, 160],    F: [40, 50, 55, 65, 80, 90] },
      strict_press_1rm: { M: [40, 50, 60, 70, 85, 95],        F: [20, 30, 35, 40, 50, 55] },
      power_clean_1rm:  { M: [50, 60, 75, 90, 105, 120],      F: [30, 40, 50, 60, 70, 78] },
      run_1mi:          { M: [545, 455, 390, 370, 330, 300],  F: [620, 520, 455, 435, 395, 360] },
      run_5k:           { M: [1805, 1500, 1320, 1170, 1140, 1050], F: [2080, 1735, 1525, 1355, 1335, 1245] },
      row_2k:           { M: [555, 505, 460, 425, 405, 390],  F: [640, 580, 525, 485, 455, 435] },
    };
    for (const [id, tiers] of Object.entries(shared)) {
      for (const sex of ['M', 'F'] as const) {
        const t = STANDARDS_THRESHOLDS[id][sex];
        expect(
          [t.pass, t.novice, t.good, t.intermediate, t.advanced, t.elite],
          `${id}/${sex}`,
        ).toEqual(tiers[sex]);
      }
    }
  });

  it('every populated benchmark carries novice/intermediate/advanced tiers (six levels, not four)', () => {
    for (const s of BENCHMARK_SOURCING) {
      if (s.id.includes('front_squat') || s.id.includes('snatch') || s.id.includes('clean_jerk')
        || ['back_squat_1rm', 'deadlift_1rm', 'bench_1rm', 'strict_press_1rm', 'power_clean_1rm', 'run_1mi', 'run_5k', 'row_2k'].includes(s.id)) {
        const t = STANDARDS_THRESHOLDS[s.id];
        expect(t.M.novice, `${s.id}/M novice`).not.toBeNull();
        expect(t.M.intermediate, `${s.id}/M intermediate`).not.toBeNull();
        expect(t.M.advanced, `${s.id}/M advanced`).not.toBeNull();
        expect(t.F.novice, `${s.id}/F novice`).not.toBeNull();
        expect(t.F.intermediate, `${s.id}/F intermediate`).not.toBeNull();
        expect(t.F.advanced, `${s.id}/F advanced`).not.toBeNull();
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
    // Round 6 (owner): every pass/good is a multiple of 5.
    expect(pl.back_squat_1rm.M.pass! % 5).toBe(0);
    expect(pl.back_squat_1rm.M.good! % 5).toBe(0);
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

  it('every override tier set is complete and strictly ordered (six-tier when novice is present)', () => {
    // Strict pairwise comparisons, not a sort-equality check — a sort
    // leaves exact TIES in place (stable sort), so it can't catch two
    // adjacent tiers landing on the same number after rounding. That gap
    // let a real bug ship: hyrox/triathlete F strict_press novice landed
    // on 30, tying `good`=30, undetected until a round-9 diagnostic caught it.
    for (const [pathway, overrides] of Object.entries(PATHWAY_STANDARD_OVERRIDES)) {
      for (const [id, bySex] of Object.entries(overrides!)) {
        const def = byId(id);
        expect(def, `${pathway} overrides unknown benchmark ${id}`).toBeTruthy();
        for (const sex of ['M', 'F'] as const) {
          const t = bySex[sex];
          if (t.pass == null) continue; // sex not overridden → base
          const tiers = t.novice != null
            ? [t.pass, t.novice, t.good, t.intermediate, t.advanced, t.elite]
            : [t.pass, t.good, t.excellent, t.elite];
          expect(tiers.every((v) => v != null), `${pathway}/${id}/${sex} incomplete`).toBe(true);
          for (let i = 0; i < tiers.length - 1; i++) {
            if (def.lowerIsBetter) {
              expect(tiers[i]!, `${pathway}/${id}/${sex} tier order @${i}`).toBeGreaterThan(tiers[i + 1]!);
            } else {
              expect(tiers[i]!, `${pathway}/${id}/${sex} tier order @${i}`).toBeLessThan(tiers[i + 1]!);
            }
          }
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
