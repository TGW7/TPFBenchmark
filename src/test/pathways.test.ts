import { describe, expect, it } from 'vitest';
import { validatePathwayWeights } from '../engine/score';
import { HRS_PATHWAY_CONFIGS, HRS_PATHWAY_LIST, PATHWAY_IDS } from '../config/pathways';
import { DEMO_PATHWAY_LIST } from '../data/demo';
import type { PathwayConfig } from '../engine/types';

describe('pathway weight invariant', () => {
  it('defines the v1 lift pathways', () => {
    expect(PATHWAY_IDS).toEqual([
      'gym_goer', 'hybrid_athlete', 'crossfit_generalist', 'hyrox', 'powerlifter', 'bodybuilder',
    ]);
  });

  it('strength pathways carry no cardio weight', () => {
    for (const id of ['powerlifter', 'bodybuilder'] as const) {
      const w = HRS_PATHWAY_CONFIGS[id].weights;
      expect(w.running ?? 0).toBe(0);
      expect(w.erg_engine ?? 0).toBe(0);
    }
  });

  it('every config pathway is valid (unpopulated null weights are allowed)', () => {
    for (const p of HRS_PATHWAY_LIST) {
      expect(validatePathwayWeights(p).valid).toBe(true);
    }
  });

  it('every populated (demo) pathway sums to exactly 100', () => {
    for (const p of DEMO_PATHWAY_LIST) {
      const v = validatePathwayWeights(p);
      expect(v.populated).toBe(true);
      expect(v.sum).toBe(100);
      expect(v.valid).toBe(true);
    }
  });

  it('fails loudly when populated weights do not sum to 100', () => {
    const broken: PathwayConfig = {
      id: 'crossfit_generalist', label: 'broken',
      weights: { running: 50, erg_engine: 40 }, // sums to 90
    };
    const v = validatePathwayWeights(broken);
    expect(v.populated).toBe(true);
    expect(v.sum).toBe(90);
    expect(v.valid).toBe(false);
  });

  it('accepts populated weights that sum to 100', () => {
    const ok: PathwayConfig = {
      id: 'hyrox', label: 'ok',
      weights: { running: 60, erg_engine: 40 },
    };
    expect(validatePathwayWeights(ok).valid).toBe(true);
  });
});
