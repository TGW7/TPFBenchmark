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

  it('matches the tpf-app base table on every shared benchmark (6-tier)', () => {
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

  it('matches the tpf-app pathway overrides on every shared benchmark, all 7 pathways (2026-07-13)', () => {
    // The test above only ever covered the BASE table — pathway overrides
    // (gym_goer/crossfit/hyrox/triathlete/powerlifter/bodybuilder's own
    // lift and run/row numbers) had NO cross-repo check at all, and drifted
    // apart silently over several earlier rounds: 78 mismatched values were
    // found across gym_goer/crossfit_generalist/triathlete's run/row tiers
    // plus a handful of 1-5 kg lift rounding differences, none caught until
    // an explicit owner request to verify sync. Fixed by taking the app's
    // habs_pathway_standards.ts as canonical and updating the benchmark
    // workbook to match exactly — this test pins that down so it can't
    // silently drift again. Powerlifter/hyrox/hybrid_athlete had already
    // been exact-verified by other tests in this file; included here too
    // for one single source of truth.
    const shared: Record<string, Record<string, { M: number[]; F: number[] }>> = {
      hybrid_athlete: {
        back_squat_1rm: { M: [80, 100, 120, 145, 165, 190], F: [50, 60, 75, 90, 105, 120] },
        deadlift_1rm: { M: [95, 115, 140, 165, 195, 225], F: [65, 75, 90, 110, 125, 145] },
        bench_1rm: { M: [70, 85, 100, 120, 140, 160], F: [40, 50, 55, 65, 80, 90] },
        strict_press_1rm: { M: [40, 50, 60, 70, 85, 95], F: [20, 30, 35, 40, 50, 55] },
        power_clean_1rm: { M: [50, 60, 75, 90, 105, 120], F: [30, 40, 50, 60, 70, 78] },
        run_1mi: { M: [545, 455, 390, 370, 330, 300], F: [620, 520, 455, 435, 395, 360] },
        run_5k: { M: [1805, 1500, 1320, 1170, 1140, 1050], F: [2080, 1735, 1525, 1355, 1335, 1245] },
        row_2k: { M: [555, 505, 460, 425, 405, 390], F: [640, 580, 525, 485, 455, 435] },
      },
      gym_goer: {
        back_squat_1rm: { M: [80, 100, 120, 145, 165, 190], F: [50, 60, 75, 90, 105, 120] },
        deadlift_1rm: { M: [95, 115, 140, 165, 195, 225], F: [65, 75, 90, 110, 125, 145] },
        bench_1rm: { M: [70, 85, 100, 120, 140, 160], F: [40, 50, 55, 65, 80, 90] },
        strict_press_1rm: { M: [40, 50, 60, 70, 85, 95], F: [20, 30, 35, 40, 50, 55] },
        power_clean_1rm: { M: [50, 60, 75, 90, 105, 120], F: [30, 40, 50, 60, 70, 78] },
        run_1mi: { M: [620, 545, 470, 415, 375, 345], F: [725, 635, 550, 490, 445, 410] },
        run_5k: { M: [2080, 1815, 1575, 1385, 1240, 1140], F: [2355, 2080, 1825, 1610, 1450, 1350] },
        row_2k: { M: [580, 530, 485, 445, 420, 405], F: [660, 605, 550, 505, 475, 460] },
      },
      crossfit_generalist: {
        back_squat_1rm: { M: [85, 110, 135, 160, 185, 210], F: [60, 75, 90, 110, 130, 150] },
        deadlift_1rm: { M: [90, 115, 140, 165, 185, 210], F: [65, 75, 95, 110, 130, 150] },
        bench_1rm: { M: [70, 85, 100, 115, 130, 140], F: [35, 45, 50, 65, 80, 90] },
        strict_press_1rm: { M: [40, 50, 60, 70, 85, 95], F: [20, 30, 35, 40, 50, 55] },
        power_clean_1rm: { M: [55, 65, 80, 100, 120, 135], F: [35, 45, 50, 65, 80, 95] },
        run_1mi: { M: [570, 505, 440, 385, 345, 330], F: [660, 580, 500, 445, 405, 380] },
        run_5k: { M: [1870, 1670, 1480, 1315, 1190, 1110], F: [2110, 1885, 1670, 1490, 1365, 1290] },
        row_2k: { M: [545, 495, 450, 415, 395, 380], F: [620, 565, 520, 485, 455, 440] },
      },
      hyrox: {
        back_squat_1rm: { M: [70, 85, 105, 130, 150, 170], F: [45, 55, 70, 85, 95, 110] },
        deadlift_1rm: { M: [90, 115, 135, 160, 185, 210], F: [60, 70, 85, 105, 125, 140] },
        bench_1rm: { M: [55, 65, 80, 95, 110, 125], F: [30, 40, 50, 60, 65, 75] },
        strict_press_1rm: { M: [35, 45, 50, 60, 70, 80], F: [20, 25, 30, 40, 45, 52] },
        power_clean_1rm: { M: [45, 55, 65, 80, 90, 105], F: [30, 40, 45, 55, 65, 72] },
        // no run/row override — inherits base
        run_1mi: { M: [545, 455, 390, 370, 330, 300], F: [620, 520, 455, 435, 395, 360] },
        run_5k: { M: [1805, 1500, 1320, 1170, 1140, 1050], F: [2080, 1735, 1525, 1355, 1335, 1245] },
        row_2k: { M: [555, 505, 460, 425, 405, 390], F: [640, 580, 525, 485, 455, 435] },
      },
      triathlete: {
        back_squat_1rm: { M: [65, 75, 90, 110, 125, 145], F: [45, 55, 70, 85, 95, 110] },
        deadlift_1rm: { M: [75, 95, 110, 135, 155, 180], F: [60, 70, 85, 100, 120, 135] },
        bench_1rm: { M: [45, 55, 65, 80, 90, 105], F: [25, 40, 45, 55, 60, 70] },
        strict_press_1rm: { M: [30, 40, 45, 55, 60, 70], F: [20, 25, 30, 35, 40, 48] },
        power_clean_1rm: { M: [40, 50, 55, 65, 80, 90], F: [25, 35, 40, 50, 60, 66] },
        run_1mi: { M: [515, 460, 405, 355, 315, 280], F: [600, 535, 470, 415, 365, 330] },
        run_5k: { M: [1735, 1520, 1325, 1175, 1060, 980], F: [2010, 1770, 1545, 1375, 1245, 1160] },
        row_2k: { M: [545, 495, 450, 415, 395, 380], F: [620, 565, 515, 475, 445, 425] },
      },
      powerlifter: {
        back_squat_1rm: { M: [105, 140, 180, 225, 280, 340], F: [70, 90, 115, 145, 175, 210] },
        deadlift_1rm: { M: [125, 155, 195, 240, 300, 380], F: [80, 100, 125, 155, 195, 250] },
        bench_1rm: { M: [85, 105, 130, 160, 195, 240], F: [50, 60, 75, 90, 110, 135] },
        strict_press_1rm: { M: [55, 65, 80, 95, 110, 135], F: [35, 40, 45, 55, 65, 75] },
        power_clean_1rm: { M: [50, 60, 75, 90, 105, 120], F: [30, 40, 50, 60, 70, 78] },
        // no run/row override — inherits base
        run_1mi: { M: [545, 455, 390, 370, 330, 300], F: [620, 520, 455, 435, 395, 360] },
        run_5k: { M: [1805, 1500, 1320, 1170, 1140, 1050], F: [2080, 1735, 1525, 1355, 1335, 1245] },
        row_2k: { M: [555, 505, 460, 425, 405, 390], F: [640, 580, 525, 485, 455, 435] },
      },
      bodybuilder: {
        back_squat_1rm: { M: [80, 100, 135, 160, 185, 210], F: [50, 60, 85, 100, 115, 130] },
        deadlift_1rm: { M: [95, 115, 140, 175, 205, 230], F: [65, 75, 95, 115, 130, 150] },
        bench_1rm: { M: [70, 85, 100, 120, 140, 160], F: [40, 50, 55, 65, 75, 85] },
        strict_press_1rm: { M: [40, 50, 65, 75, 90, 100], F: [20, 30, 40, 45, 55, 62] },
        power_clean_1rm: { M: [50, 60, 75, 90, 105, 120], F: [30, 40, 50, 60, 70, 78] },
        // no run/row override — inherits base
        run_1mi: { M: [545, 455, 390, 370, 330, 300], F: [620, 520, 455, 435, 395, 360] },
        run_5k: { M: [1805, 1500, 1320, 1170, 1140, 1050], F: [2080, 1735, 1525, 1355, 1335, 1245] },
        row_2k: { M: [555, 505, 460, 425, 405, 390], F: [640, 580, 525, 485, 455, 435] },
      },
    };
    for (const [pathway, byBenchmark] of Object.entries(shared)) {
      const overrides = pathway === 'hybrid_athlete' ? null : PATHWAY_STANDARD_OVERRIDES[pathway as keyof typeof PATHWAY_STANDARD_OVERRIDES];
      for (const [id, tiers] of Object.entries(byBenchmark)) {
        const t = (overrides?.[id] ?? STANDARDS_THRESHOLDS[id]) as typeof STANDARDS_THRESHOLDS[string];
        for (const sex of ['M', 'F'] as const) {
          const s = t[sex];
          expect(
            [s.pass, s.novice, s.good, s.intermediate, s.advanced, s.elite],
            `${pathway}/${id}/${sex}`,
          ).toEqual(tiers[sex]);
        }
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
