/**
 * Purpose: Export options sheet after a successful render.
 * Description:
 * - Shows share/download/copy/open actions for the exported blob.
 * - Tears down prior sheet listeners before reopening.
 * - Returns focus to the export button when the sheet closes.
 */
export function canShareFiles() {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export function canCopyImage(blob) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    return false;
  }
  if (typeof ClipboardItem.supports === 'function' && !ClipboardItem.supports(blob.type)) {
    return false;
  }
  return true;
}

let focusReturnEl = null;
let activeCleanup = null;
let dismissCallback = null;

/** @returns {boolean} Whether the export options sheet or backdrop is visible. */
export function isExportOptionsOpen() {
  const sheetEl = document.getElementById('exportOptionsSheet');
  const backdropEl = document.getElementById('exportOptionsBackdrop');
  return Boolean(
    sheetEl?.classList.contains('open') || backdropEl?.classList.contains('open')
  );
}

/**
 * Close the export options sheet and run any pending listener cleanup.
 * @param {boolean} [restoreFocus=true]
 * @param {{ notify?: boolean }} [options]
 */
export function dismissExportOptions(restoreFocus = true, options = {}) {
  const notify = options.notify !== false;
  if (activeCleanup) {
    activeCleanup();
    activeCleanup = null;
  }
  const sheetEl = document.getElementById('exportOptionsSheet');
  const backdropEl = document.getElementById('exportOptionsBackdrop');
  if (!sheetEl || !backdropEl) {
    if (notify) invokeDismissCallback();
    return;
  }
  sheetEl.classList.remove('open');
  backdropEl.classList.remove('open');
  sheetEl.setAttribute('aria-hidden', 'true');
  backdropEl.setAttribute('aria-hidden', 'true');
  if (restoreFocus && focusReturnEl?.focus) {
    const el = focusReturnEl;
    focusReturnEl = null;
    requestAnimationFrame(() => el.focus());
  } else if (!restoreFocus) {
    focusReturnEl = null;
  }
  if (notify) invokeDismissCallback();
}

function invokeDismissCallback() {
  const cb = dismissCallback;
  dismissCallback = null;
  if (cb) cb();
}

/**
 * Show export action sheet for a rendered blob.
 * @param {Blob} blob
 * @param {string} filename
 * @param {string} format
 * @param {object} callbacks
 * @param {object} [options]
 * @returns {boolean} false when blob or required DOM is missing
 */
export function showExportOptions(blob, filename, format, callbacks, options = {}) {
  if (!(blob instanceof Blob) || blob.size === 0) return false;

  const sheetEl = document.getElementById('exportOptionsSheet');
  const backdropEl = document.getElementById('exportOptionsBackdrop');
  const shareBtn = document.getElementById('exportOptionShare');
  const downloadBtn = document.getElementById('exportOptionDownload');
  const copyBtn = document.getElementById('exportOptionCopy');
  const openTabBtn = document.getElementById('exportOptionOpenInNewTab');
  const closeBtn = document.getElementById('exportOptionsCloseBtn');

  if (!sheetEl || !backdropEl || !downloadBtn || !openTabBtn) return false;

  dismissExportOptions(false, { notify: false });
  dismissCallback = options.onDismiss ?? null;

  const showShare = canShareFiles() && shareBtn;
  const showCopy = canCopyImage(blob) && copyBtn;

  if (shareBtn) {
    shareBtn.style.display = showShare ? '' : 'none';
  }
  if (copyBtn) {
    copyBtn.style.display = showCopy ? '' : 'none';
  }
  downloadBtn.style.display = '';
  openTabBtn.style.display = '';

  if (showShare) {
    shareBtn.classList.add('btn-primary');
    shareBtn.classList.remove('btn-secondary');
    downloadBtn.classList.remove('btn-primary');
    downloadBtn.classList.add('btn-secondary');
  } else {
    shareBtn?.classList.remove('btn-primary');
    shareBtn?.classList.add('btn-secondary');
    downloadBtn.classList.add('btn-primary');
    downloadBtn.classList.remove('btn-secondary');
  }

  focusReturnEl = options.focusReturnEl || document.activeElement;

  const cleanup = () => {
    backdropEl.removeEventListener('click', handleClose);
    closeBtn?.removeEventListener('click', handleClose);
    document.removeEventListener('keydown', onKeydown);
    if (shareBtn) shareBtn.onclick = null;
    downloadBtn.onclick = null;
    if (copyBtn) copyBtn.onclick = null;
    openTabBtn.onclick = null;
    activeCleanup = null;
  };

  const handleClose = (restoreFocus = true) => {
    dismissExportOptions(restoreFocus);
  };

  const onKeydown = (e) => {
    if (e.key === 'Escape') handleClose();
  };

  const runOption = (callback, restoreFocus = true) => (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    callback?.();
    handleClose(restoreFocus);
  };

  if (shareBtn) {
    shareBtn.onclick = runOption(callbacks.onShare);
  }

  downloadBtn.onclick = runOption(callbacks.onDownload);

  if (copyBtn) {
    copyBtn.onclick = runOption(callbacks.onCopy);
  }

  openTabBtn.onclick = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const openTab = callbacks.onOpenInNewTab;
    handleClose(false);
    openTab?.();
  };

  backdropEl.addEventListener('click', () => handleClose());
  closeBtn?.addEventListener('click', () => handleClose());
  document.addEventListener('keydown', onKeydown);
  activeCleanup = cleanup;

  sheetEl.classList.add('open');
  backdropEl.classList.add('open');
  sheetEl.setAttribute('aria-hidden', 'false');
  backdropEl.setAttribute('aria-hidden', 'false');

  const firstVisible = [shareBtn, downloadBtn, copyBtn, openTabBtn]
    .filter(Boolean)
    .find((b) => b.style.display !== 'none');
  if (firstVisible) firstVisible.focus();
  return true;
}

/** @internal Resets module state for unit tests. */
export function resetExportOptionsStateForTests() {
  focusReturnEl = null;
  activeCleanup = null;
  dismissCallback = null;
}
