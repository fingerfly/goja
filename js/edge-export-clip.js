import { buildCellEdgePathD } from './edge-shape-engine.js';

export function applyExportEdgeClip(ctx, cell, cellIndex, options = {}) {
  const supported = options.edgeAdvancedSupported === true;
  const style = options.edgeStyle ?? 'straight';
  if (!ctx || !supported || style === 'straight') return false;
  if (typeof Path2D === 'function') {
    const path = new Path2D(buildCellEdgePathD(cell, cellIndex, options));
    ctx.clip(path);
    return true;
  }
  ctx.clip();
  return true;
}
