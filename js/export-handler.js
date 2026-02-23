import { createGridCanvas, drawPhotoOnCanvas, exportCanvasAsBlob } from './image-processor.js';
import { drawWatermark } from './watermark.js';
import { drawCaptureDateOverlay } from './capture-date-overlay.js';
import { drawVignetteOverlay } from './image-effects.js';
import {
  VIGNETTE_STRENGTH_DEFAULT,
  WATERMARK_OPACITY_DEFAULT,
  WATERMARK_POSITION_DEFAULT,
  WATERMARK_FONT_SCALE_DEFAULT,
  CAPTURE_DATE_OPACITY_DEFAULT,
  CAPTURE_DATE_POSITION_DEFAULT,
  CAPTURE_DATE_FONT_SCALE_DEFAULT,
} from './config.js';

function exportMainThread(photos, layout, options) {
  const { format = 'image/jpeg', fitMode = 'cover', filter = 'none' } = options;
  const { vignetteEnabled = false, vignetteStrength = VIGNETTE_STRENGTH_DEFAULT } = options;
  const { watermarkType = 'none', watermarkText = '', watermarkPos = WATERMARK_POSITION_DEFAULT,
    watermarkOpacity = WATERMARK_OPACITY_DEFAULT, watermarkFontScale = WATERMARK_FONT_SCALE_DEFAULT, locale = 'en' } = options;
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
    for (let i = 0; i < layout.cells.length; i++) {
      drawPhotoOnCanvas(ctx, imgElements[photoOrder[i]], layout.cells[i], {
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
    return exportCanvasAsBlob(canvas, format);
  });
}

function exportViaWorker(photos, layout, options) {
  return new Promise((resolve, reject) => {
    const blobUrls = photos.map((p) => p.url);
    const worker = new Worker(new URL('./export-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      worker.terminate();
      if (e.data.error) reject(new Error(e.data.error));
      else resolve(e.data.blob);
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error('Worker failed'));
    };
    worker.postMessage({ layout, options, blobUrls });
  });
}

const USE_WORKER = typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined';

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

export async function shareBlob(blob, filename) {
  if (!navigator.share) throw new Error('Share not supported');
  const ext = blob.type === 'image/png' ? 'png' : 'jpg';
  const base = (filename && String(filename).trim()) || 'goja-grid';
  const name = `${base}.${ext}`;
  const file = new File([blob], name, { type: blob.type });
  await navigator.share({ files: [file], title: 'Goja grid' });
}

export async function copyBlobToClipboard(blob) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('Copy not supported');
  }
  if (typeof ClipboardItem.supports === 'function' && !ClipboardItem.supports(blob.type)) {
    throw new Error('Copy not supported');
  }
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
}
