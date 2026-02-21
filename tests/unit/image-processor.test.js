import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGridCanvas } from '../../js/image-processor.js';

const mockCtx = {
  fillStyle: '',
  fillRect: vi.fn(),
  drawImage: vi.fn(),
};

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx);
  vi.clearAllMocks();
});

describe('createGridCanvas', () => {
  it('returns a canvas element', () => {
    const layout = {
      baseRows: 1, baseCols: 1, gap: 0,
      canvasWidth: 100, canvasHeight: 100,
      cells: [{ rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, x: 0, y: 0, width: 100, height: 100 }],
    };
    const canvas = createGridCanvas(layout, { backgroundColor: '#ffffff' });
    expect(canvas).toBeDefined();
    expect(canvas.tagName).toBe('CANVAS');
  });

  it('sets canvas dimensions from layout', () => {
    const layout = {
      baseRows: 2, baseCols: 2, gap: 4,
      canvasWidth: 1080, canvasHeight: 810,
      cells: [],
    };
    const canvas = createGridCanvas(layout, { backgroundColor: '#000000' });
    expect(canvas.width).toBe(1080);
    expect(canvas.height).toBe(810);
  });

  it('fills background color', () => {
    const layout = {
      baseRows: 1, baseCols: 1, gap: 0,
      canvasWidth: 200, canvasHeight: 200,
      cells: [{ rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, x: 0, y: 0, width: 200, height: 200 }],
    };
    createGridCanvas(layout, { backgroundColor: '#ff0000' });
    expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 200, 200);
  });

  it('handles spanning layout dimensions', () => {
    const layout = {
      baseRows: 2, baseCols: 2, gap: 4,
      canvasWidth: 1080, canvasHeight: 1080,
      cells: [
        { rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 3, x: 0, y: 0, width: 1080, height: 538 },
        { rowStart: 2, rowEnd: 3, colStart: 1, colEnd: 2, x: 0, y: 542, width: 538, height: 538 },
        { rowStart: 2, rowEnd: 3, colStart: 2, colEnd: 3, x: 542, y: 542, width: 538, height: 538 },
      ],
    };
    const canvas = createGridCanvas(layout);
    expect(canvas.width).toBe(1080);
    expect(canvas.height).toBe(1080);
  });
});
