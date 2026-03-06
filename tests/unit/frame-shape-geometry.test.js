import { describe, it, expect } from 'vitest';
import {
  normalizeFrameShape,
  normalizeShapeOrientation,
  buildShapePathD,
} from '../../js/frame-shape-geometry.js';

describe('frame-shape-geometry', () => {
  it('normalizes unknown shapes to rect', () => {
    expect(normalizeFrameShape('circle')).toBe('circle');
    expect(normalizeFrameShape('ellipse')).toBe('ellipse');
    expect(normalizeFrameShape('hexagon')).toBe('hexagon');
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
    const hexD = buildShapePathD(200, 100, { shape: 'hexagon' });
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
});
