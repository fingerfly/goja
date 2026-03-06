import { buildShapePathD, normalizeFrameShape, normalizeShapeOrientation } from './frame-shape-geometry.js';

function n(v) {
  return Number(v.toFixed(3));
}

export function getShapeCssClip(shape, orientation = 'auto') {
  const normalizedShape = normalizeFrameShape(shape);
  const normalizedOrientation = normalizeShapeOrientation(orientation);
  if (normalizedShape === 'circle') return 'circle(50% at 50% 50%)';
  if (normalizedShape === 'ellipse') {
    if (normalizedOrientation === 'horizontal') return 'ellipse(50% 41% at 50% 50%)';
    if (normalizedOrientation === 'vertical') return 'ellipse(41% 50% at 50% 50%)';
    return 'ellipse(50% 50% at 50% 50%)';
  }
  if (normalizedShape === 'hexagon') {
    return 'polygon(50% 0%, 78% 0%, 100% 50%, 78% 100%, 22% 100%, 0% 50%)';
  }
  return 'none';
}

export function buildFrameShapePathD(layout, options = {}) {
  const shape = normalizeFrameShape(options.shape ?? 'rect');
  const inset = Math.max(0, Number(options.inset) || 0);
  return buildShapePathD(layout.canvasWidth, layout.canvasHeight, { shape, inset });
}

export function buildCellShapePathD(cell, options = {}) {
  const shape = normalizeFrameShape(options.shape ?? 'rect');
  const orientation = normalizeShapeOrientation(options.orientation ?? 'auto');
  const inset = Math.max(0, Number(options.inset) || 0);
  const x = Number(cell.x) || 0;
  const y = Number(cell.y) || 0;
  const w = Math.max(1, Number(cell.width) || 1);
  const h = Math.max(1, Number(cell.height) || 1);
  if (shape === 'rect') {
    return `M ${n(x + inset)} ${n(y + inset)} L ${n(x + w - inset)} ${n(y + inset)} L ${n(x + w - inset)} ${n(y + h - inset)} L ${n(x + inset)} ${n(y + h - inset)} Z`;
  }
  if (shape === 'circle') {
    const r = Math.max(1, Math.min(w, h) / 2 - inset);
    const cx = n(x + w / 2);
    const cy = n(y + h / 2);
    return `M ${n(cx - r)} ${cy} A ${n(r)} ${n(r)} 0 1 0 ${n(cx + r)} ${cy} A ${n(r)} ${n(r)} 0 1 0 ${n(cx - r)} ${cy} Z`;
  }
  if (shape === 'ellipse') {
    const rxScale = orientation === 'vertical' ? 0.82 : 1;
    const ryScale = orientation === 'horizontal' ? 0.82 : 1;
    const rx = Math.max(1, (w / 2 - inset) * rxScale);
    const ry = Math.max(1, (h / 2 - inset) * ryScale);
    const cx = n(x + w / 2);
    const cy = n(y + h / 2);
    return `M ${n(cx - rx)} ${cy} A ${n(rx)} ${n(ry)} 0 1 0 ${n(cx + rx)} ${cy} A ${n(rx)} ${n(ry)} 0 1 0 ${n(cx - rx)} ${cy} Z`;
  }
  const x0 = x + inset;
  const x1 = x + w - inset;
  const y0 = y + inset;
  const y1 = y + h - inset;
  const q = (x1 - x0) * 0.22;
  const midY = (y0 + y1) / 2;
  return `M ${n((x0 + x1) / 2)} ${n(y0)} L ${n(x1 - q)} ${n(y0)} L ${n(x1)} ${n(midY)} L ${n(x1 - q)} ${n(y1)} L ${n(x0 + q)} ${n(y1)} L ${n(x0)} ${n(midY)} Z`;
}
