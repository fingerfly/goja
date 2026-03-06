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
  if (normalizedShape === 'regular-hexagon') {
    return 'polygon(50% 0%, 78% 0%, 100% 50%, 78% 100%, 22% 100%, 0% 50%)';
  }
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
