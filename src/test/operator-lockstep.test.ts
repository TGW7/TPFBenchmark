/**
 * 2026-07-28 — Operator's equivalent of pathway-standards.test.ts's lockstep
 * guard. Lift has hardcoded per-benchmark tuples pinning every shared value
 * against tpf-app; Operator's own test (operator.test.ts) only ever did
 * generic sanity checks (weights sum to 100, unisex, a sample score in
 * range) — nothing pinned the actual mirrored numbers down, so a future
 * accidental edit to TPF_Operator_Standards.xlsx could silently drift
 * tpf-benchmark away from tpf-app again with nothing catching it, the exact
 * failure mode the Lift-side lockstep test was built to close.
 *
 * 177 benchmark defs across 15 pathways is too much to hand-transcribe into
 * test literals without risking the same transcription errors this test
 * exists to catch — instead this diffs the live generated data against a
 * frozen snapshot (__fixtures__/operator-lockstep-snapshot.json) taken from
 * operator.data.json at a point this session's app-alignment audit had
 * already verified matched tpf-app's operational_readiness.ts exactly.
 *
 * A FAILURE here means the generated Operator data changed — expected after
 * a deliberate edit (re-run the snapshot generator described in that commit
 * to update the fixture), a real problem if unexpected.
 */
import { describe, expect, it } from 'vitest';
import { OPERATOR_PATHWAYS } from '../config/generated/operator.generated';
import snapshot from './__fixtures__/operator-lockstep-snapshot.json';

const strip = (pathways: typeof OPERATOR_PATHWAYS) =>
  pathways.map((p) => ({
    id: p.id,
    region: p.region,
    weights: p.weights,
    benchmarks: p.benchmarks.map((b) => ({
      id: b.id,
      unit: b.unit,
      lowerIsBetter: b.lowerIsBetter,
      thresholds: b.thresholds,
    })),
  }));

describe('Operator lockstep snapshot', () => {
  it('has not drifted from the last app-verified snapshot', () => {
    expect(strip(OPERATOR_PATHWAYS)).toEqual(snapshot);
  });

  it('the snapshot itself covers all 15 pathways currently expected', () => {
    const ids = snapshot.map((p: { id: string }) => p.id).sort();
    expect(ids).toEqual([
      'navy_seal_bud_s', 'uk_aru_sco19', 'uk_infantry', 'uk_parachute_regiment_p_coy',
      'uk_police_jrft', 'uk_royal_marines_cdo_course', 'uk_special_forces_sas_sbs',
      'us_army_airborne', 'us_army_ranger_rasp_entry', 'us_army_special_forces_sfas',
      'us_infantry', 'us_marine_corps_pft_cft', 'us_police_pft', 'us_swat', 'usaf_pararescue_pj',
    ]);
  });
});
