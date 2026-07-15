import { describe, expect, it } from 'vitest';
import {
  logsFromAppProfile,
  ormPatchFromLogs,
  racePatchFromLogs,
  syncToApp,
} from '../data/appSync';
import type { AthleteLogs } from '../engine/types';

const LOGS: AthleteLogs = {
  orm: [{ benchmarkId: 'back_squat_1rm', weightKg: 180, reps: 5 }],
  raceTimes: [{ benchmarkId: 'run_5k', modality: 'run', event: '5k', timeSec: 1320 }],
  manual: [{ benchmarkId: 'strict_pullups', value: 14 }],
  wod: [],
};

describe('appSync mappers (benchmark ↔ app profile JSONB)', () => {
  it('maps ORM entries to the app lift-name format', () => {
    expect(ormPatchFromLogs(LOGS)).toEqual({ 'Back Squat': { w: '180', r: '5' } });
  });

  it('maps race entries to the app modality/event format', () => {
    const patch = racePatchFromLogs(LOGS, '2026-06-21T00:00:00Z');
    expect(patch.run['5k'].timeSec).toBe(1320);
    expect(patch.run['5k'].predicted).toBe(false);
  });

  it('rebuilds benchmark logs from app profile blobs', () => {
    const logs = logsFromAppProfile(
      { 'Back Squat': { w: '180', r: '5' }, 'Unknown Lift': { w: '1', r: '1' } },
      { run: { '5k': { timeSec: 1320, updatedAt: 'x' } } },
      'lift',
    );
    expect(logs.orm).toEqual([{ benchmarkId: 'back_squat_1rm', weightKg: 180, reps: 5 }]);
    expect(logs.raceTimes).toEqual([{ benchmarkId: 'run_5k', modality: 'run', event: '5k', timeSec: 1320 }]);
  });

  // 2026-07-16 audit — "Back Squat" etc. are shared by a Lift/Hybrid id AND an
  // Operator id (same real lift). Pulling from the app must reconstruct the
  // id that matches the CURRENT brand, not whichever one happens to be first
  // in the map — otherwise an Operator user's saved squat silently vanishes
  // from their Operator calculator (it'd reconstruct as `back_squat_1rm`,
  // which the operator pathway config doesn't score against).
  it('reverse-pull picks the id vocabulary matching the active brand', () => {
    const orm = { 'Back Squat': { w: '180', r: '5' } };
    expect(logsFromAppProfile(orm, null, 'lift').orm).toEqual([
      { benchmarkId: 'back_squat_1rm', weightKg: 180, reps: 5 },
    ]);
    expect(logsFromAppProfile(orm, null, 'hybrid').orm).toEqual([
      { benchmarkId: 'back_squat_1rm', weightKg: 180, reps: 5 },
    ]);
    expect(logsFromAppProfile(orm, null, 'operator').orm).toEqual([
      { benchmarkId: 'back_squat', weightKg: 180, reps: 5 },
    ]);
  });

  it('syncToApp is a safe no-op when Supabase is not configured', async () => {
    const r = await syncToApp('u1', LOGS);
    expect(r.disabled).toBe(true);
  });

  // 2026-07-12 — the benchmark→app signup flow end to end (mapper layer):
  // a benchmark-first athlete's lifts + times land under the EXACT keys the
  // app hydrates from profiles.orm / profiles.race_times on sign-in
  // (tpf-app orm_race_autosave.loadOrmRaceCloud → reconcileOrmRace).
  it('covers every scored lift the app has a 1RM slot for, incl. Olympic + front squat', () => {
    const logs: AthleteLogs = {
      orm: [
        { benchmarkId: 'back_squat_1rm', weightKg: 190, reps: 1 },
        { benchmarkId: 'front_squat_1rm', weightKg: 155, reps: 1 },
        { benchmarkId: 'deadlift_1rm', weightKg: 225, reps: 1 },
        { benchmarkId: 'bench_1rm', weightKg: 140, reps: 1 },
        { benchmarkId: 'strict_press_1rm', weightKg: 95, reps: 1 },
        { benchmarkId: 'power_clean_1rm', weightKg: 120, reps: 1 },
        { benchmarkId: 'snatch_1rm', weightKg: 100, reps: 1 },
        { benchmarkId: 'clean_jerk_1rm', weightKg: 130, reps: 1 },
      ],
      raceTimes: [
        { benchmarkId: 'run_1mi', modality: 'run', event: 'mile', timeSec: 300 },
        { benchmarkId: 'run_5k', modality: 'run', event: '5k', timeSec: 1050 },
        { benchmarkId: 'row_2k', modality: 'row', event: '2k', timeSec: 390 },
        { benchmarkId: 'row_500m', modality: 'row', event: '500m', timeSec: 85 },
      ],
      manual: [], wod: [],
    };
    // App lift-name keys must match tpf-app constants exactly
    // (DEFAULT_ORM_LIFTS / OLYMPIC_ORM_LIFTS).
    expect(Object.keys(ormPatchFromLogs(logs)).sort()).toEqual([
      'Back Squat', 'Bench Press', 'Clean & Jerk', 'Deadlift',
      'Front Squat', 'Overhead Press', 'Power Clean', 'Snatch',
    ]);
    const race = racePatchFromLogs(logs, '2026-07-12T00:00:00Z');
    expect(Object.keys(race.run).sort()).toEqual(['5k', 'mile']);
    expect(Object.keys(race.row).sort()).toEqual(['2k', '500m']);
    // Round-trips back into benchmark logs unchanged (app → calculator).
    const back = logsFromAppProfile(ormPatchFromLogs(logs), race, 'lift');
    expect(back.orm).toHaveLength(8);
    expect(back.raceTimes).toHaveLength(4);
  });

  // 2026-07-16 audit — before this, Operator-brand saves silently dropped
  // every entry: appSync only knew the `*_1rm`-suffixed Lift/Hybrid ids, and
  // syncToApp() is called unconditionally regardless of brand.
  it('maps Operator ORM ids to the same app lift-name vocabulary (no _1rm suffix)', () => {
    const logs: AthleteLogs = {
      orm: [
        { benchmarkId: 'back_squat', weightKg: 150, reps: 1 },
        { benchmarkId: 'conventional_dl', weightKg: 200, reps: 1 },
        { benchmarkId: 'hex_bar_dl', weightKg: 210, reps: 1 },
        { benchmarkId: 'bench_press', weightKg: 110, reps: 1 },
        { benchmarkId: 'overhead_press', weightKg: 80, reps: 1 },
        { benchmarkId: 'power_clean', weightKg: 100, reps: 1 },
        // isometric force-plate tests — no app ORM slot, must be dropped.
        { benchmarkId: 'pull_dynamometer', weightKg: 60, reps: 1 },
        { benchmarkId: 'push_dynamometer', weightKg: 55, reps: 1 },
      ],
      raceTimes: [], manual: [], wod: [],
    };
    const patch = ormPatchFromLogs(logs);
    expect(Object.keys(patch).sort()).toEqual([
      'Back Squat', 'Bench Press', 'Deadlift', 'Hex Bar DL', 'Overhead Press', 'Power Clean',
    ]);
    expect(patch['Deadlift']).toEqual({ w: '200', r: '1' }); // conventional_dl → plain "Deadlift"
  });

  it('maps Operator race ids that exactly match app event distances, skips approximate ones', () => {
    const logs: AthleteLogs = {
      orm: [],
      raceTimes: [
        { benchmarkId: '2_mile_run', modality: 'run', event: '2mi', timeSec: 900 },
        { benchmarkId: '1_5_mile_run', modality: 'run', event: '1.5mile', timeSec: 700 },
        { benchmarkId: '10_mile_ruck', modality: 'ruck', event: '10mi', timeSec: 7200 },
        // no exact-distance app event exists for these — must be dropped, not guessed.
        { benchmarkId: '3_mile_run', modality: 'run', event: '3mi', timeSec: 1300 },
        { benchmarkId: '500_yd_swim', modality: 'swim', event: '500yd', timeSec: 400 },
      ],
      manual: [], wod: [],
    };
    const patch = racePatchFromLogs(logs, '2026-07-16T00:00:00Z');
    expect(Object.keys(patch.run).sort()).toEqual(['1.5mile', '2mi']);
    expect(Object.keys(patch.ruck ?? {})).toEqual(['10mi']);
    expect(patch.swim).toBeUndefined();
  });

  it('attaches a fixed loadKg for the loaded ruck benchmarks (load is a property of the id, not user input)', () => {
    const logs: AthleteLogs = {
      orm: [],
      raceTimes: [
        { benchmarkId: '12_mile_ruck_35_lb', modality: 'ruck', event: '12mi', timeSec: 10800 },
        { benchmarkId: '8_km_ruck_35_lb', modality: 'ruck', event: '8k', timeSec: 3600 },
      ],
      manual: [], wod: [],
    };
    const patch = racePatchFromLogs(logs, '2026-07-16T00:00:00Z');
    expect(patch.ruck['12mi'].loadKg).toBeCloseTo(15.88, 1); // 35 lb
    expect(patch.ruck['8k'].loadKg).toBeCloseTo(15.88, 1);
  });

  it('reverse-pull disambiguates loaded vs unloaded ruck using the record\'s own loadKg', () => {
    const back = logsFromAppProfile(undefined, {
      ruck: {
        '12mi': { timeSec: 10800, updatedAt: 'x', loadKg: 15.9 },
        '10mi': { timeSec: 7200, updatedAt: 'x' }, // no load → plain id
      },
    }, 'operator');
    const twelveMile = back.raceTimes.find((e) => e.event === '12mi');
    expect(twelveMile?.benchmarkId).toBe('12_mile_ruck_35_lb');
    const tenMile = back.raceTimes.find((e) => e.event === '10mi');
    expect(tenMile?.benchmarkId).toBe('10_mile_ruck');
  });

  it('reverse-pull defaults the ambiguous "best effort" 1.5mi run to the plain id', () => {
    const back = logsFromAppProfile(undefined, { run: { '1.5mile': { timeSec: 700, updatedAt: 'x' } } }, 'operator');
    expect(back.raceTimes[0].benchmarkId).toBe('1_5_mile_run');
  });
});
