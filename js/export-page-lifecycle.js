/**
 * Purpose: Recover export UI after iOS Safari lifecycle transitions.
 * Description:
 * - Listens for pageshow/pagehide, visibility, focus, freeze/resume.
 * - Delegates hard reset to export-flow forceExportUiReset.
 * - Double-pass reset on bfcache persisted pageshow and iOS PWA return.
 */
import { isIosLikeDevice } from './export-handler.js';
import { isStandaloneDisplayMode } from './display-mode.js';

const IOS_FOCUS_DEBOUNCE_MS = 75;

/** Set when open-in-new-tab runs in iOS PWA (overlay return may skip pagehide). */
let awaitingPwaExportReturn = false;

/**
 * Mark that the user may return from an in-app preview overlay (iOS PWA).
 */
export function markAwaitingPwaExportReturn() {
  if (isIosLikeDevice() && isStandaloneDisplayMode()) {
    awaitingPwaExportReturn = true;
  }
}

/** @internal Resets PWA return flag for unit tests. */
export function resetAwaitingPwaExportReturnForTests() {
  awaitingPwaExportReturn = false;
}

/**
 * @param {() => { photos: { url: string }[] }} getState
 * @param {(count: number, isExporting: boolean) => void} updateActionButtons
 * @param {{
 *   forceExportUiReset: Function,
 *   isExportInProgress: () => boolean,
 *   isExportOptionsOpen: () => boolean,
 *   getExportPhase: () => string,
 * }} adapters
 * @returns {() => void} teardown
 */
export function installExportPageLifecycle(
  getState,
  updateActionButtons,
  adapters
) {
  const {
    forceExportUiReset,
    isExportInProgress,
    isExportOptionsOpen,
    getExportPhase,
  } = adapters;

  const reset = (options = {}) => {
    forceExportUiReset(getState(), updateActionButtons, options);
  };

  const isIosPwa = () => isIosLikeDevice() && isStandaloneDisplayMode();

  const doubleReset = () => {
    reset();
    requestAnimationFrame(() => reset());
  };

  const recoverPwaReturn = () => {
    if (!awaitingPwaExportReturn) return false;
    awaitingPwaExportReturn = false;
    doubleReset();
    return true;
  };

  const syncOnShow = (event) => {
    if (document.visibilityState !== 'visible') return;
    if (recoverPwaReturn()) return;

    const orphanDom = isExportOptionsOpen();
    const activeExport = isExportInProgress();
    const pwaReturn = isIosPwa();
    const needsRecover = event?.persisted || orphanDom || activeExport;
    if (!needsRecover) return;

    reset();
    if (event?.persisted || (pwaReturn && (orphanDom || activeExport))) {
      requestAnimationFrame(() => reset());
    }
  };

  const syncOnHide = () => {
    if (!isExportInProgress() && !isExportOptionsOpen()) return;
    reset({
      notifyDismiss: getExportPhase() === 'options',
    });
  };

  let focusTimer = null;
  const syncOnFocus = () => {
    if (!isIosLikeDevice()) return;
    if (recoverPwaReturn()) return;
    if (!isExportInProgress() && !isExportOptionsOpen()) return;
    clearTimeout(focusTimer);
    focusTimer = setTimeout(() => {
      if (isIosPwa()) {
        doubleReset();
      } else {
        reset();
      }
    }, IOS_FOCUS_DEBOUNCE_MS);
  };

  const syncOnFreeze = () => {
    if (!isExportInProgress() && !isExportOptionsOpen()) return;
    reset({
      notifyDismiss: getExportPhase() === 'options',
    });
  };

  const syncOnResume = () => {
    if (recoverPwaReturn()) return;
    if (!isExportInProgress() && !isExportOptionsOpen()) return;
    if (isIosPwa()) {
      doubleReset();
      return;
    }
    reset();
  };

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      syncOnHide();
    } else {
      syncOnShow(undefined);
    }
  };

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pageshow', syncOnShow);
  window.addEventListener('pagehide', syncOnHide);
  window.addEventListener('focus', syncOnFocus);
  document.addEventListener('freeze', syncOnFreeze);
  document.addEventListener('resume', syncOnResume);

  return () => {
    clearTimeout(focusTimer);
    awaitingPwaExportReturn = false;
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pageshow', syncOnShow);
    window.removeEventListener('pagehide', syncOnHide);
    window.removeEventListener('focus', syncOnFocus);
    document.removeEventListener('freeze', syncOnFreeze);
    document.removeEventListener('resume', syncOnResume);
  };
}
