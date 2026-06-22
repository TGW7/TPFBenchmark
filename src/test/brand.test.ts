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
    expect(brandMeta('benchmark.x').shortName).toBe('HRS');
    expect(BRAND_META.lift.fullName).toBe('Hybrid Readiness Score');
  });
});
