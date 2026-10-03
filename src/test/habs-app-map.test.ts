/**
 * 2026-10-03 — the HABS benchmarks' app keys (src/config/habsAppMap.ts, which
 * scripts/check-habs-vs-app.mjs uses to hand the app the same athlete) must be
 * the keys the app sync writes, or the check would compare a different athlete
 * from the one a signed-in user actually syncs.
 */
import { describe, expect, it } from 'vitest';
import { HABS_APP_KEYS, HABS_STD_KEYS, PREDICTION_RACE_EVENTS } from '../config/habsAppMap';
import { ORM_TO_APP, RACE_TO_APP } from '../data/appSync';
import { HRS_BENCHMARKS } from '../config/benchmarks';

describe('HABS app keys', () => {
  it('cover exactly the benchmarks that feed HABS', () => {
    const habsIds = HRS_BENCHMARKS.filter((b) => b.habsComponent).map((b) => b.id).sort();
    expect(Object.keys(HABS_APP_KEYS).sort()).toEqual(habsIds);
    expect(Object.keys(HABS_STD_KEYS).sort()).toEqual(habsIds);
  });

  it('match the app sync, both lifts and races', () => {
    for (const [id, key] of Object.entries(HABS_APP_KEYS)) {
      if ('orm' in key) expect(ORM_TO_APP[id], id).toBe(key.orm);
      else expect(RACE_TO_APP[id], id).toEqual({ modality: key.race[0], event: key.race[1] });
    }
  });
});

// 2026-10-03 — the races the predicted equivalents are built from
// (docs/LEGAL-FIXES-2026-10-03.md §6) are the races the sync maps.
describe('the prediction race map', () => {
  it('is the app sync\'s RACE_TO_APP for every lift / hybrid race the calculator lists (the HABS races + the 500 m row)', () => {
    const races = HRS_BENCHMARKS.filter((b) => b.source === 'race_times' && !b.optional).map((b) => b.id).sort();
    expect(Object.keys(PREDICTION_RACE_EVENTS).sort()).toEqual(races);
    for (const [id, ref] of Object.entries(PREDICTION_RACE_EVENTS)) expect(RACE_TO_APP[id], id).toEqual(ref);
  });

  it('covers every HABS race', () => {
    for (const [id, key] of Object.entries(HABS_APP_KEYS)) {
      if ('race' in key) expect(PREDICTION_RACE_EVENTS[id], id).toEqual({ modality: key.race[0], event: key.race[1] });
    }
  });
});
