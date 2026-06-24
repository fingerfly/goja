/**
 * Purpose: Recover export UI after tab lifecycle transitions.
 * Description:
 * - Resets orphan sheet/backdrop on bfcache pageshow, pagehide, and iOS focus.
 * - iOS PWA preview uses in-app overlay; this covers browser tab edge cases.
 */
import { isIosLikeDevice } from './export-handler.js';

const IOS_FOCUS_DEBOUNCE_MS = 75;

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

  const doubleReset = () => {
    reset();
    requestAnimationFrame(() => reset());
  };

  const syncOnShow = (event) => {
    if (document.visibilityState !== 'visible') return;
    const needsRecover = event?.persisted
      || isExportOptionsOpen()
      || isExportInProgress();
    if (!needsRecover) return;
    if (event?.persisted) {
      doubleReset();
    } else {
      reset();
    }
  };

  const syncOnHide = () => {
    if (!isExportInProgress() && !isExportOptionsOpen()) return;
    reset({ notifyDismiss: getExportPhase() === 'options' });
  };

  let focusTimer = null;
  const syncOnFocus = () => {
    if (!isIosLikeDevice()) return;
    if (!isExportInProgress() && !isExportOptionsOpen()) return;
    clearTimeout(focusTimer);
    focusTimer = setTimeout(() => reset(), IOS_FOCUS_DEBOUNCE_MS);
  };

  const syncOnFreeze = () => {
    if (!isExportInProgress() && !isExportOptionsOpen()) return;
    reset({ notifyDismiss: getExportPhase() === 'options' });
  };

  const syncOnResume = () => {
    if (!isExportInProgress() && !isExportOptionsOpen()) return;
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
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pageshow', syncOnShow);
    window.removeEventListener('pagehide', syncOnHide);
    window.removeEventListener('focus', syncOnFocus);
    document.removeEventListener('freeze', syncOnFreeze);
    document.removeEventListener('resume', syncOnResume);
  };
}
