/**
 * 2026-10-03 — the app's predicted race equivalents, ported
 * (src/engine/racePrediction.ts, src/engine/habsPredict.ts;
 * docs/LEGAL-FIXES-2026-10-03.md §6; the owner's "1 yes").
 *
 * These pin the RULES as typed pins, with the examples the app's own comments
 * give. The numbers themselves are compared against the app's code, on 1,644
 * athletes, by `npm run check:app-habs -- <path to tpf-app>` — which this
 * suite cannot run (CI has no app checkout).
 */
import { describe, expect, it } from 'vitest';
import {
  MAX_PREDICTION_DISTANCE_RATIO,
  isPredictableDistance,
  longDistanceDamping,
  predictRaceTime,
  predictRiegel,
  raceTimesWithEquivalents,
  withinPredictionRange,
  bwAdjustedRiegelExponent,
} from '../engine/racePrediction';
import { computeHabs, predictMissingRaces } from '../engine';
import { PREDICTION_RACE_EVENTS } from '../config/habsAppMap';
import { HABS_OLYMPIC_IDS, habsWeightsFor, inHabsScore, liftBenchmarksFor } from '../config/habs';
import type { AthleteLogs } from '../engine/types';

const logs = (races: Record<string, number>): AthleteLogs => ({
  orm: [], manual: [], wod: [],
  raceTimes: Object.entries(races).map(([id, t]) => ({ benchmarkId: id, modality: 'x', event: id, timeSec: t })),
});

describe('the app\'s rules, as its comments state them', () => {
  it('4.1×, both ways (plan 49)', () => {
    expect(MAX_PREDICTION_DISTANCE_RATIO).toBe(4.1);
    expect(withinPredictionRange(400, 1609.34)).toBe(true); // 400 m → mile, 4.02×
    expect(withinPredictionRange(400, 2000)).toBe(false); // 5×
    expect(withinPredictionRange(5000, 21097.5)).toBe(false); // 5 km → half, 4.22×
    expect(withinPredictionRange(10000, 2414.02)).toBe(false); // 10 km → 1.5 mile, 4.14×
    expect(withinPredictionRange(21097.5, 42195)).toBe(true);
  });

  it('nothing predicted past a marathon (plan 47)', () => {
    expect(isPredictableDistance(42195)).toBe(true);
    expect(isPredictableDistance(42196)).toBe(false);
    expect(predictRiegel('bike', 40000, 4000, 50000)).toBe(0);
  });

  it('the Riegel exponents, and the bodyweight term (row 25 %, bike / swim none)', () => {
    expect(bwAdjustedRiegelExponent('row', null, 'male')).toBe(1.08);
    expect(bwAdjustedRiegelExponent('row', 90, 'male')).toBeCloseTo(1.08 + 0.005 * 20 * 0.25, 12);
    expect(bwAdjustedRiegelExponent('row', 90, 'female')).toBeCloseTo(1.08 + 0.005 * 28 * 0.25, 12);
    expect(bwAdjustedRiegelExponent('row', 60, 'male')).toBe(1.08); // never faster than the base
    expect(bwAdjustedRiegelExponent('bike', 120, 'male')).toBe(1.05);
    expect(bwAdjustedRiegelExponent('swim', 120, 'male')).toBe(1.06);
  });

  it('the long-distance damping (Phase 68.CC values)', () => {
    expect(longDistanceDamping(5000, 5000)).toBe(1);
    expect(longDistanceDamping(10000, 5000)).toBeCloseTo(0.988, 3);
    expect(longDistanceDamping(160934, 1609.34)).toBe(0.9); // the floor
  });

  it('100 m is isolated; a race is never its own anchor; only in-range races count', () => {
    expect(predictRaceTime('100m', { '400m': { timeSec: 60 } })).toBeNull();
    expect(predictRaceTime('400m', { '100m': { timeSec: 12 } })).toBeNull();
    expect(predictRaceTime('half', { '5k': { timeSec: 1200 } })).toBeNull(); // 4.22×
    expect(predictRaceTime('10k', { '5k': { timeSec: 1200 } })?.fromEvent).toBe('5k');
  });

  it('between two in-range races the VDOT is blended; at either end it is the race itself', () => {
    const p = predictRaceTime('10k', { '5k': { timeSec: 1250 }, half: { timeSec: 5900 } });
    expect(p?.blendedFrom).toEqual(['5k', 'half']);
  });

  it('a stored prediction is never an anchor', () => {
    expect(predictRaceTime('10k', { '5k': { timeSec: 1200, predicted: true } })).toBeNull();
  });

  it('typed times are never overwritten; fills are whole seconds and flagged', () => {
    const out = raceTimesWithEquivalents({ run: { '5k': { timeSec: 1320 } }, row: { '500m': { timeSec: 92 } } }, 80, 'male');
    expect(out.run?.['5k']).toEqual({ timeSec: 1320 });
    expect(out.run?.['10k']?.predicted).toBe(true);
    expect(Number.isInteger(out.run?.['10k']?.timeSec)).toBe(true);
    expect(out.run?.half).toBeUndefined(); // 4.22× — not predicted
    expect(out.row?.['2k']?.predicted).toBe(true); // 500 m → 2 km is 4×
    expect(out.row?.['5k']).toBeUndefined(); // 10×
  });
});

describe('HABS on the site, with predictions', () => {
  const P = 'hybrid_athlete';
  const benchmarks = liftBenchmarksFor(P);
  const targets = benchmarks.filter((b) => b.source === 'race_times' && inHabsScore(b, P)).map((b) => b.id);
  const run = (l: AthleteLogs, anchors = {}) =>
    predictMissingRaces({ logs: l, raceEventOf: PREDICTION_RACE_EVENTS, targets, anchors, sex: 'M', bodyweightKg: 80 });

  it('a 5 km fills the mile and the 10 km, not the half (4.22×)', () => {
    const r = run(logs({ run_5k: 1320 }));
    expect(r.predictions.map((p) => p.benchmarkId).sort()).toEqual(['run_10k', 'run_1mi']);
  });

  it('a typed time is never replaced, and the typed logs are not changed', () => {
    const typed = logs({ run_5k: 1320, run_10k: 2900 });
    const r = run(typed);
    expect(r.predictions.some((p) => p.benchmarkId === 'run_10k')).toBe(false);
    expect(typed.raceTimes.length).toBe(2); // input untouched
    expect(r.logs.raceTimes.filter((e) => e.benchmarkId === 'run_10k').map((e) => e.timeSec)).toEqual([2900]);
  });

  it('a 500 m row (a standard outside the score) fills the 2 km row, which the score counts', () => {
    const r = run(logs({ row_500m: 92 }));
    expect(r.predictions.map((p) => p.benchmarkId)).toEqual(['row_2k']);
    const habs = computeHabs({ benchmarks, weights: habsWeightsFor(P), sex: 'M', logs: r.logs, olympicIds: HABS_OLYMPIC_IDS });
    expect(habs.components.find((c) => c.id === 'erg')?.hasData).toBe(true);
  });

  it('only the pathway\'s HABS races are filled (the 500 m row itself is not)', () => {
    const r = run(logs({ row_2k: 420 }));
    expect(r.predictions.map((p) => p.benchmarkId)).not.toContain('row_500m');
  });

  it('the app\'s other typed results anchor a prediction, and are named as app results', () => {
    const r = run(logs({}), { row: { '1k': { timeSec: 205 } } });
    expect(r.predictions).toHaveLength(1);
    expect(r.predictions[0]).toMatchObject({ benchmarkId: 'row_2k', fromApp: true, from: { model: 'riegel', fromEvent: '1k' } });
  });

  it('an anchor at an event the site has a field for is ignored (the field decides)', () => {
    const r = run(logs({}), { run: { '5k': { timeSec: 1320 } } });
    expect(r.predictions).toEqual([]);
  });

  it('a predicted app record is never an anchor', () => {
    const r = run(logs({}), { run: { '2k': { timeSec: 470, predicted: true } } });
    expect(r.predictions).toEqual([]);
  });
});
