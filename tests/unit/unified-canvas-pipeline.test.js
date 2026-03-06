import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderUnifiedCanvas } from '../../js/unified-canvas-pipeline.js';

describe('unified-canvas-pipeline', () => {
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    clip: vi.fn(),
    stroke: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.Path2D = vi.fn(function MockPath2D(d) { this.d = d; });
  });

  it('clips to global frame and draws all cells', () => {
    const drawCell = vi.fn();
    const layout = {
      canvasWidth: 200,
      canvasHeight: 100,
      cells: [
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 100, y: 0, width: 100, height: 100 },
      ],
      photoOrder: [0, 1],
    };
    renderUnifiedCanvas(ctx, [{}, {}], layout, {
      edgeAdvancedSupported: true,
      globalFrameShape: 'ellipse',
      globalFrameStrokeEnabled: true,
      globalFrameStrokeWidth: 2,
      globalFrameStrokeColor: '#ffffff',
      globalFrameStrokeOpacity: 1,
      backgroundColor: '#ffffff',
      outsideBackgroundColor: '#000000',
      watermarkType: 'none',
    }, drawCell);
    expect(ctx.clip).toHaveBeenCalled();
    expect(drawCell).toHaveBeenCalledTimes(2);
    expect(ctx.stroke).toHaveBeenCalledTimes(1);
  });
});
