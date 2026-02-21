export function defaultRatios(count) {
  return Array(count).fill(1);
}

export function ratiosToFrString(ratios) {
  return ratios.map(r => `${r}fr`).join(' ');
}

export function adjustRatio(ratios, index, deltaPx, totalPx, minFraction = 0.2) {
  if (deltaPx === 0) return [...ratios];
  const result = [...ratios];
  const sum = result.reduce((a, b) => a + b, 0);
  const pxPerRatio = totalPx / sum;
  const deltaRatio = deltaPx / pxPerRatio;
  const minVal = (sum / ratios.length) * minFraction;

  result[index] += deltaRatio;
  result[index + 1] -= deltaRatio;

  if (result[index] < minVal) {
    const diff = minVal - result[index];
    result[index] = minVal;
    result[index + 1] -= diff;
  }
  if (result[index + 1] < minVal) {
    const diff = minVal - result[index + 1];
    result[index + 1] = minVal;
    result[index] -= diff;
  }
  return result;
}

function trackSizes(ratios, totalPx, gap) {
  const count = ratios.length;
  const available = totalPx - gap * (count - 1);
  const sum = ratios.reduce((a, b) => a + b, 0);
  return ratios.map(r => (r / sum) * available);
}

function trackPositions(sizes, gap) {
  const pos = [0];
  for (let i = 1; i < sizes.length; i++) {
    pos.push(pos[i - 1] + sizes[i - 1] + gap);
  }
  return pos;
}

export function recomputePixelCells(layout) {
  const { baseCols, baseRows, gap, canvasWidth, colRatios, rowRatios, cells } = layout;
  const colSizes = trackSizes(colRatios, canvasWidth, gap);
  const colPos = trackPositions(colSizes, gap);
  const colUnit = (canvasWidth - gap * (baseCols - 1)) / baseCols;
  const totalRowPx = baseRows * colUnit + (baseRows - 1) * gap;
  const rowSizes = trackSizes(rowRatios, totalRowPx, gap);
  const rowPos = trackPositions(rowSizes, gap);

  return cells.map(cell => {
    const ci = cell.colStart - 1;
    const ri = cell.rowStart - 1;
    const colSpan = cell.colEnd - cell.colStart;
    const rowSpan = cell.rowEnd - cell.rowStart;
    let w = 0;
    for (let c = ci; c < ci + colSpan; c++) w += colSizes[c];
    w += (colSpan - 1) * gap;
    let h = 0;
    for (let r = ri; r < ri + rowSpan; r++) h += rowSizes[r];
    h += (rowSpan - 1) * gap;

    return {
      rowStart: cell.rowStart, rowEnd: cell.rowEnd,
      colStart: cell.colStart, colEnd: cell.colEnd,
      x: Math.round(colPos[ci]), y: Math.round(rowPos[ri]),
      width: Math.round(w), height: Math.round(h),
    };
  });
}
