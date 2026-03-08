/**
 * Purpose: Apply export-time clipping paths for advanced edge styles.
 * Description:
 * - Builds a deterministic path from cell geometry and style options.
 * - Clips the export canvas context before drawing each cell.
 */
import { buildEdgePathPair } from './edge-shape-engine.js';

/**
 * Apply edge clipping on export canvas for a single cell.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number, width: number, height: number }} cell
 * @param {number} cellIndex
 * @param {Record<string, unknown>} [options]
 * @returns {boolean} True when clipping is applied.
 */
export function applyExportEdgeClip(ctx, cell, cellIndex, options = {}) {
  const supported = options.edgeAdvancedSupported === true;
  const style = options.edgeStyle ?? 'straight';
  if (!ctx || !supported || style === 'straight') return false;
  if (typeof Path2D === 'function') {
    const { globalD } = buildEdgePathPair(cell, cellIndex, {
      ...options,
      boundaryCell: cell,
    });
    const path = new Path2D(globalD);
    ctx.clip(path);
    return true;
  }
  ctx.clip();
  return true;
}
