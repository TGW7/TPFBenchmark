/**
 * Brand detection — mirrors the app's hostname-based pattern (re-implemented,
 * not imported). `benchmark.*` → lift/general; `operatorbenchmark.*` → operator.
 *
 * Drives the `data-brand` attribute on <html> (set in main.tsx) and brand copy.
 * Operator pathways/standards/theme are Phase 3; this is the seam they slot into.
 */

export type Brand = 'lift' | 'operator' | 'hybrid';

export function detectBrand(hostname?: string): Brand {
  // Local preview override: ?brand=operator|hybrid|lift (only when no explicit hostname).
  if (hostname == null && typeof location !== 'undefined') {
    const q = new URLSearchParams(location.search).get('brand');
    if (q === 'operator' || q === 'lift' || q === 'hybrid') return q as Brand;
  }
  const host = hostname ?? (typeof location !== 'undefined' ? location.hostname : '');
  if (/operator/i.test(host)) return 'operator';
  if (/hybrid/i.test(host))   return 'hybrid';
  return 'lift';
}

export interface BrandMeta {
  brand: Brand;
  shortName: string;
  fullName: string;
  tagline: string;
  /** The paid app this site funnels into (the direct-CTA destination). */
  appUrl: string;
}

export const BRAND_META: Record<Brand, BrandMeta> = {
  lift: {
    brand: 'lift',
    shortName: 'HABS',
    fullName: 'Hybrid Athlete Benchmark Score',
    tagline: 'Free benchmark calculator · pick a pathway, enter your numbers, see where you rank',
    appUrl: 'https://app.takepointfitness.com',
  },
  hybrid: {
    brand: 'hybrid',
    shortName: 'HABS',
    fullName: 'Hybrid Athlete Benchmark Score',
    tagline: 'Free hybrid-athlete benchmark · score your strength and engine against hybrid athlete standards',
    appUrl: 'https://hybridapp.takepointfitness.com',
  },
  operator: {
    brand: 'operator',
    shortName: 'ORS',
    fullName: 'Operational Readiness Score',
    tagline: 'Free tactical-fitness benchmark · score against operator standards',
    appUrl: 'https://operatorapp.takepointfitness.com',
  },
};

export function brandMeta(hostname?: string): BrandMeta {
  return BRAND_META[detectBrand(hostname)];
}
