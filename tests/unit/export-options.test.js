import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  canShareFiles,
  canCopyImage,
  showExportOptions,
  dismissExportOptions,
  resetExportOptionsStateForTests,
} from '../../js/export-options.js';

describe('canShareFiles', () => {
  it('returns true when navigator.share exists', () => {
    navigator.share = vi.fn();
    expect(canShareFiles()).toBe(true);
  });

  it('returns false when navigator.share is undefined', () => {
    const origShare = navigator.share;
    delete navigator.share;
    expect(canShareFiles()).toBe(false);
    navigator.share = origShare;
  });

  it('returns false when navigator.share is undefined even on narrow viewport', () => {
    const origShare = navigator.share;
    const origInnerWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth');
    delete navigator.share;
    Object.defineProperty(window, 'innerWidth', { value: 360, configurable: true });
    expect(canShareFiles()).toBe(false);
    navigator.share = origShare;
    if (origInnerWidth) Object.defineProperty(window, 'innerWidth', origInnerWidth);
  });
});

describe('canCopyImage', () => {
  it('returns false when navigator.clipboard is undefined', () => {
    const orig = navigator.clipboard;
    delete navigator.clipboard;
    const blob = new Blob(['x'], { type: 'image/png' });
    expect(canCopyImage(blob)).toBe(false);
    navigator.clipboard = orig;
  });

  it('returns false when clipboard.write is undefined', () => {
    navigator.clipboard = {};
    const blob = new Blob(['x'], { type: 'image/png' });
    expect(canCopyImage(blob)).toBe(false);
  });

  it('returns false when ClipboardItem is undefined', () => {
    const orig = globalThis.ClipboardItem;
    delete globalThis.ClipboardItem;
    navigator.clipboard = { write: vi.fn() };
    const blob = new Blob(['x'], { type: 'image/png' });
    expect(canCopyImage(blob)).toBe(false);
    globalThis.ClipboardItem = orig;
  });

  it('returns true when clipboard and ClipboardItem exist', () => {
    navigator.clipboard = { write: vi.fn() };
    globalThis.ClipboardItem = class {};
    const blob = new Blob(['x'], { type: 'image/png' });
    expect(canCopyImage(blob)).toBe(true);
  });
});

describe('showExportOptions', () => {
  beforeEach(() => {
    resetExportOptionsStateForTests();
    document.body.innerHTML = `
      <div id="exportOptionsBackdrop"></div>
      <aside id="exportOptionsSheet" aria-hidden="true">
        <div class="export-options-sheet__header">
          <button id="exportOptionsCloseBtn">&times;</button>
        </div>
        <div class="export-options-sheet__body">
          <button id="exportOptionShare">Share</button>
          <button id="exportOptionDownload">Download</button>
          <button id="exportOptionCopy">Copy</button>
          <button id="exportOptionOpenInNewTab">Open</button>
        </div>
      </aside>
    `;
  });

  it('opens the sheet and adds open class', () => {
    vi.stubGlobal('navigator', { canShare: vi.fn(() => false), clipboard: undefined });
    const blob = new Blob(['x'], { type: 'image/png' });
    showExportOptions(blob, 'test', 'image/png', {});
    const sheet = document.getElementById('exportOptionsSheet');
    const backdrop = document.getElementById('exportOptionsBackdrop');
    expect(sheet.classList.contains('open')).toBe(true);
    expect(backdrop.classList.contains('open')).toBe(true);
  });

  it('calls onDownload when Download button is clicked', () => {
    const onDownload = vi.fn();
    const blob = new Blob(['x'], { type: 'image/png' });
    showExportOptions(blob, 'test', 'image/png', { onDownload });
    document.getElementById('exportOptionDownload').click();
    expect(onDownload).toHaveBeenCalled();
  });

  it('calls onOpenInNewTab when Open in new tab is clicked', () => {
    const onOpenInNewTab = vi.fn();
    const blob = new Blob(['x'], { type: 'image/png' });
    showExportOptions(blob, 'test', 'image/png', { onOpenInNewTab });
    document.getElementById('exportOptionOpenInNewTab').click();
    expect(onOpenInNewTab).toHaveBeenCalled();
  });

  it('makes Download primary when Share is hidden', () => {
    const origShare = navigator.share;
    delete navigator.share;
    const blob = new Blob(['x'], { type: 'image/png' });
    showExportOptions(blob, 'test', 'image/png', {});
    const downloadBtn = document.getElementById('exportOptionDownload');
    expect(downloadBtn.classList.contains('btn-primary')).toBe(true);
    navigator.share = origShare;
  });

  it('returns false for empty blob', () => {
    const blob = new Blob([], { type: 'image/png' });
    expect(showExportOptions(blob, 'test', 'image/png', {})).toBe(false);
  });

  it('returns false when required DOM nodes are missing', () => {
    document.body.innerHTML = '';
    const blob = new Blob(['x'], { type: 'image/png' });
    expect(showExportOptions(blob, 'test', 'image/png', {})).toBe(false);
  });

  it('reopens without stacking backdrop listeners', () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    showExportOptions(blob, 'test', 'image/png', {});
    showExportOptions(blob, 'test', 'image/png', {});
    const backdrop = document.getElementById('exportOptionsBackdrop');
    backdrop.click();
    expect(document.getElementById('exportOptionsSheet').classList.contains('open')).toBe(false);
  });

  it('dismissExportOptions closes an open sheet', () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    showExportOptions(blob, 'test', 'image/png', {});
    dismissExportOptions();
    expect(document.getElementById('exportOptionsSheet').classList.contains('open')).toBe(false);
  });

  it('calls onDismiss when the sheet closes', () => {
    const onDismiss = vi.fn();
    const blob = new Blob(['x'], { type: 'image/png' });
    showExportOptions(blob, 'test', 'image/png', {}, { onDismiss });
    dismissExportOptions();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not call onDismiss when reopening silently', () => {
    const onDismiss = vi.fn();
    const blob = new Blob(['x'], { type: 'image/png' });
    showExportOptions(blob, 'test', 'image/png', {}, { onDismiss });
    showExportOptions(blob, 'test', 'image/png', {}, { onDismiss: vi.fn() });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('open in new tab closes sheet without focusing export button', () => {
    vi.stubGlobal('navigator', { canShare: vi.fn(() => false), clipboard: undefined });
    const exportBtn = document.createElement('button');
    exportBtn.id = 'exportBtn';
    document.body.appendChild(exportBtn);
    const focusSpy = vi.spyOn(exportBtn, 'focus');
    const blob = new Blob(['x'], { type: 'image/png' });
    showExportOptions(blob, 'test', 'image/png', { onOpenInNewTab: vi.fn() }, {
      focusReturnEl: exportBtn,
    });
    document.getElementById('exportOptionOpenInNewTab').click();
    expect(document.getElementById('exportOptionsSheet').classList.contains('open')).toBe(false);
    expect(focusSpy).not.toHaveBeenCalled();
  });

  it('reopen-after-open-in-new-tab cycle keeps sheet open on second show', () => {
    vi.stubGlobal('navigator', { canShare: vi.fn(() => false), clipboard: undefined });
    const blob = new Blob(['x'], { type: 'image/png' });
    showExportOptions(blob, 'test', 'image/png', { onOpenInNewTab: vi.fn() });
    document.getElementById('exportOptionOpenInNewTab').click();
    showExportOptions(blob, 'test', 'image/png', {});
    const sheet = document.getElementById('exportOptionsSheet');
    expect(sheet.classList.contains('open')).toBe(true);
  });

  it('backdrop click closes sheet without treating event as restoreFocus flag', async () => {
    const exportBtn = document.createElement('button');
    const focusSpy = vi.spyOn(exportBtn, 'focus');
    const blob = new Blob(['x'], { type: 'image/png' });
    showExportOptions(blob, 'test', 'image/png', {}, { focusReturnEl: exportBtn });
    document.getElementById('exportOptionsBackdrop').click();
    expect(document.getElementById('exportOptionsSheet').classList.contains('open')).toBe(false);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(focusSpy).toHaveBeenCalled();
  });
});
