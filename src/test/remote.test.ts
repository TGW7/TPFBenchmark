import { describe, expect, it } from 'vitest';
import { logsToRows, rowsToLogs } from '../data/remote';
import type { AthleteLogs } from '../engine/types';

const LOGS: AthleteLogs = {
  orm: [{ benchmarkId: 'back_squat_1rm', weightKg: 150, reps: 1 }],
  raceTimes: [{ benchmarkId: 'run_5k', modality: 'run', event: '5k', timeSec: 1320 }],
  manual: [{ benchmarkId: 'strict_pullups', value: 14 }],
  wod: [{ wodId: 'fran', value: 210, scaling: 'rx' }],
};

describe('remote row mappers', () => {
  it('flattens logs to typed rows', () => {
    const rows = logsToRows(LOGS);
    expect(rows).toHaveLength(4);
    expect(rows.find((r) => r.kind === 'orm')?.payload).toEqual({ weightKg: 150, reps: 1 });
    expect(rows.find((r) => r.kind === 'wod')?.benchmark_id).toBe('fran');
  });

  it('round-trips logs -> rows -> logs', () => {
    const restored = rowsToLogs(logsToRows(LOGS));
    expect(restored).toEqual(LOGS);
  });
});
