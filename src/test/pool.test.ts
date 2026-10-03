import { describe, expect, it } from 'vitest';
import { POOL_OPT_IN_DEFAULT, buildPoolSubmissions, overallPoolKey, poolSubmissionSignature } from '../data/pool';
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

  it('tags Operator rows with the pathway (unit) they were scored under; Lift rows stay untagged', () => {
    const opDef: BenchmarkDef = { ...squat, id: 'back_squat', unit: 'kg' };
    const opLogs: AthleteLogs = { orm: [{ benchmarkId: 'back_squat', weightKg: 150, reps: 1 }], raceTimes: [], manual: [], wod: [] };
    const opRows = buildPoolSubmissions({
      brand: 'operator', benchmarks: [opDef], profile: PROFILE, logs: opLogs,
      signedIn: true, pathwayId: 'navy_seal_bud_s',
    });
    expect(opRows[0].pathway_id).toBe('navy_seal_bud_s');

    const liftRows = buildPoolSubmissions({
      brand: 'lift', benchmarks: [squat], profile: PROFILE, logs: logs(150),
      signedIn: true, pathwayId: 'hybrid_athlete',
    });
    expect(liftRows[0].pathway_id).toBeNull(); // tiers are pathway-independent for Lift
  });

  it('versions the composite overall cell (v2 = absolute recalibration; v3 = the app\'s HABS model; v4 = + predicted races)', () => {
    const rows = buildPoolSubmissions({
      brand: 'lift', benchmarks: [], profile: PROFILE, logs: logs(0), signedIn: true,
      pathwayId: 'hybrid_athlete', overall: 72,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].benchmark_id).toBe(overallPoolKey('hybrid_athlete', 'lift'));
    // 2026-10-03 — the HABS score moved to the TPF app's model (v3), then the
    // same day began filling missing races with the app's predicted
    // equivalents (v4); each starts a new cell, older rows are left as they are.
    expect(rows[0].benchmark_id).toBe('overall:hybrid_athlete:v4');
    expect(overallPoolKey('hybrid_athlete', 'hybrid')).toBe('overall:hybrid_athlete:v4');
  });

  it('Operator\'s composite stays on v2 — its score did not change (2026-10-03)', () => {
    const rows = buildPoolSubmissions({
      brand: 'operator', benchmarks: [], profile: PROFILE, logs: logs(0), signedIn: true,
      pathwayId: 'navy_seal_bud_s', overall: 72,
    });
    expect(rows[0].benchmark_id).toBe('overall:navy_seal_bud_s:v2');
  });
});

// 2026-10-03 — the TPF app's legal review, H1 (docs/LEGAL-FIXES-2026-10-03.md §3).
describe('the pool keeps no link to the athlete', () => {
  const allowed = new Set(['brand', 'benchmark_id', 'sex', 'age_band', 'value', 'lower_is_better', 'trust', 'pathway_id']);
  const rows = [
    ...buildPoolSubmissions({ brand: 'lift', benchmarks: [squat], profile: PROFILE, logs: logs(150), signedIn: true, pathwayId: 'hybrid_athlete', overall: 72 }),
    ...buildPoolSubmissions({ brand: 'operator', benchmarks: [{ ...squat, id: 'back_squat' }], profile: PROFILE,
      logs: { orm: [{ benchmarkId: 'back_squat', weightKg: 150, reps: 1 }], raceTimes: [], manual: [], wod: [] },
      signedIn: true, pathwayId: 'navy_seal_bud_s', overall: 60 }),
  ];

  it('a row carries no account id, no bodyweight and nothing outside what the percentile needs', () => {
    expect(rows.length).toBe(4);
    for (const r of rows) {
      for (const k of Object.keys(r)) expect(allowed.has(k), k).toBe(true);
      expect('user_id' in r).toBe(false);
      expect('bodyweight_kg' in r).toBe(false);
    }
  });

  it('the build step cannot even be handed an account id', () => {
    // A stray userId (as App.tsx passed until 2026-10-03) changes nothing.
    const withId = buildPoolSubmissions({ brand: 'lift', benchmarks: [squat], profile: PROFILE, logs: logs(150), signedIn: true,
      ...({ userId: 'b1f4c3e2-0000-4000-8000-000000000000' } as object) });
    expect(JSON.stringify(withId)).not.toContain('b1f4c3e2');
  });

  it('contributing is opt-in: the box starts unticked', () => {
    expect(POOL_OPT_IN_DEFAULT).toBe(false);
  });

  it('the same rows have the same signature (a repeat Save in one visit is not pooled twice)', () => {
    const a = buildPoolSubmissions({ brand: 'lift', benchmarks: [squat], profile: PROFILE, logs: logs(150), signedIn: true, pathwayId: 'hybrid_athlete', overall: 72 });
    const b = buildPoolSubmissions({ brand: 'lift', benchmarks: [squat], profile: PROFILE, logs: logs(150), signedIn: true, pathwayId: 'hybrid_athlete', overall: 72 });
    const c = buildPoolSubmissions({ brand: 'lift', benchmarks: [squat], profile: PROFILE, logs: logs(152.5), signedIn: true, pathwayId: 'hybrid_athlete', overall: 72 });
    expect(poolSubmissionSignature(a)).toBe(poolSubmissionSignature([...b].reverse()));
    expect(poolSubmissionSignature(a)).not.toBe(poolSubmissionSignature(c));
  });
});
