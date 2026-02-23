import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runExport } from '../../js/export-flow.js';

describe('runExport', () => {
  let refs;
  let state;
  let deps;

  beforeEach(() => {
    refs = {
      frameW: { value: '1080' },
      frameH: { value: '720' },
      exportFilename: { value: 'goja-grid' },
      exportUseDate: { checked: false },
      formatSelect: { value: 'image/jpeg' },
      exportBtn: document.createElement('button'),
    };
    state = {
      photos: [{ url: 'blob:1', width: 100, height: 100 }],
      currentLayout: { cells: [], gap: 0, canvasWidth: 1080, canvasHeight: 720 },
    };
    deps = {
      clampFrameValue: vi.fn((v) => parseInt(v, 10) || 320),
      showToast: vi.fn(),
      t: (k) => k,
      buildForm: vi.fn().mockReturnValue({ format: 'image/jpeg' }),
      getGridEffectsOptions: vi.fn().mockReturnValue({}),
      handleExport: vi.fn().mockResolvedValue(new Blob(['x'], { type: 'image/jpeg' })),
      showExportOptions: vi.fn(),
      downloadBlob: vi.fn(),
      shareBlob: vi.fn(),
      copyBlobToClipboard: vi.fn(),
      formatDateTimeOriginal: vi.fn(),
      getLocale: vi.fn().mockReturnValue('en'),
      updateActionButtons: vi.fn(),
      updatePreview: vi.fn().mockResolvedValue(),
    };
  });

  it('returns early when no photos or layout', async () => {
    await runExport(refs, { photos: [], currentLayout: null }, deps);
    expect(deps.handleExport).not.toHaveBeenCalled();
  });

  it('calls handleExport and showExportOptions when photos and layout exist', async () => {
    await runExport(refs, state, deps);
    expect(deps.handleExport).toHaveBeenCalledWith(state.photos, state.currentLayout, expect.any(Object));
    expect(deps.showExportOptions).toHaveBeenCalled();
    expect(deps.updateActionButtons).toHaveBeenCalledWith(1, true);
    expect(deps.updateActionButtons).toHaveBeenCalledWith(1, false);
  });

  it('calls updatePreview when frame values are clamped', async () => {
    refs.frameW.value = '100';
    deps.clampFrameValue.mockReturnValue(320);
    await runExport(refs, state, deps);
    expect(deps.showToast).toHaveBeenCalledWith('frameDimensionClamped', 'error');
    expect(deps.updatePreview).toHaveBeenCalled();
  });

  it('passes sanitized filename to showExportOptions when exportFilename has reserved chars', async () => {
    refs.exportFilename.value = '../etc/passwd';
    await runExport(refs, state, deps);
    const call = deps.showExportOptions.mock.calls[0];
    expect(call[1]).not.toMatch(/[\/\\?%*:|"<>]/);
    expect(call[1]).toBe('etcpasswd');
  });
});
