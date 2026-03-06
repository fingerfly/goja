const SHAPES = new Set(['rect', 'circle', 'ellipse', 'regular-hexagon', 'hexagon']);
const ORIENTATIONS = new Set(['auto', 'horizontal', 'vertical']);

function round3(v) {
  return Number(v.toFixed(3));
}

export function normalizeFrameShape(shape) {
  const raw = String(shape ?? 'rect');
  if (raw === 'hexagon') return 'regular-hexagon';
  return SHAPES.has(raw) ? raw : 'rect';
}

export function normalizeShapeOrientation(orientation) {
  const raw = String(orientation ?? 'auto');
  return ORIENTATIONS.has(raw) ? raw : 'auto';
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

function hexPath(w, h, inset, orientation = 'auto', ox = 0, oy = 0) {
  const aw = Math.max(1, w - inset * 2);
  const ah = Math.max(1, h - inset * 2);
  const mode = orientation === 'horizontal' || orientation === 'vertical'
    ? orientation
    : (aw >= ah ? 'horizontal' : 'vertical');
  const flatTop = mode === 'horizontal';
  const root3 = Math.sqrt(3);
  const side = flatTop ? Math.min(aw / 2, ah / root3) : Math.min(aw / root3, ah / 2);
  const cx = ox + w / 2;
  const cy = oy + h / 2;
  const dx = flatTop ? side : root3 * side / 2;
  const dy = flatTop ? root3 * side / 2 : side;
  const pts = flatTop
    ? [[cx + side, cy], [cx + side / 2, cy + dy], [cx - side / 2, cy + dy], [cx - side, cy], [cx - side / 2, cy - dy], [cx + side / 2, cy - dy]]
    : [[cx, cy - side], [cx + dx, cy - side / 2], [cx + dx, cy + side / 2], [cx, cy + side], [cx - dx, cy + side / 2], [cx - dx, cy - side / 2]];
  const p = pts.map(([x, y]) => `${round3(x)} ${round3(y)}`);
  return `M ${p[0]} L ${p[1]} L ${p[2]} L ${p[3]} L ${p[4]} L ${p[5]} Z`;
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
  if (shape === 'regular-hexagon') return hexPath(w, h, inset, orientation, ox, oy);
  return rectPath(w, h, inset, ox, oy);
}
