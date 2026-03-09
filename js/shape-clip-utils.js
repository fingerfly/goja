/**
 * Purpose: Convert frame/cell shape settings into CSS and SVG paths.
 * Description:
 * - Builds CSS clip-path expressions for preview clipping.
 * - Builds global/cell path data used by export and overlays.
 */
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
  const pts = sampleShapeContour(100, 100, {
    shape: 'heart',
    inset: 0,
    samples,
  })
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

function ellipseCssClip(orientation) {
  if (orientation === 'horizontal') return 'ellipse(50% 41% at 50% 50%)';
  if (orientation === 'vertical') return 'ellipse(41% 50% at 50% 50%)';
  return 'ellipse(50% 42% at 50% 50%)';
}

function sampledShapeClip(shape, orientation, options) {
  const samples = Number(options.samples) || 120;
  const pts = sampleShapeContour(100, 100, {
    shape,
    orientation,
    inset: 0,
    samples,
    superellipseExponent: options.superellipseExponent,
    roundedRectRadiusRatio: options.roundedRectRadiusRatio,
  }).map(([x, y]) => [Number(x), Number(y)]);
  return polygonFromPoints(pts);
}

function heartCssClip(options) {
  const samples = Math.max(
    64,
    Math.min(128, Math.round(Number(options.heartSamples) || 96))
  );
  const preferPath = options.preferPath === true;
  const forcePolygon = options.forcePolygonFallback === true;
  if (preferPath && !forcePolygon) {
    const d = buildShapePathD(100, 100, { shape: 'heart' });
    return `path('${d}')`;
  }
  return heartPolygonClip(samples);
}

function shapeNormalizer(scope) {
  return scope === 'cell'
    ? normalizeCellShapeTemplate
    : normalizeGlobalFrameShape;
}

const SAMPLED_SHAPES = new Set([
  'rounded-rect',
  'capsule',
  'diamond',
  'superellipse',
]);

/**
 * Build a CSS clip-path string from a normalized shape preset.
 * @param {string} shape
 * @param {'auto' | 'horizontal' | 'vertical'} [orientation]
 * @param {Record<string, unknown>} [options]
 * @returns {string}
 */
export function getShapeCssClip(shape, orientation = 'auto', options = {}) {
  const normalize = shapeNormalizer(options.scope);
  const normalizedShape = normalize(shape);
  const normalizedOrientation = normalizeShapeOrientation(orientation);
  if (normalizedShape === 'circle') return 'circle(50% at 50% 50%)';
  if (normalizedShape === 'ellipse') {
    return ellipseCssClip(normalizedOrientation);
  }
  if (polygonSidesForShape(normalizedShape)) {
    return regularPolygonClip(normalizedShape, normalizedOrientation);
  }
  if (SAMPLED_SHAPES.has(normalizedShape)) {
    return sampledShapeClip(normalizedShape, normalizedOrientation, options);
  }
  if (normalizedShape === 'heart') return heartCssClip(options);
  return 'none';
}

/**
 * Build global frame path data for full-canvas overlays/clipping.
 * @param {{ canvasWidth: number, canvasHeight: number }} layout
 * @param {Record<string, unknown>} [options]
 * @returns {string}
 */
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

/**
 * Convert a hex color and opacity into rgba() string.
 * @param {string} hex
 * @param {number} opacity
 * @returns {string}
 */
export function colorWithOpacity(hex, opacity) {
  const c = String(hex || '#ffffff').trim();
  const alpha = Math.max(0, Math.min(1, Number(opacity) || 0));
  if (!c.startsWith('#') || (c.length !== 7 && c.length !== 4)) {
    return `rgba(255,255,255,${alpha})`;
  }
  const full = c.length === 4
    ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`
    : c;
  const r = parseInt(full.slice(1, 3), 16);
  const g = parseInt(full.slice(3, 5), 16);
  const b = parseInt(full.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Build a shared frame-stroke model for preview/export adapters.
 * @param {{ canvasWidth: number, canvasHeight: number }} layout
 * @param {Record<string, unknown>} [options]
 * @returns {{ lineWidth: number, strokeStyle: string, pathD: string } | null}
 */
export function buildFrameStrokeModel(layout, options = {}) {
  if (options.strokeEnabled !== true) return null;
  const lineWidth = Math.max(0, Number(options.strokeWidth) || 0);
  if (lineWidth <= 0) return null;
  const pathD = buildFrameShapePathD(layout, {
    shape: options.shape,
    inset: lineWidth / 2,
    orientation: options.orientation ?? 'auto',
    superellipseExponent: options.superellipseExponent,
    roundedRectRadiusRatio: options.roundedRectRadiusRatio,
  });
  if (!pathD) return null;
  return {
    lineWidth,
    strokeStyle: colorWithOpacity(
      options.strokeColor ?? '#ffffff',
      options.strokeOpacity ?? 1
    ),
    pathD,
  };
}

/**
 * Build per-cell path data in global canvas coordinates.
 * @param {{ x: number, y: number, width: number, height: number }} cell
 * @param {Record<string, unknown>} [options]
 * @returns {string}
 */
export function buildCellShapePathD(cell, options = {}) {
  const shape = normalizeCellShapeTemplate(options.shape ?? 'rect');
  const orientation = normalizeShapeOrientation(
    options.orientation ?? 'auto'
  );
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
