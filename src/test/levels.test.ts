import { describe, expect, it } from 'vitest';
import { HABS_LEVEL_STEP, HABS_MAX_LEVEL, habsLevelInfo } from '../engine/levels';

describe('unified HABS 20-level ladder (mirrors tpf-app)', () => {
  it('anchors match the tier curve: L10=pass, L14=good, L17=excellent, L20=elite', () => {
    expect(habsLevelInfo(50).level).toBe(10);
    expect(habsLevelInfo(70).level).toBe(14);
    expect(habsLevelInfo(85).level).toBe(17);
    expect(habsLevelInfo(100).level).toBe(20);
  });
  it('under one step reads unranked; 100 is the true top (no bonus headroom)', () => {
    expect(habsLevelInfo(4.9).level).toBe(0);
    expect(HABS_MAX_LEVEL * HABS_LEVEL_STEP).toBe(100);
    const top = habsLevelInfo(100);
    expect(top.nextThreshold).toBeNull();
    expect(top.toNext).toBe(0);
  });
  it('reports progress toward the next level', () => {
    const mid = habsLevelInfo(73);
    expect(mid.level).toBe(14);
    expect(mid.nextThreshold).toBe(75);
    expect(mid.toNext).toBeCloseTo(2);
    expect(mid.progress).toBeCloseTo(0.6);
  });
  it('clamps out-of-range scores', () => {
    expect(habsLevelInfo(120).level).toBe(20);
    expect(habsLevelInfo(-5).level).toBe(0);
    expect(habsLevelInfo(null).level).toBe(0);
  });
});
