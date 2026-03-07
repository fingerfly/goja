const TAU = Math.PI * 2;
const SHAPES = new Set([
  'rect',
  'circle',
  'ellipse',
  'regular-triangle',
  'regular-octagon',
  'regular-decagon',
  'regular-dodecagon',
  'regular-hexadecagon',
  'regular-nonagon',
  'regular-hexagon',
  'hexagon',
  'heart',
]);
const ORIENTATIONS = new Set(['auto', 'horizontal', 'vertical']);
const POLYGON_SIDES_BY_SHAPE = Object.freeze({
  'regular-triangle': 3,
  'regular-octagon': 8,
  'regular-decagon': 10,
  'regular-dodecagon': 12,
  'regular-hexadecagon': 16,
});

function toFixed3(v) {
  return Number(v.toFixed(3));
}

export function normalizeFrameShape(shape) {
  const raw = String(shape ?? 'rect');
  if (raw === 'hexagon' || raw === 'regular-hexagon' || raw === 'regular-nonagon') return 'regular-octagon';
  return SHAPES.has(raw) ? raw : 'rect';
}

export function normalizeShapeOrientation(orientation) {
  const raw = String(orientation ?? 'auto');
  return ORIENTATIONS.has(raw) ? raw : 'auto';
}

export function polygonSidesForShape(shape) {
  return POLYGON_SIDES_BY_SHAPE[normalizeFrameShape(shape)] ?? null;
}

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
