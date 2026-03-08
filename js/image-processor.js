/**
 * Purpose: Create canvases and draw source images into grid cells.
 * Description:
 * - Builds regular/offscreen canvases with background fill.
 * - Draws photos in cover/contain modes with optional filter support.
 * - Exports canvas content as blobs for download/share workflows.
 */
import { isFilterSupported } from './image-effects.js';
import { JPEG_QUALITY } from './config.js';

/**
 * @typedef {CanvasImageSource & {
 *   naturalWidth?: number,
 *   naturalHeight?: number
 * }} CanvasImageWithNaturalSize
 */

/**
 * Create a standard canvas initialized with background color.
 * @param {{ canvasWidth: number, canvasHeight: number }} layout
 * @param {{ backgroundColor?: string }} [options]
 * @returns {HTMLCanvasElement}
 */
export function createGridCanvas(layout, options = {}) {
  const { backgroundColor = '#ffffff' } = options;
  const { canvasWidth, canvasHeight } = layout;
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  return canvas;
}

/**
 * Create an offscreen canvas initialized with background color.
 * @param {{ canvasWidth: number, canvasHeight: number }} layout
 * @param {{ backgroundColor?: string }} [options]
 * @returns {OffscreenCanvas}
 */
export function createOffscreenGridCanvas(layout, options = {}) {
  const { backgroundColor = '#ffffff' } = options;
  const { canvasWidth, canvasHeight } = layout;
  const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  return canvas;
}

/**
 * Draw one image into a target grid cell.
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageWithNaturalSize} img
 * @param {{ x: number, y: number, width: number, height: number }} cell
 * @param {{ fitMode?: string, backgroundColor?: string, filter?: string }}
 *   [options]
 */
export function drawPhotoOnCanvas(ctx, img, cell, options = {}) {
  const fitMode = options.fitMode ?? 'cover';
  const backgroundColor = options.backgroundColor ?? '#ffffff';
  const filter = options.filter ?? 'none';
  const w = img.naturalWidth ?? img.width;
  const h = img.naturalHeight ?? img.height;
  const srcRatio = w / h;
  const cellRatio = cell.width / cell.height;

  const useFilter = isFilterSupported(ctx) && filter && filter !== 'none';
  if (useFilter) ctx.filter = filter;

  if (fitMode === 'contain') {
    let drawW, drawH, drawX, drawY;
    if (srcRatio > cellRatio) {
      drawW = cell.width;
      drawH = cell.width / srcRatio;
      drawX = cell.x;
      drawY = cell.y + (cell.height - drawH) / 2;
    } else {
      drawH = cell.height;
      drawW = cell.height * srcRatio;
      drawX = cell.x + (cell.width - drawW) / 2;
      drawY = cell.y;
    }
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
    ctx.drawImage(img, 0, 0, w, h, drawX, drawY, drawW, drawH);
  } else {
    let sx = 0, sy = 0, sw = w, sh = h;
    if (srcRatio > cellRatio) {
      sw = h * cellRatio;
      sx = (w - sw) / 2;
    } else {
      sh = w / cellRatio;
      sy = (h - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, cell.x, cell.y, cell.width, cell.height);
  }

  if (useFilter) ctx.filter = 'none';
}

/**
 * Export regular canvas content as an image blob.
 * @param {HTMLCanvasElement} canvas
 * @param {string} [format]
 * @param {number} [quality]
 * @returns {Promise<Blob | null>}
 */
export function exportCanvasAsBlob(canvas, format = 'image/jpeg', quality = JPEG_QUALITY) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), format, quality);
  });
}

/**
 * Export offscreen canvas content as an image blob.
 * @param {OffscreenCanvas} canvas
 * @param {string} [format]
 * @param {number} [quality]
 * @returns {Promise<Blob>}
 */
export function exportOffscreenCanvasAsBlob(canvas, format = 'image/jpeg', quality = JPEG_QUALITY) {
  return canvas.convertToBlob({ type: format, quality });
}
