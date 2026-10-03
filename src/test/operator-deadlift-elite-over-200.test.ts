/**
 * 2026-10-02 — the Operator deadlift Elite is always over 200 kg, mirrored from
 * tpf-app (src/lib/operational_readiness.ts, the "DEADLIFT ELITE" note; the
 * record is tpf-app docs/build/54_MILITARY_TOP_TIERS_COMPARISON.md §11.3).
 *
 * The owner, answering plan 54 Q9: "elite deadlift shoukd always be over 200kg
 * adjust accordingly". The workbook edit is
 * scripts/apply-military-top-tiers-2026-10-02.py; the values were checked
 * against the app's live ORS_PATHWAY_CONFIGS with scripts/check-operator-vs-app.mjs
 * (0 differences across the 13 mirrored units).
 *
 * How the app set each value (TPF's method, not a source): conventional = the
 * smallest 5 kg value over 200 that keeps the order between units; hex = the
 * smallest value at least 1.06 × the new conventional that keeps the hex order.
 * Pass, Good and Excellent did not move.
 *
 * BEFORE is typed here independently of the generated data, so the order and
 * "nothing else moved" checks compare the generated rows with something they
 * did not produce.
 *
 * 2026-10-03 — two later app changes, mirrored by changesets 2 and 3 of the
 * same script (the app's record: tpf-app
 * docs/build/55_SPECIAL_FORCES_AND_ELITE_UNIT_TIERS.md §10):
 *   - Plan 55 (the owner, 2026-10-02, "As you suggest"): a special-forces top
 *     is the harder of the general Elite and the hardest general unit's top.
 *     Three deadlift Elites moved — UKSF conventional 220 → 225, UKSF hex
 *     235 → 245, Pararescue hex 230 → 245 (ELITE_PLAN55). That breaks plan
 *     54's "order between units is kept" on purpose for those three rows; the
 *     order test now holds for every other pair and pins the three at or
 *     above every general unit's top instead (and shows they were below it).
 *   - The deadlift Excellent, evened out (the owner, 2026-10-03: "Even it out
 *     a bit 170kg is barely elite, wouldn't say. Even [in] a police unit"):
 *     Excellent = (Good + Elite) / 2 rounded to the nearest 5 kg, a half
 *     rounding up, only ever raised. "Pass, Good and Excellent did not move"
 *     became "Pass and Good did not move" plus that rule, checked against
 *     EXCELLENT_AFTER, typed here from the app's §10.2 (all 25 rows rose).
 *     Consequence: Green Berets' hex Excellent is now 220, so a 218 kg hex
 *     lift reads the top of Good there (84.25), not Excellent.
 */
import { describe, expect, it } from 'vitest';
import { OPERATOR_PATHWAYS } from '../config/generated/operator.generated';
import { asResolved, scoreToPercentage } from '../engine/tier-curve';

type Ladder = readonly [number, number, number, number]; // pass, good, excellent, elite

/** Every unit's deadlift rows BEFORE plan 54 (2026-10-02 workbook, pre-change). */
const BEFORE: Record<string, { conventional_dl?: Ladder; hex_bar_dl: Ladder }> = {
  us_police_pft:               { conventional_dl: [90, 115, 140, 160],  hex_bar_dl: [100, 125, 150, 170] },
  us_navy_prt:                 { conventional_dl: [90, 115, 145, 170],  hex_bar_dl: [100, 130, 160, 185] },
  uk_parachute_regiment_p_coy: { conventional_dl: [105, 135, 160, 180], hex_bar_dl: [110, 140, 180, 200] },
  us_marine_corps_pft_cft:     { conventional_dl: [105, 135, 160, 180], hex_bar_dl: [120, 150, 175, 195] },
  usaf_pararescue_pj:          {                                        hex_bar_dl: [115, 140, 170, 195] },
  us_army_airborne:            { conventional_dl: [110, 140, 165, 185], hex_bar_dl: [115, 145, 185, 205] },
  uk_special_forces_sas_sbs:   { conventional_dl: [115, 145, 165, 185], hex_bar_dl: [130, 160, 175, 200] },
  uk_royal_marines_cdo_course: { conventional_dl: [115, 145, 175, 195], hex_bar_dl: [130, 160, 190, 215] },
  us_infantry:                 { conventional_dl: [110, 140, 170, 195], hex_bar_dl: [120, 155, 185, 210] },
  navy_seal_bud_s:             { conventional_dl: [115, 145, 175, 195], hex_bar_dl: [130, 160, 190, 215] },
  uk_infantry:                 { conventional_dl: [110, 140, 170, 195], hex_bar_dl: [120, 155, 185, 210] },
  us_swat:                     { conventional_dl: [115, 145, 170, 195], hex_bar_dl: [130, 160, 185, 210] },
  us_army_special_forces_sfas: { conventional_dl: [130, 165, 195, 215], hex_bar_dl: [145, 180, 210, 235] },
};

/** The app's new Elites after plan 54 (§11.3's table) — the record of that
 *  change; ELITE_PLAN55 is laid over it for the three rows plan 55 moved. */
const AFTER_ELITE: Record<string, { conventional_dl?: number; hex_bar_dl: number }> = {
  us_police_pft:               { conventional_dl: 205, hex_bar_dl: 220 },
  us_navy_prt:                 { conventional_dl: 210, hex_bar_dl: 225 },
  uk_parachute_regiment_p_coy: { conventional_dl: 215, hex_bar_dl: 235 },
  us_marine_corps_pft_cft:     { conventional_dl: 215, hex_bar_dl: 230 },
  usaf_pararescue_pj:          {                       hex_bar_dl: 230 },
  us_army_airborne:            { conventional_dl: 220, hex_bar_dl: 240 },
  uk_special_forces_sas_sbs:   { conventional_dl: 220, hex_bar_dl: 235 },
  uk_royal_marines_cdo_course: { conventional_dl: 225, hex_bar_dl: 250 },
  us_infantry:                 { conventional_dl: 225, hex_bar_dl: 245 },
  navy_seal_bud_s:             { conventional_dl: 225, hex_bar_dl: 250 },
  uk_infantry:                 { conventional_dl: 225, hex_bar_dl: 245 },
  us_swat:                     { conventional_dl: 225, hex_bar_dl: 245 },
  us_army_special_forces_sfas: { conventional_dl: 230, hex_bar_dl: 255 },
};

/** 2026-10-03 — plan 55's three deadlift Elites (the app's §10.2). */
const ELITE_PLAN55: Record<string, { conventional_dl?: number; hex_bar_dl?: number }> = {
  uk_special_forces_sas_sbs: { conventional_dl: 225, hex_bar_dl: 245 }, // were 220 / 235
  usaf_pararescue_pj:        { hex_bar_dl: 245 },                       // was 230
};
const PLAN55_ROWS = new Set(['uk_special_forces_sas_sbs/conventional_dl', 'uk_special_forces_sas_sbs/hex_bar_dl', 'usaf_pararescue_pj/hex_bar_dl']);

/** The general units (plan 55 §1: comparison only) that this site mirrors.
 *  US SWAT is N-A there (a police specialist team); Para Reg, the Royal
 *  Marines and US Airborne are elite / airborne, not general. */
const GENERAL_UNITS = ['us_marine_corps_pft_cft', 'us_navy_prt', 'us_infantry', 'uk_infantry', 'us_police_pft'];

/** 2026-10-03 — every Excellent AFTER the evening-out (the app's §10.2), typed
 *  here, not computed, so the rule below is checked against something it did
 *  not produce. */
const EXCELLENT_AFTER: Record<string, { conventional_dl?: number; hex_bar_dl: number }> = {
  us_police_pft:               { conventional_dl: 160, hex_bar_dl: 175 }, // were 140 / 150
  us_navy_prt:                 { conventional_dl: 165, hex_bar_dl: 180 }, // were 145 / 160
  uk_parachute_regiment_p_coy: { conventional_dl: 175, hex_bar_dl: 190 }, // were 160 / 180
  us_marine_corps_pft_cft:     { conventional_dl: 175, hex_bar_dl: 190 }, // were 160 / 175
  usaf_pararescue_pj:          {                       hex_bar_dl: 195 }, // was 170
  us_army_airborne:            { conventional_dl: 180, hex_bar_dl: 195 }, // were 165 / 185
  uk_special_forces_sas_sbs:   { conventional_dl: 185, hex_bar_dl: 205 }, // were 165 / 175
  uk_royal_marines_cdo_course: { conventional_dl: 185, hex_bar_dl: 205 }, // were 175 / 190
  us_infantry:                 { conventional_dl: 185, hex_bar_dl: 200 }, // were 170 / 185
  navy_seal_bud_s:             { conventional_dl: 185, hex_bar_dl: 205 }, // were 175 / 190
  uk_infantry:                 { conventional_dl: 185, hex_bar_dl: 200 }, // were 170 / 185
  us_swat:                     { conventional_dl: 185, hex_bar_dl: 205 }, // were 170 / 185
  us_army_special_forces_sfas: { conventional_dl: 200, hex_bar_dl: 220 }, // were 195 / 210
};

/** Nearest 5 kg, a half rounding up (192.5 → 195). */
const round5 = (kg: number) => Math.floor(kg / 5 + 0.5) * 5;

const BARS = ['conventional_dl', 'hex_bar_dl'] as const;

const ladder = (unitId: string, benchId: string): Ladder | undefined => {
  const b = OPERATOR_PATHWAYS.find((p) => p.id === unitId)?.benchmarks.find((x) => x.id === benchId);
  if (!b) return undefined;
  const t = b.thresholds;
  return [t.pass, t.good, t.excellent, t.elite] as unknown as Ladder;
};

describe('Operator deadlift Elite — always over 200 kg (app plan 54 Q9)', () => {
  it('every unit with a deadlift row is in this table — none is left out of the rule', () => {
    const withDl = OPERATOR_PATHWAYS
      .filter((p) => p.benchmarks.some((b) => (BARS as readonly string[]).includes(b.id)))
      .map((p) => p.id).sort();
    expect(withDl).toEqual(Object.keys(BEFORE).sort());
  });

  it('every conventional and hex-bar deadlift Elite on every unit is over 200 kg', () => {
    for (const p of OPERATOR_PATHWAYS) {
      for (const b of p.benchmarks.filter((x) => (BARS as readonly string[]).includes(x.id))) {
        expect(b.thresholds.elite, `${p.id}/${b.id}`).toBeGreaterThan(200);
        expect((b.thresholds.elite as number) % 5, `${p.id}/${b.id} in 5 kg steps`).toBe(0);
      }
    }
  });

  it('the Elites are exactly the app’s values (plan 54, then plan 55 for UKSF and Pararescue)', () => {
    // 2026-10-03 — was plan 54's table alone; plan 55 moved three rows.
    for (const [unitId, bars] of Object.entries(AFTER_ELITE)) {
      for (const bar of BARS) {
        const want = ELITE_PLAN55[unitId]?.[bar] ?? bars[bar];
        expect(ladder(unitId, bar)?.[3], `${unitId}/${bar}`).toBe(want);
      }
    }
  });

  it('Pass and Good did not move', () => {
    // 2026-10-03 — was "Pass, Good and Excellent did not move"; Excellent now
    // follows the evening-out rule (next test).
    for (const [unitId, bars] of Object.entries(BEFORE)) {
      for (const bar of BARS) {
        expect(ladder(unitId, bar)?.slice(0, 2), `${unitId}/${bar}`).toEqual(bars[bar]?.slice(0, 2));
      }
    }
  });

  it('2026-10-03: Excellent = round5((Good + Elite) / 2), a half rounding up, only ever raised — on every row', () => {
    for (const [unitId, bars] of Object.entries(BEFORE)) {
      for (const bar of BARS) {
        const before = bars[bar];
        if (!before) continue;
        const [, good, excellent, elite] = ladder(unitId, bar)!;
        const rule = Math.max(before[2], round5((good + elite) / 2));
        expect(excellent, `${unitId}/${bar}: the rule`).toBe(rule);
        expect(excellent, `${unitId}/${bar}: the app's value`).toBe(EXCELLENT_AFTER[unitId][bar]);
        expect(excellent, `${unitId}/${bar}: raised, never lowered`).toBeGreaterThan(before[2]);
        expect(excellent, `${unitId}/${bar}: still under Elite`).toBeLessThan(elite);
      }
    }
    // EXCELLENT_AFTER covers exactly the rows BEFORE does (none silently skipped).
    const rowsOf = (t: Record<string, Partial<Record<(typeof BARS)[number], unknown>>>) =>
      Object.entries(t).flatMap(([u, b]) => BARS.filter((bar) => b[bar] != null).map((bar) => `${u}/${bar}`)).sort();
    expect(rowsOf(EXCELLENT_AFTER)).toEqual(rowsOf(BEFORE));
    expect(rowsOf(EXCELLENT_AFTER)).toHaveLength(25);
  });

  it('2026-10-03: the owner’s examples — police no longer has a 65 kg top step', () => {
    // Shown police at 90 / 115 / 140 / 205: "Even it out a bit 170kg is barely elite".
    expect(ladder('us_police_pft', 'conventional_dl')).toEqual([90, 115, 160, 205]);
    expect(ladder('us_police_pft', 'hex_bar_dl')).toEqual([100, 125, 175, 220]);
    expect(ladder('us_navy_prt', 'conventional_dl')).toEqual([90, 115, 165, 210]); // the app's US Army rows
    const t = asResolved(OPERATOR_PATHWAYS.find((p) => p.id === 'us_police_pft')!.benchmarks.find((b) => b.id === 'conventional_dl')!.thresholds)!;
    expect(scoreToPercentage(150, t, false)).toBeLessThan(85); // was Excellent (87.3 in the app), now Good
    expect(scoreToPercentage(170, t, false)).toBeLessThan(100); // never Elite
  });

  it('hex Excellent is at least the conventional Excellent on every unit', () => {
    for (const unitId of Object.keys(BEFORE)) {
      const conv = ladder(unitId, 'conventional_dl')?.[2];
      if (conv == null) continue;
      expect(ladder(unitId, 'hex_bar_dl')![2], unitId).toBeGreaterThanOrEqual(conv);
    }
  });

  it('the order between units is kept on each bar — except plan 55’s three rows (harder stays harder, equal stays equal)', () => {
    // 2026-10-03 — plan 55 broke the order on purpose for UKSF (both bars) and
    // Pararescue (hex); every other pair is checked as before.
    const units = Object.keys(BEFORE);
    let checked = 0;
    for (const bar of BARS) {
      for (const a of units) {
        for (const b of units) {
          if (PLAN55_ROWS.has(`${a}/${bar}`) || PLAN55_ROWS.has(`${b}/${bar}`)) continue;
          const ba = BEFORE[a][bar]?.[3]; const bb = BEFORE[b][bar]?.[3];
          if (ba == null || bb == null) continue;
          const na = ladder(a, bar)![3]; const nb = ladder(b, bar)![3];
          expect(Math.sign(na - nb), `${bar}: ${a} vs ${b}`).toBe(Math.sign(ba - bb));
          checked++;
        }
      }
    }
    // conventional: 12 units (Pararescue has none) less UKSF; hex: 13 less UKSF and Pararescue.
    expect(checked).toBe(11 * 11 + 11 * 11);
  });

  it('plan 55’s three rows sit at or above every general unit’s top on that bar — and were below it before', () => {
    for (const row of PLAN55_ROWS) {
      const [unitId, bar] = row.split('/') as [string, (typeof BARS)[number]];
      const generalTop = Math.max(...GENERAL_UNITS.map((g) => ladder(g, bar)![3]));
      expect(ladder(unitId, bar)![3], row).toBeGreaterThanOrEqual(generalTop);
      expect(AFTER_ELITE[unitId][bar]!, `${row} before plan 55`).toBeLessThan(generalTop);
    }
  });

  it('hex Elite is at least 1.06 × the conventional Elite (and no more than 1.12)', () => {
    for (const unitId of Object.keys(BEFORE)) {
      const conv = ladder(unitId, 'conventional_dl')?.[3];
      const hex = ladder(unitId, 'hex_bar_dl')![3];
      if (conv == null) continue; // Pararescue has the hex bar only
      expect(hex / conv, unitId).toBeGreaterThanOrEqual(1.06);
      expect(hex / conv, unitId).toBeLessThanOrEqual(1.12);
    }
  });

  it('a 200 kg conventional (or 218 kg hex) deadlift never reads Elite; it reads Excellent on every unit but Green Berets’ hex bar', () => {
    // 2026-10-03 — was "reads Excellent on every unit". Green Berets' hex
    // Excellent rose 210 → 220 (evened out), so 218 kg is the top of Good
    // there — pinned by name. Their conventional Excellent is exactly 200.
    for (const unitId of Object.keys(BEFORE)) {
      for (const [bar, kg] of [['conventional_dl', 200], ['hex_bar_dl', 218]] as const) {
        const b = OPERATOR_PATHWAYS.find((p) => p.id === unitId)?.benchmarks.find((x) => x.id === bar);
        if (!b) continue;
        const t = asResolved(b.thresholds);
        if (!t) throw new Error(`${unitId}/${bar} has no thresholds`);
        const pct = scoreToPercentage(kg, t, false);
        expect(pct, `${unitId}/${bar} at ${kg} kg`).toBeLessThan(100);
        if (unitId === 'us_army_special_forces_sfas' && bar === 'hex_bar_dl') {
          expect(pct, 'Green Berets hex at 218 kg: the top of Good').toBeGreaterThanOrEqual(70);
          expect(pct, 'Green Berets hex at 218 kg: the top of Good').toBeLessThan(85);
          expect(pct).toBeCloseTo(84.25, 2); // the app's §10.1 says 84.3 %
        } else {
          expect(pct, `${unitId}/${bar} at ${kg} kg`).toBeGreaterThanOrEqual(85);
        }
      }
    }
  });
});
