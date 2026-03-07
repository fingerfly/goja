import {
  sampleShapeContour,
} from './shape-contour.js';
import {
  normalizeFrameShape,
  normalizeShapeOrientation,
  polygonSidesForShape,
} from './polygon-shape.js';
export { normalizeFrameShape, normalizeShapeOrientation, polygonSidesForShape };

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

function heartPath(w, h, inset, ox = 0, oy = 0) {
  const pts = sampleShapeContour(w, h, { shape: 'heart', inset, offsetX: ox, offsetY: oy, samples: 160 });
  const [first, ...rest] = pts;
  return `M ${first[0]} ${first[1]} ${rest.map(([x, y]) => `L ${x} ${y}`).join(' ')} Z`;
}

export function buildShapePathD(width, height, options = {}) {
  const w = Math.max(1, Number(width) || 1);
  const h = Math.max(1, Number(height) || 1);
  const inset = Math.max(0, Number(options.inset) || 0);
  const shape = normalizeFrameShape(options.shape);
  const orientation = normalizeShapeOrientation(options.orientation);
  const ox = Number(options.offsetX) || 0;
  const oy = Number(options.offsetY) || 0;
  if (shape === 'circle') return ellipsePath(w, h, inset, true, ox, oy);
  if (shape === 'ellipse') return ellipsePath(w, h, inset, false, ox, oy);
  const polygonSides = polygonSidesForShape(shape);
  if (polygonSides) return polygonPath(w, h, inset, polygonSides, orientation, ox, oy);
  if (shape === 'heart') return heartPath(w, h, inset, ox, oy);
  return rectPath(w, h, inset, ox, oy);
}
