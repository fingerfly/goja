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

export function drawPhotoOnCanvas(ctx, img, cell) {
  const srcRatio = img.naturalWidth / img.naturalHeight;
  const cellRatio = cell.width / cell.height;
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

export function exportCanvasAsBlob(canvas, format = 'image/jpeg', quality = 0.92) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), format, quality);
  });
}
