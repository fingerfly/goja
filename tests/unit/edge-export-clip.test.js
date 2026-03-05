import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { applyExportEdgeClip } from '../../js/edge-export-clip.js';
import { buildEdgePathPair } from '../../js/edge-shape-engine.js';

describe('applyExportEdgeClip', () => {
  const OriginalPath2D = globalThis.Path2D;

  beforeEach(() => {
    globalThis.Path2D = vi.fn(function MockPath2D(d) {
      this.d = d;
    });
  });

  afterEach(() => {
    globalThis.Path2D = OriginalPath2D;
  });

  it('clips using canonical global path from shared pipeline', () => {
    const clip = vi.fn();
    const ctx = { clip };
    const cell = { x: 12, y: 24, width: 100, height: 80 };
    const opts = {
      edgeAdvancedSupported: true,
      edgeStyle: 'paper-torn',
      edgeIntensity: 0.6,
      edgeFrequency: 5,
      edgeSeed: 8,
    };
    const expected = buildEdgePathPair(cell, 2, { ...opts, boundaryCell: cell }).globalD;
    const applied = applyExportEdgeClip(ctx, cell, 2, opts);
    expect(applied).toBe(true);
    expect(globalThis.Path2D).toHaveBeenCalledWith(expected);
    expect(clip).toHaveBeenCalledTimes(1);
  });
});
