/**
 * Brand detection — mirrors the app's hostname-based pattern (re-implemented,
 * not imported). `benchmark.*` → lift/general; `operatorbenchmark.*` → operator.
 *
 * Drives the `data-brand` attribute on <html> (set in main.tsx) and brand copy.
 * Operator pathways/standards/theme are Phase 3; this is the seam they slot into.
 */

export type Brand = 'lift' | 'operator';

export function detectBrand(hostname?: string): Brand {
  // Local preview override: ?brand=operator (only when no explicit hostname).
  if (hostname == null && typeof location !== 'undefined') {
    const q = new URLSearchParams(location.search).get('brand');
    if (q === 'operator' || q === 'lift') return q;
  }
  const host = hostname ?? (typeof location !== 'undefined' ? location.hostname : '');
  return /operator/i.test(host) ? 'operator' : 'lift';
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
    shortName: 'HRS',
    fullName: 'Hybrid Readiness Score',
    tagline: 'Free benchmark calculator · pick a pathway, enter your numbers, see where you rank',
    appUrl: 'https://app.takepointfitness.com',
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
