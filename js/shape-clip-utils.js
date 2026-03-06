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
  if (normalizedShape === 'regular-octagon') return 'polygon(50% 0%, 85.4% 14.6%, 100% 50%, 85.4% 85.4%, 50% 100%, 14.6% 85.4%, 0% 50%, 14.6% 14.6%)';
  if (normalizedShape === 'heart') {
    const samples = Math.max(64, Math.min(128, Math.round(Number(options.heartSamples) || 96)));
    if (options.preferPath === true && options.forcePolygonFallback !== true) {
      const d = buildShapePathD(100, 100, { shape: 'heart' });
      return `path('${d}')`;
    }
    return heartPolygonClip(samples);
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
