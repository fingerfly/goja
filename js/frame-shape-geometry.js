const SHAPES = new Set(['rect', 'circle', 'ellipse', 'hexagon']);
const ORIENTATIONS = new Set(['auto', 'horizontal', 'vertical']);

function round3(v) {
  return Number(v.toFixed(3));
}

export function normalizeFrameShape(shape) {
  const raw = String(shape ?? 'rect');
  return SHAPES.has(raw) ? raw : 'rect';
}

export function normalizeShapeOrientation(orientation) {
  const raw = String(orientation ?? 'auto');
  return ORIENTATIONS.has(raw) ? raw : 'auto';
}

function rectPath(w, h, inset) {
  const x0 = round3(inset);
  const y0 = round3(inset);
  const x1 = round3(Math.max(inset, w - inset));
  const y1 = round3(Math.max(inset, h - inset));
  return `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
}

function ellipsePath(w, h, inset, forceCircle = false) {
  const cx = w / 2;
  const cy = h / 2;
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

function hexPath(w, h, inset) {
  const x0 = inset;
  const x1 = Math.max(inset, w - inset);
  const y0 = inset;
  const y1 = Math.max(inset, h - inset);
  const midX = (x0 + x1) / 2;
  const quarter = (x1 - x0) * 0.25;
  const midY = (y0 + y1) / 2;
  return `M ${round3(midX)} ${round3(y0)} L ${round3(x1 - quarter)} ${round3(y0)} L ${round3(x1)} ${round3(midY)} L ${round3(x1 - quarter)} ${round3(y1)} L ${round3(x0 + quarter)} ${round3(y1)} L ${round3(x0)} ${round3(midY)} Z`;
}

export function buildShapePathD(width, height, options = {}) {
  const w = Math.max(1, Number(width) || 1);
  const h = Math.max(1, Number(height) || 1);
  const inset = Math.max(0, Number(options.inset) || 0);
  const shape = normalizeFrameShape(options.shape);
  if (shape === 'circle') return ellipsePath(w, h, inset, true);
  if (shape === 'ellipse') return ellipsePath(w, h, inset);
  if (shape === 'hexagon') return hexPath(w, h, inset);
  return rectPath(w, h, inset);
}
