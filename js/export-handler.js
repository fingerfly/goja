import { createGridCanvas, drawPhotoOnCanvas, exportCanvasAsBlob } from './image-processor.js';
import { drawWatermark } from './watermark.js';

export async function handleExport(photos, layout, options = {}) {
  const { backgroundColor = '#ffffff', format = 'image/jpeg', fitMode = 'cover' } = options;
  // #region agent log
  const _log6={sessionId:'405c66',location:'export-handler.js',message:'handleExport fitMode',data:{fitMode,optionsFitMode:options.fitMode},hypothesisId:'H1'};console.log('[DEBUG]',JSON.stringify(_log6));fetch('http://127.0.0.1:7242/ingest/e2eb931b-7773-46be-87bc-e6f76e9c4970',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'405c66'},body:JSON.stringify({..._log6,timestamp:Date.now()})}).catch(()=>{});
  // #endregion
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
    // #region agent log
    if (i === 0) { const _log7={sessionId:'405c66',location:'export-handler.js:drawLoop',message:'draw first cell',data:{fitMode,cell0:layout.cells[0]},hypothesisId:'H1'};console.log('[DEBUG]',JSON.stringify(_log7));fetch('http://127.0.0.1:7242/ingest/e2eb931b-7773-46be-87bc-e6f76e9c4970',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'405c66'},body:JSON.stringify({..._log7,timestamp:Date.now()})}).catch(()=>{}); }
    // #endregion
    drawPhotoOnCanvas(ctx, imgElements[photoOrder[i]], layout.cells[i], {
      fitMode,
      backgroundColor: options.backgroundColor ?? '#ffffff',
    });
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
