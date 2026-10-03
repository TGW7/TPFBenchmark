/**
 * 2026-10-03 — plan 55's special-forces and elite-unit tiers, mirrored from
 * tpf-app (src/lib/operational_readiness.ts; the record is tpf-app
 * docs/build/55_SPECIAL_FORCES_AND_ELITE_UNIT_TIERS.md §10, whose §10.2 marks
 * each moved value ORS or Benchmarks-only — only ORS rows are mirrored, and
 * only for the 13 units this site shares with the app).
 *
 * The owner's answers (2026-10-02), as the app built them: Q4 "As you suggest"
 * (an SF top is the harder of the general Elite and the hardest general unit's
 * top), Q2 (R1, SF run tops), Q3 "paras only" (Para Reg may be fastest; US
 * Airborne by the general rule), Q1 option B (UKSF 5-mile ruck), Q6 "Fan dance
 * should be with proper weight", Q5 "label conditions". The deadlift
 * Excellents (the owner, 2026-10-03, "even it out") are pinned in
 * operator-deadlift-elite-over-200.test.ts.
 *
 * The workbook edit is changeset 2 of scripts/apply-military-top-tiers-2026-10-02.py;
 * `npm run check:app-ors -- <tpf-app>` reported 0 differences across the 13
 * mirrored units afterwards (it now compares labels and the zero-weight rows
 * the site holds too). The OLD values below are typed from §10.2, the NEW ones
 * likewise — neither is read from the generated data this test checks.
 *
 * 2026-10-03, later — the Fan Dance's faster tiers re-set (tpf-app plan 55
 * §11.1; the owner, told a 3:00 Elite at the ~23 kg selection load is close to
 * unreachable: "adjust times then"). Good 3:30:00 → 3:55:00, Excellent
 * 3:15:00 → 3:40:00, Elite 3:00:00 → 3:30:00; Pass stays the published
 * 4:10:00. The workbook edit is changeset 4 of the same script, and
 * `check:app-ors` reported 0 differences afterwards. The "Good, Excellent and
 * Elite kept" test below was rewritten to pin the new ladder (its old values
 * are kept in it, typed, as `before`). Plan 55 §10.2's 28 values in MOVED are
 * unchanged — the Fan Dance's Pass is the only one of them on that row.
 *
 * Not mirrored, because the site has no row for them: the Benchmarks-only rows
 * (army_sfas, army_rasp, pj_past, army_airborne tests); the app's us_army,
 * uk_army, tactical, firefighter and air_force pathways; and the app's run and
 * ruck comparisons on its HABS scale (this site has no such ladder), so "SF
 * run tops at least the general Advanced" and "SF rucks lead on one scale"
 * are the app's tests only.
 */
import { describe, expect, it } from 'vitest';
import { OPERATOR_PATHWAYS } from '../config/generated/operator.generated';
import { OPERATOR_BENCHMARKS_BY_PATHWAY } from '../config/operator';
import { benchmarkLabel } from '../ui/format';

type Tier = 'pass' | 'good' | 'excellent' | 'elite';

const SEAL = 'navy_seal_bud_s';
const PJ = 'usaf_pararescue_pj';
const SFAS = 'us_army_special_forces_sfas';
const UKSF = 'uk_special_forces_sas_sbs';
const SF_UNITS = [SEAL, PJ, SFAS, UKSF];

/** The general units (plan 55 §1, comparison only) this site mirrors. US SWAT
 *  is N-A there; Para Reg, the Royal Marines and US Airborne are elite or
 *  airborne units, not general. */
const GENERAL_UNITS = ['us_marine_corps_pft_cft', 'us_navy_prt', 'us_infantry', 'uk_infantry', 'us_police_pft'];

/** Every §10.2 ORS value this site mirrors, except the deadlift Excellents.
 *  [unit, benchmark id, tier, old, new]; times in seconds. */
const MOVED: Array<[string, string, Tier, number, number]> = [
  [SEAL, '1_5_mile_run', 'elite', 510, 495],
  [SEAL, 'back_squat', 'elite', 180, 190],
  [SEAL, 'bench_press', 'elite', 140, 160],
  [SEAL, 'pull_ups_no_time', 'elite', 22, 25],
  [SEAL, 'push_ups_2_min', 'elite', 100, 105],
  [PJ, '1_5_mile_run', 'elite', 510, 495],
  [PJ, 'back_squat', 'elite', 175, 190],
  [PJ, 'hex_bar_dl', 'elite', 230, 245],
  [PJ, 'bench_press', 'elite', 135, 160], // weight 0 in both repositories
  [PJ, 'power_clean', 'elite', 110, 120], // weight 0 in both repositories
  [PJ, 'pull_ups_no_time', 'elite', 22, 25],
  [PJ, 'push_ups_2_min', 'elite', 100, 105],
  [PJ, 'sit_ups_2_min', 'elite', 100, 110],
  [SFAS, '2_mile_run', 'elite', 720, 675],
  [SFAS, 'bench_press', 'elite', 155, 160],
  [SFAS, 'push_ups_2_min', 'elite', 100, 105],
  [SFAS, 'sit_ups_2_min', 'elite', 100, 110],
  [UKSF, '5_mile_ruck_30_kg', 'elite', 3600, 3300],
  [UKSF, 'fan_dance_24_km_35_lb_rifle_optional', 'pass', 14400, 15000],
  [UKSF, 'back_squat', 'elite', 165, 190],
  [UKSF, 'conventional_dl', 'elite', 220, 225],
  [UKSF, 'hex_bar_dl', 'elite', 235, 245],
  [UKSF, 'bench_press', 'elite', 140, 160],
  [UKSF, 'pull_ups_no_time', 'elite', 22, 25],
  [UKSF, 'push_ups_2_min', 'elite', 100, 105],
  ['uk_parachute_regiment_p_coy', '2_km_run_best_effort', 'elite', 405, 380],
  ['us_army_airborne', '2_mile_run', 'excellent', 810, 750],
  ['us_army_airborne', '2_mile_run', 'elite', 750, 705],
];

const bench = (unitId: string, id: string) => {
  const b = OPERATOR_PATHWAYS.find((p) => p.id === unitId)?.benchmarks.find((x) => x.id === id);
  if (!b) throw new Error(`no ${unitId}/${id}`);
  return b;
};
const ladder = (unitId: string, id: string) => {
  const t = bench(unitId, id).thresholds;
  return [t.pass, t.good, t.excellent, t.elite];
};

describe('Operator special-forces and elite-unit tiers (app plan 55)', () => {
  it('every mirrored §10.2 value is exactly the app’s new one (28 values)', () => {
    expect(MOVED).toHaveLength(28);
    for (const [unitId, id, tier, old, want] of MOVED) {
      expect(bench(unitId, id).thresholds[tier], `${unitId}/${id} ${tier} (was ${old})`).toBe(want);
    }
  });

  // 2026-10-03, later (plan 55 §11.1) — this test said "Good, Excellent and
  // Elite kept" and pinned [15000, 12600, 11700, 10800]; the owner then had the
  // three faster tiers re-set for the selection load ("adjust times then").
  it('the Fan Dance: Pass is the published 4:10:00 at the selection load; Good 3:55, Excellent 3:40, Elite 3:30 (plan 55 §11.1)', () => {
    const before = [15000, 12600, 11700, 10800]; // 4:10:00 / 3:30:00 / 3:15:00 / 3:00:00, plan 55 §10.2
    const raw = ladder(UKSF, 'fan_dance_24_km_35_lb_rifle_optional');
    expect(raw).toEqual([15000, 14100, 13200, 12600]); // 4:10:00 / 3:55:00 / 3:40:00 / 3:30:00
    const now = raw as number[]; // no nulls: the line above
    expect(now[0], 'Pass unchanged').toBe(before[0]);
    for (let i = 1; i < 4; i++) expect(now[i], `tier ${i} only ever slowed`).toBeGreaterThan(before[i]);
    // Lower is better: strictly faster at each tier up the ladder.
    for (let i = 1; i < 4; i++) expect(now[i]).toBeLessThan(now[i - 1]);
    // TPF's spacing: the 40 minutes from Pass to Elite split 20 : 15 : 15 (the
    // tier percentages 50 / 70 / 85 / 100), each to the nearest 5 minutes.
    const span = now[0] - now[3];
    expect(span).toBe(40 * 60);
    const round5min = (s: number) => Math.round(s / 300) * 300;
    expect(now[1]).toBe(round5min(now[0] - span * (20 / 50)));
    expect(now[2]).toBe(round5min(now[0] - span * (35 / 50)));
  });

  it('the four relabelled rows carry the app’s labels and keep their stored ids', () => {
    expect(bench(SEAL, '1_5_mile_run').name).toBe('1.5-mile run (PST: in boots and trousers)');
    expect(bench(SEAL, '500_m_swim').name).toBe('500 m swim (PST: 500 yd sidestroke or breaststroke, converted)');
    expect(bench(PJ, '500_m_swim').name).toBe('500 m swim (PAST: freestyle, breaststroke or sidestroke)');
    expect(bench(UKSF, 'fan_dance_24_km_35_lb_rifle_optional').name)
      .toBe('Fan Dance (24 km, 18 kg bergen + rifle + water) — optional');
    // The conditions are the SEAL's and Pararescue's own: units sharing the id keep theirs.
    expect(bench(PJ, '1_5_mile_run').name).toBe('1.5-mile run');
    expect(bench('us_navy_prt', '1_5_mile_run').name).toBe('1.5-mile run');
    expect(bench('us_police_pft', '1_5_mile_run').name).toBe('1.5-mile run');
    expect(bench('uk_royal_marines_cdo_course', '500_m_swim').name).toBe('500 m swim');
  });

  it('the grid labels: the swim keeps "500 m swim"; the Fan Dance states the new load, not 35 lb', () => {
    // The full names are too long for benchmarkLabel's name fallback, so the
    // grid used the id; src/ui/format.ts has an entry for both ids (2026-10-03).
    const label = (unitId: string, id: string) =>
      benchmarkLabel(OPERATOR_BENCHMARKS_BY_PATHWAY[unitId].find((b) => b.id === id)!);
    for (const unitId of [SEAL, PJ, 'uk_royal_marines_cdo_course']) expect(label(unitId, '500_m_swim')).toBe('500 m swim');
    const fan = label(UKSF, 'fan_dance_24_km_35_lb_rifle_optional');
    expect(fan).toContain('18 kg');
    expect(fan).not.toMatch(/35/);
  });

  it('every special-forces Elite is at or above every general unit’s top on the same event, where the site holds both', () => {
    // Strength and muscular endurance, plus the stability, grip and power rows
    // (plan 55 §4.1: "already met" for those). Events are matched by id, so the
    // police 1-minute push-ups / sit-ups (a different event) never pair.
    const comps = new Set(['lower_strength', 'upper_strength', 'power', 'upper_endurance', 'core_endurance', 'stability', 'grip']);
    const events = new Set<string>();
    let pairs = 0;
    for (const sf of SF_UNITS) {
      for (const b of OPERATOR_PATHWAYS.find((p) => p.id === sf)!.benchmarks) {
        if (!comps.has(b.component)) continue;
        for (const g of GENERAL_UNITS) {
          const gb = OPERATOR_PATHWAYS.find((p) => p.id === g)!.benchmarks.find((x) => x.id === b.id && x.component === b.component);
          if (!gb) continue;
          expect(gb.lowerIsBetter, `${b.id}: one direction`).toBe(b.lowerIsBetter);
          const sfTop = b.thresholds.elite as number;
          const gTop = gb.thresholds.elite as number;
          if (b.lowerIsBetter) expect(sfTop, `${sf}/${b.id} vs ${g}`).toBeLessThanOrEqual(gTop);
          else expect(sfTop, `${sf}/${b.id} vs ${g}`).toBeGreaterThanOrEqual(gTop);
          events.add(b.id);
          pairs++;
        }
      }
    }
    // Not vacuous: 185 pairs on 12 events when written (2026-10-03).
    expect(pairs).toBeGreaterThanOrEqual(180);
    expect([...events].sort()).toEqual([
      'back_squat', 'bench_press', 'broad_jump', 'conventional_dl', 'dead_hang_grip', 'hex_bar_dl',
      'plank_front', 'power_clean', 'pull_ups_no_time', 'push_ups_2_min', 'side_plank_per_side', 'sit_ups_2_min',
    ]);
  });

  it('…and before plan 55 that failed: the old SF Elites below a general top on this site', () => {
    // [sf unit, id, old Elite, the general top it was under]
    const below: Array<[string, string, number, number]> = [
      [SEAL, 'pull_ups_no_time', 22, 25], [SEAL, 'push_ups_2_min', 100, 101],
      [PJ, 'hex_bar_dl', 230, 245], [PJ, 'pull_ups_no_time', 22, 25], [PJ, 'push_ups_2_min', 100, 101], [PJ, 'sit_ups_2_min', 100, 110],
      [SFAS, 'push_ups_2_min', 100, 101], [SFAS, 'sit_ups_2_min', 100, 110],
      [UKSF, 'back_squat', 165, 175], [UKSF, 'conventional_dl', 220, 225], [UKSF, 'hex_bar_dl', 235, 245],
      [UKSF, 'pull_ups_no_time', 22, 25], [UKSF, 'push_ups_2_min', 100, 101],
    ];
    for (const [sf, id, old, generalTop] of below) {
      const top = Math.max(...GENERAL_UNITS.flatMap((g) => {
        const gb = OPERATOR_PATHWAYS.find((p) => p.id === g)!.benchmarks.find((x) => x.id === id);
        return gb ? [gb.thresholds.elite as number] : [];
      }));
      expect(top, `${id}: the general top`).toBe(generalTop);
      expect(old, `${sf}/${id} before`).toBeLessThan(top);
      expect(MOVED.find(([u, i, t]) => u === sf && i === id && t === 'elite')?.[3], `${sf}/${id} is in MOVED`).toBe(old);
    }
  });
});
