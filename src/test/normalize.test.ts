import { describe, expect, it } from 'vitest';
import {
  ageGradeFactor,
  applyAgeGrade,
  calc1RMVal,
  resolveThresholds,
} from '../engine/normalize';
import type { AthleteProfile, BenchmarkDef } from '../engine/types';

const bwBench: BenchmarkDef = {
  id: 'squat', component: 'lower_strength', source: 'orm', unit: 'xBW',
  lowerIsBetter: false, normalization: 'bodyweight',
  thresholds: {
    M: { pass: 1, good: 1.5, excellent: 1.75, elite: 2 },
    F: { pass: 0.75, good: 1, excellent: 1.25, elite: 1.5 },
  },
};

const absBench: BenchmarkDef = {
  id: 'pullups', component: 'gymnastics', source: 'manual', unit: 'reps',
  lowerIsBetter: false, normalization: 'absolute',
  thresholds: {
    M: { pass: 5, good: 10, excellent: 15, elite: 22 },
    F: { pass: 3, good: 7, excellent: 12, elite: 18 },
  },
};

describe('resolveThresholds', () => {
  it('multiplies bodyweight thresholds by the athlete bodyweight', () => {
    const p: AthleteProfile = { sex: 'M', bodyweightKg: 100 };
    expect(resolveThresholds(bwBench, p)).toEqual({ pass: 100, good: 150, excellent: 175, elite: 200 });
  });

  it('selects the athlete sex', () => {
    const f: AthleteProfile = { sex: 'F', bodyweightKg: 60 };
    expect(resolveThresholds(bwBench, f)).toEqual({ pass: 45, good: 60, excellent: 75, elite: 90 });
  });

  it('leaves absolute thresholds unchanged', () => {
    const p: AthleteProfile = { sex: 'M', bodyweightKg: 80 };
    expect(resolveThresholds(absBench, p)).toEqual({ pass: 5, good: 10, excellent: 15, elite: 22 });
  });

  it('preserves null anchors (not yet populated)', () => {
    const nulled: BenchmarkDef = {
      ...bwBench,
      thresholds: { M: { pass: null, good: null, excellent: null, elite: null }, F: bwBench.thresholds.F },
    };
    expect(resolveThresholds(nulled, { sex: 'M', bodyweightKg: 100 })).toEqual({
      pass: null, good: null, excellent: null, elite: null,
    });
  });
});

describe('calc1RMVal (Epley stub)', () => {
  it('returns the weight at 1 rep', () => {
    expect(calc1RMVal(140, 1)).toBe(140);
    expect(calc1RMVal(140, 0)).toBe(140);
  });
  it('estimates higher for multi-rep sets', () => {
    expect(calc1RMVal(100, 10)).toBeCloseTo(133.33, 1);
  });
});

describe('age-grading scaffold', () => {
  const p: AthleteProfile = { sex: 'M', bodyweightKg: 80, ageYears: 50 };
  it('is a no-op when the flag is off', () => {
    expect(ageGradeFactor(p)).toBe(1);
    expect(applyAgeGrade(500, p)).toBe(500);
  });
  it('returns the placeholder identity when the flag is on', () => {
    expect(ageGradeFactor(p, { ageGrading: true })).toBe(1);
    expect(applyAgeGrade(500, p, { ageGrading: true })).toBe(500);
  });
});
