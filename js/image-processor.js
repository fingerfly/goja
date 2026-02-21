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

export function drawPhotoOnCanvas(ctx, img, cell, options = {}) {
  const fitMode = options.fitMode ?? 'cover';
  const backgroundColor = options.backgroundColor ?? '#ffffff';
  const srcRatio = img.naturalWidth / img.naturalHeight;
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
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, drawX, drawY, drawW, drawH);
  } else {
    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    if (srcRatio > cellRatio) {
      sw = img.naturalHeight * cellRatio;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = img.naturalWidth / cellRatio;
      sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, cell.x, cell.y, cell.width, cell.height);
  }
}

export function exportCanvasAsBlob(canvas, format = 'image/jpeg', quality = 0.92) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), format, quality);
  });
}
