/**
 * Imperial / metric units. The engine works in kg internally; this converts at
 * the input/display edges so US athletes can work in pounds. (×bodyweight tiers
 * are unitless, so only absolute weights + bodyweight change.)
 */
export type Units = 'metric' | 'imperial';

const KG_PER_LB = 0.45359237;

export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const kgToLb = (kg: number) => kg / KG_PER_LB;

export const weightUnit = (u: Units) => (u === 'imperial' ? 'lb' : 'kg');

/** Convert a user-entered weight (in the chosen unit) to kg for the engine. */
export const toKg = (value: number, u: Units) => (u === 'imperial' ? lbToKg(value) : value);

/** Convert a kg value to the chosen unit for display/prefill. */
export const fromKg = (kg: number, u: Units) => (u === 'imperial' ? kgToLb(kg) : kg);

/** Round a kg value to a display string in the chosen unit. */
export function displayWeight(kg: number, u: Units): string {
  return u === 'imperial' ? `${Math.round(kgToLb(kg))} lb` : `${Math.round(kg * 10) / 10} kg`;
}

const KEY = 'tpf-units';
export function loadUnits(): Units {
  try {
    return localStorage.getItem(KEY) === 'imperial' ? 'imperial' : 'metric';
  } catch {
    return 'metric';
  }
}
export function saveUnits(u: Units) {
  try { localStorage.setItem(KEY, u); } catch { /* ignore */ }
}
