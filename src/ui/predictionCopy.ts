/**
 * 2026-10-03 — how the calculator shows a predicted race time
 * (docs/LEGAL-FIXES-2026-10-03.md §6). A prediction is shown AS a prediction —
 * in the empty field's placeholder ("≈ 46:10") and a line under it saying what
 * it came from and that it counts until a time is typed. It is never put in
 * the field, never saved, never synced, never pooled.
 */

import type { RacePrediction } from '../engine/habsPredict';

const RUN: Record<string, string> = {
  '400m': '400 m', '800m': '800 m', '1500m': '1500 m', mile: '1 mile', '2k': '2 km', '1.5mile': '1.5 mile',
  '2mi': '2 mile', '5k': '5 km', '10k': '10 km', half: 'half marathon', marathon: 'marathon',
};
const OTHER: Record<string, Record<string, string>> = {
  row: { '500m': '500 m', '1k': '1 km', '2k': '2 km', '5k': '5 km', '6k': '6 km', '10k': '10 km', '21k': 'half-marathon', '42k': 'marathon' },
  bike: { '20k': '20 km', '40k': '40 km', '50k': '50 km', '100k': '100 km' },
  swim: { '50m': '50 m', '100m': '100 m', '200m': '200 m', '400m': '400 m', '500m': '500 m', '800m': '800 m', '1500m': '1500 m', '1mile': '1 mile' },
};
const NOUN: Record<string, string> = { row: 'row', bike: 'ride', swim: 'swim' };

/** "5 km", "1 km row", "800 m swim". */
export function raceEventLabel(modality: string, event: string): string {
  if (modality === 'run') return RUN[event] ?? event;
  return `${OTHER[modality]?.[event] ?? event} ${NOUN[modality] ?? modality}`;
}

export function fmtRaceTime(sec: number): string {
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${m}:${pad(ss)}`;
}

/** The line under a predicted field. `typedOnSite(modality, event)` says
 *  whether a source race is one the athlete typed here (else it is one of
 *  their results in the TPF app). */
export function predictionNote(p: RacePrediction, typedOnSite: (modality: string, event: string) => boolean): string {
  const sources = p.from.blendedFrom ?? [p.from.fromEvent];
  const names = sources.map((e) => raceEventLabel(p.modality, e));
  const anyApp = sources.some((e) => !typedOnSite(p.modality, e));
  return `Predicted ${fmtRaceTime(p.timeSec)} from your ${names.join(' and ')}` +
    `${anyApp ? ' (from your TPF app results)' : ''} — counts toward your score until you enter a time.`;
}
