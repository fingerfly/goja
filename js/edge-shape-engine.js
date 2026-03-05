import { makeSeededRng } from './edge-rng.js';

function clampNum(v, min, max, fallback) {
  const n = Number(v);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function edgePoints(x1, y1, x2, y2, amp, steps, rng, axis) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (i === 0 || i === steps || amp <= 0) pts.push([x, y]);
    else if (axis === 'x') pts.push([x + (rng() * 2 - 1) * amp, y]);
    else pts.push([x, y + (rng() * 2 - 1) * amp]);
  }
  return pts;
}

function sidePoints(cell, side, opts, key) {
  const amp = Math.min(cell.width, cell.height) * clampNum(opts.edgeIntensity, 0, 1, 0) * 0.16;
  const freq = clampNum(opts.edgeFrequency, 1, 12, 4);
  const style = opts.edgeStyle ?? 'straight';
  if (style === 'straight' || amp <= 0) {
    if (side === 'top') return [[cell.x, cell.y], [cell.x + cell.width, cell.y]];
    if (side === 'right') return [[cell.x + cell.width, cell.y], [cell.x + cell.width, cell.y + cell.height]];
    if (side === 'bottom') return [[cell.x + cell.width, cell.y + cell.height], [cell.x, cell.y + cell.height]];
    return [[cell.x, cell.y + cell.height], [cell.x, cell.y]];
  }
  const rng = makeSeededRng(key);
  if (side === 'top') return edgePoints(cell.x, cell.y, cell.x + cell.width, cell.y, amp, freq * 2, rng, 'y');
  if (side === 'right') return edgePoints(cell.x + cell.width, cell.y, cell.x + cell.width, cell.y + cell.height, amp, freq * 2, rng, 'x');
  if (side === 'bottom') return edgePoints(cell.x + cell.width, cell.y + cell.height, cell.x, cell.y + cell.height, amp, freq * 2, rng, 'y');
  return edgePoints(cell.x, cell.y + cell.height, cell.x, cell.y, amp, freq * 2, rng, 'x');
}

export function buildCellEdgePathD(cell, cellIndex, options = {}) {
  const style = options.edgeStyle ?? 'straight';
  const opts = { ...options, edgeStyle: style };
  const top = sidePoints(cell, 'top', opts, `${style}:${options.edgeSeed ?? 0}:${cellIndex}:top`);
  const right = sidePoints(cell, 'right', opts, `${style}:${options.edgeSeed ?? 0}:${cellIndex}:right`);
  const bottom = sidePoints(cell, 'bottom', opts, `${style}:${options.edgeSeed ?? 0}:${cellIndex}:bottom`);
  const left = sidePoints(cell, 'left', opts, `${style}:${options.edgeSeed ?? 0}:${cellIndex}:left`);
  const pts = [top, right.slice(1), bottom.slice(1), left.slice(1)].flat();
  return `M ${pts.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`;
}
