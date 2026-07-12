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
    );
    expect(logs.orm).toEqual([{ benchmarkId: 'back_squat_1rm', weightKg: 180, reps: 5 }]);
    expect(logs.raceTimes).toEqual([{ benchmarkId: 'run_5k', modality: 'run', event: '5k', timeSec: 1320 }]);
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
    const back = logsFromAppProfile(ormPatchFromLogs(logs), race);
    expect(back.orm).toHaveLength(8);
    expect(back.raceTimes).toHaveLength(4);
  });
});
