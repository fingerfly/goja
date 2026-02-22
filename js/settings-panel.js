let focusReturnEl = null;

export function isOpen(panelEl) {
  return panelEl.classList.contains('open');
}

export function openSettings(panelEl, backdropEl, triggerEl) {
  focusReturnEl = triggerEl || document.activeElement;
  panelEl.classList.add('open');
  backdropEl.classList.add('open');
  panelEl.setAttribute('aria-hidden', 'false');
  const firstFocusable = panelEl.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (firstFocusable) firstFocusable.focus();
}

export function closeSettings(panelEl, backdropEl) {
  panelEl.classList.remove('open');
  backdropEl.classList.remove('open');
  panelEl.setAttribute('aria-hidden', 'true');
  if (focusReturnEl && typeof focusReturnEl.focus === 'function') {
    focusReturnEl.focus();
    focusReturnEl = null;
  }
}

export function initSettingsPanel(panelEl, backdropEl, triggerEl, closeEl) {
  const close = () => closeSettings(panelEl, backdropEl);
  const open = () => openSettings(panelEl, backdropEl, triggerEl);
  triggerEl.addEventListener('click', () => {
    if (isOpen(panelEl)) close(); else open();
  });
  backdropEl.addEventListener('click', close);
  if (closeEl) closeEl.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen(panelEl)) close();
  });
}
