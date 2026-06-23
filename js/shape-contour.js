/**
 * Purpose: Sample closed shape contours as normalized point arrays.
 * Description:
 * - Produces points for polygons and smooth curves.
 * - Supports offsets/insets for frame and cell geometry workflows.
 */
import {
  normalizeFrameShape,
  normalizeShapeOrientation,
  polygonSidesForShape,
  regularPolygonVertices,
  resampleClosedContour,
  normalizeSuperellipseExponent,
} from './polygon-shape.js';
import {
  ROUNDED_RECT_RADIUS_RATIO_DEFAULT,
  SUPERELLIPSE_EXPONENT_DEFAULT,
} from './config.js';
import {
  MIN_HEART_SAMPLES,
  boundedContourSamples,
  boundedCount,
} from './loop-guards.js';

const TAU = Math.PI * 2;

function toFixed3(v) {
  return Number(v.toFixed(3));
}

function canonicalHeartPoints(samples = 160) {
  const count = boundedCount(samples, {
    min: MIN_HEART_SAMPLES,
    max: 2000,
    fallback: 160,
  });
  const points = [];
  for (let i = 0; i < count; i += 1) {
    const t = (TAU * i) / count;
    const x = 16 * (Math.sin(t) ** 3);
    const yExpr = 13 * Math.cos(t)
      - 5 * Math.cos(2 * t)
      - 2 * Math.cos(3 * t)
      - Math.cos(4 * t);
    const y = -yExpr;
    points.push([x, y]);
  }
  return points;
}

function fitContourSimilarity(
  points,
  width,
  height,
  inset = 0,
  ox = 0,
  oy = 0
) {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(1e-9, maxX - minX);
  const spanY = Math.max(1e-9, maxY - minY);
  const aw = Math.max(1, width - inset * 2);
  const ah = Math.max(1, height - inset * 2);
  const scale = Math.min(aw / spanX, ah / spanY);
  const usedW = spanX * scale;
  const usedH = spanY * scale;
  const xBase = ox + inset + (aw - usedW) / 2 - minX * scale;
  const yBase = oy + inset + (ah - usedH) / 2 - minY * scale;
  return points.map(([x, y]) => {
    return [toFixed3(xBase + x * scale), toFixed3(yBase + y * scale)];
  });
}

function roundedRectPoint(distance, state) {
  const {
    x0, y0, x1, y1, r, topLen, rightLen, arcLen,
  } = state;
  let d = distance;
  if (d < topLen) return [x0 + r + d, y0];
  d -= topLen;
  if (d < arcLen) {
    const a = -Math.PI / 2 + (d / arcLen) * (Math.PI / 2);
    return [x1 - r + Math.cos(a) * r, y0 + r + Math.sin(a) * r];
  }
  d -= arcLen;
  if (d < rightLen) return [x1, y0 + r + d];
  d -= rightLen;
  if (d < arcLen) {
    const a = (d / arcLen) * (Math.PI / 2);
    return [x1 - r + Math.cos(a) * r, y1 - r + Math.sin(a) * r];
  }
  d -= arcLen;
  if (d < topLen) return [x1 - r - d, y1];
  d -= topLen;
  if (d < arcLen) {
    const a = Math.PI / 2 + (d / arcLen) * (Math.PI / 2);
    return [x0 + r + Math.cos(a) * r, y1 - r + Math.sin(a) * r];
  }
  d -= arcLen;
  if (d < rightLen) return [x0, y1 - r - d];
  d -= rightLen;
  const a = Math.PI + (d / arcLen) * (Math.PI / 2);
  return [x0 + r + Math.cos(a) * r, y0 + r + Math.sin(a) * r];
}

function roundedRectContour(
  width,
  height,
  inset,
  ox,
  oy,
  samples,
  radiusRatio
) {
  const x0 = ox + inset;
  const y0 = oy + inset;
  const aw = Math.max(1, width - inset * 2);
  const ah = Math.max(1, height - inset * 2);
  const x1 = x0 + aw;
  const y1 = y0 + ah;
  const ratio = Math.max(0, Number(radiusRatio || 0));
  const r = Math.min(Math.min(aw, ah) / 2, Math.min(aw, ah) * ratio);
  if (r <= 0) {
    return [
      [toFixed3(x0), toFixed3(y0)],
      [toFixed3(x1), toFixed3(y0)],
      [toFixed3(x1), toFixed3(y1)],
      [toFixed3(x0), toFixed3(y1)],
    ];
  }
  const topLen = Math.max(0, aw - 2 * r);
  const rightLen = Math.max(0, ah - 2 * r);
  const arcLen = Math.PI * r * 0.5;
  const perimeter = Math.max(1e-6, (topLen + rightLen) * 2 + arcLen * 4);
  const state = {
    x0, y0, x1, y1, r, topLen, rightLen, arcLen,
  };
  const safeSamples = boundedContourSamples(samples);
  const pts = [];
  for (let i = 0; i < safeSamples; i += 1) {
    const d = (i / safeSamples) * perimeter;
    pts.push(roundedRectPoint(d, state));
  }
  return pts.map(([x, y]) => [toFixed3(x), toFixed3(y)]);
}

function superellipseContour(
  width,
  height,
  inset,
  ox,
  oy,
  samples,
  exponent
) {
  const cx = ox + width / 2;
  const cy = oy + height / 2;
  const rx = Math.max(0, width / 2 - inset);
  const ry = Math.max(0, height / 2 - inset);
  const n = normalizeSuperellipseExponent(exponent);
  const p = 2 / n;
  const safeSamples = boundedContourSamples(samples);
  const pts = [];
  for (let i = 0; i < safeSamples; i += 1) {
    const t = (TAU * i) / safeSamples - Math.PI / 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = Math.sign(c) * Math.pow(Math.abs(c), p);
    const y = Math.sign(s) * Math.pow(Math.abs(s), p);
    pts.push([toFixed3(cx + x * rx), toFixed3(cy + y * ry)]);
  }
  return pts;
}

function contourContext(width, height, options = {}) {
  const shape = normalizeFrameShape(options.shape ?? 'rect');
  const orientation = normalizeShapeOrientation(
    options.orientation ?? 'auto'
  );
  const inset = Math.max(0, Number(options.inset) || 0);
  const ox = Number(options.offsetX) || 0;
  const oy = Number(options.offsetY) || 0;
  const w = Math.max(1, Number(width) || 1);
  const h = Math.max(1, Number(height) || 1);
  const rawSamples = Math.round(Number(options.samples));
  const samples = boundedContourSamples(
    Number.isFinite(rawSamples) ? rawSamples : 120
  );
  return {
    shape,
    orientation,
    inset,
    ox,
    oy,
    w,
    h,
    rawSamples,
    samples,
    options,
  };
}

function heartContour(ctx) {
  const points = canonicalHeartPoints(ctx.samples);
  return fitContourSimilarity(
    points,
    ctx.w,
    ctx.h,
    ctx.inset,
    ctx.ox,
    ctx.oy
  );
}

function roundedLikeContour(ctx, ratio) {
  return roundedRectContour(
    ctx.w,
    ctx.h,
    ctx.inset,
    ctx.ox,
    ctx.oy,
    ctx.samples,
    ratio
  );
}

function diamondContour(ctx) {
  const cx = ctx.ox + ctx.w / 2;
  const cy = ctx.oy + ctx.h / 2;
  const spanW = ctx.w - ctx.inset * 2;
  const spanH = ctx.h - ctx.inset * 2;
  const r = Math.max(1, Math.min(spanW, spanH) / 2);
  const points = [
    [cx, cy - r],
    [cx + r, cy],
    [cx, cy + r],
    [cx - r, cy],
  ].map(([x, y]) => [toFixed3(x), toFixed3(y)]);
  return resampleClosedContour(points, ctx.samples);
}

function ellipseLikeContour(ctx) {
  const cx = ctx.ox + ctx.w / 2;
  const cy = ctx.oy + ctx.h / 2;
  const base = Math.min(ctx.w, ctx.h) / 2 - ctx.inset;
  const rx = ctx.shape === 'circle' ? base : (ctx.w / 2 - ctx.inset);
  const ry = ctx.shape === 'circle' ? base : (ctx.h / 2 - ctx.inset);
  const pts = [];
  for (let i = 0; i < ctx.samples; i += 1) {
    const t = (TAU * i) / ctx.samples - Math.PI / 2;
    const x = cx + Math.cos(t) * Math.max(0, rx);
    const y = cy + Math.sin(t) * Math.max(0, ry);
    pts.push([toFixed3(x), toFixed3(y)]);
  }
  return pts;
}

function polygonContour(ctx, sides) {
  const polygonSamples = Math.max(
    sides,
    Number.isFinite(ctx.rawSamples) ? ctx.rawSamples : sides
  );
  const vertices = regularPolygonVertices(
    ctx.w,
    ctx.h,
    ctx.inset,
    ctx.orientation,
    ctx.ox,
    ctx.oy,
    sides
  );
  return resampleClosedContour(vertices, polygonSamples);
}

function rectContour(ctx) {
  const x0 = toFixed3(ctx.ox + ctx.inset);
  const y0 = toFixed3(ctx.oy + ctx.inset);
  const x1 = toFixed3(ctx.ox + Math.max(ctx.inset, ctx.w - ctx.inset));
  const y1 = toFixed3(ctx.oy + Math.max(ctx.inset, ctx.h - ctx.inset));
  return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
}

function roundedRectBuilder(ctx) {
  const ratio = Number(
    ctx.options.roundedRectRadiusRatio ?? ROUNDED_RECT_RADIUS_RATIO_DEFAULT
  );
  return roundedLikeContour(ctx, ratio);
}

function superellipseBuilder(ctx) {
  return superellipseContour(
    ctx.w,
    ctx.h,
    ctx.inset,
    ctx.ox,
    ctx.oy,
    ctx.samples,
    ctx.options.superellipseExponent ?? SUPERELLIPSE_EXPONENT_DEFAULT
  );
}

const CONTOUR_BUILDERS = {
  heart: heartContour,
  'rounded-rect': roundedRectBuilder,
  capsule: (ctx) => roundedLikeContour(ctx, 0.5),
  diamond: diamondContour,
  superellipse: superellipseBuilder,
  ellipse: ellipseLikeContour,
  circle: ellipseLikeContour,
};

/**
 * Sample a shape contour as an ordered closed point list.
 * @param {number} width
 * @param {number} height
 * @param {Record<string, unknown>} [options]
 * @returns {[number, number][]}
 */
export function sampleShapeContour(width, height, options = {}) {
  const ctx = contourContext(width, height, options);
  const build = CONTOUR_BUILDERS[ctx.shape];
  if (build) return build(ctx);
  const sides = polygonSidesForShape(ctx.shape);
  if (sides) return polygonContour(ctx, sides);
  return rectContour(ctx);
}
