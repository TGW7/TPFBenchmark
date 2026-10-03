/**
 * 2026-10-02 — the US Navy PRT unit, scoring ALTERNATIVES, and the minimum /
 * good / maximum rule, mirrored from tpf-app (src/lib/operational_readiness.ts;
 * the record is tpf-app docs/build/51_STANDARDS_REBUILD_2026-10-02.md §11).
 *
 * Owner, 2026-10-02: "Use navy tables. Military standards should be roughly
 * interchangeable but generally considered low as they are unlikely to
 * consider special forces. Be careful to differentiate between minimum
 * standards and good standards too, as minimums are often very low."
 *
 * The workbook edit is scripts/apply-navy-prt-and-military-tiers-2026-10-02.py.
 * The values pinned here are the app's, and were checked against the app's
 * live ORS_PATHWAY_CONFIGS with scripts/check-operator-vs-app.mjs (0
 * differences across the 13 mirrored units on 2026-10-02). These pins hold
 * this repository to those numbers; that script is what notices the APP move.
 *
 * 2026-10-02, latest — plan 54 (tpf-app docs/build/54_MILITARY_TOP_TIERS_COMPARISON.md
 * §11; the workbook edit is scripts/apply-military-top-tiers-2026-10-02.py). Four
 * pins below moved with the app: the Navy forearm plank Elite 225 → 270 (4:30, the
 * operator plank; Excellent kept at 3:04), the Navy deadlifts' Elite 185 / 170 →
 * 225 / 210 (hex / conventional — the deadlift Elite is always over 200 kg), and
 * the USMC push-ups and plank Elite 96 → 100 and 250 → 270. The deadlift rule on
 * every unit is pinned in operator-deadlift-elite-over-200.test.ts.
 *
 * 2026-10-03 — plan 55 (tpf-app docs/build/55_SPECIAL_FORCES_AND_ELITE_UNIT_TIERS.md
 * §10.2; changesets 2 and 3 of the same script) moved two pins here: the Navy
 * deadlift Excellents 160 / 145 → 180 / 165 (hex / conventional — the owner's
 * "even it out", Excellent = (Good + Elite) / 2 to the nearest 5 kg) and the
 * SEAL pull-up Elite 22 → 25 (special-forces tops). The plan-55 values are
 * pinned in operator-special-forces-tops.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { computeHRS, scoreComponent } from '../engine/score';
import type { AthleteLogs, BenchmarkDef, ThresholdSet } from '../engine/types';
import { OPERATOR_PATHWAYS } from '../config/generated/operator.generated';
import { OPERATOR_BENCHMARKS_BY_PATHWAY, OPERATOR_PATHWAY_CONFIGS } from '../config/operator';

const PROFILE = { sex: 'M' as const, bodyweightKg: 85 };
const logs = (p: Partial<AthleteLogs> = {}): AthleteLogs => ({ orm: [], raceTimes: [], manual: [], wod: [], ...p });
const T = (pass: number, good: number, excellent: number, elite: number): ThresholdSet => ({ pass, good, excellent, elite });
const unit = (id: string) => {
  const u = OPERATOR_PATHWAYS.find((p) => p.id === id);
  if (!u) throw new Error(`no unit ${id}`);
  return u;
};
const tiers = (unitId: string, benchId: string) => {
  const b = unit(unitId).benchmarks.find((x) => x.id === benchId);
  if (!b) throw new Error(`no ${unitId}/${benchId}`);
  const t = b.thresholds;
  return [t.pass, t.good, t.excellent, t.elite];
};

// ---- the engine rule (synthetic) ------------------------------------------

const alt = (id: string, group?: string): BenchmarkDef => ({
  id, component: 'running', source: 'manual', unit: 'reps', lowerIsBetter: false,
  normalization: 'absolute', thresholds: { M: T(10, 20, 30, 40), F: T(10, 20, 30, 40) },
  ...(group ? { alternativeGroup: group } : {}),
});

describe('scoreComponent — alternatives (alternativeGroup)', () => {
  const X = alt('x', 'g'); const Y = alt('y', 'g'); const Z = alt('z');

  it('a group counts ONCE, at its best member — not the average', () => {
    // x = 40 → 100 %, y = 10 → 50 %: the group is 100, not 75.
    const c = scoreComponent('running', [X, Y], PROFILE, logs({ manual: [{ benchmarkId: 'x', value: 40 }, { benchmarkId: 'y', value: 10 }] }));
    expect(c.percent).toBeCloseTo(100);
  });

  it('a worse alternative cannot pull the score down, and one not done costs nothing', () => {
    const one = scoreComponent('running', [X, Y], PROFILE, logs({ manual: [{ benchmarkId: 'x', value: 30 }] }));
    const both = scoreComponent('running', [X, Y], PROFILE, logs({ manual: [{ benchmarkId: 'x', value: 30 }, { benchmarkId: 'y', value: 12 }] }));
    expect(one.percent).toBeCloseTo(85);
    expect(both.percent).toBeCloseTo(85);
  });

  it('the group is one value beside an ordinary benchmark in the same component', () => {
    // group best 100 (x = 40), ordinary z = 20 → 70: (100 + 70) / 2 = 85.
    const c = scoreComponent('running', [X, Y, Z], PROFILE, logs({ manual: [
      { benchmarkId: 'x', value: 40 }, { benchmarkId: 'y', value: 10 }, { benchmarkId: 'z', value: 20 },
    ] }));
    expect(c.percent).toBeCloseTo(85);
  });

  it('marks a scored, non-best alternative counted: false — never the best, an ordinary or an empty one', () => {
    const c = scoreComponent('running', [X, Y, Z, alt('w', 'g')], PROFILE, logs({ manual: [
      { benchmarkId: 'x', value: 40 }, { benchmarkId: 'y', value: 10 }, { benchmarkId: 'z', value: 20 },
    ] }));
    const by = Object.fromEntries(c.benchmarks.map((b) => [b.benchmarkId, b]));
    expect(by.x.counted).toBeUndefined();
    expect(by.y.counted).toBe(false);
    expect(by.z.counted).toBeUndefined();
    expect(by.w.counted).toBeUndefined(); // no data
  });

  it('a tie goes to the first listed (as the app)', () => {
    const c = scoreComponent('running', [X, Y], PROFILE, logs({ manual: [{ benchmarkId: 'x', value: 20 }, { benchmarkId: 'y', value: 20 }] }));
    expect(c.benchmarks.find((b) => b.benchmarkId === 'x')?.counted).toBeUndefined();
    expect(c.benchmarks.find((b) => b.benchmarkId === 'y')?.counted).toBe(false);
  });

  it('without a group, every benchmark is averaged exactly as before', () => {
    const c = scoreComponent('running', [alt('p'), alt('q')], PROFILE, logs({ manual: [{ benchmarkId: 'p', value: 40 }, { benchmarkId: 'q', value: 10 }] }));
    expect(c.percent).toBeCloseTo(75);
  });
});

// ---- the US Navy PRT unit --------------------------------------------------

describe('US Navy (PRT) — the app’s `navy` pathway', () => {
  it('exists, is US, and carries the app’s weights', () => {
    const u = unit('us_navy_prt');
    expect(u.region).toBe('US');
    expect(u.weightsInferred).toBe(false);
    expect(u.weights).toEqual({ running: 35, lower_strength: 10, upper_strength: 5, upper_endurance: 20, stability: 20, grip: 5, power: 5 });
  });

  it('reads the Navy PRT table, men 17-19: Probationary / Good High / Excellent High, Elite above Outstanding High', () => {
    // Outstanding High (the maximum): run 8:15, row 7:00, 500-yd 6:30, 450 m 6:20,
    // push-ups 92, plank 3:24 — each strictly inside Elite.
    expect(tiers('us_navy_prt', '1_5_mile_run')).toEqual([765, 600, 555, 470]);
    expect(tiers('us_navy_prt', 'row_2k')).toEqual([560, 490, 450, 400]);
    expect(tiers('us_navy_prt', '500_yd_swim_alternate')).toEqual([765, 555, 465, 370]);
    expect(tiers('us_navy_prt', '450_m_swim_alternate')).toEqual([755, 545, 455, 360]);
    expect(tiers('us_navy_prt', 'push_ups_2_min')).toEqual([42, 68, 82, 101]);
    expect(tiers('us_navy_prt', 'plank_front')).toEqual([71, 143, 184, 270]); // 2026-10-02 plan 54: Elite 225 → 270 (4:30)
  });

  it('strength, grip and power are TPF’s own — the app’s general-military rows', () => {
    expect(tiers('us_navy_prt', 'back_squat')).toEqual([80, 105, 130, 155]);
    // 2026-10-02 plan 54 Q9: Elite 185 → 225 (hex), 170 → 210 (conventional).
    // 2026-10-03 the deadlift Excellent evened out (round5((Good + Elite) / 2)): 160 → 180, 145 → 165.
    expect(tiers('us_navy_prt', 'hex_bar_dl')).toEqual([100, 130, 180, 225]);
    expect(tiers('us_navy_prt', 'conventional_dl')).toEqual([90, 115, 165, 210]);
    expect(tiers('us_navy_prt', 'bench_press')).toEqual([60, 80, 100, 120]);
    expect(tiers('us_navy_prt', 'dead_hang_grip')).toEqual([30, 50, 75, 100]);
    expect(tiers('us_navy_prt', 'power_clean')).toEqual([50, 70, 90, 110]);
    expect(tiers('us_navy_prt', 'broad_jump')).toEqual([1.7, 1.9, 2.1, 2.3]);
    expect(unit('us_navy_prt').benchmarks).toHaveLength(13);
  });

  it('the cardio event is ONE alternative group of four; nothing else is grouped anywhere', () => {
    const grouped = OPERATOR_PATHWAYS.flatMap((u) => u.benchmarks.filter((b) => b.alternativeGroup).map((b) => `${u.id}/${b.id}/${b.alternativeGroup}`));
    expect(grouped).toEqual([
      'us_navy_prt/1_5_mile_run/prt_cardio', 'us_navy_prt/row_2k/prt_cardio',
      'us_navy_prt/500_yd_swim_alternate/prt_cardio', 'us_navy_prt/450_m_swim_alternate/prt_cardio',
    ]);
    // The group reaches the engine-facing defs.
    expect(OPERATOR_BENCHMARKS_BY_PATHWAY.us_navy_prt.filter((b) => b.alternativeGroup)).toHaveLength(4);
  });

  it('shares input ids with the rest of the site: the 2 km row is row_2k (the app-sync id), the plank is plank_front', () => {
    const ids = unit('us_navy_prt').benchmarks.map((b) => b.id);
    expect(ids).toContain('row_2k');
    expect(ids).toContain('plank_front');
    expect(ids).toContain('1_5_mile_run'); // the same id as US Police PFT's run
  });

  it('scores the better cardio option: runs 11:30 (59 %) and rows 7:20 (88 %) → the cardio component is 88', () => {
    const r = computeHRS({
      pathway: OPERATOR_PATHWAY_CONFIGS.us_navy_prt,
      benchmarks: OPERATOR_BENCHMARKS_BY_PATHWAY.us_navy_prt,
      profile: PROFILE,
      logs: logs({ raceTimes: [
        { benchmarkId: '1_5_mile_run', modality: 'run', event: '1.5mile', timeSec: 690 },
        { benchmarkId: 'row_2k', modality: 'row', event: '2k', timeSec: 440 },
      ] }),
    });
    const running = r.components.find((c) => c.component === 'running');
    expect(running?.percent).toBeCloseTo(88);
    expect(running?.benchmarks.find((b) => b.benchmarkId === '1_5_mile_run')?.counted).toBe(false);
    expect(r.overall).toBeCloseTo(88); // the only component tested (the site re-normalises)
  });

  it('the PRT maximum on every event scores in the Excellent band, never 100', () => {
    const at = (benchmarkId: string, timeSec: number) => ({ benchmarkId, modality: 'x', event: 'x', timeSec });
    const r = computeHRS({
      pathway: OPERATOR_PATHWAY_CONFIGS.us_navy_prt,
      benchmarks: OPERATOR_BENCHMARKS_BY_PATHWAY.us_navy_prt,
      profile: PROFILE,
      logs: logs({
        raceTimes: [at('1_5_mile_run', 495)],
        manual: [{ benchmarkId: 'push_ups_2_min', value: 92 }, { benchmarkId: 'plank_front', value: 204 }],
      }),
    });
    for (const c of r.components.filter((x) => x.percent != null)) {
      expect(c.percent, c.component).toBeGreaterThan(85);
      expect(c.percent, c.component).toBeLessThan(100);
    }
  });
});

// ---- the rule on the other mirrored general-table ladders -------------------

describe('Elite above a general table’s maximum; Pass never below a minimum (app §11.3)', () => {
  it('US Marine Corps: Elite moved above the PFT maximum (18:00, 23, 87, 3:45)', () => {
    expect(tiers('us_marine_corps_pft_cft', '3_mile_run')).toEqual([1660, 1260, 1170, 1025]);
    expect(tiers('us_marine_corps_pft_cft', 'pull_ups_no_time')).toEqual([3, 12, 18, 25]);
    expect(tiers('us_marine_corps_pft_cft', 'push_ups_2_min')).toEqual([42, 60, 75, 100]); // 2026-10-02 plan 54: 96 → 100
    expect(tiers('us_marine_corps_pft_cft', 'plank_front')).toEqual([63, 180, 210, 270]); // 2026-10-02 plan 54: 250 → 270
  });

  it('US Police PFT: Elite moved above each table maximum (Navy 20-24 8:30; USAF PFRA 67, 58)', () => {
    expect(tiers('us_police_pft', '1_5_mile_run')).toEqual([810, 645, 585, 485]);
    expect(tiers('us_police_pft', 'push_ups_1_min')).toEqual([30, 45, 57, 74]);
    expect(tiers('us_police_pft', 'sit_ups_1_min')).toEqual([33, 43, 51, 64]);
  });

  it('Navy SEAL: pull-up Pass is the BUD/S PST minimum (10), not below it', () => {
    // 2026-10-03 — Elite 22 → 25 (plan 55: a special-forces top is at least the
    // hardest general unit's, here USMC / infantry 25). The Pass is unchanged.
    expect(tiers('navy_seal_bud_s', 'pull_ups_no_time')).toEqual([10, 13, 18, 25]);
  });

  it('every one of those maxima sits strictly between Excellent and Elite', () => {
    const cases: Array<[string, string, number]> = [
      ['us_marine_corps_pft_cft', '3_mile_run', 1080], ['us_marine_corps_pft_cft', 'pull_ups_no_time', 23],
      ['us_marine_corps_pft_cft', 'push_ups_2_min', 87], ['us_marine_corps_pft_cft', 'plank_front', 225],
      ['us_police_pft', '1_5_mile_run', 510], ['us_police_pft', 'push_ups_1_min', 67], ['us_police_pft', 'sit_ups_1_min', 58],
      ['us_navy_prt', '1_5_mile_run', 495], ['us_navy_prt', 'row_2k', 420], ['us_navy_prt', '500_yd_swim_alternate', 390],
      ['us_navy_prt', '450_m_swim_alternate', 380], ['us_navy_prt', 'push_ups_2_min', 92], ['us_navy_prt', 'plank_front', 204],
    ];
    for (const [u, b, max] of cases) {
      const [, , excellent, elite] = tiers(u, b) as number[];
      const lower = unit(u).benchmarks.find((x) => x.id === b)?.lowerIsBetter;
      if (lower) { expect(max, `${u}/${b}`).toBeLessThanOrEqual(excellent); expect(elite, `${u}/${b}`).toBeLessThan(max); }
      else { expect(max, `${u}/${b}`).toBeGreaterThanOrEqual(excellent); expect(elite, `${u}/${b}`).toBeGreaterThan(max); }
    }
  });
});
