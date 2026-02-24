/**
 * Web Worker for export. Uses OffscreenCanvas; fallback to main thread if unsupported.
 */
import { createOffscreenGridCanvas, exportOffscreenCanvasAsBlob } from './image-processor.js';
import { drawWatermark } from './watermark.js';
import { drawCellContent } from './cell-draw.js';
import {
  JPEG_QUALITY,
  VIGNETTE_STRENGTH_DEFAULT,
  WATERMARK_OPACITY_DEFAULT,
  WATERMARK_POSITION_DEFAULT,
  WATERMARK_FONT_SCALE_DEFAULT,
  CAPTURE_DATE_OPACITY_DEFAULT,
  CAPTURE_DATE_POSITION_DEFAULT,
  CAPTURE_DATE_FONT_SCALE_DEFAULT,
} from './config.js';

self.onmessage = async (e) => {
  const { layout, options, blobUrls, angles = [] } = e.data;
  try {
    const photoOrder = layout.photoOrder || blobUrls.map((_, i) => i);
    const blobs = await Promise.all(blobUrls.map((url) => fetch(url).then((r) => r.blob())));
    const bitmaps = await Promise.all(blobs.map((b) => createImageBitmap(b)));

    const { backgroundColor = '#ffffff', format = 'image/jpeg', fitMode = 'cover',
      filter = 'none', vignetteEnabled = false, vignetteStrength = VIGNETTE_STRENGTH_DEFAULT,
      watermarkType = 'none', watermarkText = '', watermarkPos = WATERMARK_POSITION_DEFAULT,
      watermarkOpacity = WATERMARK_OPACITY_DEFAULT, watermarkFontScale = WATERMARK_FONT_SCALE_DEFAULT, locale = 'en',
      showCaptureDate = false, captureDatePos = CAPTURE_DATE_POSITION_DEFAULT, captureDateOpacity = CAPTURE_DATE_OPACITY_DEFAULT,
      captureDateFontScale = CAPTURE_DATE_FONT_SCALE_DEFAULT, dateOriginals = [] } = options;
    const bg = options.backgroundColor ?? '#ffffff';

    const canvas = createOffscreenGridCanvas(layout, { backgroundColor: bg });
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < layout.cells.length; i++) {
      drawCellContent(ctx, bitmaps[photoOrder[i]], layout.cells[i], {
        fitMode,
        backgroundColor: bg,
        filter,
        vignetteEnabled,
        vignetteStrength,
        showCaptureDate,
        captureDateStr: dateOriginals[photoOrder[i]],
        captureDatePos,
        captureDateOpacity,
        captureDateFontScale,
        angle: angles[photoOrder[i]] || 0,
      });
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
