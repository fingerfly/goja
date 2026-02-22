/**
 * Context menu for grid cells: right-click (desktop) and long-press (touch).
 * Provides "Remove" action to remove a single photo.
 */
const LONG_PRESS_MS = 500;

let longPressTimer = null;
let touchStartCell = null;

export function enableCellContextMenu(gridEl, getLayout, onRemove, t = (k) => k) {
  gridEl.addEventListener('contextmenu', (e) => {
    if (e.target.closest('img')) e.preventDefault();
  }, { capture: true });

  gridEl.addEventListener('contextmenu', (e) => {
    const img = e.target.closest('img');
    if (!img) return;
    e.preventDefault();
    const idx = getCellIndex(gridEl, img);
    if (idx === -1) return;
    showContextMenu(e.clientX, e.clientY, idx, onRemove, t);
  });

  gridEl.addEventListener('touchstart', (e) => {
    const img = e.target.closest('img');
    if (!img) return;
    const touch = e.touches[0];
    if (!touch) return;
    touchStartCell = {
      img,
      idx: getCellIndex(gridEl, img),
      clientX: touch.clientX,
      clientY: touch.clientY,
    };
    longPressTimer = setTimeout(() => {
      longPressTimer = null;
      if (touchStartCell && touchStartCell.idx !== -1) {
        showContextMenu(touchStartCell.clientX, touchStartCell.clientY, touchStartCell.idx, onRemove, t);
      }
      touchStartCell = null;
    }, LONG_PRESS_MS);
  }, { passive: true });

  gridEl.addEventListener('touchmove', () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      touchStartCell = null;
    }
  }, { passive: true });

  gridEl.addEventListener('touchend', () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    touchStartCell = null;
  }, { passive: true });
}

function getCellIndex(gridEl, imgEl) {
  const imgs = Array.from(gridEl.querySelectorAll('img'));
  return imgs.indexOf(imgEl);
}

function showContextMenu(clientX, clientY, cellIndex, onRemove, t) {
  dismissExistingMenu();

  const menu = document.createElement('div');
  menu.className = 'cell-context-menu';
  Object.assign(menu.style, {
    position: 'fixed',
    left: `${clientX}px`,
    top: `${clientY}px`,
    minWidth: '120px',
    padding: '4px 0',
    background: 'var(--color-surface, #fff)',
    border: '1px solid var(--color-border, #e2e8f0)',
    borderRadius: 'var(--radius-md, 10px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 10000,
  });

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = t('removePhoto');
  Object.assign(removeBtn.style, {
    display: 'block',
    width: '100%',
    padding: '10px 16px',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: 'var(--font-size-base, 1rem)',
    color: 'var(--color-text, #1e293b)',
  });
  removeBtn.addEventListener('click', () => {
    onRemove(cellIndex);
    menu.remove();
  });
  removeBtn.addEventListener('mouseenter', () => {
    removeBtn.style.background = 'var(--color-drop-zone, #f0fdfa)';
  });
  removeBtn.addEventListener('mouseleave', () => {
    removeBtn.style.background = 'none';
  });

  menu.appendChild(removeBtn);
  document.body.appendChild(menu);

  const viewport = { w: window.innerWidth, h: window.innerHeight };
  const rect = menu.getBoundingClientRect();
  if (clientX + rect.width > viewport.w) menu.style.left = `${viewport.w - rect.width - 8}px`;
  if (clientY + rect.height > viewport.h) menu.style.top = `${viewport.h - rect.height - 8}px`;
  if (clientX < 8) menu.style.left = '8px';
  if (clientY < 8) menu.style.top = '8px';

  const close = () => { menu.remove(); document.removeEventListener('click', close); };
  setTimeout(() => document.addEventListener('click', close), 0);
}

function dismissExistingMenu() {
  document.querySelectorAll('.cell-context-menu').forEach((el) => el.remove());
}
