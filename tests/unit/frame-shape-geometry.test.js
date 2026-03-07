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

function polygonArea(points) {
  let acc = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    acc += (a[0] * b[1]) - (b[0] * a[1]);
  }
  return acc / 2;
}

function resampleClosedContour(points, count = 256) {
  if (points.length < 3) return points.slice();
  let pts = points.slice();
  if (polygonArea(pts) < 0) pts = pts.slice().reverse();
  const segLens = [];
  let totalLen = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segLens.push(len);
    totalLen += len;
  }
  const out = [];
  for (let k = 0; k < count; k += 1) {
    const target = (k / count) * totalLen;
    let acc = 0;
    let idx = 0;
    while (idx < segLens.length && (acc + segLens[idx]) < target) {
      acc += segLens[idx];
      idx += 1;
    }
    const a = pts[idx % pts.length];
    const b = pts[(idx + 1) % pts.length];
    const seg = Math.max(1e-9, segLens[idx % segLens.length]);
    const t = (target - acc) / seg;
    out.push([a[0] + ((b[0] - a[0]) * t), a[1] + ((b[1] - a[1]) * t)]);
  }
  return out;
}

function normalizeHeartContour(points, count = 256) {
  const sampled = resampleClosedContour(points, count);
  const cx = sampled.reduce((sum, [x]) => sum + x, 0) / sampled.length;
  const cy = sampled.reduce((sum, [, y]) => sum + y, 0) / sampled.length;
  const centered = sampled.map(([x, y]) => [x - cx, y - cy]);
  const ys = centered.map(([, y]) => y);
  const tip = centered[ys.indexOf(Math.max(...ys))];
  const tipAngle = Math.atan2(tip[0], tip[1]);
  const cosA = Math.cos(-tipAngle);
  const sinA = Math.sin(-tipAngle);
  const rotated = centered.map(([x, y]) => [(x * cosA) - (y * sinA), (x * sinA) + (y * cosA)]);
  const xs = rotated.map(([x]) => x);
  const ys2 = rotated.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys2);
  const maxY = Math.max(...ys2);
  const spanX = Math.max(1e-9, maxX - minX);
  const spanY = Math.max(1e-9, maxY - minY);
  return rotated.map(([x, y]) => [(x - minX) / spanX, (y - minY) / spanY]);
}

function nearestDistanceSquared(p, points) {
  let best = Infinity;
  for (const q of points) {
    const dx = p[0] - q[0];
    const dy = p[1] - q[1];
    const d2 = (dx * dx) + (dy * dy);
    if (d2 < best) best = d2;
  }
  return best;
}

function symmetricHausdorff(a, b) {
  let h = 0;
  for (const p of a) h = Math.max(h, Math.sqrt(nearestDistanceSquared(p, b)));
  for (const p of b) h = Math.max(h, Math.sqrt(nearestDistanceSquared(p, a)));
  return h;
}

function meanRadialError(a, b, bins = 180) {
  const center = [0.5, 0.5];
  const sumA = new Array(bins).fill(0);
  const sumB = new Array(bins).fill(0);
  const cntA = new Array(bins).fill(0);
  const cntB = new Array(bins).fill(0);
  const toBin = ([x, y]) => {
    let angle = Math.atan2(y - center[1], x - center[0]);
    if (angle < 0) angle += Math.PI * 2;
    return Math.min(bins - 1, Math.floor((angle / (Math.PI * 2)) * bins));
  };
  for (const p of a) {
    const dx = p[0] - center[0];
    const dy = p[1] - center[1];
    const idx = toBin(p);
    sumA[idx] += Math.hypot(dx, dy);
    cntA[idx] += 1;
  }
  for (const p of b) {
    const dx = p[0] - center[0];
    const dy = p[1] - center[1];
    const idx = toBin(p);
    sumB[idx] += Math.hypot(dx, dy);
    cntB[idx] += 1;
  }
  let total = 0;
  let used = 0;
  for (let i = 0; i < bins; i += 1) {
    if (cntA[i] > 0 && cntB[i] > 0) {
      total += Math.abs((sumA[i] / cntA[i]) - (sumB[i] / cntB[i]));
      used += 1;
    }
  }
  return used > 0 ? (total / used) : Infinity;
}

function canonicalParametricHeartTemplate(count = 256) {
  const points = [];
  for (let i = 0; i < count; i += 1) {
    const t = (Math.PI * 2 * i) / count;
    const x = 16 * (Math.sin(t) ** 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    points.push([x, y]);
  }
  return normalizeHeartContour(points, count);
}

function canonicalImplicitHeartTemplate(count = 256) {
  const points = [];
  const minX = -1.4;
  const maxX = 1.4;
  const columns = Math.max(240, count * 2);
  const dx = (maxX - minX) / (columns - 1);
  const minY = -1.6;
  const maxY = 1.6;
  const rows = Math.max(300, count * 3);
  const dy = (maxY - minY) / (rows - 1);
  for (let ci = 0; ci < columns; ci += 1) {
    const x = minX + (ci * dx);
    let yFound = null;
    for (let r = rows - 1; r >= 0; r -= 1) {
      const y = minY + (r * dy);
      const f = ((x * x + y * y - 1) ** 3) - (x * x * y * y * y);
      if (f <= 0) {
        yFound = y;
        break;
      }
    }
    if (yFound !== null) points.push([x, yFound]);
  }
  for (let ci = columns - 1; ci >= 0; ci -= 1) {
    const x = minX + (ci * dx);
    let yFound = null;
    for (let r = 0; r < rows; r += 1) {
      const y = minY + (r * dy);
      const f = ((x * x + y * y - 1) ** 3) - (x * x * y * y * y);
      if (f <= 0) {
        yFound = y;
        break;
      }
    }
    if (yFound !== null) points.push([x, yFound]);
  }
  return normalizeHeartContour(points, count);
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

function heartNotchOffsetFromTop(points) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minY = Math.min(...ys);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const width = maxX - minX;
  const cx = (minX + maxX) / 2;
  const centerBand = points.filter(([x]) => Math.abs(x - cx) <= width * 0.06).map(([, y]) => y);
  if (!centerBand.length) return 0;
  return Math.min(...centerBand) - minY;
}

function maxLowerHalfTurnRadians(points, minRatio = 0.62, maxRatio = 0.9) {
  if (points.length < 3) return 0;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const centerX = (minX + maxX) / 2;
  const centerBand = (maxX - minX) * 0.05;
  const spanY = Math.max(1e-6, maxY - minY);
  let maxTurn = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const yRatio = (p1[1] - minY) / spanY;
    if (yRatio < minRatio || yRatio > maxRatio) continue;
    if (Math.abs(p1[0] - centerX) <= centerBand) continue;
    const v1x = p1[0] - p0[0];
    const v1y = p1[1] - p0[1];
    const v2x = p2[0] - p1[0];
    const v2y = p2[1] - p1[1];
    const n1 = Math.hypot(v1x, v1y);
    const n2 = Math.hypot(v2x, v2y);
    if (n1 < 1e-6 || n2 < 1e-6) continue;
    const dot = Math.max(-1, Math.min(1, ((v1x * v2x) + (v1y * v2y)) / (n1 * n2)));
    const angle = Math.acos(dot);
    if (angle > maxTurn) maxTurn = angle;
  }
  return maxTurn;
}

function bottomTipOffsetFromCenter(points) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const centerX = (minX + maxX) / 2;
  const spanY = Math.max(1e-6, maxY - minY);
  const tipBand = points.filter(([, y]) => ((maxY - y) / spanY) <= 0.01);
  if (!tipBand.length) return Infinity;
  const tipX = tipBand.reduce((sum, [x]) => sum + x, 0) / tipBand.length;
  return Math.abs(tipX - centerX);
}

describe('frame-shape-geometry', () => {
  it('normalizes unknown shapes to rect', () => {
    expect(normalizeFrameShape('circle')).toBe('circle');
    expect(normalizeFrameShape('ellipse')).toBe('ellipse');
    expect(normalizeFrameShape('regular-triangle')).toBe('rect');
    expect(normalizeFrameShape('regular-36-gon')).toBe('regular-36-gon');
    expect(normalizeFrameShape('regular-64-gon')).toBe('regular-64-gon');
    expect(normalizeFrameShape('rounded-rect')).toBe('rounded-rect');
    expect(normalizeFrameShape('superellipse')).toBe('superellipse');
    expect(normalizeFrameShape('capsule')).toBe('capsule');
    expect(normalizeFrameShape('diamond')).toBe('diamond');
    expect(normalizeFrameShape('regular-decagon')).toBe('regular-decagon');
    expect(normalizeFrameShape('regular-dodecagon')).toBe('regular-dodecagon');
    expect(normalizeFrameShape('regular-hexadecagon')).toBe('regular-hexadecagon');
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
    const gon36D = buildShapePathD(200, 100, { shape: 'regular-36-gon' });
    const gon64D = buildShapePathD(200, 100, { shape: 'regular-64-gon' });
    const roundedRectD = buildShapePathD(200, 100, { shape: 'rounded-rect' });
    const superellipseD = buildShapePathD(200, 100, { shape: 'superellipse' });
    const capsuleD = buildShapePathD(200, 100, { shape: 'capsule' });
    const diamondD = buildShapePathD(200, 100, { shape: 'diamond' });
    const decagonD = buildShapePathD(200, 100, { shape: 'regular-decagon' });
    const dodecagonD = buildShapePathD(200, 100, { shape: 'regular-dodecagon' });
    const hexadecagonD = buildShapePathD(200, 100, { shape: 'regular-hexadecagon' });
    const heartD = buildShapePathD(200, 100, { shape: 'heart' });
    expect(rectD.startsWith('M ')).toBe(true);
    expect(circleD.includes('A')).toBe(true);
    expect(ellipseD.includes('A')).toBe(true);
    expect(octagonD.includes(' L ')).toBe(true);
    expect(gon36D.includes(' L ')).toBe(true);
    expect(gon64D.includes(' L ')).toBe(true);
    expect(roundedRectD.includes('A')).toBe(true);
    expect(superellipseD.includes(' L ')).toBe(true);
    expect(capsuleD.includes('A')).toBe(true);
    expect(diamondD.includes(' L ')).toBe(true);
    expect(decagonD.includes(' L ')).toBe(true);
    expect(dodecagonD.includes(' L ')).toBe(true);
    expect(hexadecagonD.includes(' L ')).toBe(true);
    expect(heartD.includes(' L ')).toBe(true);
    expect(rectD.endsWith(' Z')).toBe(true);
    expect(circleD.endsWith(' Z')).toBe(true);
    expect(ellipseD.endsWith(' Z')).toBe(true);
    expect(octagonD.endsWith(' Z')).toBe(true);
    expect(gon36D.endsWith(' Z')).toBe(true);
    expect(gon64D.endsWith(' Z')).toBe(true);
    expect(roundedRectD.endsWith(' Z')).toBe(true);
    expect(superellipseD.endsWith(' Z')).toBe(true);
    expect(capsuleD.endsWith(' Z')).toBe(true);
    expect(diamondD.endsWith(' Z')).toBe(true);
    expect(decagonD.endsWith(' Z')).toBe(true);
    expect(dodecagonD.endsWith(' Z')).toBe(true);
    expect(hexadecagonD.endsWith(' Z')).toBe(true);
    expect(heartD.endsWith(' Z')).toBe(true);
  });

  it('builds regular polygons with expected side counts', () => {
    const cases = [
      ['regular-36-gon', 36],
      ['regular-64-gon', 64],
      ['regular-octagon', 8],
      ['regular-decagon', 10],
      ['regular-dodecagon', 12],
      ['regular-hexadecagon', 16],
    ];
    for (const [shape, sides] of cases) {
      const d = buildShapePathD(240, 180, { shape, orientation: 'horizontal' });
      const nums = parseNums(d);
      expect(nums.length / 2).toBe(sides);
    }
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

  it('meets Heart V2 recognizable profile contract', () => {
    const w = 240;
    const h = 180;
    const inset = 10;
    const d = buildShapePathD(w, h, { shape: 'heart', inset });
    const points = pointsFromPathD(d);
    const usableWidth = w - inset * 2;
    const upperLobeRatio = widthAtRatio(points, 0.3) / usableWidth;
    const waistRatio = widthAtRatio(points, 0.62) / usableWidth;
    const tipRatio = widthAtRatio(points, 0.95) / usableWidth;
    expect(upperLobeRatio).toBeGreaterThanOrEqual(0.93);
    expect(upperLobeRatio).toBeLessThanOrEqual(0.98);
    expect(waistRatio).toBeGreaterThanOrEqual(0.72);
    expect(waistRatio).toBeLessThanOrEqual(0.78);
    expect(tipRatio).toBeGreaterThanOrEqual(0.16);
    expect(tipRatio).toBeLessThanOrEqual(0.22);
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

  it('keeps Heart V2 top notch close to top boundary', () => {
    const w = 240;
    const h = 180;
    const inset = 10;
    const d = buildShapePathD(w, h, { shape: 'heart', inset });
    const points = pointsFromPathD(d);
    const usableHeight = h - inset * 2;
    const notchOffset = heartNotchOffsetFromTop(points);
    expect(notchOffset).toBeLessThanOrEqual(usableHeight * 0.12);
  });

  it('keeps Heart V2 lower-half cell region sufficiently wide', () => {
    const w = 240;
    const h = 180;
    const inset = 10;
    const d = buildShapePathD(w, h, { shape: 'heart', inset });
    const points = pointsFromPathD(d);
    const usableWidth = w - inset * 2;
    const lowerWidthRatio = widthAtRatio(points, 0.75) / usableWidth;
    expect(lowerWidthRatio).toBeGreaterThanOrEqual(0.62);
  });

  it('keeps Heart V2 lower edge close to side bounds at 85% height', () => {
    const w = 240;
    const h = 180;
    const inset = 10;
    const d = buildShapePathD(w, h, { shape: 'heart', inset });
    const points = pointsFromPathD(d);
    const usableWidth = w - inset * 2;
    const lowerOuterRatio = widthAtRatio(points, 0.85) / usableWidth;
    expect(lowerOuterRatio).toBeGreaterThanOrEqual(0.46);
  });

  it('keeps Heart V2 lower contour smooth without sharp kinks', () => {
    const w = 240;
    const h = 180;
    const inset = 10;
    const d = buildShapePathD(w, h, { shape: 'heart', inset });
    const points = pointsFromPathD(d);
    const maxTurn = maxLowerHalfTurnRadians(points, 0.62, 0.9);
    expect(maxTurn).toBeLessThanOrEqual(0.95);
  });

  it('keeps Heart V2 bottom tip centered on vertical axis', () => {
    const w = 240;
    const h = 180;
    const inset = 10;
    const d = buildShapePathD(w, h, { shape: 'heart', inset });
    const points = pointsFromPathD(d);
    const tipOffset = bottomTipOffsetFromCenter(points);
    expect(tipOffset).toBeLessThanOrEqual(0.35);
  });

  it('keeps Heart V2 lower-lobe symmetry near tail', () => {
    const w = 240;
    const h = 180;
    const inset = 10;
    const d = buildShapePathD(w, h, { shape: 'heart', inset });
    const points = pointsFromPathD(d);
    const xs = points.map((p) => p[0]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const ratios = [0.82, 0.88, 0.93];
    const errors = ratios
      .map((r) => spanAtRatio(points, r))
      .filter(Boolean)
      .map((s) => Math.abs(((s.left + s.right) / 2) - cx));
    const maxError = Math.max(...errors);
    expect(maxError).toBeLessThanOrEqual(0.5);
  });

  it('stays close to canonical parametric heart after normalization', () => {
    const w = 240;
    const h = 180;
    const inset = 10;
    const d = buildShapePathD(w, h, { shape: 'heart', inset });
    const points = pointsFromPathD(d);
    const actual = normalizeHeartContour(points, 256);
    const template = canonicalParametricHeartTemplate(256);
    const hausdorff = symmetricHausdorff(actual, template);
    const radial = meanRadialError(actual, template, 180);
    expect(hausdorff).toBeLessThanOrEqual(0.12);
    expect(radial).toBeLessThanOrEqual(0.052);
  });

  it('stays close to canonical implicit heart after normalization', () => {
    const w = 240;
    const h = 180;
    const inset = 10;
    const d = buildShapePathD(w, h, { shape: 'heart', inset });
    const points = pointsFromPathD(d);
    const actual = normalizeHeartContour(points, 256);
    const template = canonicalImplicitHeartTemplate(256);
    const hausdorff = symmetricHausdorff(actual, template);
    const radial = meanRadialError(actual, template, 180);
    expect(hausdorff).toBeLessThanOrEqual(0.195);
    expect(radial).toBeLessThanOrEqual(0.079);
  });
});
