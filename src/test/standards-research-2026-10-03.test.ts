/**
 * 2026-10-03 — the TPF app's plan 61, the missing standards researched,
 * mirrored here (tpf-app docs/build/61_MISSING_STANDARDS_RESEARCH_2026-10-03.md
 * §8: §8.2 is every value that moved, §8.6 the list of values this repository
 * takes). The owner, verbatim: "1 yes build all above".
 *
 * The workbook edit is scripts/apply-standards-research-2026-10-03.py (both
 * masters). Afterwards `npm run check:app-ors -- <tpf-app>` reported 0
 * differences across the 13 mirrored units (34 cite cells compared) and the
 * new `npm run check:app-lift -- <tpf-app>` 0 differences (4 WODs, 14 base
 * keys, 68 app pathway rows). Those two scripts read the app; this test does
 * not — every OLD and NEW value below is typed from the app's record, never
 * read from the generated data it checks.
 *
 * Beyond §8.6's list: the HABS base table's three moved cells (women's
 * overhead press Beginner, women's 20 / 40 km bike Beginner). This site's base
 * table is the app's (pathway-standards.test.ts), and the new Lift check found
 * them; they are pinned there and here.
 *
 * Not pinned here, because it cannot be read from a test (this repository has
 * no Node types, so no xlsx read in tests): the workbook's new `cite` column.
 * check:app-ors compares it with the app, verbatim.
 */
import { describe, expect, it } from 'vitest';
import { OPERATOR_PATHWAYS } from '../config/generated/operator.generated';
import {
  BENCHMARK_SOURCING, PATHWAY_STANDARD_OVERRIDES, STANDARDS_THRESHOLDS, WOD_STANDARDS,
} from '../config/generated/standards.generated';
import { OPERATOR_BENCHMARKS_BY_PATHWAY } from '../config/operator';
import { benchmarkLabel } from '../ui/format';
import { asResolved, scoreToPercentage } from '../engine/tier-curve';
import type { ThresholdSet } from '../engine/types';

type Tier = 'pass' | 'good' | 'excellent' | 'elite';
const TIERS6 = ['pass', 'novice', 'good', 'intermediate', 'advanced', 'elite'] as const;

const PJ = 'usaf_pararescue_pj';
const SEAL = 'navy_seal_bud_s';
const SFAS = 'us_army_special_forces_sfas';
const NAVY = 'us_navy_prt';
const POLICE = 'us_police_pft';
const USMC = 'us_marine_corps_pft_cft';

const bench = (unitId: string, id: string) => {
  const b = OPERATOR_PATHWAYS.find((p) => p.id === unitId)?.benchmarks.find((x) => x.id === id);
  if (!b) throw new Error(`no ${unitId}/${id}`);
  return b;
};
const ladder = (unitId: string, id: string) => {
  const t = bench(unitId, id).thresholds;
  return [t.pass, t.good, t.excellent, t.elite];
};
const six = (t: ThresholdSet) => TIERS6.map((k) => t[k]);
const round = (v: number, step: number) => Math.floor(v / step + 0.5) * step; // a half rounds up

/** Every Operator value plan 61 moved on a unit this site mirrors.
 *  [unit, benchmark id, tier, old, new]; seconds, reps, metres. */
const MOVED: Array<[string, string, Tier, number, number]> = [
  [PJ, '1_5_mile_run', 'pass', 610, 620],
  [PJ, '500_m_swim', 'pass', 720, 750],
  [PJ, 'push_ups_2_min', 'pass', 50, 40],
  [PJ, 'sit_ups_2_min', 'pass', 54, 50],
  [USMC, 'plank_front', 'pass', 63, 70],
  [POLICE, 'plank_front', 'pass', 60, 90], [POLICE, 'plank_front', 'good', 90, 150],
  [POLICE, 'plank_front', 'excellent', 150, 210], [POLICE, 'plank_front', 'elite', 210, 270],
  ...[NAVY, POLICE].flatMap((u): Array<[string, string, Tier, number, number]> => [
    [u, 'broad_jump', 'good', 1.9, 1.95], [u, 'broad_jump', 'excellent', 2.1, 2.2], [u, 'broad_jump', 'elite', 2.3, 2.4],
  ]),
  ...[SEAL, PJ, SFAS].flatMap((u): Array<[string, string, Tier, number, number]> => [
    [u, 'broad_jump', 'pass', 1.8, 1.93], [u, 'broad_jump', 'good', 2, 2.16],
    [u, 'broad_jump', 'excellent', 2.2, 2.39], [u, 'broad_jump', 'elite', 2.4, 2.65],
  ]),
];

describe('Operator — plan 61 Part B', () => {
  it('every mirrored value is exactly the app’s new one (27 values)', () => {
    expect(MOVED).toHaveLength(27);
    for (const [unitId, id, tier, old, want] of MOVED) {
      expect(bench(unitId, id).thresholds[tier], `${unitId}/${id} ${tier} (was ${old})`).toBe(want);
    }
  });

  it('Pararescue reads the IFT worksheet (10 Jan 2023, PJ column) and names it', () => {
    expect(ladder(PJ, '1_5_mile_run')).toEqual([620, 570, 540, 495]); // 10:20
    expect(ladder(PJ, '500_m_swim')).toEqual([750, 660, 600, 570]); // 12:30; civilians enlist on 15:00
    expect(ladder(PJ, 'pull_ups_no_time')).toEqual([8, 12, 18, 25]);
    expect(ladder(PJ, 'push_ups_2_min')).toEqual([40, 70, 85, 105]);
    expect(ladder(PJ, 'sit_ups_2_min')).toEqual([50, 70, 90, 110]);
    expect(bench(PJ, '500_m_swim').name).toBe('500 m swim (IFT, PJ column — enlistees 15:00; freestyle, breaststroke or sidestroke)');
    expect(bench(PJ, 'pull_ups_no_time').name).toBe('Pull-ups (2 min)');
  });

  it('the renamed pull-ups keep their stored id; the other units keep "(no time)"', () => {
    // Ids are stored (submissions, saved entries) and shared across units.
    for (const u of [SEAL, SFAS, USMC, 'uk_special_forces_sas_sbs', 'us_infantry']) {
      expect(bench(u, 'pull_ups_no_time').name, u).toBe('Pull-ups (no time)');
    }
    const label = (unitId: string, id: string) =>
      benchmarkLabel(OPERATOR_BENCHMARKS_BY_PATHWAY[unitId].find((b) => b.id === id)!);
    expect(label(PJ, 'pull_ups_no_time')).toBe('Pull-ups (2 min)');
    expect(label(PJ, '500_m_swim')).toBe('500 m swim'); // the grid keeps the short label
  });

  it('broad jump: one flat ladder per group, special forces above general at every tier', () => {
    const general = [1.7, 1.95, 2.2, 2.4];
    const sf = [1.93, 2.16, 2.39, 2.65];
    const combat = [1.8, 2, 2.2, 2.4]; // kept, now with a stated basis
    for (const u of [NAVY, POLICE]) expect(ladder(u, 'broad_jump'), u).toEqual(general);
    for (const u of [SEAL, PJ, SFAS]) expect(ladder(u, 'broad_jump'), u).toEqual(sf);
    for (const u of [USMC, 'us_army_airborne', 'uk_parachute_regiment_p_coy', 'uk_royal_marines_cdo_course']) {
      expect(ladder(u, 'broad_jump'), u).toEqual(combat);
    }
    expect(ladder('us_swat', 'broad_jump')).toEqual([1.9, 2.1, 2.3, 2.5]); // kept
    for (let i = 0; i < 4; i++) expect(sf[i]).toBeGreaterThan(general[i]);
    // Every unit that holds a broad jump is one of the four ladders above.
    const holders = OPERATOR_PATHWAYS.filter((p) => p.benchmarks.some((b) => b.id === 'broad_jump')).map((p) => p.id).sort();
    expect(holders).toEqual([SEAL, 'uk_parachute_regiment_p_coy', 'uk_royal_marines_cdo_course', 'us_army_airborne',
      SFAS, USMC, NAVY, POLICE, 'us_swat', PJ].sort());
  });

  it('plank: the police plank is the operator plank now; no Pass sits under the lowest US entry minimum (1:10)', () => {
    const operatorPlank = [90, 150, 210, 270];
    expect(ladder(POLICE, 'plank_front')).toEqual(operatorPlank);
    expect(ladder(USMC, 'plank_front')).toEqual([70, 180, 210, 270]);
    expect(ladder(NAVY, 'plank_front')).toEqual([71, 143, 184, 270]); // the Navy PRT's own table, unchanged
    const planks = OPERATOR_PATHWAYS.flatMap((p) => p.benchmarks.filter((b) => b.id === 'plank_front').map((b) => [p.id, b] as const));
    expect(planks.length).toBeGreaterThanOrEqual(13);
    for (const [u, b] of planks) {
      expect(b.thresholds.pass as number, u).toBeGreaterThanOrEqual(70);
      if (u !== USMC && u !== NAVY) expect(ladder(u, 'plank_front'), u).toEqual(operatorPlank);
    }
  });

  it('…and before plan 61 the police plank Pass (1:00) was under every US entry minimum', () => {
    const before = MOVED.find(([u, id, t]) => u === POLICE && id === 'plank_front' && t === 'pass')![3];
    expect(before).toBeLessThan(70);
  });
});

describe('Lift — HYROX, Cindy, TPF Benchmark’s broad jump (plan 61 §8.6)', () => {
  it('HYROX: only the bottom tiers moved, both easier', () => {
    const m = six(WOD_STANDARDS.hyrox_race.thresholds.M);
    const f = six(WOD_STANDARDS.hyrox_race.thresholds.F);
    expect(m).toEqual([7050, 5850, 5160, 4800, 4440, 4080]); // 1:57:30 / 1:37:30 / 1:26 / 1:20 / 1:14 / 1:08
    expect(f).toEqual([7770, 6450, 5670, 5280, 4890, 4500]); // 2:09:30 / 1:47:30 / 1:34:30 / 1:28 / 1:21:30 / 1:15
    const beforeM = [5700, 5430, 5160, 4800, 4440, 4080];
    const beforeF = [6270, 5970, 5700, 5280, 4890, 4500];
    for (let i = 0; i < 6; i++) {
      expect(m[i] as number, `men ${TIERS6[i]}`).toBeGreaterThanOrEqual(beforeM[i]);
      // Women's Experienced is the one tier that got 30 s HARDER (× 1.10 rounding).
      if (i !== 2) expect(f[i] as number, `women ${TIERS6[i]}`).toBeGreaterThanOrEqual(beforeF[i]);
    }
  });

  it('HYROX: Beginner / Novice = 3.9 × TPF’s 5 km Beginner / Novice; women = men × 1.10, to 30 s', () => {
    const run5k = STANDARDS_THRESHOLDS.run_5k.M;
    const m = WOD_STANDARDS.hyrox_race.thresholds.M;
    expect(m.pass).toBe(round(3.9 * (run5k.pass as number), 30));
    expect(m.novice).toBe(round(3.9 * (run5k.novice as number), 30));
    const f = WOD_STANDARDS.hyrox_race.thresholds.F;
    for (const k of TIERS6) expect(f[k], k).toBe(round((m[k] as number) * 1.1, 30));
  });

  it('HYROX: a man finishing in 1:36 is no longer below Beginner', () => {
    const t = asResolved(WOD_STANDARDS.hyrox_race.thresholds.M)!;
    expect(scoreToPercentage(96 * 60, t, true)).toBeGreaterThanOrEqual(50);
  });

  it('Cindy (and Fran, Helen) unchanged', () => {
    expect(six(WOD_STANDARDS.cindy.thresholds.M)).toEqual([12, 15, 18, 21, 23, 25]);
    expect(six(WOD_STANDARDS.cindy.thresholds.F)).toEqual([10, 13, 16, 19, 21, 22]);
    expect(six(WOD_STANDARDS.fran.thresholds.M)).toEqual([360, 300, 240, 220, 195, 165]);
    expect(six(WOD_STANDARDS.helen.thresholds.M)).toEqual([840, 750, 660, 580, 510, 450]);
  });

  it('the six-tier broad jump: men’s Elite 285 → 275 cm; women about 0.80 × men at every tier', () => {
    const m = six(STANDARDS_THRESHOLDS.broad_jump.M) as number[];
    const f = six(STANDARDS_THRESHOLDS.broad_jump.F) as number[];
    expect(m).toEqual([200, 215, 230, 250, 270, 275]);
    expect(f).toEqual([160, 175, 185, 200, 215, 220]); // kept
    for (let i = 0; i < 6; i++) {
      expect(f[i] / m[i], TIERS6[i]).toBeGreaterThanOrEqual(0.78);
      expect(f[i] / m[i], TIERS6[i]).toBeLessThanOrEqual(0.82);
    }
    expect(f[5] / m[5]).toBeCloseTo(0.8, 5); // the Elite pair, exactly 0.80 (2.85 was 0.77)
  });

  it('the broad jump is relabelled TPF’s own, now checked — no longer "a gap"', () => {
    const s = BENCHMARK_SOURCING.find((r) => r.id === 'broad_jump')!;
    expect(s.dataSource).toMatch(/checked 2026-10-03/);
    expect(s.dataSource).not.toMatch(/a gap/);
    expect(s.license).toBe("TPF's own");
  });
});

describe('Lift — the HABS base table follows the app (found by check:app-lift)', () => {
  it('women’s overhead press Beginner 20 → 25 kg; the pathways that set their own stay at 20 kg', () => {
    expect(STANDARDS_THRESHOLDS.strict_press_1rm.F.pass).toBe(25);
    expect(STANDARDS_THRESHOLDS.strict_press_1rm.M.pass).toBe(40); // men unchanged
    // The app's §8.7 Q2: HYROX / triathlete / bodybuilder set their own women's
    // overhead press and still start at the empty bar (moving them needs new numbers).
    for (const p of ['hyrox', 'triathlete', 'bodybuilder'] as const) {
      expect(PATHWAY_STANDARD_OVERRIDES[p]?.strict_press_1rm.F.pass, p).toBe(20);
    }
  });

  it('women’s 20 km TT Beginner 50:00 → 49:30, and the derived 40 km 1:43:30 → 1:42:30', () => {
    expect(STANDARDS_THRESHOLDS.bike_20k.F.pass).toBe(2970);
    expect(STANDARDS_THRESHOLDS.bike_40k.F.pass).toBe(6150);
    // The 40 km is the 20 km × 2^1.05 to 10 s, as the app derives it.
    expect(STANDARDS_THRESHOLDS.bike_40k.F.pass).toBe(Math.round((2970 * Math.pow(2, 1.05)) / 10) * 10);
    expect(STANDARDS_THRESHOLDS.bike_20k.M.pass).toBe(2700); // men unchanged
  });
});
