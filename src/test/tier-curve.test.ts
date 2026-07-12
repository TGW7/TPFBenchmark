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

  it('elite is the hard ceiling — beating it still reads 100 (unified HABS model)', () => {
    expect(scoreToPercentage(300, HB, false)).toBe(100);
    expect(scoreToPercentage(400, HB, false)).toBe(BONUS_CAP); // BONUS_CAP === 100
    expect(scoreToPercentage(1e6, HB, false)).toBe(100);
  });
});

describe('scoreToPercentage — lower is better (inverted)', () => {
  it('hits each anchor exactly', () => {
    expect(scoreToPercentage(LB.pass, LB, true)).toBeCloseTo(ANCHORS.pass);
    expect(scoreToPercentage(LB.good, LB, true)).toBeCloseTo(ANCHORS.good);
    expect(scoreToPercentage(LB.excellent, LB, true)).toBeCloseTo(ANCHORS.excellent);
    expect(scoreToPercentage(LB.elite, LB, true)).toBeCloseTo(ANCHORS.elite);
  });

  it('faster than elite still reads the flat 100 ceiling', () => {
    expect(scoreToPercentage(200, LB, true)).toBe(100);
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
      pass: 1, novice: undefined, good: 2, excellent: 3, intermediate: undefined, advanced: undefined, elite: 4,
    });
  });
  it('passes novice/intermediate/advanced through untouched — null and a real number both survive', () => {
    expect(asResolved({ pass: 1, novice: null, good: 2, excellent: 3, elite: 4 })?.novice).toBeNull();
    expect(
      asResolved({ pass: 1, novice: 1.5, good: 2, excellent: 3, intermediate: 2.5, advanced: 3.5, elite: 4 })?.novice,
    ).toBe(1.5);
  });
});

// 2026-07-13 (round 8) — DUAL MODE: a `novice` value (plus `intermediate`/
// `advanced`) switches a benchmark onto the six-tier curve (50/60/70/80/90/100).
// Benchmarks without one (the HB/LB fixtures above) keep scoring on the
// untouched legacy four-tier curve. `excellent` is still required by the
// type but is vestigial here — the six-tier curve never reads it.
const HB6: ResolvedThresholds = {
  pass: 100, novice: 120, good: 140, excellent: 170, intermediate: 160, advanced: 180, elite: 200,
};
const LB6: ResolvedThresholds = {
  pass: 600, novice: 560, good: 500, excellent: 430, intermediate: 460, advanced: 420, elite: 400,
};

describe('scoreToPercentage — six-tier (novice populated) — higher is better', () => {
  it('hits each of the six anchors exactly', () => {
    expect(scoreToPercentage(HB6.pass, HB6, false)).toBeCloseTo(50);
    expect(scoreToPercentage(HB6.novice!, HB6, false)).toBeCloseTo(60);
    expect(scoreToPercentage(HB6.good, HB6, false)).toBeCloseTo(70);
    expect(scoreToPercentage(HB6.intermediate!, HB6, false)).toBeCloseTo(80);
    expect(scoreToPercentage(HB6.advanced!, HB6, false)).toBeCloseTo(90);
    expect(scoreToPercentage(HB6.elite, HB6, false)).toBeCloseTo(100);
  });

  it('interpolates halfway good->intermediate to 75% (not the legacy good->excellent curve)', () => {
    const halfway = (HB6.good + HB6.intermediate!) / 2; // 150
    expect(scoreToPercentage(halfway, HB6, false)).toBeCloseTo(75);
  });

  it('elite is still the hard ceiling', () => {
    expect(scoreToPercentage(300, HB6, false)).toBe(100);
  });
});

describe('scoreToPercentage — six-tier (novice populated) — lower is better', () => {
  it('hits each of the six anchors exactly', () => {
    expect(scoreToPercentage(LB6.pass, LB6, true)).toBeCloseTo(50);
    expect(scoreToPercentage(LB6.novice!, LB6, true)).toBeCloseTo(60);
    expect(scoreToPercentage(LB6.good, LB6, true)).toBeCloseTo(70);
    expect(scoreToPercentage(LB6.intermediate!, LB6, true)).toBeCloseTo(80);
    expect(scoreToPercentage(LB6.advanced!, LB6, true)).toBeCloseTo(90);
    expect(scoreToPercentage(LB6.elite, LB6, true)).toBeCloseTo(100);
  });

  it('interpolates halfway good->intermediate to 75%', () => {
    const halfway = (LB6.good + LB6.intermediate!) / 2; // 480
    expect(scoreToPercentage(halfway, LB6, true)).toBeCloseTo(75);
  });
});
