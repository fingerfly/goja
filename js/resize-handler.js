import { adjustRatio } from './resize-engine.js';

const HANDLE_CLASS = 'resize-handle';
const OVERLAY_CLASS = 'resize-overlay';
const MIN_FRACTION = 0.2;

export function enableGridResize(gridEl, layout, onResize) {
  disableGridResize(gridEl);
  const overlay = document.createElement('div');
  overlay.className = OVERLAY_CLASS;
  gridEl.parentElement.appendChild(overlay);
  overlay._gridEl = gridEl;

  const state = { colRatios: [...layout.colRatios], rowRatios: [...layout.rowRatios] };
  createHandles(overlay, gridEl, layout, state, onResize);

  return () => disableGridResize(gridEl);
}

function disableGridResize(gridEl) {
  const parent = gridEl.parentElement;
  if (!parent) return;
  const old = parent.querySelector(`.${OVERLAY_CLASS}`);
  if (old) old.remove();
}

function createHandles(overlay, gridEl, layout, state, onResize) {
  const rect = gridEl.getBoundingClientRect();
  const padLeft = parseFloat(getComputedStyle(gridEl).paddingLeft) || 0;
  const padTop = parseFloat(getComputedStyle(gridEl).paddingTop) || 0;
  const innerW = rect.width - padLeft * 2;
  const innerH = rect.height - padTop * 2;

  for (let i = 0; i < layout.baseCols - 1; i++) {
    const pos = trackBoundaryPos(state.colRatios, i, innerW, layout.gap);
    const handle = makeHandle('col', padLeft + pos, padTop, layout.gap, innerH);
    attachDrag(handle, 'col', i, state, innerW, layout.gap, onResize,
      () => refreshHandles(overlay, gridEl, layout, state, onResize));
    overlay.appendChild(handle);
  }
  for (let i = 0; i < layout.baseRows - 1; i++) {
    const pos = trackBoundaryPos(state.rowRatios, i, innerH, layout.gap);
    const handle = makeHandle('row', padLeft, padTop + pos, layout.gap, innerW);
    attachDrag(handle, 'row', i, state, innerH, layout.gap, onResize,
      () => refreshHandles(overlay, gridEl, layout, state, onResize));
    overlay.appendChild(handle);
  }
}

function trackBoundaryPos(ratios, index, totalPx, gap) {
  const sum = ratios.reduce((a, b) => a + b, 0);
  const available = totalPx - gap * (ratios.length - 1);
  let pos = 0;
  for (let i = 0; i <= index; i++) {
    pos += (ratios[i] / sum) * available;
    pos += gap;
  }
  return pos - gap / 2;
}

function makeHandle(axis, left, top, gapOrWidth, extent) {
  const el = document.createElement('div');
  el.className = `${HANDLE_CLASS} ${HANDLE_CLASS}--${axis}`;
  if (axis === 'col') {
    Object.assign(el.style, { left: `${left - 22}px`, top: `${top}px`, height: `${extent}px` });
  } else {
    Object.assign(el.style, { left: `${left}px`, top: `${top - 22}px`, width: `${extent}px` });
  }
  return el;
}

function refreshHandles(overlay, gridEl, layout, state, onResize) {
  overlay.innerHTML = '';
  createHandles(overlay, gridEl, layout, state, onResize);
}

function attachDrag(handle, axis, index, state, totalPx, gap, onResize, refresh) {
  let startPos = 0;
  const prop = axis === 'col' ? 'clientX' : 'clientY';
  const ratioKey = axis === 'col' ? 'colRatios' : 'rowRatios';

  const onMove = (e) => {
    const pos = e.touches ? e.touches[0][prop] : e[prop];
    const delta = pos - startPos;
    startPos = pos;
    state[ratioKey] = adjustRatio(state[ratioKey], index, delta, totalPx, MIN_FRACTION);
    onResize({ colRatios: [...state.colRatios], rowRatios: [...state.rowRatios] });
  };
  const onEnd = () => {
    handle.classList.remove('active');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
    refresh();
  };
  const onStart = (e) => {
    e.preventDefault();
    handle.classList.add('active');
    startPos = e.touches ? e.touches[0][prop] : e[prop];
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  };
  handle.addEventListener('mousedown', onStart);
  handle.addEventListener('touchstart', onStart, { passive: false });
}
