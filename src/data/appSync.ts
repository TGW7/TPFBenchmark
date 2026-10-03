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
import { lbToKg } from '../lib/units';
import { PREDICTION_RACE_EVENTS } from '../config/habsAppMap';
import type { Brand } from '../brand';
import type { AthleteLogs } from '../engine/types';
import type { RaceStore } from '../engine/racePrediction';

/**
 * benchmark id → the app's ORM lift name (exact title-case key in profiles.orm).
 * Covers both the Lift/Hybrid vocabulary (`*_1rm` ids, from HRS_BENCHMARKS)
 * and the Operator vocabulary (bare ids, from operator.generated.ts) — the two
 * id sets never collide (Lift/Hybrid always ends `_1rm`), so one flat map is
 * enough; no brand check needed at the call site.
 */
export const ORM_TO_APP: Record<string, string> = {
  // Lift / Hybrid
  back_squat_1rm: 'Back Squat',
  front_squat_1rm: 'Front Squat',
  deadlift_1rm: 'Deadlift',
  bench_1rm: 'Bench Press',
  strict_press_1rm: 'Overhead Press',
  power_clean_1rm: 'Power Clean',
  barbell_row_1rm: 'Barbell Row',
  // 2026-07-12 — the app has Olympic 1RM slots (Phase 68), so these sync now.
  snatch_1rm: 'Snatch',
  clean_jerk_1rm: 'Clean & Jerk',
  // Operator (2026-07-16 audit — these never synced before; verified exact
  // string matches against tpf-app/src/lib/constants.ts DEFAULT_ORM_LIFTS).
  back_squat: 'Back Squat',
  conventional_dl: 'Deadlift',
  hex_bar_dl: 'Hex Bar DL',
  bench_press: 'Bench Press',
  overhead_press: 'Overhead Press',
  power_clean: 'Power Clean',
  // pull_dynamometer / push_dynamometer omitted — isometric force-plate
  // tests, no weight×reps ORM slot exists for these in the app.
};

/** benchmark id → the app's race modality + event key in profiles.race_times. */
export const RACE_TO_APP: Record<string, { modality: string; event: string; loadKg?: number }> = {
  run_1mi: { modality: 'run', event: 'mile' },
  run_5k: { modality: 'run', event: '5k' },
  // 2026-10-03 — the HABS running-distance benchmarks (the app's `10k` and
  // `half` run events, which its HABS reads; docs/HABS-ALIGNMENT-2026-10-03.md).
  run_10k: { modality: 'run', event: '10k' },
  run_half: { modality: 'run', event: 'half' },
  row_2k: { modality: 'row', event: '2k' },
  row_500m: { modality: 'row', event: '500m' },
  // 2026-07-13 — triathlete swim/bike benchmarks (event keys match the
  // app's MODALITY_EVENTS in multimodal_race_times_storage).
  swim_400m: { modality: 'swim', event: '400m' },
  swim_1500m: { modality: 'swim', event: '1500m' },
  bike_20k: { modality: 'bike', event: '20k' },
  bike_40k: { modality: 'bike', event: '40k' },
  // ruck_time (generic HRS benchmark) omitted — the app's ruck events are
  // distance-specific (TODO map, would need a per-distance HRS benchmark).

  // Operator (2026-07-16 audit — verified exact matches against tpf-app's
  // MODALITY_EVENTS; the app's own ORS config was previously bitten by
  // approximate-distance mapping causing 20-30% unit drift, so anything
  // below that isn't an EXACT distance match is deliberately left unmapped
  // rather than guessed).
  '2_mile_run': { modality: 'run', event: '2mi' },
  // "best effort" is the same real-world distance, different test protocol —
  // both target the same event (no unit ever offers both at once, checked).
  // Listed first so the plain id below wins reverse-pull ties (see APP_TO_RACE).
  '1_5_mile_run_best_effort': { modality: 'run', event: '1.5mile' },
  '1_5_mile_run': { modality: 'run', event: '1.5mile' },
  // 2026-10-02 — the 500 m swim (Navy SEAL, USAF Pararescue, UK Royal
  // Marines). The app scores all three pathways' `swim_500m` from
  // race_times.swim["500m"] (its MODALITY_EVENTS swim `500m`, added for
  // exactly these benchmarks), and since the 2026-10-02 rebuild every one
  // of the site's three rows is a 500 METRE time (the SEAL PST's 500 yd is
  // converted, × 1.0995) — an exact-distance match.
  '500_m_swim': { modality: 'swim', event: '500m' },
  '10_mile_ruck': { modality: 'ruck', event: '10mi' },
  '12_mile_ruck': { modality: 'ruck', event: '12mi' },
  // Loaded variants target the same event + a fixed loadKg (the load is a
  // property of the benchmark id itself, e.g. "...35_lb", not user input).
  '8_km_ruck_35_lb': { modality: 'ruck', event: '8k', loadKg: Math.round(lbToKg(35) * 10) / 10 },
  '12_mile_ruck_35_lb': { modality: 'ruck', event: '12mi', loadKg: Math.round(lbToKg(35) * 10) / 10 },
  // Deliberately NOT mapped (no exact-distance app event, or no load-carrying
  // field on that modality — see the ORS-audit comments in tpf-app's
  // multimodal_race_times_storage.ts for why approximating these is unsafe):
  //   3_mile_run, 5_mile_run, 30_mile_ruck   — no matching distance key
  //   500_yd_swim_alternate                  — yards, app swim events are metric
  //                                            (and the app's Navy swims are manual inputs)
  //   450_m_swim_alternate                   — no 450 m swim event in the app
  //   vested_1_mile_run_7_kg                 — run events have no load field (unlike ruck)
  //   tactical_obstacle_course_full_kit_25_lb — no modality fits an obstacle course
  // Not mapped YET, though the app now has an exact event (checked
  // 2026-10-02 against tpf-app MODALITY_EVENTS / ORS_PATHWAY_CONFIGS; left
  // for a separate change because the loaded rucks need their load matched):
  //   2_km_run_best_effort                   — app run "2k" (the UK units' run_2k)
  //   8_km_ruck                              — app ruck "8k" (Airborne, PJ ruck_8k)
  //   5_mile_ruck_30_kg                      — app ruck "5mi" (UKSF ruck_5mi_30kg)
  //   8_mile_loaded_march_25_kg              — app ruck "8mi" (added 2026-07-16; UK
  //                                            Infantry ruck_8mi_25kg, requiredLoadKg 25)
};

// Several app lift names are shared by a Lift/Hybrid id AND an Operator id
// (e.g. "Back Squat" ← both back_squat_1rm and back_squat) — they're the same
// real lift, so this is correct, not a bug. But it makes the app → calculator
// pull direction ambiguous without knowing which brand is asking: a user
// reconstructing their profile on the Operator calculator wants `back_squat`
// prefilled, not `back_squat_1rm`. Build two reverse maps, each with its own
// vocabulary winning name collisions (`_1rm` suffix = Lift/Hybrid).
function buildReverseOrm(preferOperatorIds: boolean): Record<string, string> {
  const entries = Object.entries(ORM_TO_APP);
  const isLiftId = ([id]: [string, string]) => id.endsWith('_1rm');
  const ordered = preferOperatorIds
    ? [...entries.filter(isLiftId), ...entries.filter((e) => !isLiftId(e))]
    : [...entries.filter((e) => !isLiftId(e)), ...entries.filter(isLiftId)];
  return Object.fromEntries(ordered.map(([id, name]) => [name, id]));
}
const LIFT_APP_TO_ORM = buildReverseOrm(false);
const OPERATOR_APP_TO_ORM = buildReverseOrm(true);
// Reverse maps for pulling app data back in. Several benchmark ids can share
// one (modality, event) target (loaded vs unloaded ruck; "best effort" vs
// pass/fail run) — reconstructing a single id from just the event key would
// be a guess. Loaded records DO carry a loadKg we can key on, so those get
// their own map, checked first; everything else falls back to the plain
// default (the non-loaded, non-"best effort" id for that target).
const APP_TO_RACE: Record<string, string> = Object.fromEntries(
  Object.entries(RACE_TO_APP)
    .filter(([, m]) => m.loadKg == null)
    .map(([id, m]) => [`${m.modality}:${m.event}`, id]),
);
const LOADED_APP_TO_RACE: Record<string, string> = Object.fromEntries(
  Object.entries(RACE_TO_APP)
    .filter(([, m]) => m.loadKg != null)
    .map(([id, m]) => [`${m.modality}:${m.event}`, id]),
);

interface OrmEntryApp { w: string; r: string }
type OrmStore = Record<string, OrmEntryApp>;
interface RaceTimeApp { timeSec: number; updatedAt: string; predicted?: boolean; loadKg?: number }
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
    (out[m.modality] ??= {})[m.event] = {
      timeSec: e.timeSec, updatedAt: isoNow, predicted: false,
      ...(m.loadKg != null ? { loadKg: m.loadKg } : {}),
    };
  }
  return out;
}

/**
 * Rebuild benchmark logs (orm + race only) from the app's profile blobs.
 * `brand` resolves which id vocabulary wins when an app lift name is shared
 * (see LIFT_APP_TO_ORM / OPERATOR_APP_TO_ORM above) — required, not optional,
 * so a caller can't forget it and silently reconstruct the wrong pathway's ids.
 */
export function logsFromAppProfile(
  orm: OrmStore | null | undefined,
  race: MultimodalRaceTimes | null | undefined,
  brand: Brand,
): AthleteLogs {
  const logs = emptyLogs();
  const appToOrm = brand === 'operator' ? OPERATOR_APP_TO_ORM : LIFT_APP_TO_ORM;
  for (const [name, v] of Object.entries(orm ?? {})) {
    const id = appToOrm[name];
    if (id && v) logs.orm.push({ benchmarkId: id, weightKg: Number(v.w), reps: Number(v.r) || 1 });
  }
  for (const [modality, events] of Object.entries(race ?? {})) {
    for (const [event, v] of Object.entries(events ?? {})) {
      if (!v) continue;
      // 2026-10-03 — a time the app SAVED AS A PREDICTION (its Race Times
      // screen's Predict buttons store `predicted: true`) is not a result. It
      // used to be pulled here as if typed, scored as one, and written back on
      // Save with `predicted: false` — turning the app's prediction into a
      // "real" time there. The app's own HABS re-derives or drops such a row
      // (auto_benchmark_inputs.ts raceTimesWithEquivalents), never scores it
      // as typed, so the site now leaves it out too.
      if (v.predicted === true) continue;
      const key = `${modality}:${event}`;
      // A pulled record carrying a loadKg reconstructs to the loaded-variant
      // id when we have one for this event; otherwise the plain/default id.
      const id = (v.loadKg != null && LOADED_APP_TO_RACE[key]) || APP_TO_RACE[key];
      if (id) logs.raceTimes.push({ benchmarkId: id, modality, event, timeSec: Number(v.timeSec) });
    }
  }
  return logs;
}

/**
 * 2026-10-03 — the athlete's OTHER typed race results in the app, for the
 * predicted equivalents only (src/engine/habsPredict.ts;
 * docs/LEGAL-FIXES-2026-10-03.md §6).
 *
 * The app fills a missing race from ANY typed event in that modality — a 1 km
 * row predicts the 2 km, a 2 km run the mile — so for the site to reach the
 * app's number it needs those events too, though it has no field for them.
 * Kept: run / row / bike / swim records with a real (not `predicted`) time, at
 * events none of the calculator's own race fields maps to (those come in as
 * the field's value, and the athlete edits them on the site). Never saved,
 * never written back to the app, never pooled — read-only context.
 */
export function anchorsFromAppProfile(race: MultimodalRaceTimes | null | undefined): RaceStore {
  const own = new Set(Object.values(PREDICTION_RACE_EVENTS).map((r) => `${r.modality}:${r.event}`));
  const out: RaceStore = {};
  for (const modality of ['run', 'row', 'bike', 'swim'] as const) {
    for (const [event, v] of Object.entries(race?.[modality] ?? {})) {
      if (!v || v.predicted === true) continue;
      const t = Number(v.timeSec);
      if (!(t > 0) || !Number.isFinite(t)) continue;
      if (own.has(`${modality}:${event}`)) continue;
      (out[modality] ??= {})[event] = { timeSec: t };
    }
  }
  return out;
}

// ---- async (no-op / safe defaults when Supabase isn't configured) ---------

export interface AppPull {
  logs: AthleteLogs;
  /** See anchorsFromAppProfile. */
  anchors: RaceStore;
}

/** Pull the athlete's shared 1RMs + times from the app to prefill the
 *  calculator, plus their other typed race results as prediction anchors. */
export async function syncFromApp(userId: string, brand: Brand): Promise<AppPull> {
  if (!supabase) return { logs: emptyLogs(), anchors: {} };
  const { data, error } = await supabase
    .from('profiles')
    .select('orm, race_times')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return { logs: emptyLogs(), anchors: {} };
  return {
    logs: logsFromAppProfile(data.orm as OrmStore, data.race_times as MultimodalRaceTimes, brand),
    anchors: anchorsFromAppProfile(data.race_times as MultimodalRaceTimes),
  };
}

export interface SyncResult {
  ormWritten: number;
  racesWritten: number;
  /** Supabase is not configured (nothing to sync with). */
  disabled: boolean;
  /** 2026-10-03 — set when the read or the write failed (it used to be
   *  folded into `disabled`, so a failure read as "not configured"). */
  error?: string;
}

/** The query-builder calls syncToApp makes — so a test can hand it a fake. */
export interface ProfilesClient {
  from(table: 'profiles'): {
    select(cols: 'orm, race_times'): {
      eq(col: 'id', v: string): {
        maybeSingle(): PromiseLike<{ data: { orm?: unknown; race_times?: unknown } | null; error: { message?: string } | null }>;
      };
    };
    update(patch: { orm: OrmStore; race_times: MultimodalRaceTimes }): {
      eq(col: 'id', v: string): PromiseLike<{ error: { message?: string } | null }>;
    };
  };
}

/** Merge the session's mapped 1RMs + times into the app's profile (non-destructive). */
export async function syncToApp(userId: string, logs: AthleteLogs): Promise<SyncResult> {
  if (!supabase) return { ormWritten: 0, racesWritten: 0, disabled: true };
  return syncToAppWith(supabase as unknown as ProfilesClient, userId, logs);
}

export async function syncToAppWith(client: ProfilesClient, userId: string, logs: AthleteLogs): Promise<SyncResult> {
  const read = await client
    .from('profiles')
    .select('orm, race_times')
    .eq('id', userId)
    .maybeSingle();
  // 2026-10-03 — never write without a successful read. With a failed read
  // `data` is null, and the merge below would then REPLACE the app's whole
  // 1RM and race-time stores with just this session's patch.
  if (read.error) {
    return { ormWritten: 0, racesWritten: 0, disabled: false, error: read.error.message || 'could not read the TPF app profile' };
  }
  const data = read.data;

  const ormPatch = ormPatchFromLogs(logs);
  const racePatch = racePatchFromLogs(logs, new Date().toISOString());

  const ormMerged: OrmStore = { ...((data?.orm as OrmStore) ?? {}), ...ormPatch };
  const raceMerged: MultimodalRaceTimes = { ...((data?.race_times as MultimodalRaceTimes) ?? {}) };
  for (const [modality, events] of Object.entries(racePatch)) {
    raceMerged[modality] = { ...(raceMerged[modality] ?? {}), ...events };
  }

  const { error } = await client
    .from('profiles')
    .update({ orm: ormMerged, race_times: raceMerged })
    .eq('id', userId);
  if (error) return { ormWritten: 0, racesWritten: 0, disabled: false, error: error.message || 'could not update the TPF app profile' };

  const racesWritten = Object.values(racePatch).reduce((n, e) => n + Object.keys(e).length, 0);
  return { ormWritten: Object.keys(ormPatch).length, racesWritten, disabled: false };
}
