import {
  buildShapePathD,
  normalizeGlobalFrameShape,
  normalizeCellShapeTemplate,
  normalizeShapeOrientation,
  polygonSidesForShape,
} from './frame-shape-geometry.js';
import { sampleShapeContour } from './shape-contour.js';

function polygonFromPoints(points) {
  return `polygon(${points.map(([x, y]) => `${x}% ${y}%`).join(', ')})`;
}

function heartPolygonClip(samples = 96) {
  const pts = sampleShapeContour(100, 100, { shape: 'heart', inset: 0, samples })
    .map(([x, y]) => [Number(x), Number(y)]);
  return polygonFromPoints(pts);
}

function regularPolygonClip(shape, orientation = 'auto') {
  const sides = polygonSidesForShape(shape);
  if (!sides) return 'none';
  const pts = sampleShapeContour(100, 100, {
    shape,
    orientation,
    inset: 0,
    samples: sides,
  }).map(([x, y]) => [Number(x), Number(y)]);
  return polygonFromPoints(pts);
}

export function getShapeCssClip(shape, orientation = 'auto', options = {}) {
  const normalize = options.scope === 'cell' ? normalizeCellShapeTemplate : normalizeGlobalFrameShape;
  const normalizedShape = normalize(shape);
  const normalizedOrientation = normalizeShapeOrientation(orientation);
  if (normalizedShape === 'circle') return 'circle(50% at 50% 50%)';
  if (normalizedShape === 'ellipse') {
    if (normalizedOrientation === 'horizontal') return 'ellipse(50% 41% at 50% 50%)';
    if (normalizedOrientation === 'vertical') return 'ellipse(41% 50% at 50% 50%)';
    return 'ellipse(50% 42% at 50% 50%)';
  }
  if (polygonSidesForShape(normalizedShape)) return regularPolygonClip(normalizedShape, normalizedOrientation);
  if (normalizedShape === 'rounded-rect' || normalizedShape === 'capsule' || normalizedShape === 'diamond' || normalizedShape === 'superellipse') {
    const samples = Number(options.samples) || 120;
    const pts = sampleShapeContour(100, 100, {
      shape: normalizedShape,
      orientation: normalizedOrientation,
      inset: 0,
      samples,
      superellipseExponent: options.superellipseExponent,
      roundedRectRadiusRatio: options.roundedRectRadiusRatio,
    }).map(([x, y]) => [Number(x), Number(y)]);
    return polygonFromPoints(pts);
  }
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
  const shape = normalizeGlobalFrameShape(options.shape ?? 'rect');
  const inset = Math.max(0, Number(options.inset) || 0);
  return buildShapePathD(layout.canvasWidth, layout.canvasHeight, {
    shape,
    inset,
    orientation: options.orientation ?? 'auto',
    superellipseExponent: options.superellipseExponent,
    roundedRectRadiusRatio: options.roundedRectRadiusRatio,
  });
}

export function buildCellShapePathD(cell, options = {}) {
  const shape = normalizeCellShapeTemplate(options.shape ?? 'rect');
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
    superellipseExponent: options.superellipseExponent,
    roundedRectRadiusRatio: options.roundedRectRadiusRatio,
  });
}
