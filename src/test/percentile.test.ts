import { describe, expect, it } from 'vitest';
import { ageBand, estimatedPercentile, percentileRank, profileCell } from '../engine/percentile';

describe('estimatedPercentile', () => {
  it('maps tier anchors to their methodology percentiles', () => {
    expect(estimatedPercentile(50)).toBeCloseTo(50);
    expect(estimatedPercentile(70)).toBeCloseTo(70);
    expect(estimatedPercentile(85)).toBeCloseTo(85);
    expect(estimatedPercentile(100)).toBeCloseTo(99); // elite = ceiling ≈ top 1%
  });
  it('interpolates and clamps', () => {
    expect(estimatedPercentile(60)).toBeCloseTo(60); // halfway pass->good
    expect(estimatedPercentile(0)).toBe(0);
    expect(estimatedPercentile(110)).toBeCloseTo(99); // clamped to the 100 ceiling
    expect(estimatedPercentile(null)).toBeNull();
  });
});

describe('ageBand', () => {
  it('buckets ages', () => {
    expect(ageBand(18)).toBe('u20');
    expect(ageBand(31)).toBe('30-39');
    expect(ageBand(60)).toBe('60+');
    expect(ageBand(undefined)).toBeNull();
  });
  it('builds a sex:age cell key', () => {
    expect(profileCell({ sex: 'M', bodyweightKg: 80, ageYears: 31 })).toBe('M:30-39');
    expect(profileCell({ sex: 'F', bodyweightKg: 60 })).toBe('F:all');
  });
});

describe('percentileRank', () => {
  const samples = Array.from({ length: 100 }, (_, i) => i + 1); // 1..100

  it('ranks a value against a sample distribution (higher is better)', () => {
    expect(percentileRank(50, samples)).toBeCloseTo(49.5); // 49 below + half of self
  });
  it('flips for lower-is-better', () => {
    // value 10 (fast time): 90 samples are slower -> high percentile
    expect(percentileRank(10, samples, true)).toBeCloseTo(90.5);
  });
  it('returns null below the minimum sample size', () => {
    expect(percentileRank(5, [1, 2, 3], false, 30)).toBeNull();
  });
});
