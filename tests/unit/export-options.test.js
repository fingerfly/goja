import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canShareFiles, canCopyImage, showExportOptions } from '../../js/export-options.js';

describe('canShareFiles', () => {
  it('returns false when navigator.share is undefined', () => {
    const orig = navigator.share;
    delete navigator.share;
    expect(canShareFiles()).toBe(false);
    navigator.share = orig;
  });

  it('returns false when canShare returns false and navigator.maxTouchPoints is 0', () => {
    const nav = { share: vi.fn(), canShare: vi.fn(() => false), maxTouchPoints: 0 };
    vi.stubGlobal('navigator', nav);
    expect(canShareFiles()).toBe(false);
  });

  it('returns true when canShare returns true for files', () => {
    navigator.share = vi.fn();
    navigator.canShare = vi.fn(() => true);
    expect(canShareFiles()).toBe(true);
  });

  it('returns true on touch devices when share exists even if canShare returns false', () => {
    const nav = { share: vi.fn(), canShare: vi.fn(() => false), maxTouchPoints: 1 };
    vi.stubGlobal('navigator', nav);
    expect(canShareFiles()).toBe(true);
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
});
