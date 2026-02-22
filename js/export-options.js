/**
 * Returns true if Share should be shown. Only show when navigator.share exists.
 * Browsers without Web Share API (e.g. OPPO built-in) must not show Share to avoid "Share not supported" error.
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

function close(sheetEl, backdropEl) {
  sheetEl.classList.remove('open');
  backdropEl.classList.remove('open');
  sheetEl.setAttribute('aria-hidden', 'true');
  backdropEl.setAttribute('aria-hidden', 'true');
  if (focusReturnEl?.focus) {
    focusReturnEl.focus();
    focusReturnEl = null;
  }
}

export function showExportOptions(blob, filename, format, callbacks, options = {}) {
  const sheetEl = document.getElementById('exportOptionsSheet');
  const backdropEl = document.getElementById('exportOptionsBackdrop');
  const shareBtn = document.getElementById('exportOptionShare');
  const downloadBtn = document.getElementById('exportOptionDownload');
  const copyBtn = document.getElementById('exportOptionCopy');
  const openTabBtn = document.getElementById('exportOptionOpenInNewTab');
  const closeBtn = document.getElementById('exportOptionsCloseBtn');

  if (!sheetEl || !backdropEl) return;

  const showShare = canShareFiles();
  const showCopy = canCopyImage(blob);

  shareBtn.style.display = showShare ? '' : 'none';
  copyBtn.style.display = showCopy ? '' : 'none';
  downloadBtn.style.display = '';
  openTabBtn.style.display = '';

  if (showShare) {
    shareBtn.classList.add('btn-primary');
    shareBtn.classList.remove('btn-secondary');
    downloadBtn.classList.remove('btn-primary');
    downloadBtn.classList.add('btn-secondary');
  } else {
    shareBtn.classList.remove('btn-primary');
    shareBtn.classList.add('btn-secondary');
    downloadBtn.classList.add('btn-primary');
    downloadBtn.classList.remove('btn-secondary');
  }

  focusReturnEl = options.focusReturnEl || document.activeElement;

  const cleanup = () => {
    backdropEl.removeEventListener('click', handleClose);
    closeBtn?.removeEventListener('click', handleClose);
    document.removeEventListener('keydown', onKeydown);
  };

  const handleClose = () => {
    close(sheetEl, backdropEl);
    cleanup();
  };

  const onKeydown = (e) => {
    if (e.key === 'Escape') handleClose();
  };

  shareBtn.onclick = () => {
    callbacks.onShare?.();
    handleClose();
  };

  downloadBtn.onclick = () => {
    callbacks.onDownload?.();
    handleClose();
  };

  copyBtn.onclick = () => {
    callbacks.onCopy?.();
    handleClose();
  };

  openTabBtn.onclick = () => {
    callbacks.onOpenInNewTab?.();
    handleClose();
  };

  backdropEl.addEventListener('click', handleClose);
  closeBtn?.addEventListener('click', handleClose);
  document.addEventListener('keydown', onKeydown);

  sheetEl.classList.add('open');
  backdropEl.classList.add('open');
  sheetEl.setAttribute('aria-hidden', 'false');
  backdropEl.setAttribute('aria-hidden', 'false');

  const firstVisible = [shareBtn, downloadBtn, copyBtn, openTabBtn].find((b) => b?.style?.display !== 'none');
  if (firstVisible) firstVisible.focus();
}
