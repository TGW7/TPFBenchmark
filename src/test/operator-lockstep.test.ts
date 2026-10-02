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
 *
 * 2026-10-02 — standards rebuild (tpf-app docs/build/51_STANDARDS_REBUILD_2026-10-02.md
 * §2.10). Five benchmarks in the fixture were edited by hand to the app's new
 * values — and only those five; every other value is the 2026-07-28 snapshot:
 *   us_police_pft 1_5_mile_run   750/690/630/570 → 810/645/585/510 (US Navy PRT
 *                                1.5-mile, men 20-24 — was stated as Cooper)
 *   us_police_pft push_ups_1_min  30/45/60/75 → 30/45/57/67 (USAF PFRA, men <25)
 *   us_police_pft sit_ups_1_min   30/45/60/75 → 33/43/51/58 (USAF PFRA, men <25)
 *   navy_seal_bud_s 500_m_swim   750/600/540/480 → 825/660/594/528 (the PST
 *                                swim is 500 YARDS; × 1.0995 to 500 m)
 *   uk_royal_marines_cdo_course 500_m_swim 863/690/621/552 → 948/759/683/607
 *                                (derived: the corrected SEAL swim × 1.15)
 * All twelve app-mirrored units were re-compared with the app's
 * operational_readiness.ts the same day (a textual read of that file): no
 * other threshold differs.
 *
 * 2026-10-02, later — the Navy PRT and the minimum / good / maximum rule
 * (tpf-app docs/build/51_STANDARDS_REBUILD_2026-10-02.md §11; the workbook
 * edit is scripts/apply-navy-prt-and-military-tiers-2026-10-02.py). The
 * fixture was REGENERATED from operator.data.json (the strip() shape below,
 * which now also carries `alternativeGroup`) after checking it against the
 * app's live ORS_PATHWAY_CONFIGS with scripts/check-operator-vs-app.mjs — 0
 * differences across 13 mirrored units. What moved, old → new:
 *   us_marine_corps_pft_cft 3_mile_run       Elite 1080 → 1025 (above the PFT max)
 *   us_marine_corps_pft_cft pull_ups_no_time Elite 23 → 25
 *   us_marine_corps_pft_cft push_ups_2_min   Elite 87 → 96
 *   us_marine_corps_pft_cft plank_front      Elite 225 → 250
 *   us_police_pft 1_5_mile_run               Elite 510 → 485 (above Navy 20-24 max)
 *   us_police_pft push_ups_1_min             Elite 67 → 74 (above USAF PFRA max)
 *   us_police_pft sit_ups_1_min              Elite 58 → 64
 *   navy_seal_bud_s pull_ups_no_time         Pass 8 → 10 (the BUD/S PST minimum)
 *   us_navy_prt                              NEW unit, 13 benchmarks (the app's
 *                                            `navy`), cardio = one alternative group
 * No other value in the fixture changed (diffed). The values themselves are
 * pinned against the app in operator-navy-prt.test.ts.
 *
 * NOTE: this fixture is a snapshot of THIS repository's generated data, so it
 * catches drift here but cannot see the app move — run
 * `npm run check:app-ors -- <path to tpf-app>` for that.
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
      ...(b.alternativeGroup ? { alternativeGroup: b.alternativeGroup } : {}),
    })),
  }));

describe('Operator lockstep snapshot', () => {
  it('has not drifted from the last app-verified snapshot', () => {
    expect(strip(OPERATOR_PATHWAYS)).toEqual(snapshot);
  });

  it('the snapshot itself covers all 16 pathways currently expected', () => {
    // 2026-10-02 — 15 → 16: us_navy_prt (the app's `navy`, now on the Navy PRT).
    const ids = snapshot.map((p: { id: string }) => p.id).sort();
    expect(ids).toEqual([
      'navy_seal_bud_s', 'uk_aru_sco19', 'uk_infantry', 'uk_parachute_regiment_p_coy',
      'uk_police_jrft', 'uk_royal_marines_cdo_course', 'uk_special_forces_sas_sbs',
      'us_army_airborne', 'us_army_ranger_rasp_entry', 'us_army_special_forces_sfas',
      'us_infantry', 'us_marine_corps_pft_cft', 'us_navy_prt', 'us_police_pft', 'us_swat', 'usaf_pararescue_pj',
    ]);
  });
});
