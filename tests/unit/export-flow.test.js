import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runExport, resetExportInProgressForTests } from '../../js/export-flow.js';

describe('runExport', () => {
  let refs;
  let state;
  let deps;

  beforeEach(() => {
    resetExportInProgressForTests();
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
      showExportOptions: vi.fn().mockReturnValue(true),
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

  it('ignores concurrent export while one is in progress', async () => {
    let resolveExport;
    deps.handleExport.mockReturnValue(new Promise((resolve) => {
      resolveExport = resolve;
    }));
    const first = runExport(refs, state, deps);
    await runExport(refs, state, deps);
    expect(deps.handleExport).toHaveBeenCalledTimes(1);
    resolveExport(new Blob(['x'], { type: 'image/jpeg' }));
    await first;
  });

  it('shows error toast when handleExport returns empty blob', async () => {
    deps.handleExport.mockResolvedValue(new Blob([], { type: 'image/jpeg' }));
    await runExport(refs, state, deps);
    expect(deps.showExportOptions).not.toHaveBeenCalled();
    expect(deps.showToast).toHaveBeenCalledWith(
      expect.stringContaining('exportFailed'),
      'error'
    );
  });

  it('shows error toast when showExportOptions cannot open', async () => {
    deps.showExportOptions.mockReturnValue(false);
    await runExport(refs, state, deps);
    expect(deps.showToast).toHaveBeenCalledWith(
      expect.stringContaining('exportFailed'),
      'error'
    );
  });

  it('disables export before frame clamp await completes', async () => {
    refs.frameW.value = '100';
    deps.clampFrameValue.mockReturnValue(320);
    let resolvePreview;
    deps.updatePreview.mockReturnValue(new Promise((resolve) => {
      resolvePreview = resolve;
    }));
    const pending = runExport(refs, state, deps);
    expect(deps.updateActionButtons).toHaveBeenCalledWith(1, true);
    resolvePreview();
    await pending;
  });
});
