import { createGridCanvas, drawPhotoOnCanvas, exportCanvasAsBlob } from './image-processor.js';
import { drawWatermark } from './watermark.js';

export async function handleExport(photos, layout, options = {}) {
  const { backgroundColor = '#ffffff', format = 'image/jpeg' } = options;
  const { watermarkType = 'none', watermarkText = '', watermarkPos = 'bottom-right' } = options;
  const photoOrder = layout.photoOrder || photos.map((_, i) => i);

  const canvas = createGridCanvas(layout, { backgroundColor });
  const ctx = canvas.getContext('2d');

  const imgElements = await Promise.all(photos.map((p, i) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load photo ${i + 1}`));
      img.src = p.url;
    });
  }));

  for (let i = 0; i < layout.cells.length; i++) {
    drawPhotoOnCanvas(ctx, imgElements[photoOrder[i]], layout.cells[i]);
  }

  drawWatermark(ctx, canvas.width, canvas.height, { type: watermarkType, text: watermarkText, position: watermarkPos });

  const blob = await exportCanvasAsBlob(canvas, format);
  return blob;
}

export function downloadBlob(blob, format) {
  const ext = format === 'image/png' ? 'png' : 'jpg';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `goja-grid.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}
