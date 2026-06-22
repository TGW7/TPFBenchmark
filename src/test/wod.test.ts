import { describe, expect, it } from 'vitest';
import { WOD_CORE_WEIGHT, scoreWod } from '../engine/wod';
import type { AthleteProfile, WodDef } from '../engine/types';

const PROFILE: AthleteProfile = { sex: 'M', bodyweightKg: 80 };

// Synthetic, lower-is-better (time) WOD.
const FRAN: WodDef = {
  id: 'fran', unit: 'mm:ss', lowerIsBetter: true,
  thresholds: {
    M: { pass: 360, good: 240, excellent: 180, elite: 120 },
    F: { pass: 420, good: 300, excellent: 210, elite: 150 },
  },
  qualityMix: {},
};

const NULLED: WodDef = {
  id: 'grace', unit: 'mm:ss', lowerIsBetter: true,
  thresholds: {
    M: { pass: null, good: null, excellent: null, elite: null },
    F: { pass: null, good: null, excellent: null, elite: null },
  },
  qualityMix: {},
};

describe('scoreWod scaling rules', () => {
  it('Rx maps the full tier curve', () => {
    // 210s is halfway good(240)->excellent(180) -> 77.5%
    expect(scoreWod(FRAN, { wodId: 'fran', value: 210, scaling: 'rx' }, PROFILE).percent).toBeCloseTo(77.5);
  });

  it('scaled is capped at the good (70%) ceiling', () => {
    // 150s would be ~92.5% Rx, but scaled caps at 70.
    expect(scoreWod(FRAN, { wodId: 'fran', value: 150, scaling: 'scaled' }, PROFILE).percent).toBe(70);
  });

  it('incomplete is scored on a rep-equivalent (below pass)', () => {
    const s = scoreWod(
      FRAN,
      { wodId: 'fran', value: 0, scaling: 'incomplete', repsCompleted: 45, repsPrescribed: 90 },
      PROFILE,
    );
    expect(s.percent).toBeCloseTo(25); // 50% of prescribed work -> 25%
  });

  it('returns null when WOD thresholds are still TODO', () => {
    expect(scoreWod(NULLED, { wodId: 'grace', value: 200, scaling: 'rx' }, PROFILE).percent).toBeNull();
  });
});

describe('WOD core weight', () => {
  it('is 0 in v1 (display-only, never folded into HRS)', () => {
    expect(WOD_CORE_WEIGHT).toBe(0);
  });
});
