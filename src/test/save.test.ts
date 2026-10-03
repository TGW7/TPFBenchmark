/**
 * 2026-10-03 — the owner: "Fix benchmark bug". A failed save is now reported,
 * a rejected insert no longer deletes the athlete's saved entries, and the app
 * sync never writes after a failed read (docs/LEGAL-FIXES-2026-10-03.md §4).
 *
 * The fakes below stand in for supabase-js's query builder: each records the
 * calls made and answers with a scripted result, so the order of operations is
 * what is tested — no network, no Supabase.
 */
import { describe, expect, it } from 'vitest';
import { runSave, SAVE_FAILED, type SaveSteps } from '../data/save';
import { replaceEntriesWith, type EntriesClient } from '../data/remote';
import { syncToAppWith, type ProfilesClient } from '../data/appSync';
import type { AthleteLogs } from '../engine/types';

const LOGS: AthleteLogs = {
  orm: [{ benchmarkId: 'back_squat_1rm', weightKg: 150, reps: 1 }],
  raceTimes: [{ benchmarkId: 'run_5k', modality: 'run', event: '5k', timeSec: 1320 }],
  manual: [],
  wod: [],
};

const ok = async () => null;
const fail = (m: string) => async () => m;
const synced = async () => ({ ormWritten: 1, racesWritten: 1, disabled: false });

function steps(over: Partial<SaveSteps> = {}): SaveSteps & { calls: string[] } {
  const calls: string[] = [];
  const wrap = <T,>(name: string, f: () => Promise<T>) => async () => { calls.push(name); return f(); };
  const s = { saveProfile: ok, replaceEntries: ok, syncToApp: synced, submitToPool: null as SaveSteps['submitToPool'], ...over };
  return {
    calls,
    saveProfile: wrap('profile', s.saveProfile),
    replaceEntries: wrap('entries', s.replaceEntries),
    syncToApp: wrap('sync', s.syncToApp),
    submitToPool: s.submitToPool ? wrap('pool', s.submitToPool) : null,
  };
}

describe('runSave — what the athlete is told', () => {
  it('a rejected profile write is reported, and nothing after it runs', async () => {
    const st = steps({ saveProfile: fail('new row for relation "benchmark_profiles" violates check constraint "benchmark_profiles_brand_check"'), submitToPool: ok });
    const out = await runSave(st);
    expect(out.saved).toBe(false);
    expect(out.message.startsWith(SAVE_FAILED)).toBe(true);
    expect(out.message).toContain('brand_check');
    expect(out.message).not.toMatch(/^Saved/);
    expect(st.calls).toEqual(['profile']);
    expect(out.pooled).toBe(false);
  });

  it('a rejected entries write is reported, and the app and the pool are not touched', async () => {
    const st = steps({ replaceEntries: fail('violates check constraint'), submitToPool: ok });
    const out = await runSave(st);
    expect(out.saved).toBe(false);
    expect(st.calls).toEqual(['profile', 'entries']);
  });

  it('a step that throws is a failure, not an unhandled rejection', async () => {
    const out = await runSave(steps({ saveProfile: async () => { throw new Error('network down'); } }));
    expect(out.saved).toBe(false);
    expect(out.message).toContain('network down');
  });

  it('a failed app sync is reported beside a successful save', async () => {
    const out = await runSave(steps({ syncToApp: async () => ({ ormWritten: 0, racesWritten: 0, disabled: false, error: 'permission denied' }) }));
    expect(out.saved).toBe(true);
    expect(out.message).toContain('couldn’t update your TPF app (permission denied)');
  });

  it('the pool runs only when ticked, and its failure is reported', async () => {
    const off = steps();
    expect((await runSave(off)).message).not.toMatch(/pool/);
    expect(off.calls).toEqual(['profile', 'entries', 'sync']);

    const okPool = steps({ submitToPool: ok });
    const r1 = await runSave(okPool);
    expect(r1.pooled).toBe(true);
    expect(r1.message).toContain('Added to the percentile pool.');

    const badPool = await runSave(steps({ submitToPool: fail('row-level security') }));
    expect(badPool.saved).toBe(true);
    expect(badPool.pooled).toBe(false);
    expect(badPool.message).toContain('Couldn’t add your numbers to the percentile pool (row-level security)');
  });

  it('all good reads as before', async () => {
    const out = await runSave(steps());
    expect(out).toEqual({ saved: true, message: 'Saved — 1 lifts + 1 times synced to your TPF app.', pooled: false });
  });
});

/** A fake benchmark_entries client: records operations, scripted answers. */
function entriesClient(opts: { insertError?: string; deleteError?: string }) {
  const ops: string[] = [];
  const client: EntriesClient = {
    from: () => ({
      insert: (rows) => ({
        select: () => {
          ops.push(`insert ${rows.length}`);
          return Promise.resolve(opts.insertError
            ? { data: null, error: { message: opts.insertError } }
            : { data: rows.map((_, i) => ({ id: `new-${i}` })), error: null });
        },
      }),
      delete: () => ({
        eq: (_c, v) => {
          type R = { error: { message?: string } | null };
          const done = (what: string): Promise<R> => { ops.push(what); return Promise.resolve({ error: opts.deleteError ? { message: opts.deleteError } : null }); };
          // Awaited directly = "delete all"; with .not(...) = "delete the rest".
          const all = {
            then: (onF?: (x: R) => unknown, onR?: (e: unknown) => unknown) => done(`delete all of ${v}`).then(onF, onR),
          } as unknown as PromiseLike<R>;
          return Object.assign(all, { not: (_c2: 'id', _op: 'in', list: string) => done(`delete ${v} except ${list}`) });
        },
      }),
    }),
  };
  return { client, ops };
}

describe('replaceEntries — insert first, then delete the old rows', () => {
  it('a rejected insert deletes NOTHING (it used to delete every saved entry first)', async () => {
    const { client, ops } = entriesClient({ insertError: 'violates check constraint "benchmark_entries_brand_check"' });
    const err = await replaceEntriesWith(client, 'u1', LOGS, 'hybrid');
    expect(err).toContain('brand_check');
    expect(ops).toEqual(['insert 2']);
  });

  it('on success the old rows are removed, keeping the new ones', async () => {
    const { client, ops } = entriesClient({});
    expect(await replaceEntriesWith(client, 'u1', LOGS, 'hybrid')).toBeNull();
    expect(ops).toEqual(['insert 2', 'delete u1 except (new-0,new-1)']);
  });

  it('a failed clean-up is reported', async () => {
    const { client } = entriesClient({ deleteError: 'timeout' });
    expect(await replaceEntriesWith(client, 'u1', LOGS, 'lift')).toBe('timeout');
  });

  it('saving an empty session clears the saved entries', async () => {
    const { client, ops } = entriesClient({});
    const empty: AthleteLogs = { orm: [], raceTimes: [], manual: [], wod: [] };
    expect(await replaceEntriesWith(client, 'u1', empty, 'lift')).toBeNull();
    expect(ops).toEqual(['delete all of u1']);
  });
});

/** A fake profiles client for the app sync. */
function profilesClient(opts: { readError?: string; data?: { orm?: unknown; race_times?: unknown } | null; writeError?: string }) {
  const writes: unknown[] = [];
  const client: ProfilesClient = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve(opts.readError
            ? { data: null, error: { message: opts.readError } }
            : { data: opts.data ?? null, error: null }),
        }),
      }),
      update: (patch) => ({
        eq: () => { writes.push(patch); return Promise.resolve({ error: opts.writeError ? { message: opts.writeError } : null }); },
      }),
    }),
  };
  return { client, writes };
}

describe('syncToApp — never writes without a successful read', () => {
  it('a failed read writes nothing (it used to replace the app\'s whole 1RM and race stores with the patch)', async () => {
    const { client, writes } = profilesClient({ readError: 'JWT expired' });
    const r = await syncToAppWith(client, 'u1', LOGS);
    expect(writes).toEqual([]);
    expect(r.error).toBe('JWT expired');
    expect(r.disabled).toBe(false);
  });

  it('a successful read merges, keeping the app\'s other lifts and races', async () => {
    const { client, writes } = profilesClient({
      data: { orm: { Deadlift: { w: '200', r: '1' } }, race_times: { row: { '2k': { timeSec: 420, updatedAt: 'x' } } } },
    });
    const r = await syncToAppWith(client, 'u1', LOGS);
    expect(r).toEqual({ ormWritten: 1, racesWritten: 1, disabled: false });
    const w = writes[0] as { orm: Record<string, unknown>; race_times: Record<string, Record<string, unknown>> };
    expect(Object.keys(w.orm).sort()).toEqual(['Back Squat', 'Deadlift']);
    expect(Object.keys(w.race_times).sort()).toEqual(['row', 'run']);
  });

  it('a failed write is reported', async () => {
    const { client } = profilesClient({ data: {}, writeError: 'permission denied' });
    const r = await syncToAppWith(client, 'u1', LOGS);
    expect(r.error).toBe('permission denied');
  });
});
