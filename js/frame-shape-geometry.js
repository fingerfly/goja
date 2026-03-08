/**
 * Purpose: Generate SVG path data for supported frame/cell shapes.
 * Description:
 * - Re-exports shape normalizers for shared geometry consumers.
 * - Produces path data for polygonal and smooth contour presets.
 */
import {
  sampleShapeContour,
} from './shape-contour.js';
import {
  normalizeFrameShape,
  normalizeGlobalFrameShape,
  normalizeCellShapeTemplate,
  normalizeShapeOrientation,
  polygonSidesForShape,
  normalizeSuperellipseExponent,
} from './polygon-shape.js';
import {
  ROUNDED_RECT_RADIUS_RATIO_DEFAULT,
  SUPERELLIPSE_EXPONENT_DEFAULT,
} from './config.js';
export { normalizeFrameShape, normalizeGlobalFrameShape, normalizeCellShapeTemplate, normalizeShapeOrientation, polygonSidesForShape, normalizeSuperellipseExponent };

function round3(v) {
  return Number(v.toFixed(3));
}

function rectPath(w, h, inset, ox = 0, oy = 0) {
  const x0 = round3(ox + inset);
  const y0 = round3(oy + inset);
  const x1 = round3(ox + Math.max(inset, w - inset));
  const y1 = round3(oy + Math.max(inset, h - inset));
  return `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
}

function ellipsePath(w, h, inset, forceCircle = false, ox = 0, oy = 0) {
  const cx = ox + w / 2;
  const cy = oy + h / 2;
  const base = Math.min(w, h) / 2 - inset;
  const rx0 = forceCircle ? base : (w / 2 - inset);
  const ry0 = forceCircle ? base : (h / 2 - inset);
  const rx = round3(Math.max(0, rx0));
  const ry = round3(Math.max(0, ry0));
  const sx = round3(cx - rx);
  const ex = round3(cx + rx);
  const y = round3(cy);
  return `M ${sx} ${y} A ${rx} ${ry} 0 1 0 ${ex} ${y} A ${rx} ${ry} 0 1 0 ${sx} ${y} Z`;
}

function polygonPath(w, h, inset, sides, orientation = 'auto', ox = 0, oy = 0) {
  const count = Math.max(3, Math.round(Number(sides) || 3));
  const aw = Math.max(1, w - inset * 2);
  const ah = Math.max(1, h - inset * 2);
  const mode = orientation === 'horizontal' || orientation === 'vertical' ? orientation : (aw >= ah ? 'horizontal' : 'vertical');
  const cx = ox + w / 2;
  const cy = oy + h / 2;
  const r = Math.max(1, Math.min(aw, ah) / 2);
  const start = mode === 'horizontal' ? -Math.PI / 2 : -Math.PI / 2 + Math.PI / count;
  const pts = [];
  for (let i = 0; i < count; i += 1) {
    const a = start + (Math.PI * 2 * i) / count;
    pts.push([round3(cx + Math.cos(a) * r), round3(cy + Math.sin(a) * r)]);
  }
  const p = pts.map(([x, y]) => `${x} ${y}`);
  return `M ${p[0]} ${p.slice(1).map((pt) => `L ${pt}`).join(' ')} Z`;
}

function roundedRectPath(w, h, inset, ox = 0, oy = 0, radiusRatio = ROUNDED_RECT_RADIUS_RATIO_DEFAULT) {
  const x0 = round3(ox + inset);
  const y0 = round3(oy + inset);
  const x1 = round3(ox + Math.max(inset, w - inset));
  const y1 = round3(oy + Math.max(inset, h - inset));
  const aw = Math.max(0, x1 - x0);
  const ah = Math.max(0, y1 - y0);
  const r = round3(Math.max(0, Math.min(Math.min(aw, ah) / 2, Math.min(aw, ah) * Number(radiusRatio || 0))));
  if (r <= 0) return rectPath(w, h, inset, ox, oy);
  return `M ${round3(x0 + r)} ${y0} L ${round3(x1 - r)} ${y0} A ${r} ${r} 0 0 1 ${x1} ${round3(y0 + r)} L ${x1} ${round3(y1 - r)} A ${r} ${r} 0 0 1 ${round3(x1 - r)} ${y1} L ${round3(x0 + r)} ${y1} A ${r} ${r} 0 0 1 ${x0} ${round3(y1 - r)} L ${x0} ${round3(y0 + r)} A ${r} ${r} 0 0 1 ${round3(x0 + r)} ${y0} Z`;
}

function diamondPath(w, h, inset, ox = 0, oy = 0) {
  const cx = round3(ox + w / 2);
  const cy = round3(oy + h / 2);
  const r = round3(Math.max(1, Math.min(w - inset * 2, h - inset * 2) / 2));
  return `M ${cx} ${round3(cy - r)} L ${round3(cx + r)} ${cy} L ${cx} ${round3(cy + r)} L ${round3(cx - r)} ${cy} Z`;
}

function superellipsePath(w, h, inset, ox = 0, oy = 0, exponent = SUPERELLIPSE_EXPONENT_DEFAULT) {
  const pts = sampleShapeContour(w, h, { shape: 'superellipse', inset, offsetX: ox, offsetY: oy, samples: 160, superellipseExponent: exponent });
  const [first, ...rest] = pts;
  return `M ${first[0]} ${first[1]} ${rest.map(([x, y]) => `L ${x} ${y}`).join(' ')} Z`;
}

function heartPath(w, h, inset, ox = 0, oy = 0) {
  const pts = sampleShapeContour(w, h, { shape: 'heart', inset, offsetX: ox, offsetY: oy, samples: 160 });
  const [first, ...rest] = pts;
  return `M ${first[0]} ${first[1]} ${rest.map(([x, y]) => `L ${x} ${y}`).join(' ')} Z`;
}

/**
 * Build an SVG path string for a configured shape and bounds.
 * @param {number} width
 * @param {number} height
 * @param {Record<string, unknown>} [options]
 * @returns {string}
 */
export function buildShapePathD(width, height, options = {}) {
  const w = Math.max(1, Number(width) || 1);
  const h = Math.max(1, Number(height) || 1);
  const inset = Math.max(0, Number(options.inset) || 0);
  const shape = normalizeFrameShape(options.shape);
  const orientation = normalizeShapeOrientation(options.orientation);
  const ox = Number(options.offsetX) || 0;
  const oy = Number(options.offsetY) || 0;
  const roundedRectRadiusRatio = Number(options.roundedRectRadiusRatio ?? ROUNDED_RECT_RADIUS_RATIO_DEFAULT);
  const superellipseExponent = normalizeSuperellipseExponent(options.superellipseExponent ?? SUPERELLIPSE_EXPONENT_DEFAULT);
  if (shape === 'circle') return ellipsePath(w, h, inset, true, ox, oy);
  if (shape === 'ellipse') return ellipsePath(w, h, inset, false, ox, oy);
  if (shape === 'rounded-rect') return roundedRectPath(w, h, inset, ox, oy, roundedRectRadiusRatio);
  if (shape === 'capsule') return roundedRectPath(w, h, inset, ox, oy, 0.5);
  if (shape === 'diamond') return diamondPath(w, h, inset, ox, oy);
  if (shape === 'superellipse') return superellipsePath(w, h, inset, ox, oy, superellipseExponent);
  const polygonSides = polygonSidesForShape(shape);
  if (polygonSides) return polygonPath(w, h, inset, polygonSides, orientation, ox, oy);
  if (shape === 'heart') return heartPath(w, h, inset, ox, oy);
  return rectPath(w, h, inset, ox, oy);
}
