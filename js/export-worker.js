/**
 * Web Worker for export. Uses OffscreenCanvas; fallback to main thread if unsupported.
 */
import { createOffscreenGridCanvas, drawPhotoOnCanvas, exportOffscreenCanvasAsBlob } from './image-processor.js';
import { drawWatermark } from './watermark.js';
import { drawCaptureDateOverlay } from './capture-date-overlay.js';
import { drawVignetteOverlay } from './image-effects.js';
import { JPEG_QUALITY, VIGNETTE_STRENGTH_DEFAULT } from './config.js';

self.onmessage = async (e) => {
  const { layout, options, blobUrls } = e.data;
  try {
    const photoOrder = layout.photoOrder || blobUrls.map((_, i) => i);
    const blobs = await Promise.all(blobUrls.map((url) => fetch(url).then((r) => r.blob())));
    const bitmaps = await Promise.all(blobs.map((b) => createImageBitmap(b)));

    const { backgroundColor = '#ffffff', format = 'image/jpeg', fitMode = 'cover',
      filter = 'none', vignetteEnabled = false, vignetteStrength = VIGNETTE_STRENGTH_DEFAULT,
      watermarkType = 'none', watermarkText = '', watermarkPos = 'bottom-right',
      watermarkOpacity = 0.8, watermarkFontScale = 1, locale = 'en',
      showCaptureDate = false, captureDatePos = 'bottom-left', captureDateOpacity = 0.7,
      captureDateFontScale = 1, dateOriginals = [] } = options;
    const bg = options.backgroundColor ?? '#ffffff';

    const canvas = createOffscreenGridCanvas(layout, { backgroundColor: bg });
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < layout.cells.length; i++) {
      drawPhotoOnCanvas(ctx, bitmaps[photoOrder[i]], layout.cells[i], {
        fitMode,
        backgroundColor: bg,
        filter,
      });
      if (vignetteEnabled) {
        drawVignetteOverlay(ctx, layout.cells[i], { strength: vignetteStrength });
      }
      if (showCaptureDate) {
        const dateStr = dateOriginals[photoOrder[i]];
        if (dateStr) {
          drawCaptureDateOverlay(ctx, layout.cells[i], dateStr, {
            position: captureDatePos,
            opacity: captureDateOpacity,
            fontScale: captureDateFontScale,
            backgroundColor: bg,
          });
        }
      }
    }

    drawWatermark(ctx, canvas.width, canvas.height, {
      type: watermarkType, text: watermarkText, position: watermarkPos,
      opacity: watermarkOpacity, fontScale: watermarkFontScale,
      backgroundColor: bg, locale,
    });

    const quality = format === 'image/jpeg' ? JPEG_QUALITY : undefined;
    const blob = await exportOffscreenCanvasAsBlob(canvas, format, quality);

    bitmaps.forEach((b) => b.close());
    self.postMessage({ blob }, [blob]);
  } catch (err) {
    self.postMessage({ error: err.message });
  }
};
