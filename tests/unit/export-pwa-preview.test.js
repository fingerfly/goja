import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  openExportPwaPreview,
  closeExportPwaPreview,
  isExportPwaPreviewOpen,
  shouldUseInAppBlobPreview,
  resetExportPwaPreviewForTests,
} from '../../js/export-pwa-preview.js';

vi.mock('../../js/export-handler.js', () => ({
  isIosLikeDevice: vi.fn(() => true),
}));

vi.mock('../../js/display-mode.js', () => ({
  isStandaloneDisplayMode: vi.fn(() => false),
}));

import { isIosLikeDevice } from '../../js/export-handler.js';
import { isStandaloneDisplayMode } from '../../js/display-mode.js';

describe('export-pwa-preview', () => {
  beforeEach(() => {
    resetExportPwaPreviewForTests();
    document.body.innerHTML = '';
    vi.mocked(isIosLikeDevice).mockReturnValue(true);
    vi.mocked(isStandaloneDisplayMode).mockReturnValue(false);
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

describe('shouldUseInAppBlobPreview', () => {
  beforeEach(() => {
    vi.mocked(isIosLikeDevice).mockReturnValue(true);
    vi.mocked(isStandaloneDisplayMode).mockReturnValue(false);
  });

  it('returns false when not standalone', () => {
    expect(shouldUseInAppBlobPreview()).toBe(false);
  });

  it('returns true on iOS standalone', () => {
    vi.mocked(isStandaloneDisplayMode).mockReturnValue(true);
    expect(shouldUseInAppBlobPreview()).toBe(true);
  });

  it('returns false on non-iOS even when standalone', () => {
    vi.mocked(isIosLikeDevice).mockReturnValue(false);
    vi.mocked(isStandaloneDisplayMode).mockReturnValue(true);
    expect(shouldUseInAppBlobPreview()).toBe(false);
  });
});
