import { describe, it, expect } from 'vitest';
import { benchmarkLabel } from '../ui/format';
import data from '../config/generated/operator.data.json';

// 2026-10-03 — the grid fell back to the title-cased id ("1 5 Mile Run") for
// every Operator benchmark whose name the `notes` fallback refuses. No
// Operator benchmark may show its id.
describe('Operator grid labels', () => {
  const units = data as Array<{ benchmarks: Array<{ id: string; name: string }> }>;
  const idLabel = (id: string) => id.replace(/_1rm$/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  for (const u of units) for (const b of u.benchmarks) {
    it(`${b.id} shows a name, not its id`, () => {
      const label = benchmarkLabel({ id: b.id, meta: { notes: b.name } });
      if (idLabel(b.id) !== b.name) expect(label).not.toBe(idLabel(b.id));
    });
  }
});
