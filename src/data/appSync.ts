/**
 * Two-way sync with the Take Point Fitness app (Phase 2b — wired to the real
 * schema).
 *
 * The app stores shared data as JSONB on `public.profiles` (keyed by
 * auth.users.id), NOT in separate tables:
 *   - profiles.orm         → { "Back Squat": { w: "180", r: "5" }, ... }  (kg)
 *   - profiles.race_times  → { run: { "5k": { timeSec, updatedAt } }, ... }
 *
 * So a 1RM/time entered on the benchmark site lands in the app, and the app's
 * existing numbers prefill the calculator on sign-in. Manual reps and WODs are
 * app-localStorage-only, so they don't sync here.
 */

import { supabase } from '../lib/supabase';
import { emptyLogs } from './stores';
import type { AthleteLogs } from '../engine/types';

/** benchmark id → the app's ORM lift name (exact title-case key in profiles.orm). */
export const ORM_TO_APP: Record<string, string> = {
  back_squat_1rm: 'Back Squat',
  front_squat_1rm: 'Front Squat',
  deadlift_1rm: 'Deadlift',
  bench_1rm: 'Bench Press',
  strict_press_1rm: 'Overhead Press',
  power_clean_1rm: 'Power Clean',
  // 2026-07-12 — the app has Olympic 1RM slots (Phase 68), so these sync now.
  snatch_1rm: 'Snatch',
  clean_jerk_1rm: 'Clean & Jerk',
};

/** benchmark id → the app's race modality + event key in profiles.race_times. */
export const RACE_TO_APP: Record<string, { modality: string; event: string }> = {
  run_1mi: { modality: 'run', event: 'mile' },
  run_5k: { modality: 'run', event: '5k' },
  row_2k: { modality: 'row', event: '2k' },
  row_500m: { modality: 'row', event: '500m' },
  // 2026-07-13 — triathlete swim/bike benchmarks (event keys match the
  // app's MODALITY_EVENTS in multimodal_race_times_storage).
  swim_400m: { modality: 'swim', event: '400m' },
  swim_1500m: { modality: 'swim', event: '1500m' },
  bike_20k: { modality: 'bike', event: '20k' },
  bike_40k: { modality: 'bike', event: '40k' },
  // ruck_time omitted — the app's ruck events are distance-specific (TODO map).
};

const APP_TO_ORM: Record<string, string> = Object.fromEntries(
  Object.entries(ORM_TO_APP).map(([id, name]) => [name, id]),
);
const APP_TO_RACE: Record<string, string> = Object.fromEntries(
  Object.entries(RACE_TO_APP).map(([id, m]) => [`${m.modality}:${m.event}`, id]),
);

interface OrmEntryApp { w: string; r: string }
type OrmStore = Record<string, OrmEntryApp>;
interface RaceTimeApp { timeSec: number; updatedAt: string; predicted?: boolean }
type MultimodalRaceTimes = Record<string, Record<string, RaceTimeApp>>;

// ---- pure mappers (tested) ------------------------------------------------

export function ormPatchFromLogs(logs: AthleteLogs): OrmStore {
  const out: OrmStore = {};
  for (const e of logs.orm) {
    const name = ORM_TO_APP[e.benchmarkId];
    if (name) out[name] = { w: String(e.weightKg), r: String(e.reps) };
  }
  return out;
}

export function racePatchFromLogs(logs: AthleteLogs, isoNow: string): MultimodalRaceTimes {
  const out: MultimodalRaceTimes = {};
  for (const e of logs.raceTimes) {
    const m = RACE_TO_APP[e.benchmarkId];
    if (!m) continue;
    (out[m.modality] ??= {})[m.event] = { timeSec: e.timeSec, updatedAt: isoNow, predicted: false };
  }
  return out;
}

/** Rebuild benchmark logs (orm + race only) from the app's profile blobs. */
export function logsFromAppProfile(
  orm?: OrmStore | null,
  race?: MultimodalRaceTimes | null,
): AthleteLogs {
  const logs = emptyLogs();
  for (const [name, v] of Object.entries(orm ?? {})) {
    const id = APP_TO_ORM[name];
    if (id && v) logs.orm.push({ benchmarkId: id, weightKg: Number(v.w), reps: Number(v.r) || 1 });
  }
  for (const [modality, events] of Object.entries(race ?? {})) {
    for (const [event, v] of Object.entries(events ?? {})) {
      const id = APP_TO_RACE[`${modality}:${event}`];
      if (id && v) logs.raceTimes.push({ benchmarkId: id, modality, event, timeSec: Number(v.timeSec) });
    }
  }
  return logs;
}

// ---- async (no-op / safe defaults when Supabase isn't configured) ---------

/** Pull the athlete's shared 1RMs + times from the app to prefill the calculator. */
export async function syncFromApp(userId: string): Promise<AthleteLogs> {
  if (!supabase) return emptyLogs();
  const { data, error } = await supabase
    .from('profiles')
    .select('orm, race_times')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return emptyLogs();
  return logsFromAppProfile(data.orm as OrmStore, data.race_times as MultimodalRaceTimes);
}

export interface SyncResult {
  ormWritten: number;
  racesWritten: number;
  disabled: boolean;
}

/** Merge the session's mapped 1RMs + times into the app's profile (non-destructive). */
export async function syncToApp(userId: string, logs: AthleteLogs): Promise<SyncResult> {
  if (!supabase) return { ormWritten: 0, racesWritten: 0, disabled: true };

  const { data } = await supabase
    .from('profiles')
    .select('orm, race_times')
    .eq('id', userId)
    .maybeSingle();

  const ormPatch = ormPatchFromLogs(logs);
  const racePatch = racePatchFromLogs(logs, new Date().toISOString());

  const ormMerged: OrmStore = { ...((data?.orm as OrmStore) ?? {}), ...ormPatch };
  const raceMerged: MultimodalRaceTimes = { ...((data?.race_times as MultimodalRaceTimes) ?? {}) };
  for (const [modality, events] of Object.entries(racePatch)) {
    raceMerged[modality] = { ...(raceMerged[modality] ?? {}), ...events };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ orm: ormMerged, race_times: raceMerged })
    .eq('id', userId);

  const racesWritten = Object.values(racePatch).reduce((n, e) => n + Object.keys(e).length, 0);
  return { ormWritten: Object.keys(ormPatch).length, racesWritten, disabled: Boolean(error) };
}
