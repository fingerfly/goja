import { describe, it, expect } from 'vitest';
import { resolveEdgeSupport } from '../../js/edge-capability.js';

describe('resolveEdgeSupport', () => {
  it('returns advancedUnsupported when required API is missing', () => {
    const env = {
      Path2D: undefined,
      CSS: { supports: () => true },
      document: {},
    };
    const support = resolveEdgeSupport(env);
    expect(support.advancedSupported).toBe(false);
    expect(support.status).toBe('advancedUnsupported');
  });

  it('returns advancedSupported when APIs and probes pass', () => {
    const env = {
      Path2D: function MockPath2D() {},
      CSS: { supports: () => true },
      document: {},
    };
    const support = resolveEdgeSupport(env, {
      canvasProbe: () => true,
      previewProbe: () => true,
    });
    expect(support.advancedSupported).toBe(true);
    expect(support.status).toBe('advancedSupported');
  });

  it('falls back to advancedUnsupported when probes fail', () => {
    const env = {
      Path2D: function MockPath2D() {},
      CSS: { supports: () => true },
      document: {},
    };
    const support = resolveEdgeSupport(env, {
      canvasProbe: () => false,
      previewProbe: () => true,
      previewPolygonProbe: () => true,
    });
    expect(support.advancedSupported).toBe(false);
  });

  it('supports polygon preview mode when path probe fails', () => {
    const env = {
      Path2D: function MockPath2D() {},
      CSS: { supports: () => true },
      document: {},
    };
    const support = resolveEdgeSupport(env, {
      canvasProbe: () => true,
      previewProbe: () => false,
      previewPolygonProbe: () => true,
    });
    expect(support.advancedSupported).toBe(true);
    expect(support.previewClipMode).toBe('polygon');
  });
});
