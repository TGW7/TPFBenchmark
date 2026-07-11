import { describe, expect, it } from 'vitest';
import { computeHRS, validatePathwayWeights } from '../engine';
import { brandConfig } from '../data/brandConfig';
import {
  OPERATOR_BENCHMARKS_BY_PATHWAY,
  OPERATOR_PATHWAY_LIST,
  OPERATOR_SAMPLE_LOGS,
  OPERATOR_SAMPLE_PROFILE,
} from '../config/operator';

describe('operator config (real ORS)', () => {
  it('has both US and UK units', () => {
    const us = OPERATOR_PATHWAY_LIST.filter((p) => p.group === 'US');
    const uk = OPERATOR_PATHWAY_LIST.filter((p) => p.group === 'UK');
    expect(us.length).toBeGreaterThanOrEqual(8);
    expect(uk.length).toBeGreaterThanOrEqual(5);
  });

  it('every unit’s weights sum to ~100', () => {
    for (const p of OPERATOR_PATHWAY_LIST) {
      expect(Math.round(validatePathwayWeights(p).sum)).toBe(100);
    }
  });

  it('uses absolute, unisex thresholds', () => {
    const bms = OPERATOR_BENCHMARKS_BY_PATHWAY[OPERATOR_PATHWAY_LIST[0].id];
    const squat = bms.find((b) => b.id === 'back_squat');
    expect(squat?.normalization).toBe('absolute');
    expect(squat?.thresholds.M).toEqual(squat?.thresholds.F);
  });

  it('scores the sample operator athlete (~good tier) via brandConfig', () => {
    const cfg = brandConfig('operator');
    const pid = cfg.pathwayList[0].id;
    const r = computeHRS({
      pathway: cfg.pathways[pid],
      benchmarks: cfg.benchmarksFor(pid),
      profile: OPERATOR_SAMPLE_PROFILE,
      logs: OPERATOR_SAMPLE_LOGS,
    });
    expect(r.overall).toBeGreaterThan(55);
    expect(r.overall).toBeLessThanOrEqual(100);
    expect(r.coverage).toBeGreaterThan(0.5);
  });
});
