import { describe, expect, it } from 'vitest';
import { tierCells, TIER_COLUMNS } from '../ui/format';
import type { ThresholdSet } from '../engine/types';

describe('tierCells', () => {
  it('six-tier: drops excellent, stays monotonic (regression — Back Squat M)', () => {
    // From lift.data.json — the exact row that read 80/100/120/155/145/165/190
    // in the Browse Standards table before this fix (excellent=155 sitting
    // between good=120 and intermediate=145, breaking the visible order).
    const t: ThresholdSet = { pass: 80, novice: 100, good: 120, excellent: 155, intermediate: 145, advanced: 165, elite: 190 };
    const cells = tierCells(t, 'kg');
    expect(cells).toEqual(['80', '100', '120', '145', '165', '190']);
    expect(cells).toHaveLength(TIER_COLUMNS.length);
    const nums = cells.map(Number);
    for (let i = 1; i < nums.length; i++) expect(nums[i]).toBeGreaterThan(nums[i - 1]);
  });

  it('four-tier: maps excellent into the Advanced slot, dashes Novice/Intermediate', () => {
    const t: ThresholdSet = { pass: 30, good: 50, excellent: 75, elite: 100 };
    expect(tierCells(t, 'reps')).toEqual(['30 reps', '—', '50 reps', '—', '75 reps', '100 reps']);
  });

  it('renders "—" for any null tier', () => {
    const t: ThresholdSet = { pass: null, good: null, excellent: null, elite: null };
    expect(tierCells(t, 'kg')).toEqual(['—', '—', '—', '—', '—', '—']);
  });
});
