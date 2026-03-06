import { buildShapePathD, normalizeFrameShape, normalizeShapeOrientation } from './frame-shape-geometry.js';
import { sampleShapeContour } from './shape-contour.js';

function polygonFromPoints(points) {
  return `polygon(${points.map(([x, y]) => `${x}% ${y}%`).join(', ')})`;
}

function heartPolygonClip(samples = 96) {
  const pts = sampleShapeContour(100, 100, { shape: 'heart', inset: 0, samples })
    .map(([x, y]) => [Number(x), Number(y)]);
  return polygonFromPoints(pts);
}

export function getShapeCssClip(shape, orientation = 'auto', options = {}) {
  const normalizedShape = normalizeFrameShape(shape);
  const normalizedOrientation = normalizeShapeOrientation(orientation);
  if (normalizedShape === 'circle') return 'circle(50% at 50% 50%)';
  if (normalizedShape === 'ellipse') {
    if (normalizedOrientation === 'horizontal') return 'ellipse(50% 41% at 50% 50%)';
    if (normalizedOrientation === 'vertical') return 'ellipse(41% 50% at 50% 50%)';
    return 'ellipse(50% 42% at 50% 50%)';
  }
  if (normalizedShape === 'regular-nonagon') return 'polygon(50% 0%, 82% 12%, 100% 40%, 94% 72%, 68% 96%, 32% 96%, 6% 72%, 0% 40%, 18% 12%)';
  if (normalizedShape === 'heart') {
    const samples = Math.max(64, Math.min(128, Math.round(Number(options.heartSamples) || 96)));
    if (options.forcePolygonFallback === true) return heartPolygonClip(samples);
    const d = buildShapePathD(100, 100, { shape: 'heart' });
    return `path('${d}')`;
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
