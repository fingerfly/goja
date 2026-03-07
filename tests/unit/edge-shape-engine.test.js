import { describe, it, expect } from 'vitest';
import {
  buildCellEdgePathD,
  buildLocalCellEdgePathD,
  translatePathD,
  buildEdgePathPair,
} from '../../js/edge-shape-engine.js';
import { sampleShapeContour } from '../../js/shape-contour.js';

function makeCell() {
  return { x: 10, y: 20, width: 100, height: 80 };
}

function parsePointsFromPathD(d) {
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  const pts = [];
  for (let i = 0; i < nums.length - 1; i += 2) pts.push([nums[i], nums[i + 1]]);
  return pts;
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

  it('keeps shared boundary deterministic between adjacent cells', () => {
    const leftCell = { x: 0, y: 0, width: 100, height: 100 };
    const rightCell = { x: 100, y: 0, width: 100, height: 100 };
    const opts = { edgeStyle: 'wavy', edgeIntensity: 0.5, edgeFrequency: 5, edgeSeed: 17 };
    const left = buildCellEdgePathD(leftCell, 0, opts);
    const right = buildCellEdgePathD(rightCell, 1, opts);
    expect(left).not.toBe(right);
    expect(left).toContain('100');
    expect(right).toContain('100');
  });

  it('uses one normalized local geometry source for preview/export parity', () => {
    const cell = makeCell();
    const opts = { edgeStyle: 'silk-wave', edgeIntensity: 0.5, edgeFrequency: 6, edgeSeed: 42 };
    const local = buildLocalCellEdgePathD(cell, 3, opts);
    const translated = translatePathD(local, cell.x, cell.y);
    const global = buildCellEdgePathD(cell, 3, opts);
    expect(translated).toBe(global);
  });

  it('maps legacy style names to curated presets', () => {
    const cell = makeCell();
    const legacy = buildCellEdgePathD(cell, 1, { edgeStyle: 'wavy', edgeIntensity: 0.6, edgeFrequency: 5, edgeSeed: 1 });
    const curated = buildCellEdgePathD(cell, 1, { edgeStyle: 'silk-wave', edgeIntensity: 0.6, edgeFrequency: 5, edgeSeed: 1 });
    expect(legacy).toBe(curated);
  });

  it('provides canonical local/global path pair for both adapters', () => {
    const cell = makeCell();
    const opts = { edgeStyle: 'paper-torn', edgeIntensity: 0.55, edgeFrequency: 5, edgeSeed: 99 };
    const pair = buildEdgePathPair(cell, 6, opts);
    expect(pair.localD).toBe(buildLocalCellEdgePathD(cell, 6, opts));
    expect(pair.globalD).toBe(buildCellEdgePathD(cell, 6, opts));
    expect(pair.globalD).toBe(translatePathD(pair.localD, cell.x, cell.y));
  });

  it('follows non-rect template contours instead of rectangle corners', () => {
    const d = buildCellEdgePathD(makeCell(), 2, {
      edgeStyle: 'paper-torn',
      edgeIntensity: 0.5,
      edgeFrequency: 6,
      edgeSeed: 9,
      cellShapeTemplate: 'circle',
      cellShapeOrientation: 'auto',
    });
    expect(d).not.toContain('10 20');
    expect(d).not.toContain('110 20');
    expect(d).not.toContain('110 100');
    expect(d).not.toContain('10 100');
    expect(d.endsWith(' Z')).toBe(true);
  });

  it('applies continuous contour perturbation across all non-rect templates', () => {
    const templates = ['circle', 'ellipse', 'regular-octagon', 'heart'];
    for (const template of templates) {
      const cell = makeCell();
      const opts = {
        edgeStyle: 'paper-torn',
        edgeIntensity: 0.5,
        edgeFrequency: 6,
        edgeSeed: 9,
        cellShapeTemplate: template,
        cellShapeOrientation: 'auto',
      };
      const d = buildLocalCellEdgePathD(cell, 2, opts);
      const perturbed = parsePointsFromPathD(d);
      const base = sampleShapeContour(cell.width, cell.height, {
        shape: template,
        orientation: 'auto',
        samples: template === 'regular-octagon' ? 96 : 120,
      });
      expect(perturbed.length).toBe(base.length);
      const displacement = perturbed.map(([x, y], i) => Math.hypot(x - base[i][0], y - base[i][1]));
      const buckets = 4;
      const bucketSize = Math.floor(displacement.length / buckets);
      for (let b = 0; b < buckets; b += 1) {
        const from = b * bucketSize;
        const to = b === buckets - 1 ? displacement.length : (b + 1) * bucketSize;
        const slice = displacement.slice(from, to);
        const avg = slice.reduce((sum, v) => sum + v, 0) / Math.max(1, slice.length);
        expect(avg).toBeGreaterThan(0.05);
      }
    }
  });

  it('keeps non-rect contour perturbation deterministic for same seed', () => {
    const templates = ['circle', 'ellipse', 'regular-octagon', 'heart'];
    for (const template of templates) {
      const cell = makeCell();
      const opts = {
        edgeStyle: 'graphic-zigzag',
        edgeIntensity: 0.55,
        edgeFrequency: 7,
        edgeSeed: 42,
        cellShapeTemplate: template,
        cellShapeOrientation: 'auto',
      };
      const a = buildLocalCellEdgePathD(cell, 7, opts);
      const b = buildLocalCellEdgePathD(cell, 7, opts);
      expect(a).toBe(b);
    }
  });
});
