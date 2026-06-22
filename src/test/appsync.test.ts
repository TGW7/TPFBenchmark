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
});
