/**
 * Purpose: Full-screen export preview inside iOS PWA standalone.
 * Description:
 * - Avoids window.open navigation that orphan export UI on back.
 * - Revokes blob URL on close; Escape and close button dismiss.
 */

let activeCleanup = null;

/** @returns {boolean} */
export function isExportPwaPreviewOpen() {
  return Boolean(document.getElementById('exportPwaPreview'));
}

/** Tear down any open in-app export preview. */
export function closeExportPwaPreview() {
  if (activeCleanup) {
    activeCleanup();
    activeCleanup = null;
  }
}

/**
 * Show a full-screen blob preview with a close control.
 * @param {Blob} blob
 * @param {{ onClose?: () => void, closeLabel?: string }} [options]
 * @returns {() => void} dismiss handler
 */
export function openExportPwaPreview(blob, options = {}) {
  closeExportPwaPreview();
  const url = URL.createObjectURL(blob);
  const { onClose, closeLabel = 'Close' } = options;

  const overlay = document.createElement('div');
  overlay.id = 'exportPwaPreview';
  overlay.className = 'export-pwa-preview';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const img = document.createElement('img');
  img.className = 'export-pwa-preview__img';
  img.src = url;
  img.alt = '';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn btn-primary export-pwa-preview__close';
  closeBtn.textContent = closeLabel;

  overlay.append(img, closeBtn);
  document.body.appendChild(overlay);
  closeBtn.focus();

  const finish = () => {
    document.removeEventListener('keydown', onKeydown);
    overlay.remove();
    URL.revokeObjectURL(url);
    activeCleanup = null;
    onClose?.();
  };

  const onKeydown = (e) => {
    if (e.key === 'Escape') finish();
  };

  closeBtn.addEventListener('click', finish);
  document.addEventListener('keydown', onKeydown);
  activeCleanup = finish;

  return finish;
}

/** @internal Resets module state for unit tests. */
export function resetExportPwaPreviewForTests() {
  closeExportPwaPreview();
}
