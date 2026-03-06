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
});
