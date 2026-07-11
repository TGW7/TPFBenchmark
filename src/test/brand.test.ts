import { describe, expect, it } from 'vitest';
import { BRAND_META, brandMeta, detectBrand } from '../brand';

describe('detectBrand', () => {
  it('defaults to lift', () => {
    expect(detectBrand('benchmark.takepointfitness.com')).toBe('lift');
    expect(detectBrand('localhost')).toBe('lift');
  });
  it('detects operator from the hostname', () => {
    expect(detectBrand('operatorbenchmark.takepointfitness.com')).toBe('operator');
    expect(detectBrand('OperatorBenchmark.example.com')).toBe('operator');
  });
  it('exposes brand metadata', () => {
    expect(brandMeta('operatorbenchmark.x').shortName).toBe('ORS');
    expect(brandMeta('benchmark.x').shortName).toBe('HABS');
    expect(BRAND_META.lift.fullName).toBe('Hybrid Athlete Benchmark Scoring');
    expect(BRAND_META.hybrid.fullName).toBe('Hybrid Athlete Benchmark Scoring');
  });
  it('brand-aware score label avoids redundant "Score Score"', () => {
    expect(BRAND_META.lift.scoreLabel).toBe('HABS Score');
    expect(BRAND_META.hybrid.scoreLabel).toBe('HABS Score');
    // ORS's fullName already ends in "...Score" — the label stays bare.
    expect(BRAND_META.operator.scoreLabel).toBe('ORS');
  });
});
