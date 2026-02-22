const MINIMAL_PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);

/**
 * Returns true if Share should be shown. Uses actual blob when available for more accurate
 * detection. On mobile (touch devices), falls back to showing Share when navigator.share
 * exists even if canShare returns false, since some Android browsers (e.g. Oppo) support
 * share but canShare may incorrectly return false.
 */
export function canShareFiles(blob) {
  if (!navigator.share) return false;
  try {
    const data = blob
      ? { files: [new File([blob], 'image.png', { type: blob.type })], title: '' }
      : { files: [new File([MINIMAL_PNG], 'x.png', { type: 'image/png' })], title: '' };
    if (navigator.canShare && navigator.canShare(data)) return true;
    return navigator.maxTouchPoints > 0;
  } catch {
    return navigator.maxTouchPoints > 0;
  }
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
  const { t = (k) => k } = options;
  const sheetEl = document.getElementById('exportOptionsSheet');
  const backdropEl = document.getElementById('exportOptionsBackdrop');
  const shareBtn = document.getElementById('exportOptionShare');
  const downloadBtn = document.getElementById('exportOptionDownload');
  const copyBtn = document.getElementById('exportOptionCopy');
  const openTabBtn = document.getElementById('exportOptionOpenInNewTab');
  const closeBtn = document.getElementById('exportOptionsCloseBtn');

  if (!sheetEl || !backdropEl) return;

  const showShare = canShareFiles(blob);
  const showCopy = canCopyImage(blob);

  shareBtn.style.display = showShare ? '' : 'none';
  copyBtn.style.display = showCopy ? '' : 'none';
  downloadBtn.style.display = '';
  openTabBtn.style.display = '';

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
