import { buildEdgePathPair } from './edge-shape-engine.js';

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
