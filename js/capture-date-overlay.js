import {
  CAPTURE_DATE_FONT_RATIO,
  CAPTURE_DATE_MARGIN_RATIO,
  CAPTURE_DATE_OPACITY_DEFAULT,
  CAPTURE_DATE_POSITION_DEFAULT,
} from './config.js';

/** Returns 0–1 luminance (dark ≈ 0, light ≈ 1) from hex color */
function luminanceFromColor(cssColor) {
  if (!cssColor) return 1;
  let r = 1, g = 1, b = 1;
  const hex = cssColor.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    const s = hex[1];
    if (s.length === 3) {
      r = parseInt(s[0] + s[0], 16) / 255;
      g = parseInt(s[1] + s[1], 16) / 255;
      b = parseInt(s[2] + s[2], 16) / 255;
    } else {
      r = parseInt(s.slice(0, 2), 16) / 255;
      g = parseInt(s.slice(2, 4), 16) / 255;
      b = parseInt(s.slice(4, 6), 16) / 255;
    }
  }
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function drawCorner(ctx, w, h, text, opts, align, x, y, baseline) {
  const scale = opts.fontScale ?? 1;
  const alpha = (opts.alpha ?? CAPTURE_DATE_OPACITY_DEFAULT) * 0.625;
  const fontSize = Math.round(w * CAPTURE_DATE_FONT_RATIO * scale);
  ctx.font = `${fontSize}px sans-serif`;
  ctx.globalAlpha = alpha;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
}

function drawInCell(ctx, w, h, text, opts) {
  const pos = opts.position ?? CAPTURE_DATE_POSITION_DEFAULT;
  const margin = Math.round(w * CAPTURE_DATE_MARGIN_RATIO);
  if (pos === 'bottom-left') {
    drawCorner(ctx, w, h, text, opts, 'left', margin, h - margin, 'bottom');
  } else if (pos === 'bottom-right') {
    drawCorner(ctx, w, h, text, opts, 'right', w - margin, h - margin, 'bottom');
  } else if (pos === 'top-left') {
    drawCorner(ctx, w, h, text, opts, 'left', margin, margin, 'top');
  } else if (pos === 'top-right') {
    drawCorner(ctx, w, h, text, opts, 'right', w - margin, margin, 'top');
  } else {
    drawCorner(ctx, w, h, text, opts, 'left', margin, h - margin, 'bottom');
  }
}

/**
 * Draws capture date text in a cell corner.
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {{x: number, y: number, width: number, height: number}} cell - Cell bounds
 * @param {string} text - Formatted date string
 * @param {{position?: string, opacity?: number, fontScale?: number, backgroundColor?: string}} options
 */
export function drawCaptureDateOverlay(ctx, cell, text, options = {}) {
  if (!text || typeof text !== 'string' || text.trim() === '') return;

  ctx.save();
  ctx.translate(cell.x, cell.y);

  const lum = luminanceFromColor(options.backgroundColor ?? '#ffffff');
  const isDark = lum < 0.5;
  const alpha = Math.min(0.9, Math.max(0.3, options.opacity ?? CAPTURE_DATE_OPACITY_DEFAULT));
  ctx.fillStyle = isDark ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)';

  drawInCell(ctx, cell.width, cell.height, text, {
    ...options,
    alpha,
  });

  ctx.restore();
}
