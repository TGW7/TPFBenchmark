import { describe, expect, it } from 'vitest';
import {
  isOutlier,
  mad,
  median,
  quantile,
  robustBounds,
  trustWeightedPercentile,
  winsorize,
} from '../engine/stats';

describe('robust stats', () => {
  it('median handles odd/even/empty', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  it('mad measures spread around the median', () => {
    expect(mad([1, 1, 1])).toBe(0);
    expect(mad([1, 2, 3, 4, 5])).toBe(1); // |dev| = 2,1,0,1,2 -> median 1
  });

  it('flags robust outliers, ignores tight clusters', () => {
    const data = [10, 11, 9, 10, 12, 8, 100];
    expect(isOutlier(100, data)).toBe(true);
    expect(isOutlier(10, data)).toBe(false);
    // zero spread -> nothing is an outlier
    expect(robustBounds([5, 5, 5])).toEqual([-Infinity, Infinity]);
  });

  it('quantile interpolates', () => {
    expect(quantile([1, 2, 3, 4, 5], 0.5)).toBe(3);
    expect(quantile([0, 10], 0.25)).toBe(2.5);
  });

  it('winsorize clamps the tails', () => {
    const w = winsorize([1, 2, 3, 4, 100], 0.2);
    expect(Math.max(...w)).toBeLessThan(100);
  });
});

describe('trustWeightedPercentile', () => {
  const samples: Array<[number, number]> = Array.from({ length: 50 }, (_, i) => [i + 1, 1]);

  it('weights by trust and gates on minimum total trust', () => {
    expect(trustWeightedPercentile(25, samples, false, 30)).toBeCloseTo(49); // 24 below + 0.5 self of 50
    expect(trustWeightedPercentile(25, samples.slice(0, 5), false, 30)).toBeNull();
  });

  it('flips for lower-is-better and respects unequal trust', () => {
    const s: Array<[number, number]> = [[10, 1], [20, 1], [30, 0.2]];
    // value 25, lower better: below = those slower (>25) = 30 (trust .2); equal 0; total 2.2
    expect(trustWeightedPercentile(25, s, true, 0)).toBeCloseTo((0.2 / 2.2) * 100);
  });
});
