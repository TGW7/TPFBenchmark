/**
 * Robust statistics for the percentile pool (audit tiers T2 + T3).
 *
 * Pure + framework-agnostic. The production read-path percentile is computed
 * server-side (see supabase benchmark_percentile()); this module is the tested
 * reference implementation + the client/edge logic for outlier filtering and
 * trust-weighted aggregation. Uses median/MAD (robust to skew) — never mean±SD.
 */

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Median absolute deviation. */
export function mad(values: number[]): number | null {
  const m = median(values);
  if (m == null) return null;
  return median(values.map((v) => Math.abs(v - m)));
}

/**
 * Robust outlier bounds: median ± k · 1.4826 · MAD (1.4826 scales MAD to a
 * normal-equivalent SD). Returns infinite bounds when MAD is 0 (no spread →
 * don't flag everything).
 */
export function robustBounds(values: number[], k = 3): [number, number] {
  const m = median(values);
  const d = mad(values);
  if (m == null || d == null || d === 0) return [-Infinity, Infinity];
  const spread = k * 1.4826 * d;
  return [m - spread, m + spread];
}

export function isOutlier(value: number, values: number[], k = 3): boolean {
  const [lo, hi] = robustBounds(values, k);
  return value < lo || value > hi;
}

/** Linear-interpolated quantile (q in [0,1]) of a sample. */
export function quantile(values: number[], q: number): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const pos = (s.length - 1) * Math.min(1, Math.max(0, q));
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return s[lo];
  return s[lo] + (pos - lo) * (s[hi] - s[lo]);
}

/** Winsorize: clamp values to the [p, 1−p] quantiles (tames extremes). */
export function winsorize(values: number[], p = 0.05): number[] {
  const lo = quantile(values, p);
  const hi = quantile(values, 1 - p);
  if (lo == null || hi == null) return [...values];
  return values.map((v) => Math.min(hi, Math.max(lo, v)));
}

/**
 * Trust-weighted percentile of `value` against `samples` of [value, trust].
 * Mirrors the SQL benchmark_percentile(): trust-weighted share below + half of
 * ties. Returns null below `minTrust` total weight (don't show what we can't
 * support). `lowerIsBetter` flips direction (faster time → higher percentile).
 */
export function trustWeightedPercentile(
  value: number,
  samples: Array<[number, number]>,
  lowerIsBetter = false,
  minTrust = 30,
): number | null {
  let total = 0;
  let below = 0;
  let equal = 0;
  for (const [v, t] of samples) {
    total += t;
    if (v === value) equal += t;
    else if (lowerIsBetter ? v > value : v < value) below += t;
  }
  if (total < minTrust) return null;
  return ((below + equal / 2) / total) * 100;
}
