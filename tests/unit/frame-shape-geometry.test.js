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
    expect(normalizeFrameShape('hexagon')).toBe('regular-octagon');
    expect(normalizeFrameShape('regular-hexagon')).toBe('regular-octagon');
    expect(normalizeFrameShape('regular-nonagon')).toBe('regular-octagon');
    expect(normalizeFrameShape('regular-octagon')).toBe('regular-octagon');
    expect(normalizeFrameShape('heart')).toBe('heart');
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
    const octagonD = buildShapePathD(200, 100, { shape: 'regular-octagon' });
    const heartD = buildShapePathD(200, 100, { shape: 'heart' });
    expect(rectD.startsWith('M ')).toBe(true);
    expect(circleD.includes('A')).toBe(true);
    expect(ellipseD.includes('A')).toBe(true);
    expect(octagonD.includes(' L ')).toBe(true);
    expect(heartD.includes(' L ')).toBe(true);
    expect(rectD.endsWith(' Z')).toBe(true);
    expect(circleD.endsWith(' Z')).toBe(true);
    expect(ellipseD.endsWith(' Z')).toBe(true);
    expect(octagonD.endsWith(' Z')).toBe(true);
    expect(heartD.endsWith(' Z')).toBe(true);
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

  it('builds regular-octagon with near-equal side lengths', () => {
    const octagonD = buildShapePathD(300, 180, { shape: 'regular-octagon', orientation: 'horizontal' });
    const nums = parseNums(octagonD);
    const points = [];
    for (let i = 0; i < 16; i += 2) points.push({ x: nums[i], y: nums[i + 1] });
    const lengths = [];
    for (let i = 0; i < 8; i += 1) {
      const a = points[i];
      const b = points[(i + 1) % 8];
      lengths.push(Math.hypot(a.x - b.x, a.y - b.y));
    }
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);
    expect(max - min).toBeLessThan(0.12);
  });

  it('builds centered heart path within bounds', () => {
    const w = 240;
    const h = 180;
    const d = buildShapePathD(w, h, { shape: 'heart' });
    const nums = parseNums(d);
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    expect(minX).toBeGreaterThanOrEqual(0);
    expect(minY).toBeGreaterThanOrEqual(0);
    expect(maxX).toBeLessThanOrEqual(w);
    expect(maxY).toBeLessThanOrEqual(h);
    const cx = (minX + maxX) / 2;
    expect(Math.abs(cx - w / 2)).toBeLessThan(0.1);
  });

  it('maximizes heart fit within inset-safe area', () => {
    const w = 240;
    const h = 180;
    const inset = 10;
    const d = buildShapePathD(w, h, { shape: 'heart', inset });
    const nums = parseNums(d);
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const usableWidth = w - inset * 2;
    const usableHeight = h - inset * 2;
    const usedWidth = maxX - minX;
    const usedHeight = maxY - minY;
    expect(minX).toBeGreaterThanOrEqual(inset - 0.1);
    expect(maxX).toBeLessThanOrEqual(w - inset + 0.1);
    expect(minY).toBeGreaterThanOrEqual(inset - 0.1);
    expect(maxY).toBeLessThanOrEqual(h - inset + 0.1);
    expect(minY).toBeLessThanOrEqual(inset + 1.5);
    expect(usedWidth / usableWidth).toBeGreaterThan(0.95);
    expect(usedHeight / usableHeight).toBeGreaterThan(0.95);
  });
});
