/**
 * Returns true if Share should be shown. Always show on mobile viewport (width < 768px)
 * so Oppo and similar devices see it; navigator.share may exist but detection can fail.
 * When tapped, shareBlob will try share; if unavailable, user gets an error toast.
 */
export function canShareFiles() {
  const hasShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const isNarrowViewport = typeof window !== 'undefined' && window.innerWidth < 768;
  return hasShare || isNarrowViewport;
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
