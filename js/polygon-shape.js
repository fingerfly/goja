/**
 * Purpose: Normalize shape presets and derive polygon/contour geometry.
 * Description:
 * - Maps legacy shape aliases to current supported shape IDs.
 * - Provides polygon vertex and contour resampling primitives.
 */
import {
  SUPERELLIPSE_EXPONENT_DEFAULT,
  SUPERELLIPSE_EXPONENT_MIN,
  SUPERELLIPSE_EXPONENT_MAX,
} from './config.js';
const TAU = Math.PI * 2;
const GLOBAL_SHAPES = new Set(['rect', 'circle', 'ellipse', 'regular-octagon', 'regular-decagon', 'regular-dodecagon', 'regular-hexadecagon', 'regular-36-gon', 'regular-64-gon', 'rounded-rect', 'superellipse', 'capsule', 'diamond', 'regular-nonagon', 'regular-hexagon', 'hexagon', 'heart']);
const CELL_SHAPES = new Set([...GLOBAL_SHAPES].filter((shape) => shape !== 'capsule' && shape !== 'diamond'));
const ORIENTATIONS = new Set(['auto', 'horizontal', 'vertical']);
const POLYGON_SIDES_BY_SHAPE = Object.freeze({ 'regular-octagon': 8, 'regular-decagon': 10, 'regular-dodecagon': 12, 'regular-hexadecagon': 16, 'regular-36-gon': 36, 'regular-64-gon': 64 });

function toFixed3(v) { return Number(v.toFixed(3)); }
function normalizeLegacyShape(raw) { if (raw === 'hexagon' || raw === 'regular-hexagon' || raw === 'regular-nonagon') return 'regular-octagon'; if (raw === 'regular-triangle' || raw === 'squircle') return 'rect'; return raw; }

/**
 * Normalize global frame shape ID.
 * @param {string} shape
 * @returns {string}
 */
export function normalizeGlobalFrameShape(shape) {
  const raw = String(shape ?? 'rect');
  const normalized = normalizeLegacyShape(raw);
  return GLOBAL_SHAPES.has(normalized) ? normalized : 'rect';
}

/**
 * Normalize cell shape ID.
 * @param {string} shape
 * @returns {string}
 */
export function normalizeCellShapeTemplate(shape) {
  const raw = String(shape ?? 'rect');
  const normalized = normalizeLegacyShape(raw);
  return CELL_SHAPES.has(normalized) ? normalized : 'rect';
}

/**
 * Normalize frame shape ID (alias to global frame normalizer).
 * @param {string} shape
 * @returns {string}
 */
export function normalizeFrameShape(shape) {
  return normalizeGlobalFrameShape(shape);
}

/**
 * Normalize shape orientation.
 * @param {string} orientation
 * @returns {'auto' | 'horizontal' | 'vertical'}
 */
export function normalizeShapeOrientation(orientation) {
  const raw = String(orientation ?? 'auto');
  return ORIENTATIONS.has(raw) ? raw : 'auto';
}

/**
 * Resolve polygon side count for supported polygonal shape IDs.
 * @param {string} shape
 * @returns {number | null}
 */
export function polygonSidesForShape(shape) {
  return POLYGON_SIDES_BY_SHAPE[normalizeGlobalFrameShape(shape)] ?? null;
}

/**
 * Clamp superellipse exponent to supported bounds.
 * @param {unknown} value
 * @returns {number}
 */
export function normalizeSuperellipseExponent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return SUPERELLIPSE_EXPONENT_DEFAULT;
  return Math.max(SUPERELLIPSE_EXPONENT_MIN, Math.min(SUPERELLIPSE_EXPONENT_MAX, n));
}

/**
 * Build regular polygon vertices for target bounds.
 * @param {number} width
 * @param {number} height
 * @param {number} inset
 * @param {'auto' | 'horizontal' | 'vertical'} orientation
 * @param {number} ox
 * @param {number} oy
 * @param {number} sides
 * @returns {[number, number][]}
 */
export function regularPolygonVertices(width, height, inset, orientation, ox, oy, sides) {
  const w = Math.max(1, Number(width) || 1);
  const h = Math.max(1, Number(height) || 1);
  const aw = Math.max(1, w - inset * 2);
  const ah = Math.max(1, h - inset * 2);
  const mode = orientation === 'horizontal' || orientation === 'vertical' ? orientation : (aw >= ah ? 'horizontal' : 'vertical');
  const cx = ox + w / 2;
  const cy = oy + h / 2;
  const r = Math.max(1, Math.min(aw, ah) / 2);
  const start = mode === 'horizontal' ? -Math.PI / 2 : -Math.PI / 2 + Math.PI / sides;
  return Array.from({ length: sides }, (_, i) => {
    const a = start + (TAU * i) / sides;
    return [toFixed3(cx + Math.cos(a) * r), toFixed3(cy + Math.sin(a) * r)];
  });
}

/**
 * Resample a closed contour to a target point count.
 * @param {[number, number][]} points
 * @param {number} count
 * @returns {[number, number][]}
 */
export function resampleClosedContour(points, count) {
  if (!Array.isArray(points) || points.length < 3) return points.slice();
  const target = Math.max(3, Math.round(Number(count) || points.length));
  if (target <= points.length) return points.slice();
  const segLens = [];
  let totalLen = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segLens.push(len);
    totalLen += len;
  }
  const out = [];
  for (let k = 0; k < target; k += 1) {
    const targetLen = (k / target) * totalLen;
    let acc = 0;
    let idx = 0;
    while (idx < segLens.length && (acc + segLens[idx]) < targetLen) {
      acc += segLens[idx];
      idx += 1;
    }
    const a = points[idx % points.length];
    const b = points[(idx + 1) % points.length];
    const seg = Math.max(1e-9, segLens[idx % segLens.length]);
    const t = (targetLen - acc) / seg;
    out.push([toFixed3(a[0] + ((b[0] - a[0]) * t)), toFixed3(a[1] + ((b[1] - a[1]) * t))]);
  }
  return out;
}
