import { drawPhotoOnCanvas } from './image-processor.js';
import { drawCaptureDateOverlay } from './capture-date-overlay.js';
import { drawVignetteOverlay } from './image-effects.js';
import { fitScaleFactor } from './rotation-math.js';
import { applyExportEdgeClip } from './edge-export-clip.js';

export function drawCellContent(ctx, img, cell, options = {}) {
  const {
    fitMode = 'cover',
    backgroundColor = '#ffffff',
    filter = 'none',
    vignetteEnabled = false,
    vignetteStrength,
    showCaptureDate = false,
    captureDateStr = '',
    captureDatePos,
    captureDateOpacity,
    captureDateFontScale,
    angle = 0,
    edgeStyle = 'straight',
    edgeIntensity = 0.5,
    edgeFrequency = 4,
    edgeSeed = 0,
    edgeAdvancedSupported = false,
    cellIndex = 0,
  } = options;

  if (angle !== 0) {
    const cx = cell.x + cell.width / 2;
    const cy = cell.y + cell.height / 2;
    const scale = fitScaleFactor(angle, cell.width, cell.height);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
  }

  if (edgeAdvancedSupported && edgeStyle !== 'straight') {
    ctx.save();
    applyExportEdgeClip(ctx, cell, cellIndex, {
      edgeStyle,
      edgeIntensity,
      edgeFrequency,
      edgeSeed,
      edgeAdvancedSupported,
    });
  }

  drawPhotoOnCanvas(ctx, img, cell, { fitMode, backgroundColor, filter });

  if (vignetteEnabled) {
    drawVignetteOverlay(ctx, cell, { strength: vignetteStrength });
  }

  if (showCaptureDate && captureDateStr) {
    drawCaptureDateOverlay(ctx, cell, captureDateStr, {
      position: captureDatePos,
      opacity: captureDateOpacity,
      fontScale: captureDateFontScale,
      backgroundColor,
    });
  }

  if (edgeAdvancedSupported && edgeStyle !== 'straight') {
    ctx.restore();
  }

  if (angle !== 0) {
    ctx.restore();
  }
}
