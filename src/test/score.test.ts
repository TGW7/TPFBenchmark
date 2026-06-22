import { describe, expect, it } from 'vitest';
import { computeHRS, scoreComponent } from '../engine/score';
import type {
  AthleteLogs,
  AthleteProfile,
  BenchmarkDef,
  PathwayConfig,
  Sex,
} from '../engine/types';

const PROFILE: AthleteProfile = { sex: 'M', bodyweightKg: 80 };

function logs(partial: Partial<AthleteLogs> = {}): AthleteLogs {
  return { orm: [], raceTimes: [], manual: [], wod: [], ...partial };
}

const sameForBothSexes = (
  pass: number | null,
  good: number | null,
  excellent: number | null,
  elite: number | null,
): Record<Sex, BenchmarkDef['thresholds']['M']> => ({
  M: { pass, good, excellent, elite },
  F: { pass, good, excellent, elite },
});

// Synthetic benchmarks (reps, higher-is-better).
const A: BenchmarkDef = {
  id: 'a', component: 'lower_strength', source: 'manual', unit: 'reps',
  lowerIsBetter: false, normalization: 'absolute', thresholds: sameForBothSexes(10, 20, 30, 40),
};
const B: BenchmarkDef = {
  id: 'b', component: 'running', source: 'manual', unit: 'reps',
  lowerIsBetter: false, normalization: 'absolute', thresholds: sameForBothSexes(10, 20, 30, 40),
};
const A2: BenchmarkDef = {
  id: 'a2', component: 'lower_strength', source: 'manual', unit: 'reps',
  lowerIsBetter: false, normalization: 'absolute', thresholds: sameForBothSexes(10, 20, 30, 40),
};
// Thresholds still TODO (null) — must be skipped even when data is logged.
const NULLED: BenchmarkDef = {
  id: 'c', component: 'gymnastics', source: 'manual', unit: 'reps',
  lowerIsBetter: false, normalization: 'absolute', thresholds: sameForBothSexes(null, null, null, null),
};

const TWO_WAY: PathwayConfig = {
  id: 'crossfit_generalist', label: 'two', weights: { lower_strength: 50, running: 50 },
};

describe('computeHRS — missing-data re-normalisation & coverage', () => {
  it('excludes untested components and re-normalises remaining weight', () => {
    // Only the lower_strength benchmark is logged (value 30 -> excellent -> 85%).
    const r = computeHRS({
      pathway: TWO_WAY, benchmarks: [A, B], profile: PROFILE,
      logs: logs({ manual: [{ benchmarkId: 'a', value: 30 }] }),
    });
    expect(r.overall).toBeCloseTo(85); // running dropped, not penalised
    expect(r.coverage).toBeCloseTo(0.5);
  });

  it('weights both components when both are tested', () => {
    const r = computeHRS({
      pathway: TWO_WAY, benchmarks: [A, B], profile: PROFILE,
      logs: logs({ manual: [{ benchmarkId: 'a', value: 30 }, { benchmarkId: 'b', value: 20 }] }),
    });
    // (50*85 + 50*70) / 100 = 77.5
    expect(r.overall).toBeCloseTo(77.5);
    expect(r.coverage).toBeCloseTo(1);
  });

  it('returns null overall and 0 coverage with nothing logged', () => {
    const r = computeHRS({ pathway: TWO_WAY, benchmarks: [A, B], profile: PROFILE, logs: logs() });
    expect(r.overall).toBeNull();
    expect(r.coverage).toBe(0);
  });

  it('skips benchmarks whose thresholds are still null even if data exists', () => {
    const pathway: PathwayConfig = { id: 'crossfit_generalist', label: 'g', weights: { gymnastics: 100 } };
    const r = computeHRS({
      pathway, benchmarks: [NULLED], profile: PROFILE,
      logs: logs({ manual: [{ benchmarkId: 'c', value: 25 }] }),
    });
    expect(r.overall).toBeNull();
    expect(r.coverage).toBe(0);
  });
});

describe('scoreComponent', () => {
  it('averages the logged, scoreable benchmarks in a component', () => {
    const cs = scoreComponent('lower_strength', [A, A2], PROFILE,
      logs({ manual: [{ benchmarkId: 'a', value: 30 }, { benchmarkId: 'a2', value: 20 }] }));
    expect(cs.percent).toBeCloseTo(77.5); // (85 + 70) / 2
  });

  it('is null when no benchmark in the component is logged', () => {
    const cs = scoreComponent('lower_strength', [A], PROFILE, logs());
    expect(cs.percent).toBeNull();
  });
});
