/**
 * 2026-10-03 — the HABS score, aligned with the TPF app (owner: "make HABS
 * score align"; docs/HABS-ALIGNMENT-2026-10-03.md).
 *
 * These pins are typed literals, so they catch a change HERE. Only
 * `npm run check:app-habs -- <path to tpf-app>` (scripts/check-habs-vs-app.mjs)
 * runs the app's own computeHABS and so sees the APP move; it is not part of
 * `npm test` (CI has no app checkout).
 */
import { describe, expect, it } from 'vitest';
import {
  computeHabs,
  HABS_COMPONENT_IDS,
  habsAsHrsResult,
  habsBenchmarkScore,
  habsLadder,
  habsOneRepMax,
  habsScoreValue,
} from '../engine/habs';
import type { AthleteLogs, HabsComponentId, Sex, ThresholdSet } from '../engine/types';
import { HABS_OLYMPIC_IDS, habsWeightsFor, inHabsScore, liftBenchmarksFor } from '../config/habs';
import { HABS_COMPONENT_LABEL } from '../config/habsDisplay';
import { HRS_BENCHMARKS } from '../config/benchmarks';
import { HABS_PATHWAY_WEIGHTS, PATHWAY_STANDARD_OVERRIDES, STANDARDS_THRESHOLDS } from '../config/generated/standards.generated';
import { PATHWAY_IDS } from '../config/pathways';
import { brandConfig } from '../data/brandConfig';

const empty = (): AthleteLogs => ({ orm: [], raceTimes: [], manual: [], wod: [] });
function athlete(lifts: Record<string, [number, number]>, races: Record<string, number>): AthleteLogs {
  return {
    orm: Object.entries(lifts).map(([benchmarkId, [weightKg, reps]]) => ({ benchmarkId, weightKg, reps })),
    raceTimes: Object.entries(races).map(([benchmarkId, timeSec]) => ({ benchmarkId, modality: 'x', event: benchmarkId, timeSec })),
    manual: [],
    wod: [],
  };
}
const score = (pathwayId: string, sex: Sex, logs: AthleteLogs) =>
  computeHabs({ benchmarks: liftBenchmarksFor(pathwayId), weights: habsWeightsFor(pathwayId), sex, logs, olympicIds: HABS_OLYMPIC_IDS });

describe('the app\'s HABS model, held here (2026-10-03)', () => {
  it('nine components, in the app\'s COMPONENT_DEFS order, with the app\'s labels', () => {
    expect(HABS_COMPONENT_IDS).toEqual([
      'lower_strength', 'power', 'upper_push', 'upper_pull',
      'run_intensity', 'run_distance', 'swimming', 'cycling', 'erg',
    ]);
    expect(HABS_COMPONENT_LABEL).toEqual({
      lower_strength: 'Lower-body strength', power: 'Power',
      upper_push: 'Upper-body push', upper_pull: 'Upper-body pull',
      run_intensity: 'Running (intensity)', run_distance: 'Running (distance)',
      swimming: 'Swimming', cycling: 'Cycling', erg: 'Rowing / erg',
    });
  });

  it('which benchmark feeds which component (tpf-app habs.ts COMPONENT_DEFS)', () => {
    const members: Record<string, string[]> = {};
    for (const b of HRS_BENCHMARKS) if (b.habsComponent) (members[b.habsComponent] ??= []).push(b.id);
    expect(members).toEqual({
      lower_strength: ['back_squat_1rm', 'deadlift_1rm'],
      power: ['power_clean_1rm'],
      upper_push: ['bench_1rm', 'strict_press_1rm'],
      upper_pull: ['barbell_row_1rm'],
      run_intensity: ['run_1mi', 'run_5k'],
      run_distance: ['run_10k', 'run_half'],
      swimming: ['swim_400m', 'swim_1500m'],
      cycling: ['bike_20k', 'bike_40k'],
      erg: ['row_2k'],
    });
  });

  it('the app\'s literal HABS_PATHWAY_WEIGHTS, each pathway summing to 100', () => {
    const order = HABS_COMPONENT_IDS;
    const row = (p: string) => order.map((c) => HABS_PATHWAY_WEIGHTS[p]?.[c] ?? null);
    expect(row('gym_goer')).toEqual([28.6, 14.3, 14.9, 13.7, 7.1, 7.1, 0, 0, 14.3]);
    expect(row('hybrid_athlete')).toEqual([20, 13.4, 10.4, 9.6, 13.3, 13.3, 0, 0, 20]);
    expect(row('crossfit_generalist')).toEqual([22.6, 19.2, 10.1, 9.3, 9.7, 9.7, 0, 0, 19.4]);
    expect(row('hyrox')).toEqual([20.8, 9.1, 5.4, 5, 21.4, 21.4, 0, 0, 16.9]);
    expect(row('powerlifter')).toEqual([50, 11.1, 20.2, 18.7, 0, 0, 0, 0, 0]);
    expect(row('bodybuilder')).toEqual([43.8, 12.5, 22.7, 21, 0, 0, 0, 0, 0]);
    expect(row('triathlete')).toEqual([10, 5, 5, 5, 12.5, 12.5, 25, 25, 0]);
    for (const p of PATHWAY_IDS) {
      const sum = order.reduce((s, c) => s + (HABS_PATHWAY_WEIGHTS[p]?.[c] ?? 0), 0);
      expect(sum, p).toBeCloseTo(100, 6);
    }
  });

  it('the 10 km and half are derived from the 5 km as the app derives them (Riegel 1.06, 10 s)', () => {
    const riegel = (t: number, d: number) => Math.round(t * Math.pow(d / 5000, 1.06) / 10) * 10;
    const tiers = ['pass', 'novice', 'good', 'intermediate', 'advanced', 'elite'] as const;
    const check = (five: ThresholdSet, ten: ThresholdSet, half: ThresholdSet, at: string) => {
      for (const t of tiers) {
        expect(ten[t], `${at} 10k ${t}`).toBe(riegel(five[t]!, 10000));
        expect(half[t], `${at} half ${t}`).toBe(riegel(five[t]!, 21097.5));
      }
    };
    for (const sex of ['M', 'F'] as const) {
      check(STANDARDS_THRESHOLDS.run_5k[sex], STANDARDS_THRESHOLDS.run_10k[sex], STANDARDS_THRESHOLDS.run_half[sex], `base/${sex}`);
      for (const p of ['gym_goer', 'crossfit_generalist', 'triathlete']) {
        const o = PATHWAY_STANDARD_OVERRIDES[p]!;
        check(o.run_5k[sex], o.run_10k[sex], o.run_half[sex], `${p}/${sex}`);
      }
    }
    // The app's own numbers (measured with its tsx, 2026-10-03).
    expect(STANDARDS_THRESHOLDS.run_10k.M.pass).toBe(3760);
    expect(STANDARDS_THRESHOLDS.run_half.F.elite).toBe(5730);
    expect(PATHWAY_STANDARD_OVERRIDES.triathlete!.run_10k.M.elite).toBe(2040);
  });
});

describe('habsScoreValue — tpf-app scoreValue', () => {
  const lift = { pass: 80, novice: 100, good: 120, intermediate: 145, advanced: 165, elite: 190 };
  const time = { pass: 1805, novice: 1500, good: 1320, intermediate: 1170, advanced: 1140, elite: 1050, lowerIsBetter: true as const };

  it('anchors at 50 / 60 / 70 / 80 / 90 / 100 and caps at 100', () => {
    expect([80, 100, 120, 145, 165, 190].map((v) => habsScoreValue(v, lift))).toEqual([50, 60, 70, 80, 90, 100]);
    expect([1805, 1500, 1320, 1170, 1140, 1050].map((v) => habsScoreValue(v, time))).toEqual([50, 60, 70, 80, 90, 100]);
    expect(habsScoreValue(400, lift)).toBe(100);
    expect(habsScoreValue(900, time)).toBe(100);
  });

  it('is linear between anchors', () => {
    expect(habsScoreValue(155, lift)).toBe(85);
    expect(habsScoreValue(1155, time)).toBe(85);
  });

  it('below Beginner: a lift falls to 0 at zero; a time to 0 one Beginner–Novice gap past Beginner', () => {
    expect(habsScoreValue(40, lift)).toBe(25);
    expect(habsScoreValue(0, lift)).toBe(0);
    // floor = 1805 + (1805 − 1500) = 2110 — the site used to floor at 2 × pass (3610).
    expect(habsScoreValue(2110, time)).toBe(0);
    expect(habsScoreValue(1957.5, time)).toBe(25);
    expect(habsScoreValue(3000, time)).toBe(0);
  });

  it('a ladder missing a tier is not scored', () => {
    expect(habsLadder({ pass: 1, good: 2, excellent: 3, elite: 4 }, false)).toBeNull();
  });
});

describe('habsOneRepMax — tpf-app calc1RMVal', () => {
  it('Epley ÷ 30 to 0.1 kg; ÷ 25 for an Olympic lift; one rep is the weight', () => {
    expect(habsOneRepMax(100, 5, false)).toBe(116.7);
    expect(habsOneRepMax(100, 3, true)).toBe(112);
    expect(habsOneRepMax(100, 1, true)).toBe(100);
  });
  it('reps read as parseInt(r) || 1', () => {
    expect(habsOneRepMax(100, 0, false)).toBe(100);
    expect(habsOneRepMax(100, 2.5, false)).toBe(habsOneRepMax(100, 2, false));
    expect(habsOneRepMax(0, 5, false)).toBeNull();
  });
  it('the power clean is the HABS lift on the Olympic divisor', () => {
    expect([...HABS_OLYMPIC_IDS].filter((id) => inHabsScore(HRS_BENCHMARKS.find((b) => b.id === id)!, 'hybrid_athlete')))
      .toEqual(['power_clean_1rm']);
  });
});

describe('computeHabs — tpf-app computeHABS', () => {
  // Hybrid athlete, men, every lift on an anchor and no 10 km / half:
  //   lower (80 + 90) / 2 = 85 · power 80 · push (70 + 80) / 2 = 75 · pull 70
  //   · run intensity (70 + 80) / 2 = 75 · erg 80 · run distance not scored.
  //   (85·20 + 80·13.4 + 75·10.4 + 70·9.6 + 75·13.3 + 80·20) / 86.7
  const logs = athlete(
    { back_squat_1rm: [145, 1], deadlift_1rm: [195, 1], bench_1rm: [100, 1], strict_press_1rm: [70, 1],
      barbell_row_1rm: [80, 1], power_clean_1rm: [90, 1] },
    { run_1mi: 390, run_5k: 1170, row_2k: 420 },
  );

  it('component means, the renormalised weighted mean, weight covered and the weak link', () => {
    const r = score('hybrid_athlete', 'M', logs);
    const by = Object.fromEntries(r.components.map((c) => [c.id, c]));
    expect(r.components.map((c) => c.id)).toEqual(['lower_strength', 'power', 'upper_push', 'upper_pull', 'run_intensity', 'run_distance', 'erg']);
    expect(by.lower_strength.score).toBe(85);
    expect(by.upper_push.score).toBe(75);
    expect(by.run_distance.hasData).toBe(false);
    expect(r.weightCovered).toBeCloseTo(86.7, 10);
    expect(r.score).toBeCloseTo(6821.5 / 86.7, 10);
    expect(r.weakLink).toBe('upper_pull');
  });

  it('the TPF Benchmark standards outside HABS never move the score', () => {
    const plus = athlete(
      { back_squat_1rm: [145, 1], deadlift_1rm: [195, 1], bench_1rm: [100, 1], strict_press_1rm: [70, 1],
        barbell_row_1rm: [80, 1], power_clean_1rm: [90, 1], front_squat_1rm: [40, 1], snatch_1rm: [200, 1],
        clean_jerk_1rm: [30, 1] },
      { run_1mi: 390, run_5k: 1170, row_2k: 420, row_500m: 200 },
    );
    plus.manual.push({ benchmarkId: 'strict_pullups', value: 1 }, { benchmarkId: 'plank_hold', value: 600 });
    expect(score('hybrid_athlete', 'M', plus)).toEqual(score('hybrid_athlete', 'M', logs));
  });

  it('zero-weight components are dropped entirely (powerlifter: no running, no erg)', () => {
    const r = score('powerlifter', 'M', logs);
    expect(r.components.map((c) => c.id)).toEqual(['lower_strength', 'power', 'upper_push', 'upper_pull']);
    // …on the powerlifter's own (drug-tested) ladders: squat 145 sits below its Experienced 180.
    expect(r.components[0].benchmarks[0].score).toBeLessThan(70);
  });

  it('one scored component: a score but no weak link; nothing scored: 0 and no coverage', () => {
    const one = score('hybrid_athlete', 'F', athlete({ back_squat_1rm: [120, 1] }, {}));
    expect(one.score).toBe(100);
    expect(one.weightCovered).toBe(20);
    expect(one.weakLink).toBeNull();
    const none = score('hybrid_athlete', 'F', empty());
    expect(none).toMatchObject({ score: 0, weightCovered: 0, weakLink: null });
    expect(habsAsHrsResult('hybrid_athlete', none).overall).toBeNull();
  });

  it('the triathlete scores swim, bike and both runs, and no erg', () => {
    const r = score('triathlete', 'M', athlete({}, { swim_400m: 360, bike_40k: 3350, run_10k: 2040, row_2k: 390 }));
    expect(r.components.map((c) => [c.id, c.hasData])).toEqual([
      ['lower_strength', false], ['power', false], ['upper_push', false], ['upper_pull', false],
      ['run_intensity', false], ['run_distance', true], ['swimming', true], ['cycling', true],
    ]);
    // 10 km 34:00 = the triathlete's own Elite (from its 16:20 5 km), not the base 36:30.
    expect(r.components.find((c) => c.id === 'run_distance')!.score).toBe(100);
  });

  it('as the site\'s result shape: overall, per-component percent, coverage as a fraction', () => {
    const v = habsAsHrsResult('hybrid_athlete', score('hybrid_athlete', 'M', logs));
    expect(v.overall).toBeCloseTo(6821.5 / 86.7, 10);
    expect(v.coverage).toBeCloseTo(0.867, 10);
    expect(v.components.find((c) => c.component === 'run_distance')!.percent).toBeNull();
    expect(v.components.find((c) => c.component === 'upper_pull')!.percent).toBe(70);
  });

  it('a standard outside the score still gets its own score on the same curve', () => {
    const fs = liftBenchmarksFor('hybrid_athlete').find((b) => b.id === 'front_squat_1rm')!;
    expect(fs.habsComponent).toBeUndefined();
    // front squat M Experienced 100 kg → 70.
    expect(habsBenchmarkScore(fs, 'M', athlete({ front_squat_1rm: [100, 1] }, {}), HABS_OLYMPIC_IDS)).toBe(70);
  });
});

describe('what the calculator lists per pathway', () => {
  const ids = (p: string) => liftBenchmarksFor(p).map((b) => b.id);
  const scored = (p: string) => liftBenchmarksFor(p).filter((b) => inHabsScore(b, p)).map((b) => b.id);

  it('every HABS benchmark the pathway weights, and nothing it does not', () => {
    for (const p of PATHWAY_IDS) {
      const w = habsWeightsFor(p);
      const want = HRS_BENCHMARKS.filter((b) => b.habsComponent && (w[b.habsComponent as HabsComponentId] ?? 0) > 0).map((b) => b.id);
      expect(scored(p), p).toEqual(want);
    }
    expect(scored('powerlifter')).not.toContain('run_5k');
    expect(scored('triathlete')).not.toContain('row_2k');
    expect(scored('hybrid_athlete')).toEqual(expect.arrayContaining(['run_10k', 'run_half']));
  });

  it('keeps the TPF Benchmark standards each pathway listed before (outside the score)', () => {
    expect(ids('crossfit_generalist')).toEqual(expect.arrayContaining(['front_squat_1rm', 'snatch_1rm', 'clean_jerk_1rm', 'row_500m', 'broad_jump', 'strict_pullups', 'plank_hold']));
    expect(ids('powerlifter')).toEqual(expect.arrayContaining(['front_squat_1rm', 'broad_jump', 'plank_hold']));
    expect(ids('powerlifter')).not.toContain('snatch_1rm');
    expect(ids('triathlete')).not.toContain('row_500m');
  });

  it('both HABS brands score with it; Operator does not', () => {
    expect(brandConfig('lift').habs).toBe(true);
    expect(brandConfig('hybrid').habs).toBe(true);
    expect(brandConfig('operator').habs).toBe(false);
    expect(brandConfig('hybrid').components).toEqual([...HABS_COMPONENT_IDS]);
  });
});
