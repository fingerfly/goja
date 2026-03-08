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

const TAU = Math.PI * 2;

function toFixed3(v) {
  return Number(v.toFixed(3));
}

function cubicAt(a, b, c, d, t) {
  const mt = 1 - t;
  return mt * mt * mt * a + 3 * mt * mt * t * b + 3 * mt * t * t * c + t * t * t * d;
}

function unitHeartPoints(samples = 120) {
  const count = Math.max(24, Math.round(Number(samples) || 120));
  const split = 0.445;
  const notch = [0.5, 0.16];
  const rightPeak = [0.923, 0.08];
  const bottomTip = [0.5, 1.0];
  const c1Top = [0.665, 0.01];
  const c2Top = [0.809, 0.02];
  const c1Bottom = [2 * rightPeak[0] - c2Top[0], 2 * rightPeak[1] - c2Top[1]];
  const c2Bottom = [0.91, 0.865];
  const rightAt = (s) => {
    if (s <= split) {
      const t = s / split;
      return [cubicAt(notch[0], c1Top[0], c2Top[0], rightPeak[0], t), cubicAt(notch[1], c1Top[1], c2Top[1], rightPeak[1], t)];
    }
    const t = (s - split) / (1 - split);
    return [cubicAt(rightPeak[0], c1Bottom[0], c2Bottom[0], bottomTip[0], t), cubicAt(rightPeak[1], c1Bottom[1], c2Bottom[1], bottomTip[1], t)];
  };
  const pts = [];
  for (let i = 0; i < count; i += 1) {
    const u = i / count;
    if (u < 0.5) {
      const s = u * 2;
      pts.push(rightAt(s));
    } else {
      const v = (u - 0.5) * 2;
      const right = rightAt(1 - v);
      pts.push([1 - right[0], right[1]]);
    }
  }
  const xs = pts.map(([x]) => x);
  const ys = pts.map(([, y]) => y);
  const minX = Math.min(...xs); const maxX = Math.max(...xs);
  const minY = Math.min(...ys); const maxY = Math.max(...ys);
  const spanX = Math.max(1e-6, maxX - minX);
  const spanY = Math.max(1e-6, maxY - minY);
  return pts.map(([x, y]) => [((x - minX) / spanX), ((y - minY) / spanY)]);
}

function mapUnit(pts, width, height, inset = 0, ox = 0, oy = 0) {
  const w = Math.max(1, width - inset * 2);
  const h = Math.max(1, height - inset * 2);
  const x0 = ox + inset;
  const y0 = oy + inset;
  return pts.map(([x, y]) => [toFixed3(x0 + x * w), toFixed3(y0 + y * h)]);
}

function roundedRectContour(width, height, inset, ox, oy, samples, radiusRatio) {
  const x0 = ox + inset;
  const y0 = oy + inset;
  const aw = Math.max(1, width - inset * 2);
  const ah = Math.max(1, height - inset * 2);
  const x1 = x0 + aw;
  const y1 = y0 + ah;
  const ratio = Math.max(0, Number(radiusRatio || 0));
  const r = Math.min(Math.min(aw, ah) / 2, Math.min(aw, ah) * ratio);
  if (r <= 0) return [[toFixed3(x0), toFixed3(y0)], [toFixed3(x1), toFixed3(y0)], [toFixed3(x1), toFixed3(y1)], [toFixed3(x0), toFixed3(y1)]];
  const topLen = Math.max(0, aw - 2 * r);
  const rightLen = Math.max(0, ah - 2 * r);
  const arcLen = Math.PI * r * 0.5;
  const perimeter = Math.max(1e-6, (topLen + rightLen) * 2 + arcLen * 4);
  const pts = [];
  for (let i = 0; i < samples; i += 1) {
    let d = (i / samples) * perimeter;
    if (d < topLen) pts.push([x0 + r + d, y0]);
    else if ((d -= topLen) < arcLen) {
      const a = -Math.PI / 2 + (d / arcLen) * (Math.PI / 2);
      pts.push([x1 - r + Math.cos(a) * r, y0 + r + Math.sin(a) * r]);
    } else if ((d -= arcLen) < rightLen) pts.push([x1, y0 + r + d]);
    else if ((d -= rightLen) < arcLen) {
      const a = (d / arcLen) * (Math.PI / 2);
      pts.push([x1 - r + Math.cos(a) * r, y1 - r + Math.sin(a) * r]);
    } else if ((d -= arcLen) < topLen) pts.push([x1 - r - d, y1]);
    else if ((d -= topLen) < arcLen) {
      const a = Math.PI / 2 + (d / arcLen) * (Math.PI / 2);
      pts.push([x0 + r + Math.cos(a) * r, y1 - r + Math.sin(a) * r]);
    } else if ((d -= arcLen) < rightLen) pts.push([x0, y1 - r - d]);
    else {
      d -= rightLen;
      const a = Math.PI + (d / arcLen) * (Math.PI / 2);
      pts.push([x0 + r + Math.cos(a) * r, y0 + r + Math.sin(a) * r]);
    }
  }
  return pts.map(([x, y]) => [toFixed3(x), toFixed3(y)]);
}

function superellipseContour(width, height, inset, ox, oy, samples, exponent) {
  const cx = ox + width / 2;
  const cy = oy + height / 2;
  const rx = Math.max(0, width / 2 - inset);
  const ry = Math.max(0, height / 2 - inset);
  const n = normalizeSuperellipseExponent(exponent);
  const p = 2 / n;
  const pts = [];
  for (let i = 0; i < samples; i += 1) {
    const t = (TAU * i) / samples - Math.PI / 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = Math.sign(c) * Math.pow(Math.abs(c), p);
    const y = Math.sign(s) * Math.pow(Math.abs(s), p);
    pts.push([toFixed3(cx + x * rx), toFixed3(cy + y * ry)]);
  }
  return pts;
}

/**
 * Sample a shape contour as an ordered closed point list.
 * @param {number} width
 * @param {number} height
 * @param {Record<string, unknown>} [options]
 * @returns {[number, number][]}
 */
export function sampleShapeContour(width, height, options = {}) {
  const shape = normalizeFrameShape(options.shape ?? 'rect');
  const orientation = normalizeShapeOrientation(options.orientation ?? 'auto');
  const inset = Math.max(0, Number(options.inset) || 0);
  const ox = Number(options.offsetX) || 0;
  const oy = Number(options.offsetY) || 0;
  const w = Math.max(1, Number(width) || 1);
  const h = Math.max(1, Number(height) || 1);
  const rawSamples = Math.round(Number(options.samples));
  const samples = Math.max(24, Number.isFinite(rawSamples) ? rawSamples : 120);
  const cx = ox + w / 2;
  const cy = oy + h / 2;
  if (shape === 'heart') return mapUnit(unitHeartPoints(samples), w, h, inset, ox, oy);
  if (shape === 'rounded-rect') return roundedRectContour(w, h, inset, ox, oy, samples, Number(options.roundedRectRadiusRatio ?? ROUNDED_RECT_RADIUS_RATIO_DEFAULT));
  if (shape === 'capsule') return roundedRectContour(w, h, inset, ox, oy, samples, 0.5);
  if (shape === 'diamond') {
    const r = Math.max(1, Math.min(w - inset * 2, h - inset * 2) / 2);
    const pts = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]].map(([x, y]) => [toFixed3(x), toFixed3(y)]);
    return resampleClosedContour(pts, samples);
  }
  if (shape === 'superellipse') return superellipseContour(w, h, inset, ox, oy, samples, options.superellipseExponent ?? SUPERELLIPSE_EXPONENT_DEFAULT);
  if (shape === 'ellipse' || shape === 'circle') {
    const base = Math.min(w, h) / 2 - inset;
    const rx = shape === 'circle' ? base : (w / 2 - inset);
    const ry = shape === 'circle' ? base : (h / 2 - inset);
    const pts = [];
    for (let i = 0; i < samples; i += 1) {
      const t = (TAU * i) / samples - Math.PI / 2;
      pts.push([toFixed3(cx + Math.cos(t) * Math.max(0, rx)), toFixed3(cy + Math.sin(t) * Math.max(0, ry))]);
    }
    return pts;
  }
  const sides = polygonSidesForShape(shape);
  if (sides) {
    const polygonSamples = Math.max(sides, Number.isFinite(rawSamples) ? rawSamples : sides);
    const vertices = regularPolygonVertices(w, h, inset, orientation, ox, oy, sides);
    return resampleClosedContour(vertices, polygonSamples);
  }
  const x0 = toFixed3(ox + inset); const y0 = toFixed3(oy + inset);
  const x1 = toFixed3(ox + Math.max(inset, w - inset)); const y1 = toFixed3(oy + Math.max(inset, h - inset));
  return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
}
