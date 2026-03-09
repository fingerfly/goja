/**
 * Purpose: Render final collage output through one unified canvas pass.
 * Description:
 * - Applies global frame shape clipping and outside-background fill.
 * - Draws each cell via injected drawCellContent callback.
 * - Draws watermark and optional global frame stroke overlays.
 */
import { drawWatermark } from './watermark.js';
import { buildFrameShapePathD, buildFrameStrokeModel } from './shape-clip-utils.js';
import { normalizeGlobalFrameShape, normalizeSuperellipseExponent } from './frame-shape-geometry.js';
import {
  GLOBAL_FRAME_SHAPE_DEFAULT,
  GLOBAL_FRAME_STROKE_COLOR_DEFAULT,
  GLOBAL_FRAME_STROKE_OPACITY_DEFAULT,
  OUTSIDE_BACKGROUND_COLOR_DEFAULT,
} from './config.js';

function strokeFrame(ctx, layout, options, shape) {
  const model = buildFrameStrokeModel(layout, {
    shape,
    strokeEnabled: options.globalFrameStrokeEnabled,
    strokeWidth: options.globalFrameStrokeWidth,
    strokeColor: options.globalFrameStrokeColor
      ?? GLOBAL_FRAME_STROKE_COLOR_DEFAULT,
    strokeOpacity: options.globalFrameStrokeOpacity
      ?? GLOBAL_FRAME_STROKE_OPACITY_DEFAULT,
    superellipseExponent: normalizeSuperellipseExponent(options.superellipseExponent),
  });
  if (!model) return;
  const path = typeof Path2D === 'function' ? new Path2D(model.pathD) : null;
  ctx.save();
  ctx.lineWidth = model.lineWidth;
  ctx.strokeStyle = model.strokeStyle;
  if (path) ctx.stroke(path);
  ctx.restore();
}

/**
 * Render the final collage canvas using normalized options.
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource[]} images
 * @param {object} layout
 * @param {Record<string, unknown>} options
 * @param {(ctx: CanvasRenderingContext2D, image: CanvasImageSource,
 *   cell: object, options: Record<string, unknown>) => void} drawCellContent
 */
export function renderUnifiedCanvas(ctx, images, layout, options, drawCellContent) {
  const shape = options.edgeAdvancedSupported
    ? normalizeGlobalFrameShape(options.globalFrameShape ?? GLOBAL_FRAME_SHAPE_DEFAULT)
    : GLOBAL_FRAME_SHAPE_DEFAULT;
  const order = layout.photoOrder || images.map((_, i) => i);
  let clipped = false;
  if (shape !== 'rect') {
    const outside = options.outsideBackgroundColor ?? OUTSIDE_BACKGROUND_COLOR_DEFAULT;
    const inset = options.globalFrameStrokeEnabled ? (Number(options.globalFrameStrokeWidth) || 0) / 2 : 0;
    const d = buildFrameShapePathD(layout, {
      shape,
      inset,
      superellipseExponent: normalizeSuperellipseExponent(options.superellipseExponent),
    });
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
