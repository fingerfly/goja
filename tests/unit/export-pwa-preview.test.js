import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  openExportPwaPreview,
  closeExportPwaPreview,
  isExportPwaPreviewOpen,
  resetExportPwaPreviewForTests,
} from '../../js/export-pwa-preview.js';

describe('export-pwa-preview', () => {
  beforeEach(() => {
    resetExportPwaPreviewForTests();
    document.body.innerHTML = '';
  });

  it('opens full-screen preview and closes on button click', () => {
    const onClose = vi.fn();
    const blob = new Blob(['x'], { type: 'image/jpeg' });
    openExportPwaPreview(blob, { closeLabel: 'Done', onClose });

    expect(isExportPwaPreviewOpen()).toBe(true);
    const overlay = document.getElementById('exportPwaPreview');
    expect(overlay?.querySelector('.export-pwa-preview__img')).toBeTruthy();
    expect(overlay?.querySelector('.export-pwa-preview__close')?.textContent)
      .toBe('Done');

    overlay.querySelector('.export-pwa-preview__close').click();
    expect(isExportPwaPreviewOpen()).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closeExportPwaPreview removes open overlay', () => {
    openExportPwaPreview(new Blob(['x'], { type: 'image/png' }), {});
    closeExportPwaPreview();
    expect(isExportPwaPreviewOpen()).toBe(false);
  });
});
