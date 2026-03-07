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
  const split = 0.4;
  const notch = [0.5, 0.16];
  const rightPeak = [0.9, 0.08];
  const bottomTip = [0.5, 1.0];
  const c1Top = [0.62, 0.01];
  const c2Top = [0.9, 0.02];
  // C1 continuity at rightPeak: (rightPeak - c2Top) == (c1Bottom - rightPeak)
  const c1Bottom = [2 * rightPeak[0] - c2Top[0], 2 * rightPeak[1] - c2Top[1]];
  const c2Bottom = [0.9, 0.82];
  const rightAt = (s) => {
    if (s <= split) {
      const t = s / split;
      return [cubicAt(notch[0], c1Top[0], c2Top[0], rightPeak[0], t), cubicAt(notch[1], c1Top[1], c2Top[1], rightPeak[1], t)];
    }
    const t = (s - split) / (1 - split);
    return [
      cubicAt(rightPeak[0], c1Bottom[0], c2Bottom[0], bottomTip[0], t),
      cubicAt(rightPeak[1], c1Bottom[1], c2Bottom[1], bottomTip[1], t),
    ];
  };
  const pts = [];
  // Generate by strict mirror mapping to guarantee axis symmetry and centered tip.
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
