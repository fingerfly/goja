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
export {
  normalizeFrameShape,
  normalizeGlobalFrameShape,
  normalizeCellShapeTemplate,
  normalizeShapeOrientation,
  polygonSidesForShape,
  normalizeSuperellipseExponent,
};

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
  const arcA = `A ${rx} ${ry} 0 1 0 ${ex} ${y}`;
  const arcB = `A ${rx} ${ry} 0 1 0 ${sx} ${y}`;
  return `M ${sx} ${y} ${arcA} ${arcB} Z`;
}

function polygonMode(orientation, aw, ah) {
  if (orientation === 'horizontal' || orientation === 'vertical') {
    return orientation;
  }
  return aw >= ah ? 'horizontal' : 'vertical';
}

function polygonPath(
  w,
  h,
  inset,
  sides,
  orientation = 'auto',
  ox = 0,
  oy = 0
) {
  const count = Math.max(3, Math.round(Number(sides) || 3));
  const aw = Math.max(1, w - inset * 2);
  const ah = Math.max(1, h - inset * 2);
  const mode = polygonMode(orientation, aw, ah);
  const cx = ox + w / 2;
  const cy = oy + h / 2;
  const r = Math.max(1, Math.min(aw, ah) / 2);
  const start = mode === 'horizontal'
    ? -Math.PI / 2
    : -Math.PI / 2 + Math.PI / count;
  const pts = [];
  for (let i = 0; i < count; i += 1) {
    const a = start + (Math.PI * 2 * i) / count;
    pts.push([round3(cx + Math.cos(a) * r), round3(cy + Math.sin(a) * r)]);
  }
  const p = pts.map(([x, y]) => `${x} ${y}`);
  return `M ${p[0]} ${p.slice(1).map((pt) => `L ${pt}`).join(' ')} Z`;
}

function roundedRectPath(
  w,
  h,
  inset,
  ox = 0,
  oy = 0,
  radiusRatio = ROUNDED_RECT_RADIUS_RATIO_DEFAULT
) {
  const x0 = round3(ox + inset);
  const y0 = round3(oy + inset);
  const x1 = round3(ox + Math.max(inset, w - inset));
  const y1 = round3(oy + Math.max(inset, h - inset));
  const aw = Math.max(0, x1 - x0);
  const ah = Math.max(0, y1 - y0);
  const ratio = Number(radiusRatio || 0);
  const raw = Math.min(Math.min(aw, ah) / 2, Math.min(aw, ah) * ratio);
  const r = round3(Math.max(0, raw));
  if (r <= 0) return rectPath(w, h, inset, ox, oy);
  const p0 = `M ${round3(x0 + r)} ${y0}`;
  const p1 = `L ${round3(x1 - r)} ${y0}`;
  const p2 = `A ${r} ${r} 0 0 1 ${x1} ${round3(y0 + r)}`;
  const p3 = `L ${x1} ${round3(y1 - r)}`;
  const p4 = `A ${r} ${r} 0 0 1 ${round3(x1 - r)} ${y1}`;
  const p5 = `L ${round3(x0 + r)} ${y1}`;
  const p6 = `A ${r} ${r} 0 0 1 ${x0} ${round3(y1 - r)}`;
  const p7 = `L ${x0} ${round3(y0 + r)}`;
  const p8 = `A ${r} ${r} 0 0 1 ${round3(x0 + r)} ${y0}`;
  return `${p0} ${p1} ${p2} ${p3} ${p4} ${p5} ${p6} ${p7} ${p8} Z`;
}

function diamondPath(w, h, inset, ox = 0, oy = 0) {
  const cx = round3(ox + w / 2);
  const cy = round3(oy + h / 2);
  const span = Math.min(w - inset * 2, h - inset * 2);
  const r = round3(Math.max(1, span / 2));
  const top = `${cx} ${round3(cy - r)}`;
  const right = `${round3(cx + r)} ${cy}`;
  const bottom = `${cx} ${round3(cy + r)}`;
  const left = `${round3(cx - r)} ${cy}`;
  return `M ${top} L ${right} L ${bottom} L ${left} Z`;
}

function superellipsePath(
  w,
  h,
  inset,
  ox = 0,
  oy = 0,
  exponent = SUPERELLIPSE_EXPONENT_DEFAULT
) {
  const pts = sampleShapeContour(w, h, {
    shape: 'superellipse',
    inset,
    offsetX: ox,
    offsetY: oy,
    samples: 160,
    superellipseExponent: exponent,
  });
  const [first, ...rest] = pts;
  const lines = rest.map(([x, y]) => `L ${x} ${y}`).join(' ');
  return `M ${first[0]} ${first[1]} ${lines} Z`;
}

function heartPath(w, h, inset, ox = 0, oy = 0) {
  const pts = sampleShapeContour(w, h, {
    shape: 'heart',
    inset,
    offsetX: ox,
    offsetY: oy,
    samples: 160,
  });
  const [first, ...rest] = pts;
  const lines = rest.map(([x, y]) => `L ${x} ${y}`).join(' ');
  return `M ${first[0]} ${first[1]} ${lines} Z`;
}

function buildKnownShapePath(shape, w, h, inset, ox, oy, opts) {
  if (shape === 'circle') return ellipsePath(w, h, inset, true, ox, oy);
  if (shape === 'ellipse') return ellipsePath(w, h, inset, false, ox, oy);
  if (shape === 'rounded-rect') {
    return roundedRectPath(w, h, inset, ox, oy, opts.roundedRectRadiusRatio);
  }
  if (shape === 'capsule') return roundedRectPath(w, h, inset, ox, oy, 0.5);
  if (shape === 'diamond') return diamondPath(w, h, inset, ox, oy);
  if (shape === 'superellipse') {
    return superellipsePath(w, h, inset, ox, oy, opts.superellipseExponent);
  }
  if (shape === 'heart') return heartPath(w, h, inset, ox, oy);
  return null;
}

function parsePathOptions(width, height, options = {}) {
  const w = Math.max(1, Number(width) || 1);
  const h = Math.max(1, Number(height) || 1);
  const inset = Math.max(0, Number(options.inset) || 0);
  const shape = normalizeFrameShape(options.shape);
  const orientation = normalizeShapeOrientation(options.orientation);
  const ox = Number(options.offsetX) || 0;
  const oy = Number(options.offsetY) || 0;
  const roundedRectRadiusRatio = Number(
    options.roundedRectRadiusRatio ?? ROUNDED_RECT_RADIUS_RATIO_DEFAULT
  );
  const superellipseExponent = normalizeSuperellipseExponent(
    options.superellipseExponent ?? SUPERELLIPSE_EXPONENT_DEFAULT
  );
  return {
    w,
    h,
    inset,
    shape,
    orientation,
    ox,
    oy,
    roundedRectRadiusRatio,
    superellipseExponent,
  };
}

/**
 * Build an SVG path string for a configured shape and bounds.
 * @param {number} width
 * @param {number} height
 * @param {Record<string, unknown>} [options]
 * @returns {string}
 */
export function buildShapePathD(width, height, options = {}) {
  const parsed = parsePathOptions(width, height, options);
  const known = buildKnownShapePath(
    parsed.shape,
    parsed.w,
    parsed.h,
    parsed.inset,
    parsed.ox,
    parsed.oy,
    {
      roundedRectRadiusRatio: parsed.roundedRectRadiusRatio,
      superellipseExponent: parsed.superellipseExponent,
    }
  );
  if (known) return known;
  const polygonSides = polygonSidesForShape(parsed.shape);
  if (polygonSides) {
    return polygonPath(
      parsed.w,
      parsed.h,
      parsed.inset,
      polygonSides,
      parsed.orientation,
      parsed.ox,
      parsed.oy
    );
  }
  return rectPath(parsed.w, parsed.h, parsed.inset, parsed.ox, parsed.oy);
}
