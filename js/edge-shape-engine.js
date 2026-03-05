import { makeSeededRng } from './edge-rng.js';

function clampNum(v, min, max, fallback) {
  const n = Number(v);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function edgePoints(x1, y1, x2, y2, amp, steps, offsetAt, axis) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (i === 0 || i === steps || amp <= 0) {
      pts.push([x, y]);
    } else {
      const off = offsetAt(t);
      if (axis === 'x') pts.push([x + off, y]);
      else pts.push([x, y + off]);
    }
  }
  return pts;
}

function triangleWave(x) {
  const f = x - Math.floor(x);
  return 1 - 4 * Math.abs(f - 0.5);
}

function boundaryKey(side, baseCell) {
  const x1 = side === 'left' ? baseCell.x : (side === 'right' ? baseCell.x + baseCell.width : baseCell.x);
  const y1 = side === 'top' ? baseCell.y : (side === 'bottom' ? baseCell.y + baseCell.height : baseCell.y);
  const x2 = side === 'left' ? baseCell.x : (side === 'right' ? baseCell.x + baseCell.width : baseCell.x + baseCell.width);
  const y2 = side === 'top' ? baseCell.y : (side === 'bottom' ? baseCell.y + baseCell.height : baseCell.y + baseCell.height);
  const a = `${Math.min(x1, x2)}:${Math.min(y1, y2)}`;
  const b = `${Math.max(x1, x2)}:${Math.max(y1, y2)}`;
  return `${a}|${b}`;
}

function sidePoints(cell, side, opts, baseCell) {
  const amp = Math.min(cell.width, cell.height) * clampNum(opts.edgeIntensity, 0, 1, 0) * 0.16;
  const freq = clampNum(opts.edgeFrequency, 1, 12, 4) * 0.5;
  const style = opts.edgeStyle ?? 'straight';
  if (style === 'straight' || amp <= 0) {
    if (side === 'top') return [[cell.x, cell.y], [cell.x + cell.width, cell.y]];
    if (side === 'right') return [[cell.x + cell.width, cell.y], [cell.x + cell.width, cell.y + cell.height]];
    if (side === 'bottom') return [[cell.x + cell.width, cell.y + cell.height], [cell.x, cell.y + cell.height]];
    return [[cell.x, cell.y + cell.height], [cell.x, cell.y]];
  }
  const rng = makeSeededRng(`${style}:${opts.edgeSeed ?? 0}:${boundaryKey(side, baseCell)}`);
  const phase = rng();
  const jitter = 0.85 + rng() * 0.3;
  const offsetAt = (t) => {
    if (style === 'wavy') return Math.sin((t * freq + phase) * Math.PI * 2) * amp * jitter;
    return triangleWave(t * freq + phase) * amp * jitter;
  };
  if (side === 'top') return edgePoints(cell.x, cell.y, cell.x + cell.width, cell.y, amp, Math.max(8, Math.round(freq * 8)), offsetAt, 'y');
  if (side === 'right') return edgePoints(cell.x + cell.width, cell.y, cell.x + cell.width, cell.y + cell.height, amp, Math.max(8, Math.round(freq * 8)), offsetAt, 'x');
  if (side === 'bottom') return edgePoints(cell.x + cell.width, cell.y + cell.height, cell.x, cell.y + cell.height, amp, Math.max(8, Math.round(freq * 8)), offsetAt, 'y');
  return edgePoints(cell.x, cell.y + cell.height, cell.x, cell.y, amp, Math.max(8, Math.round(freq * 8)), offsetAt, 'x');
}

export function buildCellEdgePathD(cell, cellIndex, options = {}) {
  const style = options.edgeStyle ?? 'straight';
  const opts = { ...options, edgeStyle: style };
  const baseCell = options.boundaryCell ?? cell;
  const top = sidePoints(cell, 'top', opts, baseCell);
  const right = sidePoints(cell, 'right', opts, baseCell);
  const bottom = sidePoints(cell, 'bottom', opts, baseCell);
  const left = sidePoints(cell, 'left', opts, baseCell);
  const pts = [top, right.slice(1), bottom.slice(1), left.slice(1)].flat();
  return `M ${pts.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`;
}
