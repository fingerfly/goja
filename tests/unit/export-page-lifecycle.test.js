import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  installExportPageLifecycle,
  markAwaitingPwaExportReturn,
  resetAwaitingPwaExportReturnForTests,
} from '../../js/export-page-lifecycle.js';
import {
  forceExportUiReset,
  isExportInProgress,
  getExportPhase,
  resetExportInProgressForTests,
} from '../../js/export-flow.js';
import { isExportOptionsOpen } from '../../js/export-options.js';

function lifecycleAdapters(state, updateActionButtons) {
  return {
    forceExportUiReset,
    isExportInProgress,
    isExportOptionsOpen,
    getExportPhase,
  };
}

describe('installExportPageLifecycle PWA return', () => {
  let state;
  let updateActionButtons;

  beforeEach(() => {
    resetExportInProgressForTests();
    resetAwaitingPwaExportReturnForTests();
    state = { photos: [{ url: 'blob:1' }] };
    updateActionButtons = vi.fn();
    document.body.innerHTML = `
      <div id="exportOptionsBackdrop" class="open"></div>
      <aside id="exportOptionsSheet" class="open"></aside>
    `;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('double-resets on visibility visible after markAwaitingPwaExportReturn', async () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      platform: 'iPhone',
      maxTouchPoints: 5,
      standalone: true,
    });
    vi.stubGlobal('matchMedia', vi.fn((q) => ({
      matches: q === '(display-mode: standalone)',
    })));

    markAwaitingPwaExportReturn();
    const teardown = installExportPageLifecycle(
      () => state,
      updateActionButtons,
      lifecycleAdapters(state, updateActionButtons)
    );

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(isExportInProgress()).toBe(false);
    expect(document.getElementById('exportOptionsBackdrop').classList.contains('open'))
      .toBe(false);

    document.getElementById('exportOptionsBackdrop').classList.add('open');
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(document.getElementById('exportOptionsBackdrop').classList.contains('open'))
      .toBe(false);

    teardown();
  });
});
