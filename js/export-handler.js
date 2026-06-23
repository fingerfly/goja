/**
 * Purpose: Export rendered grids via worker or main-thread fallback.
 * Description:
 * - Builds export options and delegates drawing to unified pipeline.
 * - Prefers worker rendering when supported for UI responsiveness.
 * - Clones worker payloads as plain JSON before postMessage.
 * - Exposes download/share/clipboard helpers for UI actions.
 */
import { createGridCanvas, exportCanvasAsBlob } from './image-processor.js';
import { drawCellContent } from './cell-draw.js';
import { renderUnifiedCanvas } from './unified-canvas-pipeline.js';
import {
  VIGNETTE_STRENGTH_DEFAULT,
  WATERMARK_OPACITY_DEFAULT,
  WATERMARK_POSITION_DEFAULT,
  WATERMARK_FONT_SCALE_DEFAULT,
  WATERMARK_TILE_SPACING_DEFAULT,
  WATERMARK_TILE_COL_SPACING_DEFAULT,
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
  EXPORT_WORKER_TIMEOUT_MS,
} from './config.js';

/**
 * Render and export on the main thread.
 * @param {{ url: string, angle?: number }[]} photos
 * @param {{
 *   photoOrder?: number[],
 *   canvasWidth: number,
 *   canvasHeight: number,
 *   cells: object[]
 * }} layout
 * @param {Record<string, unknown>} options
 * @returns {Promise<Blob>}
 */
function exportMainThread(photos, layout, options) {
  const { format = 'image/jpeg', fitMode = 'cover', filter = 'none' } = options;
  const { vignetteEnabled = false, vignetteStrength = VIGNETTE_STRENGTH_DEFAULT } = options;
  const { watermarkType = 'none', watermarkText = '', watermarkPos = WATERMARK_POSITION_DEFAULT,
    watermarkOpacity = WATERMARK_OPACITY_DEFAULT, watermarkFontScale = WATERMARK_FONT_SCALE_DEFAULT,
    watermarkColor, watermarkTileSpacing = WATERMARK_TILE_SPACING_DEFAULT,
    watermarkTileColSpacing = WATERMARK_TILE_COL_SPACING_DEFAULT,
    watermarkTileRotation = WATERMARK_TILE_ROTATION_DEFAULT, locale = 'en' } = options;
  const { showCaptureDate = false, captureDatePos = CAPTURE_DATE_POSITION_DEFAULT,
    captureDateOpacity = CAPTURE_DATE_OPACITY_DEFAULT, captureDateFontScale = CAPTURE_DATE_FONT_SCALE_DEFAULT, dateOriginals = [] } = options;
  const photoOrder = layout.photoOrder || photos.map((_, i) => i);
  const bg = options.backgroundColor ?? '#ffffff';

  const canvas = createGridCanvas(layout, { backgroundColor: bg });
  const ctx = canvas.getContext('2d');

  return Promise.all(photos.map((p, i) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load photo ${i + 1}`));
      img.src = p.url;
    });
  })).then((imgElements) => {
    renderUnifiedCanvas(ctx, imgElements, layout, {
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
      watermarkTileColSpacing,
      watermarkTileRotation,
      locale,
      dateOriginals,
    }, (drawCtx, image, cell, drawOptions) => {
      drawCellContent(drawCtx, image, cell, {
        ...drawOptions,
        angle: photos[photoOrder[drawOptions.cellIndex]]?.angle || 0,
        captureDateStr: dateOriginals[photoOrder[drawOptions.cellIndex]],
      });
    });
    return exportCanvasAsBlob(canvas, format);
  });
}

/**
 * Render and export in a dedicated worker.
 * @param {{ url: string, angle?: number }[]} photos
 * @param {object} layout
 * @param {Record<string, unknown>} options
 * @returns {Promise<Blob>}
 */
function exportViaWorker(photos, layout, options) {
  return new Promise((resolve, reject) => {
    const blobUrls = photos.map((p) => p.url);
    const angles = photos.map((p) => p.angle || 0);
    let worker;
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker?.terminate();
      fn(value);
    };
    const timer = setTimeout(
      () => finish(reject, new Error('Export timed out')),
      EXPORT_WORKER_TIMEOUT_MS
    );
    worker = new Worker(new URL('./export-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      if (e.data?.error) {
        finish(reject, new Error(e.data.error));
      } else if (!(e.data?.blob instanceof Blob)) {
        finish(reject, new Error('Export produced no image data'));
      } else {
        finish(resolve, e.data.blob);
      }
    };
    worker.onerror = () => finish(reject, new Error('Worker failed'));
    worker.onmessageerror = () => finish(reject, new Error('Worker message failed'));
    try {
      worker.postMessage({
        layout: cloneForWorker(layout),
        options: cloneForWorker(options),
        blobUrls,
        angles,
      });
    } catch (err) {
      finish(reject, err instanceof Error ? err : new Error(String(err)));
    }
  });
}

const USE_WORKER = typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined';

/**
 * Clone export payload for worker postMessage (plain data only).
 * @param {unknown} value
 * @returns {unknown}
 */
function cloneForWorker(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    throw new Error('Export payload is not serializable');
  }
}

/**
 * Export a composed collage image.
 * @param {{ url: string, angle?: number }[]} photos
 * @param {object} layout
 * @param {Record<string, unknown>} [options]
 * @returns {Promise<Blob>}
 */
export async function handleExport(photos, layout, options = {}) {
  if (USE_WORKER) {
    try {
      return await exportViaWorker(photos, layout, options);
    } catch {
      return exportMainThread(photos, layout, options);
    }
  }
  return exportMainThread(photos, layout, options);
}

/**
 * Trigger browser download for the exported image blob.
 * @param {Blob} blob
 * @param {string} format
 * @param {string} filename
 */
export function downloadBlob(blob, format, filename) {
  const ext = format === 'image/png' ? 'png' : 'jpg';
  const base = (filename && String(filename).trim()) || 'goja-grid';
  const name = `${base}.${ext}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Share the exported image through Web Share API.
 * @param {Blob} blob
 * @param {string} filename
 * @returns {Promise<void>}
 * @throws {Error} When sharing is unsupported.
 */
export async function shareBlob(blob, filename) {
  if (!navigator.share) throw new Error('Share not supported');
  const ext = blob.type === 'image/png' ? 'png' : 'jpg';
  const base = (filename && String(filename).trim()) || 'goja-grid';
  const name = `${base}.${ext}`;
  const file = new File([blob], name, { type: blob.type });
  await navigator.share({ files: [file], title: 'Goja grid' });
}

/**
 * Copy an exported image blob to clipboard.
 * @param {Blob} blob
 * @returns {Promise<void>}
 * @throws {Error} When clipboard image copy is unsupported.
 */
export async function copyBlobToClipboard(blob) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('Copy not supported');
  }
  if (typeof ClipboardItem.supports === 'function' && !ClipboardItem.supports(blob.type)) {
    throw new Error('Copy not supported');
  }
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
}
