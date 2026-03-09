import { describe, it, expect } from 'vitest';
import {
  getShapeCssClip,
  buildFrameStrokeModel,
  getFrameCssClipFromLayout,
} from '../../js/shape-clip-utils.js';

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
      ['regular-36-gon', 36],
      ['regular-64-gon', 64],
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

  it('supports wave11 non-polygon shapes with valid css clip output', () => {
    const cases = ['rounded-rect', 'superellipse', 'capsule', 'diamond'];
    for (const shape of cases) {
      const clip = getShapeCssClip(shape, 'horizontal', { superellipseExponent: 4.5 });
      expect(clip === 'none').toBe(false);
      expect(clip.startsWith('polygon(') || clip.startsWith('path(')).toBe(true);
    }
  });

  it('builds shared frame stroke model from normalized options', () => {
    const model = buildFrameStrokeModel(
      { canvasWidth: 300, canvasHeight: 200 },
      {
        shape: 'regular-octagon',
        strokeEnabled: true,
        strokeWidth: 20,
        strokeColor: '#00ff00',
        strokeOpacity: 0.5,
      }
    );
    expect(model).toBeTruthy();
    expect(model?.lineWidth).toBe(20);
    expect(model?.strokeStyle).toBe('rgba(0,255,0,0.5)');
    expect(typeof model?.pathD).toBe('string');
    expect(model?.pathD.length).toBeGreaterThan(0);
  });

  it('returns null frame stroke model when disabled or zero-width', () => {
    const disabled = buildFrameStrokeModel(
      { canvasWidth: 300, canvasHeight: 200 },
      { shape: 'circle', strokeEnabled: false, strokeWidth: 20 }
    );
    const zeroWidth = buildFrameStrokeModel(
      { canvasWidth: 300, canvasHeight: 200 },
      { shape: 'circle', strokeEnabled: true, strokeWidth: 0 }
    );
    expect(disabled).toBeNull();
    expect(zeroWidth).toBeNull();
  });

  it('keeps non-square regular polygon inset in frame css clip', () => {
    const clip = getFrameCssClipFromLayout(
      { canvasWidth: 240, canvasHeight: 120 },
      { shape: 'regular-octagon', inset: 0 }
    );
    expect(clip.startsWith('polygon(')).toBe(true);
    const coords = clip
      .slice('polygon('.length, -1)
      .split(',')
      .map((part) => part.trim())
      .map((pair) => pair.split(/\s+/).map((v) => Number(v.replace('%', ''))))
      .filter((pair) => pair.length === 2 && Number.isFinite(pair[0]));
    const xs = coords.map(([x]) => x);
    expect(Math.min(...xs)).toBeGreaterThan(20);
    expect(Math.max(...xs)).toBeLessThan(80);
  });
});
