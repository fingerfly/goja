/**
 * Purpose: Control settings panel open/close and focus restoration.
 * Description:
 * - Keeps dialog state (`open` class + aria-hidden) synchronized.
 * - Restores focus to trigger for keyboard accessibility.
 */
let focusReturnEl = null;

/**
 * Check whether settings panel is currently open.
 * @param {HTMLElement} panelEl
 * @returns {boolean}
 */
export function isOpen(panelEl) {
  return panelEl.classList.contains('open');
}

/**
 * Open settings panel and move focus into the dialog.
 * @param {HTMLElement} panelEl
 * @param {HTMLElement} backdropEl
 * @param {HTMLElement | null} triggerEl
 */
export function openSettings(panelEl, backdropEl, triggerEl) {
  focusReturnEl = triggerEl || document.activeElement;
  panelEl.classList.add('open');
  backdropEl.classList.add('open');
  panelEl.setAttribute('aria-hidden', 'false');
  const firstFocusable = panelEl.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (firstFocusable) firstFocusable.focus();
}

/**
 * Close settings panel and restore focus to trigger element.
 * @param {HTMLElement} panelEl
 * @param {HTMLElement} backdropEl
 */
export function closeSettings(panelEl, backdropEl) {
  panelEl.classList.remove('open');
  backdropEl.classList.remove('open');
  panelEl.setAttribute('aria-hidden', 'true');
  if (focusReturnEl && typeof focusReturnEl.focus === 'function') {
    focusReturnEl.focus();
    focusReturnEl = null;
  }
}

/**
 * Bind settings panel open/close interactions.
 * @param {HTMLElement} panelEl
 * @param {HTMLElement} backdropEl
 * @param {HTMLElement} triggerEl
 * @param {HTMLElement | null} closeEl
 */
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
