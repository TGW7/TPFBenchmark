import { describe, expect, it } from 'vitest';
import { buildPoolSubmissions } from '../data/pool';
import type { AthleteLogs, AthleteProfile, BenchmarkDef } from '../engine/types';

const PROFILE: AthleteProfile = { sex: 'M', bodyweightKg: 100, ageYears: 31 };
const squat: BenchmarkDef = {
  id: 'back_squat_1rm', component: 'lower_strength', source: 'orm', unit: 'xBW',
  lowerIsBetter: false, normalization: 'bodyweight',
  thresholds: { M: { pass: null, good: null, excellent: null, elite: null },
                F: { pass: null, good: null, excellent: null, elite: null } },
};
const logs = (weightKg: number): AthleteLogs => ({
  orm: [{ benchmarkId: 'back_squat_1rm', weightKg, reps: 1 }], raceTimes: [], manual: [], wod: [],
});

describe('buildPoolSubmissions', () => {
  it('emits a bodyweight-normalised row with trust + age band', () => {
    const rows = buildPoolSubmissions({ brand: 'lift', benchmarks: [squat], profile: PROFILE, logs: logs(150), signedIn: true });
    expect(rows).toHaveLength(1);
    expect(rows[0].value).toBeCloseTo(1.5); // 150kg / 100kg = 1.5×BW
    expect(rows[0].age_band).toBe('30-39');
    expect(rows[0].sex).toBe('M');
    expect(rows[0].trust).toBeGreaterThan(0.3);
  });

  it('drops implausible entries (never pools garbage)', () => {
    const rows = buildPoolSubmissions({ brand: 'lift', benchmarks: [squat], profile: PROFILE, logs: logs(500), signedIn: true });
    expect(rows).toHaveLength(0); // 5.0×BW exceeds the hard bound
  });
});
