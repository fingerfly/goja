/**
 * Web Worker for export. Uses OffscreenCanvas; fallback to main thread if unsupported.
 */
import { createOffscreenGridCanvas, exportOffscreenCanvasAsBlob } from './image-processor.js';
import { drawCellContent } from './cell-draw.js';
import { renderUnifiedCanvas } from './unified-canvas-pipeline.js';
import {
  JPEG_QUALITY,
  VIGNETTE_STRENGTH_DEFAULT,
  WATERMARK_OPACITY_DEFAULT,
  WATERMARK_POSITION_DEFAULT,
  WATERMARK_FONT_SCALE_DEFAULT,
  WATERMARK_TILE_SPACING_DEFAULT,
  WATERMARK_TILE_ROTATION_DEFAULT,
  CAPTURE_DATE_OPACITY_DEFAULT,
  CAPTURE_DATE_POSITION_DEFAULT,
  CAPTURE_DATE_FONT_SCALE_DEFAULT,
  GLOBAL_FRAME_SHAPE_DEFAULT,
  GLOBAL_FRAME_STROKE_ENABLED_DEFAULT,
  GLOBAL_FRAME_STROKE_WIDTH_DEFAULT,
  GLOBAL_FRAME_STROKE_COLOR_DEFAULT,
  GLOBAL_FRAME_STROKE_OPACITY_DEFAULT,
  OUTSIDE_BACKGROUND_COLOR_DEFAULT,
  CELL_SHAPE_TEMPLATE_DEFAULT,
  CELL_SHAPE_ORIENTATION_DEFAULT,
} from './config.js';

self.onmessage = async (e) => {
  const { layout, options, blobUrls, angles = [] } = e.data;
  try {
    const photoOrder = layout.photoOrder || blobUrls.map((_, i) => i);
    const blobs = await Promise.all(blobUrls.map(async (url, i) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load photo ${i + 1}`);
      }
      return response.blob();
    }));
    const bitmaps = await Promise.all(blobs.map((b) => createImageBitmap(b)));

    const { backgroundColor = '#ffffff', format = 'image/jpeg', fitMode = 'cover',
      filter = 'none', vignetteEnabled = false, vignetteStrength = VIGNETTE_STRENGTH_DEFAULT,
      watermarkType = 'none', watermarkText = '', watermarkPos = WATERMARK_POSITION_DEFAULT,
      watermarkOpacity = WATERMARK_OPACITY_DEFAULT, watermarkFontScale = WATERMARK_FONT_SCALE_DEFAULT,
      watermarkColor, watermarkTileSpacing = WATERMARK_TILE_SPACING_DEFAULT,
      watermarkTileRotation = WATERMARK_TILE_ROTATION_DEFAULT, locale = 'en',
      showCaptureDate = false, captureDatePos = CAPTURE_DATE_POSITION_DEFAULT, captureDateOpacity = CAPTURE_DATE_OPACITY_DEFAULT,
      captureDateFontScale = CAPTURE_DATE_FONT_SCALE_DEFAULT, dateOriginals = [] } = options;
    const bg = options.backgroundColor ?? '#ffffff';

    const canvas = createOffscreenGridCanvas(layout, { backgroundColor: bg });
    const ctx = canvas.getContext('2d');

    renderUnifiedCanvas(ctx, bitmaps, layout, {
      fitMode,
      backgroundColor: bg,
      filter,
      vignetteEnabled,
      vignetteStrength,
      showCaptureDate,
      captureDatePos,
      captureDateOpacity,
      captureDateFontScale,
      edgeStyle: options.edgeStyle ?? 'straight',
      edgeIntensity: options.edgeIntensity ?? 0.5,
      edgeFrequency: options.edgeFrequency ?? 4,
      edgeSeed: options.edgeSeed ?? 0,
      edgeAdvancedSupported: options.edgeAdvancedSupported ?? false,
      cellShapeTemplate: options.cellShapeTemplate ?? CELL_SHAPE_TEMPLATE_DEFAULT,
      cellShapeOrientation: options.cellShapeOrientation ?? CELL_SHAPE_ORIENTATION_DEFAULT,
      superellipseExponent: options.superellipseExponent ?? 4,
      globalFrameShape: options.globalFrameShape ?? GLOBAL_FRAME_SHAPE_DEFAULT,
      globalFrameStrokeEnabled: options.globalFrameStrokeEnabled ?? GLOBAL_FRAME_STROKE_ENABLED_DEFAULT,
      globalFrameStrokeWidth: options.globalFrameStrokeWidth ?? GLOBAL_FRAME_STROKE_WIDTH_DEFAULT,
      globalFrameStrokeColor: options.globalFrameStrokeColor ?? GLOBAL_FRAME_STROKE_COLOR_DEFAULT,
      globalFrameStrokeOpacity: options.globalFrameStrokeOpacity ?? GLOBAL_FRAME_STROKE_OPACITY_DEFAULT,
      outsideBackgroundColor: options.outsideBackgroundColor ?? OUTSIDE_BACKGROUND_COLOR_DEFAULT,
      watermarkType,
      watermarkText,
      watermarkPos,
      watermarkOpacity,
      watermarkFontScale,
      watermarkColor,
      watermarkTileSpacing,
      watermarkTileRotation,
      locale,
      dateOriginals,
    }, (drawCtx, image, cell, drawOptions) => {
      drawCellContent(drawCtx, image, cell, {
        ...drawOptions,
        angle: angles[photoOrder[drawOptions.cellIndex]] || 0,
        captureDateStr: dateOriginals[photoOrder[drawOptions.cellIndex]],
      });
    });

    const quality = format === 'image/jpeg' ? JPEG_QUALITY : undefined;
    const blob = await exportOffscreenCanvasAsBlob(canvas, format, quality);

    bitmaps.forEach((b) => b.close());
    self.postMessage({ blob }, [blob]);
  } catch (err) {
    self.postMessage({ error: err.message });
  }
};
