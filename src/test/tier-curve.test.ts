import { describe, expect, it } from 'vitest';
import { ANCHORS, BONUS_CAP, asResolved, scoreToPercentage } from '../engine/tier-curve';
import type { ResolvedThresholds } from '../engine/types';

// Synthetic thresholds only — no real standards.
const HB: ResolvedThresholds = { pass: 100, good: 140, excellent: 170, elite: 200 };
const LB: ResolvedThresholds = { pass: 600, good: 500, excellent: 450, elite: 400 };

describe('scoreToPercentage — higher is better', () => {
  it('hits each anchor exactly', () => {
    expect(scoreToPercentage(HB.pass, HB, false)).toBeCloseTo(ANCHORS.pass);
    expect(scoreToPercentage(HB.good, HB, false)).toBeCloseTo(ANCHORS.good);
    expect(scoreToPercentage(HB.excellent, HB, false)).toBeCloseTo(ANCHORS.excellent);
    expect(scoreToPercentage(HB.elite, HB, false)).toBeCloseTo(ANCHORS.elite);
  });

  it('is linear from 0 below pass', () => {
    expect(scoreToPercentage(50, HB, false)).toBeCloseTo(25); // half of pass -> half of 50%
    expect(scoreToPercentage(0, HB, false)).toBe(0);
    expect(scoreToPercentage(-10, HB, false)).toBe(0);
  });

  it('interpolates halfway good->excellent to ~77.5%', () => {
    const halfway = (HB.good + HB.excellent) / 2; // 155
    expect(scoreToPercentage(halfway, HB, false)).toBeCloseTo(77.5);
  });

  it('awards a small linear bonus above elite, capped at 110', () => {
    expect(scoreToPercentage(300, HB, false)).toBeCloseTo(105); // +50% over elite -> +5
    expect(scoreToPercentage(400, HB, false)).toBeCloseTo(BONUS_CAP); // +100% -> +10 (cap)
    expect(scoreToPercentage(1e6, HB, false)).toBe(BONUS_CAP);
  });
});

describe('scoreToPercentage — lower is better (inverted)', () => {
  it('hits each anchor exactly', () => {
    expect(scoreToPercentage(LB.pass, LB, true)).toBeCloseTo(ANCHORS.pass);
    expect(scoreToPercentage(LB.good, LB, true)).toBeCloseTo(ANCHORS.good);
    expect(scoreToPercentage(LB.excellent, LB, true)).toBeCloseTo(ANCHORS.excellent);
    expect(scoreToPercentage(LB.elite, LB, true)).toBeCloseTo(ANCHORS.elite);
  });

  it('faster than elite earns the capped bonus', () => {
    expect(scoreToPercentage(200, LB, true)).toBeCloseTo(105); // half the elite time -> +5
    expect(scoreToPercentage(0, LB, true)).toBe(BONUS_CAP);
  });

  it('slower than pass decays linearly to 0', () => {
    expect(scoreToPercentage(900, LB, true)).toBeCloseTo(25); // 1.5x pass
    expect(scoreToPercentage(1200, LB, true)).toBe(0); // 2x pass
    expect(scoreToPercentage(5000, LB, true)).toBe(0);
  });

  it('interpolates halfway good->excellent to ~77.5%', () => {
    const halfway = (LB.good + LB.excellent) / 2; // 475
    expect(scoreToPercentage(halfway, LB, true)).toBeCloseTo(77.5);
  });

  it('faster always scores higher than slower (monotonic)', () => {
    expect(scoreToPercentage(420, LB, true)).toBeGreaterThan(
      scoreToPercentage(480, LB, true),
    );
  });
});

describe('asResolved', () => {
  it('returns null if any anchor is missing', () => {
    expect(asResolved({ pass: 1, good: 2, excellent: 3, elite: null })).toBeNull();
    expect(asResolved({ pass: null, good: null, excellent: null, elite: null })).toBeNull();
  });
  it('narrows a fully-populated set', () => {
    expect(asResolved({ pass: 1, good: 2, excellent: 3, elite: 4 })).toEqual({
      pass: 1, good: 2, excellent: 3, elite: 4,
    });
  });
});
