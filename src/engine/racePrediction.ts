/**
 * Predicted race equivalents — the TPF app's, ported to compute the SAME
 * times (2026-10-03; the owner, to "Should the site fill in predicted race
 * times like the app?": "1 yes").
 *
 * In the app a race the athlete has not entered is filled, for HABS, with a
 * time predicted from one they have — and HABS scores it like any other
 * (docs/HABS-ALIGNMENT-2026-10-03.md §1.8, D19). This file is the part of the
 * app that does that, as pure functions, with the app's numbers:
 *
 *   tpf-app src/lib/race_predictor.ts         — Daniels VDOT (vo2Demand,
 *       vo2Fraction, velocityForDemand, vdotFromRace, timeFromVdot), the
 *       long-distance damping, MAX_PLAUSIBLE_VDOT, isLoggedAnchor, and
 *       predictRaceTime (plan 49: anchors within 4.1×, the VDOT blended
 *       between the nearest shorter and longer race, one-sided damping, 100 m
 *       isolated);
 *   tpf-app src/lib/race_times_storage.ts     — RACE_EVENTS, RACE_DISTANCE_M;
 *   tpf-app src/lib/multimodal_race_times_storage.ts — MODALITY_EVENTS (run,
 *       row, bike, swim), MAX_PREDICTED_METRES / isPredictableDistance (no
 *       prediction past a marathon), MAX_PREDICTION_DISTANCE_RATIO /
 *       withinPredictionRange (4.1×), MODALITY_RIEGEL_EXPONENT, the
 *       bodyweight-adjusted exponent and predictRiegel;
 *   tpf-app src/lib/auto_benchmark_inputs.ts  — raceTimesWithEquivalents
 *       (which of those fills a missing event, and how).
 *
 * Read at tpf-app ea86b857. Every expression is written as the app writes it
 * — same operations, same order — so a time here is bit-for-bit the app's.
 * `npm run check:app-habs -- <path to tpf-app>` runs the app's own
 * raceTimesWithEquivalents and computeHABS beside this file and src/engine/habs.ts
 * on synthetic athletes with partial race coverage, and requires identical
 * scores.
 *
 * Left out, because HABS never reaches them: the ruck predictors (HABS has no
 * ruck), the training-pace zones, the dead sprint Riegel, the Race Times
 * screen's storage. Added, without changing a number: which race each
 * prediction came from (`from`), for the site to say so.
 *
 * Pure: no React, no config imports.
 */

// ── tpf-app race_times_storage.ts ─────────────────────────────────────────

export type RaceEvent =
  | '100m' | '400m' | '800m' | '1500m' | 'mile' | '2k' | '1.5mile' | '2mi' | '5k' | '10k' | 'half' | 'marathon';

export const RACE_EVENTS: RaceEvent[] = [
  '100m', '400m', '800m', '1500m', 'mile',
  '2k', '1.5mile', '2mi', '5k', '10k', 'half', 'marathon',
];

export const RACE_DISTANCE_M: Record<RaceEvent, number> = {
  '100m': 100,
  '400m': 400,
  '800m': 800,
  '1500m': 1500,
  'mile': 1609.34,
  '2k': 2000,
  '1.5mile': 2414.02,
  '2mi': 3218.69,
  '5k': 5000,
  '10k': 10000,
  'half': 21097.5,
  'marathon': 42195,
};

// ── tpf-app multimodal_race_times_storage.ts ──────────────────────────────

export type EquivModality = 'run' | 'row' | 'bike' | 'swim';

/** The app's MODALITY_EVENTS for the four modalities HABS can predict (ruck
 *  is never predicted for HABS — load-dependent). Order matters: it is the
 *  order the app fills events in, and the tie-break for the nearest Riegel
 *  source. */
export const MODALITY_EVENTS: Record<EquivModality, Array<{ key: string; metres: number }>> = {
  run: [
    { key: '100m', metres: 100 },
    { key: '400m', metres: 400 },
    { key: '800m', metres: 800 },
    { key: '1500m', metres: 1500 },
    { key: 'mile', metres: 1609.34 },
    { key: '2k', metres: 2000 },
    { key: '1.5mile', metres: 2414.02 },
    { key: '2mi', metres: 3218.69 },
    { key: '5k', metres: 5000 },
    { key: '10k', metres: 10000 },
    { key: 'half', metres: 21097.5 },
    { key: 'marathon', metres: 42195 },
    { key: '50mi', metres: 80467.2 },
    { key: '100mi', metres: 160934.4 },
  ],
  row: [
    { key: '500m', metres: 500 },
    { key: '1k', metres: 1000 },
    { key: '2k', metres: 2000 },
    { key: '5k', metres: 5000 },
    { key: '6k', metres: 6000 },
    { key: '10k', metres: 10000 },
    { key: '21k', metres: 21097.5 },
    { key: '42k', metres: 42195 },
  ],
  bike: [
    { key: '20k', metres: 20000 },
    { key: '40k', metres: 40000 },
    { key: '50k', metres: 50000 },
    { key: '100k', metres: 100000 },
    { key: 'century', metres: 160934 },
    { key: '200k', metres: 200000 },
  ],
  swim: [
    { key: '50m', metres: 50 },
    { key: '100m', metres: 100 },
    { key: '200m', metres: 200 },
    { key: '400m', metres: 400 },
    { key: '500m', metres: 500 },
    { key: '800m', metres: 800 },
    { key: '1500m', metres: 1500 },
    { key: '1mile', metres: 1609.34 },
  ],
};

/** Plan 47 — nothing is predicted AT a distance longer than a marathon. */
export const MAX_PREDICTED_METRES = 42195;

export function isPredictableDistance(metres: number): boolean {
  return typeof metres === 'number' && Number.isFinite(metres) && metres > 0 && metres <= MAX_PREDICTED_METRES;
}

/** Plan 49 — a time predicts another only within 4.1× of its distance. */
export const MAX_PREDICTION_DISTANCE_RATIO = 4.1;

export function withinPredictionRange(fromMetres: number, toMetres: number): boolean {
  if (typeof fromMetres !== 'number' || typeof toMetres !== 'number') return false;
  if (!Number.isFinite(fromMetres) || !Number.isFinite(toMetres)) return false;
  if (fromMetres <= 0 || toMetres <= 0) return false;
  const ratio = Math.max(fromMetres, toMetres) / Math.min(fromMetres, toMetres);
  return ratio <= MAX_PREDICTION_DISTANCE_RATIO + 1e-9;
}

export const MODALITY_RIEGEL_EXPONENT: Record<EquivModality, number> = {
  run: 1.07,
  row: 1.08,
  bike: 1.05,
  swim: 1.06,
};

const BW_REF_KG: Record<'male' | 'female', number> = { male: 70, female: 62 };
const MODALITY_BW_SENSITIVITY: Record<EquivModality, number> = {
  run: 1.0,
  row: 0.25,
  bike: 0.0,
  swim: 0.0,
};

export type AppSex = 'male' | 'female' | 'unspecified';

export function bwAdjustedRiegelExponent(
  modality: EquivModality,
  bodyweightKg?: number | null,
  sex?: AppSex | null,
): number {
  const base = MODALITY_RIEGEL_EXPONENT[modality];
  if (!bodyweightKg || bodyweightKg <= 0) return base;
  const sensitivity = MODALITY_BW_SENSITIVITY[modality];
  if (sensitivity === 0) return base;
  const ref = BW_REF_KG[sex === 'female' ? 'female' : 'male'];
  const delta = Math.max(0, bodyweightKg - ref);
  return base + 0.005 * delta * sensitivity;
}

export function predictRiegel(
  modality: EquivModality,
  fromMetres: number,
  fromTimeSec: number,
  toMetres: number,
  bodyweightKg?: number | null,
  sex?: AppSex | null,
): number {
  if (fromMetres <= 0 || fromTimeSec <= 0 || toMetres <= 0) return 0;
  if (!isPredictableDistance(toMetres)) return 0;
  if (!withinPredictionRange(fromMetres, toMetres)) return 0;
  const exp = bwAdjustedRiegelExponent(modality, bodyweightKg, sex);
  return fromTimeSec * Math.pow(toMetres / fromMetres, exp);
}

// ── tpf-app race_predictor.ts — Daniels VDOT ──────────────────────────────

function vo2Demand(velocityMPerMin: number): number {
  return (
    -4.60 +
    0.182258 * velocityMPerMin +
    0.000104 * velocityMPerMin * velocityMPerMin
  );
}

function vo2Fraction(timeMin: number): number {
  return (
    0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMin) +
    0.2989558 * Math.exp(-0.1932605 * timeMin)
  );
}

function velocityForDemand(target: number): number {
  const a = 0.000104;
  const b = 0.182258;
  const c = -4.60 - target;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return 0;
  return (-b + Math.sqrt(disc)) / (2 * a);
}

export function vdotFromRace(distanceM: number, timeSec: number): number {
  if (distanceM <= 0 || timeSec <= 0) return 0;
  const timeMin = timeSec / 60;
  const velocity = distanceM / timeMin;
  const demand = vo2Demand(velocity);
  const fraction = vo2Fraction(timeMin);
  if (fraction <= 0) return 0;
  return demand / fraction;
}

export function timeFromVdot(distanceM: number, vdot: number): number {
  if (distanceM <= 0 || vdot <= 0) return 0;
  let timeSec = distanceM / 4;
  for (let i = 0; i < 50; i++) {
    const timeMin = timeSec / 60;
    const fraction = vo2Fraction(timeMin);
    const demandTarget = vdot * fraction;
    const v = velocityForDemand(demandTarget);
    if (!isFinite(v) || v <= 0) return 0;
    const next = (distanceM / v) * 60;
    if (Math.abs(next - timeSec) < 0.005) return next;
    timeSec = next;
  }
  return timeSec;
}

const ISOLATED_EVENTS = new Set<RaceEvent>(['100m']);
const DISTANCE_EVENTS = new Set<RaceEvent>([
  '400m', '800m', '1500m', 'mile', '2k', '1.5mile', '2mi', '5k', '10k', 'half', 'marathon',
]);
function isIsolated(ev: RaceEvent): boolean { return ISOLATED_EVENTS.has(ev); }
function isDistance(ev: RaceEvent): boolean { return DISTANCE_EVENTS.has(ev); }

export const MAX_PLAUSIBLE_VDOT = 90;

/** A real (typed, non-predicted) time. */
export function isLoggedAnchor(rec: { timeSec?: number; predicted?: boolean } | undefined): boolean {
  return !!rec && typeof rec.timeSec === 'number' && rec.timeSec > 0 && rec.predicted !== true;
}

export function longDistanceDamping(targetMetres: number, anchorMetres: number): number {
  if (targetMetres <= 0 || anchorMetres <= 0) return 1;
  const logRatio = Math.abs(Math.log2(targetMetres / anchorMetres));
  const factor = 1 - 0.012 * logRatio * logRatio;
  return Math.max(0.90, factor);
}

export interface RunPrediction {
  timeSec: number;
  fromEvent: RaceEvent;
  distanceRatio: number;
  blendedFrom?: [RaceEvent, RaceEvent];
  vdot?: number;
}

export type RaceRecord = { timeSec?: number; predicted?: boolean };
export type RunTimes = Partial<Record<string, RaceRecord>>;

/** tpf-app predictRaceTime: null for 100 m and anything outside the chain. */
export function predictRaceTime(target: RaceEvent, records: RunTimes): RunPrediction | null {
  if (isIsolated(target)) return null;
  if (!isDistance(target)) return null;
  return predictAtDistance(RACE_DISTANCE_M[target], records, target);
}

function predictAtDistance(dTarget: number, records: RunTimes, skip: RaceEvent | null): RunPrediction | null {
  if (!isPredictableDistance(dTarget)) return null;

  type Anchor = { ev: RaceEvent; d: number; vdot: number };
  const anchors: Anchor[] = [];
  for (const ev of RACE_EVENTS) {
    if (ev === skip) continue;
    const rec = records[ev];
    if (!isLoggedAnchor(rec)) continue;
    if (!isDistance(ev)) continue;
    const d = RACE_DISTANCE_M[ev];
    if (!withinPredictionRange(d, dTarget)) continue;
    const vdot = vdotFromRace(d, rec!.timeSec!);
    if (vdot <= 0 || vdot > MAX_PLAUSIBLE_VDOT) continue;
    anchors.push({ ev, d, vdot });
  }
  if (anchors.length === 0) return null;

  const at = anchors.find((a) => Math.abs(a.d - dTarget) < 0.5);
  if (at) {
    return { timeSec: records[at.ev]!.timeSec!, fromEvent: at.ev, distanceRatio: 1, vdot: at.vdot };
  }

  let below: Anchor | null = null;
  let above: Anchor | null = null;
  for (const a of anchors) {
    if (a.d < dTarget) { if (!below || a.d > below.d) below = a; }
    else if (a.d > dTarget) { if (!above || a.d < above.d) above = a; }
  }

  const logGap = (a: Anchor) => Math.abs(Math.log(dTarget / a.d));

  if (below && above) {
    const f = Math.log(dTarget / below.d) / Math.log(above.d / below.d);
    const vdot = below.vdot + f * (above.vdot - below.vdot);
    const timeSec = timeFromVdot(dTarget, vdot);
    if (isFinite(timeSec) && timeSec > 0) {
      const nearer = logGap(below) <= logGap(above) ? below : above;
      return {
        timeSec,
        fromEvent: nearer.ev,
        distanceRatio: dTarget / nearer.d,
        blendedFrom: [below.ev, above.ev],
        vdot,
      };
    }
  }

  const nearest = anchors.reduce((a, b) => (logGap(b) < logGap(a) ? b : a));
  let predictedSec = timeFromVdot(dTarget, nearest.vdot);
  if (!isFinite(predictedSec) || predictedSec <= 0) return null;
  predictedSec = predictedSec / longDistanceDamping(dTarget, nearest.d);
  return {
    timeSec: predictedSec,
    fromEvent: nearest.ev,
    distanceRatio: dTarget / nearest.d,
    vdot: nearest.vdot,
  };
}

// ── tpf-app auto_benchmark_inputs.ts raceTimesWithEquivalents ─────────────

/** One modality's records, keyed by the app's event key. */
export type ModalityRecords = Record<string, RaceRecord & { from?: PredictionSource }>;
/** The four modalities HABS predicts. A modality may be absent. */
export type RaceStore = Partial<Record<EquivModality, ModalityRecords>>;

/** Where a prediction came from (added here; the app does not return it). */
export interface PredictionSource {
  model: 'daniels-vdot' | 'riegel';
  /** The nearest race it was worked out from. */
  fromEvent: string;
  /** Run only: the two races the VDOT was blended between, when it was. */
  blendedFrom?: [string, string];
}

const EQUIV_MODALITIES: EquivModality[] = ['run', 'row', 'bike', 'swim'];

/**
 * tpf-app raceTimesWithEquivalents, same rule, same order: every missing (or
 * previously predicted) event of each modality is filled from that modality's
 * ENTERED times — runs by the Daniels VDOT chain, row / bike / swim by the
 * modality's Riegel from the nearest entered distance (log-distance) — never
 * past a marathon, never from further than 4.1×; a stored prediction the rule
 * can no longer reproduce is dropped. Entered times are never touched.
 * Filled times are rounded to the second, as the app rounds them.
 */
export function raceTimesWithEquivalents(
  rt: RaceStore,
  bodyweightKg?: number | null,
  sex?: AppSex | null,
): RaceStore {
  const out: RaceStore = { ...rt };

  for (const modality of EQUIV_MODALITIES) {
    const times: ModalityRecords = { ...(rt[modality] ?? {}) };
    const events = MODALITY_EVENTS[modality];
    const entered = events.filter((ev) => isLoggedAnchor(times[ev.key]));

    for (const ev of events) {
      if (isLoggedAnchor(times[ev.key])) continue;
      if (!isPredictableDistance(ev.metres)) continue;
      let predictedSec = 0;
      let from: PredictionSource | null = null;
      if (modality === 'run') {
        const p = predictRaceTime(ev.key as RaceEvent, times);
        if (p && p.timeSec > 0) {
          predictedSec = p.timeSec;
          from = { model: 'daniels-vdot', fromEvent: p.fromEvent, ...(p.blendedFrom ? { blendedFrom: p.blendedFrom } : {}) };
        }
      } else {
        let src: { key: string; metres: number; timeSec: number } | null = null;
        let bestGap = Infinity;
        for (const cand of entered) {
          const gap = Math.abs(Math.log2(ev.metres / cand.metres));
          if (gap < bestGap) { bestGap = gap; src = { key: cand.key, metres: cand.metres, timeSec: times[cand.key]!.timeSec! }; }
        }
        if (src) {
          predictedSec = predictRiegel(modality, src.metres, src.timeSec, ev.metres, bodyweightKg, sex);
          from = { model: 'riegel', fromEvent: src.key };
        }
      }
      if (predictedSec > 0 && isFinite(predictedSec)) {
        times[ev.key] = {
          ...(times[ev.key] ?? {}),
          timeSec: Math.round(predictedSec),
          predicted: true,
          ...(from ? { from } : {}),
        };
      } else if (times[ev.key]?.predicted === true) {
        delete times[ev.key];
      }
    }
    out[modality] = times;
  }
  return out;
}
