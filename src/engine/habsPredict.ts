/**
 * HABS's inputs with the app's predicted race equivalents filled in
 * (2026-10-03; docs/LEGAL-FIXES-2026-10-03.md §6).
 *
 * The app's HABS is fed `raceTimesWithEquivalents(raceTimes, bodyweight, sex)`
 * (tpf-app auto_benchmark_inputs.ts; src/engine/racePrediction.ts here): a race
 * the athlete has not entered is filled with a time predicted from one they
 * have, and scored. This builds the same race store from what the site holds —
 *
 *   1. `anchors`: the athlete's other typed results in the TPF app (events the
 *      site has no field for: a 1 km row, a 2 km run, an 800 m swim, …), pulled
 *      on sign-in (src/data/appSync.ts anchorsFromAppProfile) — the app
 *      predicts from every typed event in a modality, so the site must too;
 *   2. the times typed on the site, mapped to the app's events (`raceEventOf`)
 *      — these win, and an anchor at a site-mapped event is ignored (that event
 *      belongs to the site's own field, which the athlete edits here);
 *
 * — runs the app's rule on it, and returns the athlete's logs with each
 * `targets` benchmark that has no typed time filled with its prediction.
 *
 * The returned logs are for SCORING only. They are never saved, synced to the
 * app or added to the pool (src/ui/App.tsx keeps typed `logs` and predicted
 * `scoringLogs` apart); the grid shows a prediction as predicted.
 *
 * Pure: no React, no config imports.
 */

import type { AthleteLogs, Sex } from './types';
import {
  raceTimesWithEquivalents,
  isLoggedAnchor,
  type AppSex,
  type EquivModality,
  type PredictionSource,
  type RaceStore,
} from './racePrediction';

export interface RaceEventRef {
  modality: string;
  event: string;
}

export interface RacePrediction {
  benchmarkId: string;
  modality: string;
  event: string;
  /** Whole seconds, as the app rounds them. */
  timeSec: number;
  from: PredictionSource;
  /** True when the source race is one of the app-only anchors (so the page
   *  can say "in the TPF app"). */
  fromApp: boolean;
}

export interface PredictArgs {
  logs: AthleteLogs;
  /** Site race benchmark id → the app's (modality, event). */
  raceEventOf: Readonly<Record<string, RaceEventRef>>;
  /** The benchmark ids a prediction may fill (the pathway's HABS races). */
  targets: readonly string[];
  /** Typed app results at events the site has no field for. */
  anchors?: RaceStore | null;
  sex: Sex;
  bodyweightKg?: number | null;
}

const EQUIV = new Set<string>(['run', 'row', 'bike', 'swim']);

export const appSexOf = (sex: Sex): AppSex => (sex === 'F' ? 'female' : 'male');

/** The best (lowest) positive, finite typed time for a benchmark, or null. */
function typedTime(logs: AthleteLogs, id: string): number | null {
  const vals = logs.raceTimes
    .filter((e) => e.benchmarkId === id)
    .map((e) => e.timeSec)
    .filter((t) => t > 0 && Number.isFinite(t));
  return vals.length ? Math.min(...vals) : null;
}

/** The race store the app's rule runs on (exported for the check and tests). */
export function buildRaceStore(
  logs: AthleteLogs,
  raceEventOf: Readonly<Record<string, RaceEventRef>>,
  anchors?: RaceStore | null,
): RaceStore {
  const siteEvents = new Set(Object.values(raceEventOf).map((r) => `${r.modality}:${r.event}`));
  const store: RaceStore = {};
  for (const [m, events] of Object.entries(anchors ?? {})) {
    if (!EQUIV.has(m) || !events) continue;
    for (const [ev, rec] of Object.entries(events)) {
      if (siteEvents.has(`${m}:${ev}`)) continue; // the site's own field decides this event
      if (!isLoggedAnchor(rec)) continue;
      (store[m as EquivModality] ??= {})[ev] = { timeSec: rec.timeSec };
    }
  }
  for (const [id, ref] of Object.entries(raceEventOf)) {
    if (!EQUIV.has(ref.modality)) continue;
    const t = typedTime(logs, id);
    if (t == null) continue;
    (store[ref.modality as EquivModality] ??= {})[ref.event] = { timeSec: t };
  }
  return store;
}

export function predictMissingRaces(args: PredictArgs): { logs: AthleteLogs; predictions: RacePrediction[] } {
  const { logs, raceEventOf, targets, anchors, sex, bodyweightKg } = args;
  const store = buildRaceStore(logs, raceEventOf, anchors);
  const filled = raceTimesWithEquivalents(store, bodyweightKg, appSexOf(sex));

  const predictions: RacePrediction[] = [];
  for (const id of targets) {
    const ref = raceEventOf[id];
    if (!ref || !EQUIV.has(ref.modality)) continue;
    if (typedTime(logs, id) != null) continue; // a typed time is never replaced
    const rec = filled[ref.modality as EquivModality]?.[ref.event];
    if (!rec || rec.predicted !== true || !(rec.timeSec! > 0) || !rec.from) continue;
    const srcKey = rec.from.fromEvent;
    // The source is a time typed on the site when a site field maps to it and
    // holds a time; otherwise it can only have come from the app's anchors.
    const fromSite = Object.entries(raceEventOf).some(
      ([bid, r]) => r.modality === ref.modality && r.event === srcKey && typedTime(logs, bid) != null,
    );
    predictions.push({
      benchmarkId: id,
      modality: ref.modality,
      event: ref.event,
      timeSec: rec.timeSec!,
      from: rec.from,
      fromApp: !fromSite,
    });
  }

  if (predictions.length === 0) return { logs, predictions };
  return {
    logs: {
      ...logs,
      raceTimes: [
        ...logs.raceTimes,
        ...predictions.map((p) => ({ benchmarkId: p.benchmarkId, modality: p.modality, event: p.event, timeSec: p.timeSec })),
      ],
    },
    predictions,
  };
}
