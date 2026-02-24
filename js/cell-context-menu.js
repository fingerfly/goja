const TAP_MAX_MOVE_PX = 8;
const TAP_MAX_DURATION_MS = 250;
const TOUCH_CONTEXTMENU_GUARD_MS = 700;

export function enableCellContextMenu(gridEl, getLayout, onRemove, t = (k) => k) {
  let touchState = null;
  let lastTouchAt = 0;

  gridEl.addEventListener('contextmenu', (e) => {
    const img = e.target.closest('img');
    if (!img) return;
    e.preventDefault();
    if (Date.now() - lastTouchAt < TOUCH_CONTEXTMENU_GUARD_MS) return;
    const idx = getCellIndex(gridEl, img);
    if (idx !== -1) showContextMenu(e.clientX, e.clientY, idx, onRemove, t);
  }, { capture: true });

  gridEl.addEventListener('touchstart', (e) => {
    const img = e.target.closest('img');
    const touch = e.touches?.[0];
    if (!img || !touch) return;
    touchState = { img, idx: getCellIndex(gridEl, img), x: touch.clientX, y: touch.clientY, moved: false, startedAt: Date.now() };
  }, { passive: true });

  gridEl.addEventListener('touchmove', (e) => {
    if (!touchState) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    const dx = touch.clientX - touchState.x;
    const dy = touch.clientY - touchState.y;
    touchState.moved = touchState.moved || Math.hypot(dx, dy) > TAP_MAX_MOVE_PX;
  }, { passive: true });

  gridEl.addEventListener('touchend', (e) => {
    lastTouchAt = Date.now();
    if (!touchState) return;
    const touch = e.changedTouches?.[0];
    const duration = Date.now() - touchState.startedAt;
    const isTap = touchState.idx !== -1 && !touchState.moved && duration <= TAP_MAX_DURATION_MS;
    if (isTap) showContextMenu(touch.clientX, touch.clientY, touchState.idx, onRemove, t);
    touchState = null;
  }, { passive: true });

  gridEl.addEventListener('touchcancel', () => { touchState = null; }, { passive: true });
}

function getCellIndex(gridEl, imgEl) {
  return Array.from(gridEl.querySelectorAll('img')).indexOf(imgEl);
}

function showContextMenu(clientX, clientY, cellIndex, onRemove, t) {
  dismissExistingMenu();
  const menu = document.createElement('div');
  menu.className = 'cell-context-menu';
  menu.style.left = `${clientX}px`;
  menu.style.top = `${clientY}px`;
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'cell-context-menu__btn';
  removeBtn.textContent = t('removePhoto');
  removeBtn.addEventListener('click', () => { onRemove(cellIndex); menu.remove(); });
  menu.appendChild(removeBtn);
  document.body.appendChild(menu);
  const rect = menu.getBoundingClientRect();
  if (clientX + rect.width > window.innerWidth) menu.style.left = `${window.innerWidth - rect.width - 8}px`;
  if (clientY + rect.height > window.innerHeight) menu.style.top = `${window.innerHeight - rect.height - 8}px`;
  if (clientX < 8) menu.style.left = '8px';
  if (clientY < 8) menu.style.top = '8px';
  const close = () => { menu.remove(); document.removeEventListener('click', close); };
  setTimeout(() => document.addEventListener('click', close), 0);
}

function dismissExistingMenu() {
  document.querySelector('.cell-context-menu')?.remove();
}
