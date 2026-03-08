/**
 * Purpose: Apply preview-time clip paths for advanced edge styles.
 * Description:
 * - Generates local path expressions for each preview cell.
 * - Removes clip-path styles when feature/style is unavailable.
 */
import { buildEdgePathPair } from './edge-shape-engine.js';

/**
 * Apply or clear edge clip-path on a preview cell element.
 * @param {HTMLElement} cellEl
 * @param {{ x: number, y: number, width: number, height: number }} cell
 * @param {number} cellIndex
 * @param {Record<string, unknown>} [options]
 */
export function applyPreviewEdgeClip(cellEl, cell, cellIndex, options = {}) {
  const supported = options.edgeAdvancedSupported === true;
  const style = options.edgeStyle ?? 'straight';
  if (!cellEl || !supported || style === 'straight') {
    cellEl?.style.removeProperty('clip-path');
    cellEl?.style.removeProperty('-webkit-clip-path');
    return;
  }
  const { localD } = buildEdgePathPair(cell, cellIndex, {
    ...options,
    boundaryCell: cell,
  });
  const pathExpr = `path('${localD}')`;
  cellEl.style.clipPath = pathExpr;
  cellEl.style.setProperty('-webkit-clip-path', pathExpr);
}
