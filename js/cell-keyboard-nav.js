/**
 * Keyboard navigation for grid cells: Arrow keys move focus, Alt+Arrow swaps with previous/next.
 */
export function enableCellKeyboardNav(gridEl, getLayout, onSwap) {
  function getCells() {
    return Array.from(gridEl.querySelectorAll('img[tabindex="0"]'));
  }

  function getCellIndex(el) {
    const cells = getCells();
    const img = el?.closest?.('img') || el;
    return img && cells.includes(img) ? cells.indexOf(img) : -1;
  }

  function getLayoutCells() {
    const layout = getLayout();
    return layout?.cells || [];
  }

  /** Build (rowStart, colStart) sorted order for arrow navigation */
  function getNavOrder() {
    const cells = getLayoutCells();
    const indices = cells.map((c, i) => ({
      i,
      row: c.rowStart,
      col: c.colStart,
    }));
    indices.sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col);
    return indices.map((x) => x.i);
  }

  gridEl.addEventListener('keydown', (e) => {
    const cells = getCells();
    if (cells.length === 0) return;
    const current = document.activeElement;
    const idx = getCellIndex(current);
    if (idx === -1) return;

    const layout = getLayout();
    if (!layout) return;

    if (e.altKey) {
      if (e.key === 'ArrowLeft' && idx > 0) {
        e.preventDefault();
        onSwap(idx, idx - 1);
        return;
      }
      if (e.key === 'ArrowRight' && idx < cells.length - 1) {
        e.preventDefault();
        onSwap(idx, idx + 1);
        return;
      }
      return;
    }

    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();

    const navOrder = getNavOrder();
    const navIdx = navOrder.indexOf(idx);
    if (navIdx === -1) return;

    let nextIdx = -1;
    if (e.key === 'ArrowLeft') {
      nextIdx = navIdx > 0 ? navOrder[navIdx - 1] : -1;
    } else if (e.key === 'ArrowRight') {
      nextIdx = navIdx < navOrder.length - 1 ? navOrder[navIdx + 1] : -1;
    } else {
      const layoutCells = getLayoutCells();
      const cur = layoutCells[idx];
      if (!cur) return;
      const isUp = e.key === 'ArrowUp';
      const candidates = layoutCells
        .map((c, i) => ({ i, ...c }))
        .filter((c) => {
          const colOverlap = c.colStart < cur.colEnd && c.colEnd > cur.colStart;
          return isUp
            ? colOverlap && c.rowEnd <= cur.rowStart
            : colOverlap && c.rowStart >= cur.rowEnd;
        });
      const pick = candidates.length === 0 ? null
        : isUp ? candidates.reduce((a, b) => (b.rowEnd > a.rowEnd ? b : a))
        : candidates.reduce((a, b) => (b.rowStart < a.rowStart ? b : a));
      nextIdx = pick ? pick.i : -1;
    }

    if (nextIdx >= 0 && cells[nextIdx]) {
      cells[nextIdx].focus();
    }
  });
}
