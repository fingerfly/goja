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

function pointsFromPathD(d) {
  const nums = parseNums(d);
  const pts = [];
  for (let i = 0; i < nums.length - 1; i += 2) pts.push([nums[i], nums[i + 1]]);
  return pts;
}

function widthAtRatio(points, ratio) {
  const ys = points.map((p) => p[1]);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const y = minY + (maxY - minY) * ratio;
  const xs = [];
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const y1 = a[1];
    const y2 = b[1];
    if (y1 === y2 || y < Math.min(y1, y2) || y > Math.max(y1, y2)) continue;
    const t = (y - y1) / (y2 - y1);
    xs.push(a[0] + t * (b[0] - a[0]));
  }
  if (xs.length < 2) return 0;
  xs.sort((a, b) => a - b);
  return xs[xs.length - 1] - xs[0];
}

function spanAtRatio(points, ratio) {
  const ys = points.map((p) => p[1]);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const y = minY + (maxY - minY) * ratio;
  const xs = [];
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const y1 = a[1];
    const y2 = b[1];
    if (y1 === y2 || y < Math.min(y1, y2) || y > Math.max(y1, y2)) continue;
    const t = (y - y1) / (y2 - y1);
    xs.push(a[0] + t * (b[0] - a[0]));
  }
  if (xs.length < 2) return null;
  xs.sort((a, b) => a - b);
  return { left: xs[0], right: xs[xs.length - 1] };
}

function heartTopConcavityDepth(points) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const width = maxX - minX;
  const cx = (minX + maxX) / 2;
  const centerBand = points.filter(([x]) => Math.abs(x - cx) <= width * 0.06).map(([, y]) => y);
  const leftBand = points
    .filter(([x]) => x >= minX + width * 0.12 && x <= minX + width * 0.38)
    .map(([, y]) => y);
  const rightBand = points
    .filter(([x]) => x >= maxX - width * 0.38 && x <= maxX - width * 0.12)
    .map(([, y]) => y);
  if (!centerBand.length || !leftBand.length || !rightBand.length) return 0;
  const centerMin = Math.min(...centerBand);
  const lobeAvg = (Math.min(...leftBand) + Math.min(...rightBand)) / 2;
  return centerMin - lobeAvg;
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

  it('meets Heart V2 balanced width contract', () => {
    const w = 240;
    const h = 180;
    const inset = 10;
    const d = buildShapePathD(w, h, { shape: 'heart', inset });
    const points = pointsFromPathD(d);
    const usableWidth = w - inset * 2;
    const midUpperWidthRatio = widthAtRatio(points, 0.45) / usableWidth;
    const tipWidthAt95Y = widthAtRatio(points, 0.95);
    expect(midUpperWidthRatio).toBeGreaterThanOrEqual(0.93);
    expect(tipWidthAt95Y).toBeGreaterThanOrEqual(usableWidth * 0.08);
  });

  it('keeps Heart V2 horizontally symmetric within tolerance', () => {
    const w = 240;
    const h = 180;
    const inset = 10;
    const d = buildShapePathD(w, h, { shape: 'heart', inset });
    const points = pointsFromPathD(d);
    const xs = points.map((p) => p[0]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const ratios = [0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85];
    const errors = ratios
      .map((r) => spanAtRatio(points, r))
      .filter(Boolean)
      .map((s) => Math.abs(((s.left + s.right) / 2) - cx));
    const meanError = errors.reduce((sum, v) => sum + v, 0) / Math.max(1, errors.length);
    expect(meanError).toBeLessThan(0.5);
  });

  it('keeps Heart V2 top notch lower than both top lobes', () => {
    const w = 240;
    const h = 180;
    const inset = 10;
    const d = buildShapePathD(w, h, { shape: 'heart', inset });
    const points = pointsFromPathD(d);
    const usableHeight = h - inset * 2;
    const concavityDepth = heartTopConcavityDepth(points);
    expect(concavityDepth).toBeGreaterThanOrEqual(usableHeight * 0.06);
  });
});
