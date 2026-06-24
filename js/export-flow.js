/**
 * Export flow: validate frame, run handleExport, show export options.
 * Extracted from app.js for modularity.
 */
import { EXPORT_URL_REVOKE_DELAY_MS, EXPORT_FILENAME_DEFAULT } from './config.js';
import { sanitizeFilename } from './utils.js';
import { markAwaitingPwaExportReturn } from './export-page-lifecycle.js';
import { shouldUseInAppBlobPreview } from './export-open-target.js';
import { openExportPwaPreview } from './export-pwa-preview.js';
import {
  dismissExportOptions,
  isExportOptionsOpen,
  forceCloseExportOptionsDom,
} from './export-options.js';
import { closeExportPwaPreview } from './export-pwa-preview.js';

/** Guards concurrent export runs (double-click, frame-clamp await window). */
let exportInProgress = false;

/** @type {'idle' | 'rendering' | 'options'} */
let exportPhase = 'idle';

/** Invalidates in-flight render when user starts a new export. */
let exportGeneration = 0;

/**
 * Clear a stuck export UI state (e.g. iOS tab switch before dismiss ran).
 * @param {{ photos: { url: string }[] }} state
 * @param {(count: number, isExporting: boolean) => void} updateActionButtons
 */
export function recoverStuckExportState(state, updateActionButtons) {
  forceExportUiReset(state, updateActionButtons);
}

/**
 * Idempotent hard reset: DOM sheet/backdrop + export guard + action buttons.
 * @param {{ photos: { url: string }[] }} state
 * @param {(count: number, isExporting: boolean) => void} updateActionButtons
 * @param {{ notifyDismiss?: boolean }} [options]
 */
export function forceExportUiReset(state, updateActionButtons, options = {}) {
  const { notifyDismiss = false } = options;
  const sheetOpen = isExportOptionsOpen();
  if (sheetOpen) {
    dismissExportOptions(false, {
      notify: notifyDismiss && exportInProgress && exportPhase === 'options',
    });
  }
  forceCloseExportOptionsDom();
  closeExportPwaPreview();
  exportInProgress = false;
  exportPhase = 'idle';
  updateActionButtons(state.photos.length, false);
}

/**
 * Dismiss orphan sheet/backdrop and reset export guard unless rendering.
 * @param {{ photos: { url: string }[] }} state
 * @param {(count: number, isExporting: boolean) => void} updateActionButtons
 */
export function ensureExportUiIdle(state, updateActionButtons, options = {}) {
  const { force = false } = options;
  if (force) {
    forceExportUiReset(state, updateActionButtons, {
      notifyDismiss: exportPhase === 'options',
    });
    return;
  }
  if (exportInProgress && exportPhase === 'rendering') return;
  if (exportInProgress || isExportOptionsOpen()) {
    forceExportUiReset(state, updateActionButtons, {
      notifyDismiss: exportPhase === 'options',
    });
  }
}

/**
 * Runs the full export flow: clamp frame if needed, handleExport, showExportOptions.
 * @param {{ frameW: HTMLInputElement, frameH: HTMLInputElement, exportFilename: HTMLInputElement | null, exportUseDate: HTMLInputElement | null, formatSelect: HTMLSelectElement, exportBtn: HTMLButtonElement }} refs
 * @param {{ photos: { url: string }[], currentLayout: object | null }} state
 * @param {{ clampFrameValue: (v: unknown) => number, showToast: (msg: string, type: string) => void, t: (key: string) => string, buildForm: (includeFormat?: boolean) => object, getGridEffectsOptions: (form: object, photos: object[], formatDateTimeOriginal: (d: Date, loc: string) => string, getLocale: () => string) => object, handleExport: (photos: object[], layout: object, opts: object) => Promise<Blob>, showExportOptions: (blob: Blob, filename: string, format: string, handlers: object, opts?: object) => boolean, downloadBlob: (blob: Blob, format: string, filename: string) => void, shareBlob: (blob: Blob, filename: string) => Promise<void>, copyBlobToClipboard: (blob: Blob) => Promise<void>, formatDateTimeOriginal: (d: Date, loc: string) => string, getLocale: () => string, updateActionButtons: (count: number, isExporting: boolean) => void, updatePreview: () => Promise<void> }} deps
 */
export async function runExport(refs, state, deps) {
  const { photos, currentLayout } = state;
  if (!currentLayout || photos.length === 0) return;

  const { frameW, frameH, exportFilename, exportUseDate, formatSelect, exportBtn } = refs;
  const { clampFrameValue, showToast, t, buildForm, getGridEffectsOptions, handleExport, showExportOptions,
    downloadBlob, shareBlob, copyBlobToClipboard, formatDateTimeOriginal, getLocale,
    updateActionButtons, updatePreview } = deps;

  if (exportInProgress && exportPhase === 'rendering') {
    exportGeneration += 1;
  }
  const generation = exportGeneration + 1;
  exportGeneration = generation;
  ensureExportUiIdle(state, updateActionButtons, { force: true });

  exportInProgress = true;
  exportPhase = 'rendering';
  updateActionButtons(photos.length, true);
  let sheetOpened = false;
  try {
    let w = clampFrameValue(frameW.value);
    let h = clampFrameValue(frameH.value);
    if (w !== parseInt(frameW.value, 10) || h !== parseInt(frameH.value, 10)) {
      frameW.value = String(w);
      frameH.value = String(h);
      showToast(t('frameDimensionClamped'), 'error');
      await updatePreview();
    }
    const form = buildForm(true);
    const opts = getGridEffectsOptions(form, photos, formatDateTimeOriginal, getLocale);
    const blob = await handleExport(photos, currentLayout, opts);
    if (generation !== exportGeneration) {
      return;
    }
    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new Error('Export produced no image data');
    }
    const base = sanitizeFilename(exportFilename?.value, EXPORT_FILENAME_DEFAULT);
    const withDate = exportUseDate?.checked ? `${base}-${new Date().toISOString().slice(0, 10)}` : base;
    exportPhase = 'options';
    sheetOpened = showExportOptions(blob, withDate, formatSelect.value, {
      onShare: () => {
        shareBlob(blob, withDate).then(
          () => showToast(t('exportSuccess'), 'success'),
          (err) => { if (err?.name !== 'AbortError') showToast(`${t('exportShareFailed')} — ${err?.message ?? err}`, 'error'); }
        );
      },
      onDownload: () => {
        downloadBlob(blob, formatSelect.value, withDate);
        showToast(t('exportSuccess'), 'success');
      },
      onCopy: () => {
        copyBlobToClipboard(blob).then(
          () => showToast(t('exportCopySuccess'), 'success'),
          (err) => showToast(`${t('exportCopyFailed')} — ${err?.message ?? err}`, 'error')
        );
      },
      onOpenInNewTab: () => {
        if (shouldUseInAppBlobPreview()) {
          openExportPwaPreview(blob, {
            closeLabel: t('exportPreviewClose'),
            onClose: () => {
              forceExportUiReset(state, updateActionButtons);
            },
          });
          return;
        }
        markAwaitingPwaExportReturn();
        const url = URL.createObjectURL(blob);
        const opened = window.open(url, '_blank', 'noopener');
        if (!opened) {
          const a = document.createElement('a');
          a.href = url;
          a.rel = 'noopener';
          a.target = '_blank';
          a.click();
        }
        setTimeout(() => URL.revokeObjectURL(url), EXPORT_URL_REVOKE_DELAY_MS);
      },
    }, {
      focusReturnEl: exportBtn,
      onDismiss: () => {
        exportInProgress = false;
        exportPhase = 'idle';
        updateActionButtons(state.photos.length, false);
      },
    });
    if (sheetOpened) {
      updateActionButtons(state.photos.length, false);
    }
    if (!sheetOpened) {
      throw new Error('Export options UI unavailable');
    }
  } catch (err) {
    if (generation !== exportGeneration) {
      return;
    }
    showToast(`${t('exportFailed')} — ${err?.message ?? String(err)}`, 'error');
  } finally {
    if (generation !== exportGeneration) {
      return;
    }
    if (!sheetOpened) {
      exportInProgress = false;
      exportPhase = 'idle';
      updateActionButtons(state.photos.length, false);
    }
  }
}

/** @returns {boolean} Whether canvas export is actively rendering. */
export function isExportRendering() {
  return exportInProgress && exportPhase === 'rendering';
}

/** @returns {boolean} Whether an export run is active (sheet open or rendering). */
export function isExportInProgress() {
  return exportInProgress;
}

/** @returns {'idle' | 'rendering' | 'options'} Current export phase. */
export function getExportPhase() {
  return exportPhase;
}

/** Clears the export guard without invoking sheet onDismiss (e.g. Clear all). */
export function cancelExportFlow() {
  exportInProgress = false;
  exportPhase = 'idle';
}

/** @internal Resets export-in-progress guard for unit tests. */
export function resetExportInProgressForTests() {
  exportInProgress = false;
  exportPhase = 'idle';
  exportGeneration = 0;
}
