import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../js/export-pwa-preview.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    shouldUseInAppBlobPreview: vi.fn(() => false),
  };
});

import { shouldUseInAppBlobPreview } from '../../js/export-pwa-preview.js';
import {
  runExport,
  resetExportInProgressForTests,
  isExportInProgress,
  isExportRendering,
  forceExportUiReset,
  getExportPhase,
} from '../../js/export-flow.js';
import { installExportPageLifecycle } from '../../js/export-page-lifecycle.js';
import { isExportOptionsOpen } from '../../js/export-options.js';

function lifecycleAdapters(state, updateActionButtons) {
  return {
    forceExportUiReset,
    isExportInProgress,
    isExportOptionsOpen,
    getExportPhase,
  };
}

describe('runExport', () => {
  let refs;
  let state;
  let deps;

  beforeEach(() => {
    resetExportInProgressForTests();
    vi.mocked(shouldUseInAppBlobPreview).mockReturnValue(false);
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

  it('re-enables export when the options sheet dismisses', async () => {
    deps.showExportOptions.mockImplementation((_blob, _name, _fmt, _handlers, opts) => {
      opts?.onDismiss?.();
      return true;
    });
    await runExport(refs, state, deps);
    expect(deps.updateActionButtons).toHaveBeenCalledWith(1, false);
  });

  it('does not show success toast for open in new tab handler', async () => {
    deps.showExportOptions.mockImplementation((blob, filename, format, handlers) => {
      handlers.onOpenInNewTab?.();
      return true;
    });
    await runExport(refs, state, deps);
    expect(deps.showToast).not.toHaveBeenCalledWith('exportSuccess', 'success');
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

  it('cancels hung render and starts a new export on second click', async () => {
    let resolveFirst;
    let callCount = 0;
    deps.handleExport.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      }
      return Promise.resolve(new Blob(['x'], { type: 'image/jpeg' }));
    });
    deps.showExportOptions.mockReturnValue(true);
    const first = runExport(refs, state, deps);
    await runExport(refs, state, deps);
    expect(deps.handleExport).toHaveBeenCalledTimes(2);
    resolveFirst(new Blob(['x'], { type: 'image/jpeg' }));
    await first;
  });

  it('recovers and re-exports when options sheet is open on second click', async () => {
    document.body.innerHTML = `
      <div id="exportOptionsBackdrop"></div>
      <aside id="exportOptionsSheet"></aside>
    `;
    deps.showExportOptions.mockImplementation(() => {
      document.getElementById('exportOptionsBackdrop').classList.add('open');
      return true;
    });
    await runExport(refs, state, deps);
    await runExport(refs, state, deps);
    expect(deps.handleExport).toHaveBeenCalledTimes(2);
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
    expect(deps.updateActionButtons).toHaveBeenCalledWith(1, false);
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

  it('onDismiss uses live photo count from state', async () => {
    let capturedOnDismiss;
    deps.showExportOptions.mockImplementation((_blob, _name, _fmt, _handlers, opts) => {
      capturedOnDismiss = opts?.onDismiss;
      return true;
    });
    await runExport(refs, state, deps);
    state.photos = [];
    capturedOnDismiss?.();
    expect(deps.updateActionButtons).toHaveBeenCalledWith(0, false);
  });

  it('keeps export guard active when updatePreview runs mid-export', async () => {
    refs.frameW.value = '100';
    deps.clampFrameValue.mockReturnValue(320);
    deps.updatePreview.mockImplementation(async () => {
      expect(isExportInProgress()).toBe(true);
    });
    await runExport(refs, state, deps);
    expect(isExportInProgress()).toBe(true);
  });

  it('recovers stuck guard when options phase has no open sheet', async () => {
    deps.showExportOptions.mockReturnValue(true);
    await runExport(refs, state, deps);
    expect(isExportInProgress()).toBe(true);
    forceExportUiReset(state, deps.updateActionButtons);
    expect(isExportInProgress()).toBe(false);
    expect(deps.updateActionButtons).toHaveBeenCalledWith(1, false);
    await runExport(refs, state, deps);
    expect(deps.handleExport).toHaveBeenCalledTimes(2);
  });

  it('installExportPageLifecycle clears stuck state on pageshow', async () => {
    document.body.innerHTML = `
      <div id="exportOptionsBackdrop" class="open"></div>
      <aside id="exportOptionsSheet"></aside>
    `;
    deps.showExportOptions.mockReturnValue(true);
    await runExport(refs, state, deps);
    const teardown = installExportPageLifecycle(
      () => state,
      deps.updateActionButtons,
      lifecycleAdapters(state, deps.updateActionButtons)
    );
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    expect(isExportInProgress()).toBe(false);
    teardown();
  });

  it('installExportPageLifecycle clears options sheet on pagehide', async () => {
    document.body.innerHTML = `
      <div id="exportOptionsBackdrop"></div>
      <aside id="exportOptionsSheet"></aside>
    `;
    deps.showExportOptions.mockImplementation(() => {
      document.getElementById('exportOptionsBackdrop').classList.add('open');
      return true;
    });
    await runExport(refs, state, deps);
    const teardown = installExportPageLifecycle(
      () => state,
      deps.updateActionButtons,
      lifecycleAdapters(state, deps.updateActionButtons)
    );
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
    expect(isExportInProgress()).toBe(false);
    expect(document.getElementById('exportOptionsBackdrop').classList.contains('open'))
      .toBe(false);
    teardown();
  });

  it('installExportPageLifecycle clears stuck state on window focus on iOS', async () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      platform: 'iPhone',
      maxTouchPoints: 5,
    });
    document.body.innerHTML = `
      <div id="exportOptionsBackdrop" class="open"></div>
      <aside id="exportOptionsSheet"></aside>
    `;
    deps.showExportOptions.mockReturnValue(true);
    await runExport(refs, state, deps);
    const teardown = installExportPageLifecycle(
      () => state,
      deps.updateActionButtons,
      lifecycleAdapters(state, deps.updateActionButtons)
    );
    window.dispatchEvent(new Event('focus'));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(isExportInProgress()).toBe(false);
    teardown();
    vi.unstubAllGlobals();
  });

  it('isExportRendering is false while options sheet is open', async () => {
    deps.showExportOptions.mockReturnValue(true);
    await runExport(refs, state, deps);
    expect(isExportInProgress()).toBe(true);
    expect(isExportRendering()).toBe(false);
  });

  it('forceExportUiReset clears orphan backdrop when guard is idle', () => {
    document.body.innerHTML = `
      <div id="exportOptionsBackdrop" class="open"></div>
      <aside id="exportOptionsSheet" class="open"></aside>
    `;
    expect(isExportInProgress()).toBe(false);
    forceExportUiReset(state, deps.updateActionButtons);
    expect(document.getElementById('exportOptionsBackdrop').classList.contains('open'))
      .toBe(false);
    expect(isExportInProgress()).toBe(false);
    expect(deps.updateActionButtons).toHaveBeenCalledWith(1, false);
  });

  it('forceExportUiReset is idempotent', () => {
    document.body.innerHTML = `
      <div id="exportOptionsBackdrop"></div>
      <aside id="exportOptionsSheet"></aside>
    `;
    forceExportUiReset(state, deps.updateActionButtons);
    forceExportUiReset(state, deps.updateActionButtons);
    expect(isExportInProgress()).toBe(false);
    expect(deps.updateActionButtons).toHaveBeenCalledTimes(2);
  });

  it('installExportPageLifecycle double-resets on persisted pageshow', async () => {
    document.body.innerHTML = `
      <div id="exportOptionsBackdrop" class="open"></div>
      <aside id="exportOptionsSheet"></aside>
    `;
    deps.showExportOptions.mockReturnValue(true);
    await runExport(refs, state, deps);
    const teardown = installExportPageLifecycle(
      () => state,
      deps.updateActionButtons,
      lifecycleAdapters(state, deps.updateActionButtons)
    );
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    expect(isExportInProgress()).toBe(false);
    document.getElementById('exportOptionsBackdrop').classList.add('open');
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(document.getElementById('exportOptionsBackdrop').classList.contains('open'))
      .toBe(false);
    teardown();
  });

  it('pagehide during options phase runs onDismiss via notifyDismiss', async () => {
    const { showExportOptions: realShowExportOptions } = await import(
      '../../js/export-options.js'
    );
    let onDismissCalled = false;
    document.body.innerHTML = `
      <div id="exportOptionsBackdrop"></div>
      <aside id="exportOptionsSheet"></aside>
      <button id="exportOptionDownload"></button>
      <button id="exportOptionOpenInNewTab"></button>
      <button id="exportOptionsCloseBtn"></button>
    `;
    deps.showExportOptions.mockImplementation((blob, name, fmt, handlers, opts) => realShowExportOptions(
      blob,
      name,
      fmt,
      handlers,
      {
        ...opts,
        onDismiss: () => {
          onDismissCalled = true;
          opts?.onDismiss?.();
        },
      }
    ));
    await runExport(refs, state, deps);
    expect(getExportPhase()).toBe('options');
    const teardown = installExportPageLifecycle(
      () => state,
      deps.updateActionButtons,
      lifecycleAdapters(state, deps.updateActionButtons)
    );
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
    expect(onDismissCalled).toBe(true);
    expect(isExportInProgress()).toBe(false);
    teardown();
  });

  it('uses in-app preview instead of window.open on iOS PWA', async () => {
    vi.mocked(shouldUseInAppBlobPreview).mockReturnValue(true);
    deps.t = (k) => k;
    deps.showExportOptions.mockImplementation((blob, filename, format, handlers) => {
      handlers.onOpenInNewTab?.();
      return true;
    });
    await runExport(refs, state, deps);
    expect(document.getElementById('exportPwaPreview')).toBeTruthy();
    document.querySelector('.export-pwa-preview__close')?.click();
    expect(document.getElementById('exportPwaPreview')).toBeNull();
    expect(isExportInProgress()).toBe(false);
  });
});
