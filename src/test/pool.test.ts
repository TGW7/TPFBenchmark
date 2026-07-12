import { describe, expect, it } from 'vitest';
import { buildPoolSubmissions, overallPoolKey } from '../data/pool';
import type { AthleteLogs, AthleteProfile, BenchmarkDef } from '../engine/types';

const PROFILE: AthleteProfile = { sex: 'M', bodyweightKg: 100, ageYears: 31 };
// 2026-07-12 — lifts are absolute kg now.
const squat: BenchmarkDef = {
  id: 'back_squat_1rm', component: 'lower_strength', source: 'orm', unit: 'kg',
  lowerIsBetter: false, normalization: 'absolute',
  thresholds: { M: { pass: null, good: null, excellent: null, elite: null },
                F: { pass: null, good: null, excellent: null, elite: null } },
};
const logs = (weightKg: number): AthleteLogs => ({
  orm: [{ benchmarkId: 'back_squat_1rm', weightKg, reps: 1 }], raceTimes: [], manual: [], wod: [],
});

describe('buildPoolSubmissions', () => {
  it('emits absolute-kg lift rows under a unit-partitioned cell id', () => {
    const rows = buildPoolSubmissions({ brand: 'lift', benchmarks: [squat], profile: PROFILE, logs: logs(150), signedIn: true });
    expect(rows).toHaveLength(1);
    expect(rows[0].value).toBe(150); // absolute kg, no bodyweight scaling
    // Historical ×BW rows live under the bare id — kg rows must not mix in.
    expect(rows[0].benchmark_id).toBe('back_squat_1rm:kg');
    expect(rows[0].age_band).toBe('30-39');
    expect(rows[0].sex).toBe('M');
    expect(rows[0].trust).toBeGreaterThan(0.3);
  });

  it('still bodyweight-normalises rows for bodyweight-defined benchmarks', () => {
    const bwDef: BenchmarkDef = { ...squat, id: 'hypothetical_bw_lift', unit: 'xBW', normalization: 'bodyweight' };
    const rows = buildPoolSubmissions({
      brand: 'lift', benchmarks: [bwDef], profile: PROFILE, signedIn: true,
      logs: { orm: [{ benchmarkId: 'hypothetical_bw_lift', weightKg: 150, reps: 1 }], raceTimes: [], manual: [], wod: [] },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].value).toBeCloseTo(1.5); // 150 kg / 100 kg
    expect(rows[0].benchmark_id).toBe('hypothetical_bw_lift'); // no :kg suffix
  });

  it('drops implausible entries (never pools garbage)', () => {
    const rows = buildPoolSubmissions({ brand: 'lift', benchmarks: [squat], profile: PROFILE, logs: logs(600), signedIn: true });
    expect(rows).toHaveLength(0); // 600 kg exceeds the hard bound
  });

  it('versions the composite overall cell (v2 = absolute recalibration)', () => {
    const rows = buildPoolSubmissions({
      brand: 'lift', benchmarks: [], profile: PROFILE, logs: logs(0), signedIn: true,
      pathwayId: 'hybrid_athlete', overall: 72,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].benchmark_id).toBe(overallPoolKey('hybrid_athlete'));
    expect(rows[0].benchmark_id).toBe('overall:hybrid_athlete:v2');
  });
});
