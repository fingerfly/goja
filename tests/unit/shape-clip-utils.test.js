import { describe, it, expect } from 'vitest';
import { getShapeCssClip } from '../../js/shape-clip-utils.js';

describe('shape-clip-utils', () => {
  it('uses high-sample polygon heart clip by default', () => {
    const clip = getShapeCssClip('heart', 'auto');
    expect(clip.startsWith('polygon(')).toBe(true);
    const points = clip.slice('polygon('.length, -1).split(',').map((v) => v.trim()).filter(Boolean);
    expect(points.length).toBeGreaterThanOrEqual(64);
  });

  it('uses high-sample polygon fallback for heart when requested', () => {
    const clip = getShapeCssClip('heart', 'auto', {
      forcePolygonFallback: true,
      heartSamples: 96,
    });
    expect(clip.startsWith('polygon(')).toBe(true);
    const points = clip.slice('polygon('.length, -1).split(',').map((v) => v.trim()).filter(Boolean);
    expect(points.length).toBeGreaterThanOrEqual(96);
  });

  it('clamps heart polygon samples to safe range 64..128', () => {
    const low = getShapeCssClip('heart', 'auto', { forcePolygonFallback: true, heartSamples: 8 });
    const high = getShapeCssClip('heart', 'auto', { forcePolygonFallback: true, heartSamples: 999 });
    const lowPoints = low.slice('polygon('.length, -1).split(',').map((v) => v.trim()).filter(Boolean);
    const highPoints = high.slice('polygon('.length, -1).split(',').map((v) => v.trim()).filter(Boolean);
    expect(lowPoints.length).toBeGreaterThanOrEqual(64);
    expect(highPoints.length).toBeLessThanOrEqual(128);
  });

  it('builds polygon clips for new regular polygon shapes', () => {
    const cases = [
      ['regular-triangle', 3],
      ['regular-decagon', 10],
      ['regular-dodecagon', 12],
      ['regular-hexadecagon', 16],
    ];
    for (const [shape, sides] of cases) {
      const clip = getShapeCssClip(shape, 'horizontal');
      expect(clip.startsWith('polygon(')).toBe(true);
      const points = clip.slice('polygon('.length, -1).split(',').map((v) => v.trim()).filter(Boolean);
      expect(points.length).toBe(sides);
    }
  });
});
