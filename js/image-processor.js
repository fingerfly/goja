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

export function createOffscreenGridCanvas(layout, options = {}) {
  const { backgroundColor = '#ffffff' } = options;
  const { canvasWidth, canvasHeight } = layout;
  const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  return canvas;
}

export function drawPhotoOnCanvas(ctx, img, cell, options = {}) {
  const fitMode = options.fitMode ?? 'cover';
  const backgroundColor = options.backgroundColor ?? '#ffffff';
  const w = img.naturalWidth ?? img.width;
  const h = img.naturalHeight ?? img.height;
  const srcRatio = w / h;
  const cellRatio = cell.width / cell.height;

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
}

import { JPEG_QUALITY } from './config.js';

export function exportCanvasAsBlob(canvas, format = 'image/jpeg', quality = JPEG_QUALITY) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), format, quality);
  });
}

export function exportOffscreenCanvasAsBlob(canvas, format = 'image/jpeg', quality = JPEG_QUALITY) {
  return canvas.convertToBlob({ type: format, quality });
}
