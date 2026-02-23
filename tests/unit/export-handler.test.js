import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as imageProcessor from '../../js/image-processor.js';
import * as captureDateOverlay from '../../js/capture-date-overlay.js';
import * as imageEffects from '../../js/image-effects.js';
import { handleExport, downloadBlob, shareBlob, copyBlobToClipboard } from '../../js/export-handler.js';

const mockGradient = { addColorStop: vi.fn() };
const mockCtx = {
  fillStyle: '',
  filter: 'none',
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  createRadialGradient: vi.fn(() => mockGradient),
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

  it('uses default fitMode cover when options omit it', async () => {
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
      await handleExport(photos, layout, {});
      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        { fitMode: 'cover', backgroundColor: '#ffffff', filter: 'none' }
      );
    } finally {
      globalThis.Image = origImage;
      spy.mockRestore();
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
        { fitMode: 'contain', backgroundColor: '#ff0000', filter: 'none' }
      );
    } finally {
      globalThis.Image = origImage;
      spy.mockRestore();
    }
  });

  it('calls drawCaptureDateOverlay when showCaptureDate and dateOriginals provided', async () => {
    const photos = [{ url: 'blob:valid-url', width: 100, height: 100 }];
    const layout = makeLayout();
    const spy = vi.spyOn(captureDateOverlay, 'drawCaptureDateOverlay');

    const origImage = globalThis.Image;
    globalThis.Image = class {
      set src(_) { setTimeout(() => this.onload && this.onload(), 0); }
      get naturalWidth() { return 100; }
      get naturalHeight() { return 100; }
    };

    try {
      await handleExport(photos, layout, {
        showCaptureDate: true,
        dateOriginals: ['Feb 22, 2025'],
        captureDatePos: 'bottom-right',
        captureDateOpacity: 0.8,
        captureDateFontScale: 1.2,
      });
      expect(spy).toHaveBeenCalledWith(
        mockCtx,
        expect.objectContaining({ x: 0, y: 0, width: 100, height: 100 }),
        'Feb 22, 2025',
        expect.objectContaining({
          position: 'bottom-right',
          opacity: 0.8,
          fontScale: 1.2,
        })
      );
    } finally {
      globalThis.Image = origImage;
      spy.mockRestore();
    }
  });

  it('does not call drawCaptureDateOverlay when showCaptureDate is false', async () => {
    const photos = [{ url: 'blob:valid-url', width: 100, height: 100 }];
    const layout = makeLayout();
    const spy = vi.spyOn(captureDateOverlay, 'drawCaptureDateOverlay');

    const origImage = globalThis.Image;
    globalThis.Image = class {
      set src(_) { setTimeout(() => this.onload && this.onload(), 0); }
      get naturalWidth() { return 100; }
      get naturalHeight() { return 100; }
    };

    try {
      await handleExport(photos, layout, { dateOriginals: ['Feb 22, 2025'] });
      expect(spy).not.toHaveBeenCalled();
    } finally {
      globalThis.Image = origImage;
      spy.mockRestore();
    }
  });

  it('calls drawVignetteOverlay when vignetteEnabled is true', async () => {
    const photos = [{ url: 'blob:valid-url', width: 100, height: 100 }];
    const layout = makeLayout();
    const spy = vi.spyOn(imageEffects, 'drawVignetteOverlay');

    const origImage = globalThis.Image;
    globalThis.Image = class {
      set src(_) { setTimeout(() => this.onload && this.onload(), 0); }
      get naturalWidth() { return 100; }
      get naturalHeight() { return 100; }
    };

    try {
      await handleExport(photos, layout, {
        vignetteEnabled: true,
        vignetteStrength: 0.6,
      });
      expect(spy).toHaveBeenCalledWith(
        mockCtx,
        expect.objectContaining({ x: 0, y: 0, width: 100, height: 100 }),
        { strength: 0.6 }
      );
    } finally {
      globalThis.Image = origImage;
      spy.mockRestore();
    }
  });

  it('does not call drawVignetteOverlay when vignetteEnabled is false', async () => {
    const photos = [{ url: 'blob:valid-url', width: 100, height: 100 }];
    const layout = makeLayout();
    const spy = vi.spyOn(imageEffects, 'drawVignetteOverlay');

    const origImage = globalThis.Image;
    globalThis.Image = class {
      set src(_) { setTimeout(() => this.onload && this.onload(), 0); }
      get naturalWidth() { return 100; }
      get naturalHeight() { return 100; }
    };

    try {
      await handleExport(photos, layout, {});
      expect(spy).not.toHaveBeenCalled();
    } finally {
      globalThis.Image = origImage;
      spy.mockRestore();
    }
  });

  it('does not call drawCaptureDateOverlay when dateOriginals cell is null', async () => {
    const photos = [{ url: 'blob:valid-url', width: 100, height: 100 }];
    const layout = makeLayout();
    const spy = vi.spyOn(captureDateOverlay, 'drawCaptureDateOverlay');

    const origImage = globalThis.Image;
    globalThis.Image = class {
      set src(_) { setTimeout(() => this.onload && this.onload(), 0); }
      get naturalWidth() { return 100; }
      get naturalHeight() { return 100; }
    };

    try {
      await handleExport(photos, layout, {
        showCaptureDate: true,
        dateOriginals: [null],
      });
      expect(spy).not.toHaveBeenCalled();
    } finally {
      globalThis.Image = origImage;
      spy.mockRestore();
    }
  });
});

describe('shareBlob', () => {
  it('rejects when navigator.share is undefined', async () => {
    const origShare = navigator.share;
    delete navigator.share;
    const blob = new Blob(['x'], { type: 'image/png' });
    await expect(shareBlob(blob, 'test')).rejects.toThrow('Share not supported');
    navigator.share = origShare;
  });

  it('calls navigator.share with file and title', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    navigator.share = shareMock;
    const blob = new Blob(['x'], { type: 'image/png' });
    await shareBlob(blob, 'my-grid');
    expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        files: expect.any(Array),
        title: 'Goja grid',
      })
    );
    expect(shareMock.mock.calls[0][0].files[0]).toBeInstanceOf(File);
    expect(shareMock.mock.calls[0][0].files[0].name).toBe('my-grid.png');
  });
});

describe('copyBlobToClipboard', () => {
  it('rejects when navigator.clipboard is undefined', async () => {
    const origClipboard = navigator.clipboard;
    delete navigator.clipboard;
    const blob = new Blob(['x'], { type: 'image/png' });
    await expect(copyBlobToClipboard(blob)).rejects.toThrow('Copy not supported');
    navigator.clipboard = origClipboard;
  });

  it('rejects when clipboard.write is undefined', async () => {
    const origClipboard = navigator.clipboard;
    navigator.clipboard = {};
    const blob = new Blob(['x'], { type: 'image/png' });
    await expect(copyBlobToClipboard(blob)).rejects.toThrow('Copy not supported');
    navigator.clipboard = origClipboard;
  });

  it('calls navigator.clipboard.write when supported', async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined);
    navigator.clipboard = { write: writeMock };
    const origClipboardItem = globalThis.ClipboardItem;
    globalThis.ClipboardItem = class {
      constructor(items) {
        this.items = items;
      }
      static supports = vi.fn(() => true);
    };
    const blob = new Blob(['x'], { type: 'image/png' });
    await copyBlobToClipboard(blob);
    expect(writeMock).toHaveBeenCalledWith(expect.any(Array));
    globalThis.ClipboardItem = origClipboardItem;
  });
});
