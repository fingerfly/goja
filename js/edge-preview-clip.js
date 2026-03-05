import { buildCellEdgePathD } from './edge-shape-engine.js';

export function applyPreviewEdgeClip(cellEl, cell, cellIndex, options = {}) {
  const supported = options.edgeAdvancedSupported === true;
  const style = options.edgeStyle ?? 'straight';
  if (!cellEl || !supported || style === 'straight') {
    cellEl?.style.removeProperty('clip-path');
    cellEl?.style.removeProperty('-webkit-clip-path');
    return;
  }
  const localCell = { x: 0, y: 0, width: cell.width, height: cell.height };
  const d = buildCellEdgePathD(localCell, cellIndex, {
    ...options,
    boundaryCell: cell,
  });
  const pathExpr = `path('${d}')`;
  cellEl.style.clipPath = pathExpr;
  cellEl.style.setProperty('-webkit-clip-path', pathExpr);
}
