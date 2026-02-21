export function isOpen(panelEl) {
  return panelEl.classList.contains('open');
}

export function openSettings(panelEl, backdropEl) {
  panelEl.classList.add('open');
  backdropEl.classList.add('open');
  panelEl.setAttribute('aria-hidden', 'false');
}

export function closeSettings(panelEl, backdropEl) {
  panelEl.classList.remove('open');
  backdropEl.classList.remove('open');
  panelEl.setAttribute('aria-hidden', 'true');
}

export function initSettingsPanel(panelEl, backdropEl, triggerEl, closeEl) {
  const close = () => closeSettings(panelEl, backdropEl);
  triggerEl.addEventListener('click', () => {
    if (isOpen(panelEl)) close(); else openSettings(panelEl, backdropEl);
  });
  backdropEl.addEventListener('click', close);
  if (closeEl) closeEl.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen(panelEl)) close();
  });
}
