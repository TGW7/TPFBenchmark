import { describe, expect, it } from 'vitest';
import {
  computeCapacityIndex,
  predictWodPercent,
  toComponentScoreMap,
} from '../engine/capacity';
import type { AthleteProfile, ComponentScore, WodDef } from '../engine/types';

const PROFILE: AthleteProfile = { sex: 'M', bodyweightKg: 80 };

const FRAN: WodDef = {
  id: 'fran', unit: 'mm:ss', lowerIsBetter: true,
  thresholds: {
    M: { pass: 360, good: 240, excellent: 180, elite: 120 },
    F: { pass: 420, good: 300, excellent: 210, elite: 150 },
  },
  qualityMix: { gymnastics: 0.5, upper_strength: 0.5 },
};

const SCORES = { gymnastics: 80, upper_strength: 60 };

describe('predictWodPercent', () => {
  it('blends component scores by the quality-mix vector', () => {
    expect(predictWodPercent(FRAN, SCORES)).toBeCloseTo(70); // 0.5*80 + 0.5*60
  });

  it('re-normalises when a taxed component has no score', () => {
    expect(predictWodPercent(FRAN, { gymnastics: 80 })).toBeCloseTo(80);
  });

  it('is null when the quality-mix is empty / TODO', () => {
    expect(predictWodPercent({ ...FRAN, qualityMix: {} }, SCORES)).toBeNull();
  });
});

describe('computeCapacityIndex', () => {
  it('averages actual minus predicted across logged WODs', () => {
    // actual: 210s Rx -> 77.5; predicted: 70 -> delta +7.5
    const r = computeCapacityIndex(
      { fran: FRAN },
      [{ wodId: 'fran', value: 210, scaling: 'rx' }],
      SCORES,
      PROFILE,
    );
    expect(r.index).toBeCloseTo(7.5);
    expect(r.perWod[0].delta).toBeCloseTo(7.5);
  });

  it('is null when nothing has both an actual and a prediction', () => {
    const r = computeCapacityIndex(
      { fran: { ...FRAN, qualityMix: {} } },
      [{ wodId: 'fran', value: 210, scaling: 'rx' }],
      SCORES,
      PROFILE,
    );
    expect(r.index).toBeNull();
  });
});

describe('toComponentScoreMap', () => {
  it('maps component scores to a lookup, preserving null', () => {
    const components: ComponentScore[] = [
      { component: 'gymnastics', percent: 80, benchmarks: [] },
      { component: 'running', percent: null, benchmarks: [] },
    ];
    const map = toComponentScoreMap(components);
    expect(map.gymnastics).toBe(80);
    expect(map.running).toBeNull();
  });
});
