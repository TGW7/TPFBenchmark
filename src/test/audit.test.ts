import { describe, expect, it } from 'vitest';
import {
  auditBodyweight,
  auditConsistency,
  auditEntry,
  needsVerification,
  trustScore,
} from '../engine/audit';
import type { AthleteProfile, BenchmarkDef, Normalization } from '../engine/types';

const PROFILE: AthleteProfile = { sex: 'M', bodyweightKg: 80 };

function def(id: string, normalization: Normalization, unit: string): BenchmarkDef {
  return {
    id, component: 'lower_strength', source: 'orm', unit,
    lowerIsBetter: unit.includes(':'), normalization,
    thresholds: { M: { pass: null, good: null, excellent: null, elite: null },
                  F: { pass: null, good: null, excellent: null, elite: null } },
  };
}

const squat = def('back_squat_1rm', 'bodyweight', 'xBW');
const pullups = def('strict_pullups', 'absolute', 'reps');
const run5k = def('run_5k', 'absolute', 'mm:ss');

describe('auditEntry — sanity bounds', () => {
  it('accepts plausible bodyweight lifts (×BW)', () => {
    expect(auditEntry(squat, 150, PROFILE).level).toBe('ok'); // 1.88×BW
  });
  it('rejects impossible lifts and flags implausible ones', () => {
    expect(auditEntry(squat, 400, PROFILE).level).toBe('reject'); // 5.0×BW
    expect(auditEntry(squat, 300, PROFILE).level).toBe('review'); // 3.75×BW > soft 3.5
    expect(auditEntry(squat, -10, PROFILE).level).toBe('reject');
  });
  it('handles absolute rep benchmarks', () => {
    expect(auditEntry(pullups, 14, PROFILE).level).toBe('ok');
    expect(auditEntry(pullups, 70, PROFILE).level).toBe('review');
    expect(auditEntry(pullups, 200, PROFILE).level).toBe('reject');
  });
  it('handles time benchmarks (seconds)', () => {
    expect(auditEntry(run5k, 1320, PROFILE).level).toBe('ok'); // 22:00
    expect(auditEntry(run5k, 700, PROFILE).level).toBe('reject'); // 11:40, impossible
    expect(auditEntry(run5k, 760, PROFILE).level).toBe('review'); // 12:40, elite-rare
  });
});

describe('auditBodyweight', () => {
  it('accepts/flags/rejects appropriately', () => {
    expect(auditBodyweight(80).level).toBe('ok');
    expect(auditBodyweight(220).level).toBe('review');
    expect(auditBodyweight(350).level).toBe('reject');
  });
});

describe('auditConsistency — cross-benchmark ratios', () => {
  it('flags bench above squat', () => {
    const f = auditConsistency({ bench_1rm: 1.6, back_squat_1rm: 1.5 }, {});
    expect(f.some((x) => x.benchmarkId === 'bench_1rm')).toBe(true);
  });
  it('flags a mile slower than 5k pace', () => {
    // 6:00 mile but 18:00 5k (~5:48/mi) -> mile should be faster
    const f = auditConsistency({}, { run_1mi: 360, run_5k: 1080 });
    expect(f.some((x) => x.benchmarkId === 'run_1mi')).toBe(true);
  });
  it('passes a consistent athlete with no findings', () => {
    const f = auditConsistency(
      { bench_1rm: 1.3, back_squat_1rm: 1.8, clean_jerk_1rm: 1.4, snatch_1rm: 1.1, power_clean_1rm: 1.2 },
      { run_1mi: 330, run_5k: 1140 }, // 5:30 mile, ~6:07/mi 5k -> consistent
    );
    expect(f.length).toBe(0);
  });
});

describe('trustScore & verification', () => {
  it('scores anonymous low and verified high', () => {
    expect(trustScore({})).toBeCloseTo(0.15);
    const full = trustScore({
      signedIn: true, verified: true, loggedInApp: true,
      internallyConsistent: true, withinPlausibleRange: true,
    });
    expect(full).toBe(1);
  });
  it('gates verification on high percentile claims', () => {
    expect(needsVerification(96)).toBe(true);
    expect(needsVerification(90)).toBe(false);
    expect(needsVerification(null)).toBe(false);
  });
});
