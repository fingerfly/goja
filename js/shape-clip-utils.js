import { buildShapePathD, normalizeFrameShape, normalizeShapeOrientation } from './frame-shape-geometry.js';

export function getShapeCssClip(shape, orientation = 'auto') {
  const normalizedShape = normalizeFrameShape(shape);
  const normalizedOrientation = normalizeShapeOrientation(orientation);
  if (normalizedShape === 'circle') return 'circle(50% at 50% 50%)';
  if (normalizedShape === 'ellipse') {
    if (normalizedOrientation === 'horizontal') return 'ellipse(50% 41% at 50% 50%)';
    if (normalizedOrientation === 'vertical') return 'ellipse(41% 50% at 50% 50%)';
    return 'ellipse(50% 42% at 50% 50%)';
  }
  if (normalizedShape === 'regular-nonagon') return 'polygon(50% 0%, 82% 12%, 100% 40%, 94% 72%, 68% 96%, 32% 96%, 6% 72%, 0% 40%, 18% 12%)';
  if (normalizedShape === 'heart') return 'polygon(50% 100%, 40% 88%, 28% 74%, 18% 58%, 14% 43%, 21% 29%, 33% 22%, 43% 25%, 50% 34%, 57% 25%, 67% 22%, 79% 29%, 86% 43%, 82% 58%, 72% 74%, 60% 88%)';
  return 'none';
}

export function buildFrameShapePathD(layout, options = {}) {
  const shape = normalizeFrameShape(options.shape ?? 'rect');
  const inset = Math.max(0, Number(options.inset) || 0);
  return buildShapePathD(layout.canvasWidth, layout.canvasHeight, {
    shape,
    inset,
    orientation: options.orientation ?? 'auto',
  });
}

export function buildCellShapePathD(cell, options = {}) {
  const shape = normalizeFrameShape(options.shape ?? 'rect');
  const orientation = normalizeShapeOrientation(options.orientation ?? 'auto');
  const inset = Math.max(0, Number(options.inset) || 0);
  const w = Math.max(1, Number(cell.width) || 1);
  const h = Math.max(1, Number(cell.height) || 1);
  return buildShapePathD(w, h, {
    shape,
    orientation,
    inset,
    offsetX: Number(cell.x) || 0,
    offsetY: Number(cell.y) || 0,
  });
}
