import { makeSeededRng } from './edge-rng.js';
import { getEdgeStyleProfile, normalizeEdgeStyle } from './edge-style-presets.js';
import { normalizeFrameShape, normalizeShapeOrientation } from './frame-shape-geometry.js';
import { sampleShapeContour } from './shape-contour.js';

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

function clampInt(v, min, max, fallback) {
  return Math.round(clampNum(v, min, max, fallback));
}

function waveformAt(kind, t) {
  if (kind === 'sine') return Math.sin(t * Math.PI * 2);
  if (kind === 'triangle') return triangleWave(t);
  if (kind === 'scallop') return Math.abs(Math.sin(t * Math.PI * 2)) * 2 - 1;
  if (kind === 'zigzag') return triangleWave(t) >= 0 ? 1 : -1;
  return 0;
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
  const style = normalizeEdgeStyle(opts.edgeStyle);
  const profile = getEdgeStyleProfile(style);
  const ampBase = Math.min(cell.width, cell.height) * clampNum(opts.edgeIntensity, 0, 1, 0) * 0.16;
  const amp = ampBase * profile.ampScale;
  const cycles = clampInt(opts.edgeFrequency, 1, 20, 4);
  const freq = cycles * profile.freqScale;
  if (style === 'straight' || amp <= 0) {
    if (side === 'top') return [[cell.x, cell.y], [cell.x + cell.width, cell.y]];
    if (side === 'right') return [[cell.x + cell.width, cell.y], [cell.x + cell.width, cell.y + cell.height]];
    if (side === 'bottom') return [[cell.x + cell.width, cell.y + cell.height], [cell.x, cell.y + cell.height]];
    return [[cell.x, cell.y + cell.height], [cell.x, cell.y]];
  }
  const rng = makeSeededRng(`${style}:${opts.edgeSeed ?? 0}:${boundaryKey(side, baseCell)}`);
  const phase = rng();
  const jitter = 1 - profile.jitter + rng() * profile.jitter * 2;
  const steps = Math.max(10, Math.round(cycles * 8));
  const offsetAt = (t) => waveformAt(profile.waveform, t * freq + phase) * amp * jitter;
  if (side === 'top') return edgePoints(cell.x, cell.y, cell.x + cell.width, cell.y, amp, steps, offsetAt, 'y');
  if (side === 'right') return edgePoints(cell.x + cell.width, cell.y, cell.x + cell.width, cell.y + cell.height, amp, steps, offsetAt, 'x');
  if (side === 'bottom') return edgePoints(cell.x + cell.width, cell.y + cell.height, cell.x, cell.y + cell.height, amp, steps, offsetAt, 'y');
  return edgePoints(cell.x, cell.y + cell.height, cell.x, cell.y, amp, steps, offsetAt, 'x');
}

function pathFromPoints(points) {
  if (!Array.isArray(points) || points.length === 0) return 'M 0 0 Z';
  const [first, ...rest] = points;
  return `M ${first[0]} ${first[1]} ${rest.map(([x, y]) => `L ${x} ${y}`).join(' ')} Z`;
}

function perturbContour(points, opts, seedKey) {
  const style = normalizeEdgeStyle(opts.edgeStyle);
  if (style === 'straight' || points.length < 3) return points;
  const profile = getEdgeStyleProfile(style);
  const width = Math.max(...points.map(([x]) => x)) - Math.min(...points.map(([x]) => x));
  const height = Math.max(...points.map(([, y]) => y)) - Math.min(...points.map(([, y]) => y));
  const ampBase = Math.min(width, height) * clampNum(opts.edgeIntensity, 0, 1, 0) * 0.16;
  const amp = ampBase * profile.ampScale;
  if (amp <= 0) return points;
  const cycles = clampInt(opts.edgeFrequency, 1, 20, 4);
  const freq = cycles * profile.freqScale;
  const rng = makeSeededRng(`${style}:${opts.edgeSeed ?? 0}:${seedKey}`);
  const phase = rng();
  const jitter = 1 - profile.jitter + rng() * profile.jitter * 2;
  const n = points.length;
  return points.map(([x, y], i) => {
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];
    const tx = next[0] - prev[0];
    const ty = next[1] - prev[1];
    const len = Math.hypot(tx, ty) || 1;
    const nx = -ty / len;
    const ny = tx / len;
    const t = i / n;
    const off = waveformAt(profile.waveform, t * freq + phase) * amp * jitter;
    return [x + nx * off, y + ny * off];
  });
}

export function buildLocalCellEdgePathD(cell, cellIndex, options = {}) {
  const style = normalizeEdgeStyle(options.edgeStyle);
  const opts = { ...options, edgeStyle: style };
  const template = normalizeFrameShape(options.cellShapeTemplate ?? 'rect');
  const orientation = normalizeShapeOrientation(options.cellShapeOrientation ?? 'auto');
  if (template !== 'rect' && style !== 'straight') {
    const contour = sampleShapeContour(cell.width, cell.height, {
      shape: template,
      orientation,
      samples: template === 'regular-octagon' ? 96 : 120,
    });
    const perturbed = perturbContour(contour, opts, `${template}:${cell.width}:${cell.height}:${cellIndex}`);
    return pathFromPoints(perturbed);
  }
  const localCell = { x: 0, y: 0, width: cell.width, height: cell.height };
  const baseCell = options.boundaryCell ?? cell;
  const top = sidePoints(localCell, 'top', opts, baseCell);
  const right = sidePoints(localCell, 'right', opts, baseCell);
  const bottom = sidePoints(localCell, 'bottom', opts, baseCell);
  const left = sidePoints(localCell, 'left', opts, baseCell);
  const pts = [top, right.slice(1), bottom.slice(1), left.slice(1)].flat();
  return `M ${pts.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`;
}

export function translatePathD(pathD, dx, dy) {
  return pathD.replace(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g, (_, x, y) => `${Number(x) + dx} ${Number(y) + dy}`);
}

export function buildCellEdgePathD(cell, cellIndex, options = {}) {
  return buildEdgePathPair(cell, cellIndex, options).globalD;
}

export function buildEdgePathPair(cell, cellIndex, options = {}) {
  const localD = buildLocalCellEdgePathD(cell, cellIndex, options);
  return {
    localD,
    globalD: translatePathD(localD, cell.x, cell.y),
  };
}
