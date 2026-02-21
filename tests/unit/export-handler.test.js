import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as imageProcessor from '../../js/image-processor.js';
import { handleExport } from '../../js/export-handler.js';

const mockCtx = {
  fillStyle: '',
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  globalAlpha: 1,
  textBaseline: '',
  textAlign: '',
  font: '',
  translate: vi.fn(),
  rotate: vi.fn(),
  fillText: vi.fn(),
};

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (cb) {
    cb(new Blob(['test'], { type: 'image/jpeg' }));
  });
  vi.clearAllMocks();
});

function makeLayout() {
  return {
    baseRows: 1, baseCols: 1, gap: 0,
    canvasWidth: 100, canvasHeight: 100,
    cells: [{ rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, x: 0, y: 0, width: 100, height: 100 }],
    photoOrder: [0],
    colRatios: [1], rowRatios: [1],
  };
}

describe('handleExport', () => {
  it('rejects when an image fails to load', async () => {
    const photos = [{ url: 'blob:invalid-url', width: 100, height: 100 }];
    const layout = makeLayout();

    const origImage = globalThis.Image;
    globalThis.Image = class {
      set src(_) { setTimeout(() => this.onerror && this.onerror(new Error('fail')), 0); }
      get naturalWidth() { return 0; }
      get naturalHeight() { return 0; }
    };

    try {
      await expect(handleExport(photos, layout)).rejects.toThrow('Failed to load photo 1');
    } finally {
      globalThis.Image = origImage;
    }
  });

  it('resolves with a Blob when all images load', async () => {
    const photos = [{ url: 'blob:valid-url', width: 100, height: 100 }];
    const layout = makeLayout();

    const origImage = globalThis.Image;
    globalThis.Image = class {
      set src(_) { setTimeout(() => this.onload && this.onload(), 0); }
      get naturalWidth() { return 100; }
      get naturalHeight() { return 100; }
    };

    try {
      const blob = await handleExport(photos, layout);
      expect(blob).toBeInstanceOf(Blob);
    } finally {
      globalThis.Image = origImage;
    }
  });

  it('passes fitMode and backgroundColor to drawPhotoOnCanvas', async () => {
    const photos = [{ url: 'blob:valid-url', width: 100, height: 100 }];
    const layout = makeLayout();
    const spy = vi.spyOn(imageProcessor, 'drawPhotoOnCanvas');

    const origImage = globalThis.Image;
    globalThis.Image = class {
      set src(_) { setTimeout(() => this.onload && this.onload(), 0); }
      get naturalWidth() { return 100; }
      get naturalHeight() { return 100; }
    };

    try {
      await handleExport(photos, layout, {
        fitMode: 'contain',
        backgroundColor: '#ff0000',
      });
      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        { fitMode: 'contain', backgroundColor: '#ff0000' }
      );
    } finally {
      globalThis.Image = origImage;
      spy.mockRestore();
    }
  });
});
