import {
  ROTATION_DEFAULT_ANGLE,
  ROTATION_KEYBOARD_STEP,
} from './config.js';
import { computeAngleDeg, fitScaleFactor, normalizeAngle } from './rotation-math.js';

export function applyCellRotation(cellEl, angleDeg, width, height) {
  const angle = normalizeAngle(angleDeg);
  const scale = fitScaleFactor(angle, width, height);
  cellEl.style.transform = `rotate(${angle}deg) scale(${scale})`;
  cellEl.style.setProperty('--cell-scale', String(scale));
  return angle;
}

function pointFromEvent(e) {
  const touch = e.touches?.[0] || e.changedTouches?.[0];
  return touch ? { x: touch.clientX, y: touch.clientY } : { x: e.clientX, y: e.clientY };
}

function getPhotoIndex(layout, cellIndex) {
  const order = layout?.photoOrder;
  return order ? order[cellIndex] : cellIndex;
}

export function enableRotation(gridEl, getPhotos, getLayout, onRotate, onRotateStart, getAriaLabel = () => 'Rotate photo') {
  gridEl.querySelectorAll('.rotation-handle').forEach((el) => el.remove());
  const cells = Array.from(gridEl.querySelectorAll('.preview-cell'));

  cells.forEach((cellEl, cellIndex) => {
    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'rotation-handle';
    handle.setAttribute('aria-label', getAriaLabel());
    cellEl.appendChild(handle);

    let raf = 0;
    let lastEvent = null;
    let finalAngle = ROTATION_DEFAULT_ANGLE;

    const applyFromPointer = () => {
      raf = 0;
      if (!lastEvent) return;
      const layout = getLayout();
      const pixelCell = layout?.cells?.[cellIndex];
      if (!pixelCell) return;
      const rect = cellEl.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const p = pointFromEvent(lastEvent);
      finalAngle = computeAngleDeg(centerX, centerY, p.x, p.y);
      applyCellRotation(cellEl, finalAngle, pixelCell.width, pixelCell.height);
    };
    const queueApply = (e) => {
      lastEvent = e;
      if (!raf) raf = requestAnimationFrame(applyFromPointer);
    };

    const onMove = (e) => { e.preventDefault(); queueApply(e); };
    const onEnd = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      if (raf) cancelAnimationFrame(raf);
      onRotate(cellIndex, finalAngle);
    };
    const onStart = (e) => {
      e.preventDefault();
      e.stopPropagation();
      onRotateStart(cellIndex);
      queueApply(e);
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    };
    handle.addEventListener('mousedown', onStart);
    handle.addEventListener('touchstart', onStart, { passive: false });
    handle.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const layout = getLayout();
      const pixelCell = layout?.cells?.[cellIndex];
      if (!pixelCell) return;
      const photoIdx = getPhotoIndex(layout, cellIndex);
      const photos = getPhotos();
      const current = photos?.[photoIdx]?.angle ?? ROTATION_DEFAULT_ANGLE;
      const delta = e.key === 'ArrowRight' ? ROTATION_KEYBOARD_STEP : -ROTATION_KEYBOARD_STEP;
      const next = normalizeAngle(current + delta);
      onRotateStart(cellIndex);
      applyCellRotation(cellEl, next, pixelCell.width, pixelCell.height);
      onRotate(cellIndex, next);
    });
  });

  return () => gridEl.querySelectorAll('.rotation-handle').forEach((el) => el.remove());
}
