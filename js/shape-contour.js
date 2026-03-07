const TAU = Math.PI * 2;
const SHAPES = new Set(['rect', 'circle', 'ellipse', 'regular-octagon', 'regular-nonagon', 'regular-hexagon', 'hexagon', 'heart']);
const ORIENTATIONS = new Set(['auto', 'horizontal', 'vertical']);

function toFixed3(v) {
  return Number(v.toFixed(3));
}

function normalizeFrameShape(shape) {
  const raw = String(shape ?? 'rect');
  if (raw === 'hexagon' || raw === 'regular-hexagon' || raw === 'regular-nonagon') return 'regular-octagon';
  return SHAPES.has(raw) ? raw : 'rect';
}

function normalizeShapeOrientation(orientation) {
  const raw = String(orientation ?? 'auto');
  return ORIENTATIONS.has(raw) ? raw : 'auto';
}

function cubicAt(a, b, c, d, t) {
  const mt = 1 - t;
  return mt * mt * mt * a + 3 * mt * mt * t * b + 3 * mt * t * t * c + t * t * t * d;
}

function appendCubic(points, p0, c1, c2, p1, steps, skipStart = false) {
  const from = skipStart ? 1 : 0;
  for (let i = from; i <= steps; i += 1) {
    const t = i / steps;
    points.push([cubicAt(p0[0], c1[0], c2[0], p1[0], t), cubicAt(p0[1], c1[1], c2[1], p1[1], t)]);
  }
}

function unitHeartPoints(samples = 120) {
  const count = Math.max(24, Math.round(Number(samples) || 120));
  const seg = Math.max(6, Math.floor(count * 0.22));
  const arcSteps = Math.max(6, count - seg * 4);
  const pts = [];
  const notch = [0.5, 0.16];
  const rightPeak = [0.9, 0.07];
  const rightArcStart = [0.56, 0.93];
  const leftArcEnd = [0.44, 0.93];
  const leftPeak = [0.1, 0.07];
  appendCubic(pts, notch, [0.58, 0.01], [0.86, 0.0], rightPeak, seg, false);
  appendCubic(pts, rightPeak, [1.0, 0.40], [0.9, 0.84], rightArcStart, seg, true);
  for (let i = 1; i <= arcSteps; i += 1) {
    const t = (Math.PI * i) / arcSteps;
    pts.push([0.5 + 0.06 * Math.cos(t), 0.93 + 0.06 * Math.sin(t)]);
  }
  appendCubic(pts, leftArcEnd, [0.1, 0.84], [0.0, 0.40], leftPeak, seg, true);
  appendCubic(pts, leftPeak, [0.14, 0.0], [0.42, 0.01], notch, seg, true);
  if (pts.length > 1) pts.pop();
  while (pts.length > count) pts.splice(Math.floor(pts.length / 2), 1);
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

export function sampleShapeContour(width, height, options = {}) {
  const shape = normalizeFrameShape(options.shape ?? 'rect');
  const orientation = normalizeShapeOrientation(options.orientation ?? 'auto');
  const inset = Math.max(0, Number(options.inset) || 0);
  const ox = Number(options.offsetX) || 0;
  const oy = Number(options.offsetY) || 0;
  const w = Math.max(1, Number(width) || 1);
  const h = Math.max(1, Number(height) || 1);
  const samples = Math.max(24, Math.round(Number(options.samples) || 120));
  const cx = ox + w / 2;
  const cy = oy + h / 2;
  if (shape === 'heart') return mapUnit(unitHeartPoints(samples), w, h, inset, ox, oy);
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
  if (shape === 'regular-octagon') {
    const aw = Math.max(1, w - inset * 2);
    const ah = Math.max(1, h - inset * 2);
    const mode = orientation === 'horizontal' || orientation === 'vertical' ? orientation : (aw >= ah ? 'horizontal' : 'vertical');
    const r = Math.max(1, Math.min(aw, ah) / 2);
    const start = mode === 'horizontal' ? -Math.PI / 2 : -Math.PI / 2 + Math.PI / 8;
    return Array.from({ length: 8 }, (_, i) => {
      const a = start + (TAU * i) / 8;
      return [toFixed3(cx + Math.cos(a) * r), toFixed3(cy + Math.sin(a) * r)];
    });
  }
  const x0 = toFixed3(ox + inset); const y0 = toFixed3(oy + inset);
  const x1 = toFixed3(ox + Math.max(inset, w - inset)); const y1 = toFixed3(oy + Math.max(inset, h - inset));
  return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
}
