import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as imageProcessor from '../../js/image-processor.js';
import * as captureDateOverlay from '../../js/capture-date-overlay.js';
import * as imageEffects from '../../js/image-effects.js';
import { drawCellContent } from '../../js/cell-draw.js';

describe('drawCellContent', () => {
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
  };
  const img = { naturalWidth: 100, naturalHeight: 100 };
  const cell = { x: 0, y: 0, width: 100, height: 100 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('draws photo with default options', () => {
    const spy = vi.spyOn(imageProcessor, 'drawPhotoOnCanvas').mockImplementation(() => {});
    drawCellContent(ctx, img, cell);
    expect(spy).toHaveBeenCalledWith(ctx, img, cell, {
      fitMode: 'cover',
      backgroundColor: '#ffffff',
      filter: 'none',
    });
  });

  it('draws vignette when enabled', () => {
    vi.spyOn(imageProcessor, 'drawPhotoOnCanvas').mockImplementation(() => {});
    const spy = vi.spyOn(imageEffects, 'drawVignetteOverlay').mockImplementation(() => {});
    drawCellContent(ctx, img, cell, { vignetteEnabled: true, vignetteStrength: 0.6 });
    expect(spy).toHaveBeenCalledWith(ctx, cell, { strength: 0.6 });
  });

  it('does not draw vignette when disabled', () => {
    vi.spyOn(imageProcessor, 'drawPhotoOnCanvas').mockImplementation(() => {});
    const spy = vi.spyOn(imageEffects, 'drawVignetteOverlay').mockImplementation(() => {});
    drawCellContent(ctx, img, cell, { vignetteEnabled: false });
    expect(spy).not.toHaveBeenCalled();
  });

  it('draws capture date when enabled and provided', () => {
    vi.spyOn(imageProcessor, 'drawPhotoOnCanvas').mockImplementation(() => {});
    const spy = vi.spyOn(captureDateOverlay, 'drawCaptureDateOverlay').mockImplementation(() => {});
    drawCellContent(ctx, img, cell, {
      showCaptureDate: true,
      captureDateStr: 'Feb 22, 2025',
      captureDatePos: 'top-left',
      captureDateOpacity: 0.8,
      captureDateFontScale: 1.2,
      backgroundColor: '#000000',
    });
    expect(spy).toHaveBeenCalledWith(ctx, cell, 'Feb 22, 2025', {
      position: 'top-left',
      opacity: 0.8,
      fontScale: 1.2,
      backgroundColor: '#000000',
    });
  });

  it('does not draw capture date without value', () => {
    vi.spyOn(imageProcessor, 'drawPhotoOnCanvas').mockImplementation(() => {});
    const spy = vi.spyOn(captureDateOverlay, 'drawCaptureDateOverlay').mockImplementation(() => {});
    drawCellContent(ctx, img, cell, { showCaptureDate: true, captureDateStr: '' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('applies transform and restores context when angle is provided', () => {
    vi.spyOn(imageProcessor, 'drawPhotoOnCanvas').mockImplementation(() => {});
    drawCellContent(ctx, img, cell, { angle: 45 });
    expect(ctx.save).toHaveBeenCalledTimes(1);
    expect(ctx.rotate).toHaveBeenCalledTimes(1);
    expect(ctx.scale).toHaveBeenCalledTimes(1);
    expect(ctx.restore).toHaveBeenCalledTimes(1);
  });
});
