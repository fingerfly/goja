const TAU = Math.PI * 2;
const SHAPES = new Set(['rect', 'circle', 'ellipse', 'regular-nonagon', 'regular-hexagon', 'hexagon', 'heart']);
const ORIENTATIONS = new Set(['auto', 'horizontal', 'vertical']);

function toFixed3(v) {
  return Number(v.toFixed(3));
}

function normalizeFrameShape(shape) {
  const raw = String(shape ?? 'rect');
  if (raw === 'hexagon' || raw === 'regular-hexagon') return 'regular-nonagon';
  return SHAPES.has(raw) ? raw : 'rect';
}

function normalizeShapeOrientation(orientation) {
  const raw = String(orientation ?? 'auto');
  return ORIENTATIONS.has(raw) ? raw : 'auto';
}

function unitHeartPoints(samples = 120) {
  const count = Math.max(24, Math.round(Number(samples) || 120));
  const pts = [];
  for (let i = 0; i < count; i += 1) {
    const t = (TAU * i) / count;
    const x = 16 * (Math.sin(t) ** 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push([x, y]);
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
  if (shape === 'regular-nonagon') {
    const aw = Math.max(1, w - inset * 2);
    const ah = Math.max(1, h - inset * 2);
    const mode = orientation === 'horizontal' || orientation === 'vertical' ? orientation : (aw >= ah ? 'horizontal' : 'vertical');
    const r = Math.max(1, Math.min(aw, ah) / 2);
    const start = mode === 'horizontal' ? -Math.PI / 2 : -Math.PI / 2 + Math.PI / 9;
    return Array.from({ length: 9 }, (_, i) => {
      const a = start + (TAU * i) / 9;
      return [toFixed3(cx + Math.cos(a) * r), toFixed3(cy + Math.sin(a) * r)];
    });
  }
  const x0 = toFixed3(ox + inset); const y0 = toFixed3(oy + inset);
  const x1 = toFixed3(ox + Math.max(inset, w - inset)); const y1 = toFixed3(oy + Math.max(inset, h - inset));
  return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
}
