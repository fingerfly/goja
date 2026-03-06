import { drawWatermark } from './watermark.js';
import { buildFrameShapePathD } from './shape-clip-utils.js';
import { normalizeFrameShape } from './frame-shape-geometry.js';
import {
  GLOBAL_FRAME_SHAPE_DEFAULT,
  GLOBAL_FRAME_STROKE_COLOR_DEFAULT,
  GLOBAL_FRAME_STROKE_OPACITY_DEFAULT,
  OUTSIDE_BACKGROUND_COLOR_DEFAULT,
} from './config.js';

function colorWithOpacity(hex, opacity) {
  const c = String(hex || '#ffffff').trim();
  const alpha = Math.max(0, Math.min(1, Number(opacity) || 0));
  if (!c.startsWith('#') || (c.length !== 7 && c.length !== 4)) return `rgba(255,255,255,${alpha})`;
  const full = c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c;
  const r = parseInt(full.slice(1, 3), 16);
  const g = parseInt(full.slice(3, 5), 16);
  const b = parseInt(full.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function strokeFrame(ctx, layout, options, shape) {
  if (!options.globalFrameStrokeEnabled) return;
  const lineWidth = Math.max(0, Number(options.globalFrameStrokeWidth) || 0);
  if (lineWidth <= 0) return;
  const d = buildFrameShapePathD(layout, { shape, inset: lineWidth / 2 });
  if (!d) return;
  const path = typeof Path2D === 'function' ? new Path2D(d) : null;
  ctx.save();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = colorWithOpacity(
    options.globalFrameStrokeColor ?? GLOBAL_FRAME_STROKE_COLOR_DEFAULT,
    options.globalFrameStrokeOpacity ?? GLOBAL_FRAME_STROKE_OPACITY_DEFAULT
  );
  if (path) ctx.stroke(path);
  ctx.restore();
}

export function renderUnifiedCanvas(ctx, images, layout, options, drawCellContent) {
  const shape = options.edgeAdvancedSupported
    ? normalizeFrameShape(options.globalFrameShape ?? GLOBAL_FRAME_SHAPE_DEFAULT)
    : GLOBAL_FRAME_SHAPE_DEFAULT;
  const order = layout.photoOrder || images.map((_, i) => i);
  let clipped = false;
  if (shape !== 'rect') {
    const outside = options.outsideBackgroundColor ?? OUTSIDE_BACKGROUND_COLOR_DEFAULT;
    const inset = options.globalFrameStrokeEnabled ? (Number(options.globalFrameStrokeWidth) || 0) / 2 : 0;
    const d = buildFrameShapePathD(layout, { shape, inset });
    const path = typeof Path2D === 'function' ? new Path2D(d) : null;
    ctx.fillStyle = outside;
    ctx.fillRect(0, 0, layout.canvasWidth, layout.canvasHeight);
    if (path) {
      ctx.save();
      ctx.clip(path);
      clipped = true;
      ctx.fillStyle = options.backgroundColor ?? '#ffffff';
      ctx.fillRect(0, 0, layout.canvasWidth, layout.canvasHeight);
    }
  }
  for (let i = 0; i < layout.cells.length; i++) {
    const idx = order[i];
    if (idx == null || idx < 0 || idx >= images.length) continue;
    drawCellContent(ctx, images[idx], layout.cells[i], { ...options, cellIndex: i });
  }
  drawWatermark(ctx, layout.canvasWidth, layout.canvasHeight, {
    type: options.watermarkType ?? 'none',
    text: options.watermarkText ?? '',
    position: options.watermarkPos,
    opacity: options.watermarkOpacity,
    fontScale: options.watermarkFontScale,
    backgroundColor: options.backgroundColor ?? '#ffffff',
    locale: options.locale ?? 'en',
  });
  if (clipped) ctx.restore();
  strokeFrame(ctx, layout, options, shape);
}
