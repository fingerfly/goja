import { describe, it, expect } from 'vitest';
import {
  normalizeFrameShape,
  normalizeShapeOrientation,
  buildShapePathD,
} from '../../js/frame-shape-geometry.js';

function parseNums(d) {
  return (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
}

function approxEqual(a, b, eps = 0.01) {
  return Math.abs(a - b) <= eps;
}

describe('frame-shape-geometry', () => {
  it('normalizes unknown shapes to rect', () => {
    expect(normalizeFrameShape('circle')).toBe('circle');
    expect(normalizeFrameShape('ellipse')).toBe('ellipse');
    expect(normalizeFrameShape('hexagon')).toBe('regular-hexagon');
    expect(normalizeFrameShape('regular-hexagon')).toBe('regular-hexagon');
    expect(normalizeFrameShape('bad-shape')).toBe('rect');
  });

  it('normalizes unknown orientations to auto', () => {
    expect(normalizeShapeOrientation('auto')).toBe('auto');
    expect(normalizeShapeOrientation('horizontal')).toBe('horizontal');
    expect(normalizeShapeOrientation('vertical')).toBe('vertical');
    expect(normalizeShapeOrientation('bad')).toBe('auto');
  });

  it('builds closed path commands for supported shapes', () => {
    const rectD = buildShapePathD(200, 100, { shape: 'rect' });
    const circleD = buildShapePathD(200, 100, { shape: 'circle' });
    const ellipseD = buildShapePathD(200, 100, { shape: 'ellipse' });
    const hexD = buildShapePathD(200, 100, { shape: 'regular-hexagon' });
    expect(rectD.startsWith('M ')).toBe(true);
    expect(circleD.includes('A')).toBe(true);
    expect(ellipseD.includes('A')).toBe(true);
    expect(hexD.includes(' L ')).toBe(true);
    expect(rectD.endsWith(' Z')).toBe(true);
    expect(circleD.endsWith(' Z')).toBe(true);
    expect(ellipseD.endsWith(' Z')).toBe(true);
    expect(hexD.endsWith(' Z')).toBe(true);
  });

  it('supports inset without generating negative radii', () => {
    const d = buildShapePathD(40, 40, { shape: 'circle', inset: 30 });
    expect(d.endsWith(' Z')).toBe(true);
    expect(d.includes('NaN')).toBe(false);
    expect(d.includes('Infinity')).toBe(false);
  });

  it('keeps ellipse distinct from circle on non-square dimensions', () => {
    const circleD = buildShapePathD(300, 160, { shape: 'circle' });
    const ellipseD = buildShapePathD(300, 160, { shape: 'ellipse' });
    const c = parseNums(circleD);
    const e = parseNums(ellipseD);
    const circleRx = c[2];
    const circleRy = c[3];
    const ellipseRx = e[2];
    const ellipseRy = e[3];
    expect(approxEqual(circleRx, circleRy)).toBe(true);
    expect(approxEqual(ellipseRx, ellipseRy)).toBe(false);
  });

  it('builds regular-hexagon with near-equal side lengths', () => {
    const hexD = buildShapePathD(300, 180, { shape: 'regular-hexagon', orientation: 'horizontal' });
    const nums = parseNums(hexD);
    const points = [];
    for (let i = 0; i < 12; i += 2) points.push({ x: nums[i], y: nums[i + 1] });
    const lengths = [];
    for (let i = 0; i < 6; i += 1) {
      const a = points[i];
      const b = points[(i + 1) % 6];
      lengths.push(Math.hypot(a.x - b.x, a.y - b.y));
    }
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);
    expect(max - min).toBeLessThan(0.05);
  });
});
