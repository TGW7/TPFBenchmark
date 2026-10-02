import { describe, it, expect } from 'vitest';
import { formatValue } from '../ui/format';

// 2026-10-02 — Operator times and holds are stored as plain seconds ('sec');
// the tables printed them raw ("810" for a 13:30 run).
describe("formatValue — the 'sec' unit", () => {
  it('a minute or more reads as m:ss', () => {
    expect(formatValue(810, 'sec')).toBe('13:30');
    expect(formatValue(225, 'sec')).toBe('3:45');
    expect(formatValue(60, 'sec')).toBe('1:00');
  });
  it('a short sprint or hold keeps seconds', () => {
    expect(formatValue(45, 'sec')).toBe('45 s');
    expect(formatValue(4.5, 'sec')).toBe('4.5 s');
  });
});
