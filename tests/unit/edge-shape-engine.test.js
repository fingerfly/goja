import { describe, it, expect } from 'vitest';
import { buildCellEdgePathD } from '../../js/edge-shape-engine.js';

function makeCell() {
  return { x: 10, y: 20, width: 100, height: 80 };
}

describe('buildCellEdgePathD', () => {
  it('returns rectangle path for straight style', () => {
    const d = buildCellEdgePathD(makeCell(), 0, {
      edgeStyle: 'straight',
      edgeIntensity: 0.4,
      edgeFrequency: 4,
      edgeSeed: 7,
    });
    expect(d).toContain('M 10 20');
    expect(d).toContain('L 110 20');
    expect(d).toContain('L 110 100');
    expect(d).toContain('L 10 100');
    expect(d).toContain('Z');
  });

  it('is deterministic for same seed and inputs', () => {
    const opts = { edgeStyle: 'wavy', edgeIntensity: 0.5, edgeFrequency: 6, edgeSeed: 42 };
    const d1 = buildCellEdgePathD(makeCell(), 3, opts);
    const d2 = buildCellEdgePathD(makeCell(), 3, opts);
    expect(d1).toBe(d2);
  });

  it('varies with different seed for non-straight styles', () => {
    const cell = makeCell();
    const a = buildCellEdgePathD(cell, 1, { edgeStyle: 'jagged', edgeIntensity: 0.6, edgeFrequency: 5, edgeSeed: 1 });
    const b = buildCellEdgePathD(cell, 1, { edgeStyle: 'jagged', edgeIntensity: 0.6, edgeFrequency: 5, edgeSeed: 2 });
    expect(a).not.toBe(b);
  });
});
