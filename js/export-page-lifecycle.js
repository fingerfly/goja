/**
 * Purpose: Recover export UI after iOS Safari lifecycle transitions.
 * Description:
 * - Listens for pageshow/pagehide, visibility, focus, freeze/resume.
 * - Arms touch/pointer recovery when PWA open-in-new-tab may skip events.
 * - Delegates hard reset to export-flow forceExportUiReset.
 */
import { isIosLikeDevice } from './export-handler.js';
import {
  isStandaloneDisplayMode,
  isIosStandaloneWebApp,
} from './display-mode.js';

const IOS_FOCUS_DEBOUNCE_MS = 75;
const INTERACTION_RECOVERY_MS = 120000;

/** Set when open-in-new-tab runs in iOS PWA (overlay return may skip pagehide). */
let awaitingPwaExportReturn = false;

let lifecycleGetState = null;
let lifecycleUpdateButtons = null;
let lifecycleAdapters = null;
let interactionTeardown = null;
let interactionTimer = null;

function isIosPwaContext() {
  return isIosLikeDevice()
    && (isStandaloneDisplayMode() || isIosStandaloneWebApp());
}

function disarmInteractionRecovery() {
  if (interactionTimer) {
    clearTimeout(interactionTimer);
    interactionTimer = null;
  }
  if (interactionTeardown) {
    interactionTeardown();
    interactionTeardown = null;
  }
}

/**
 * Mark that the user may return from an in-app preview overlay (iOS PWA).
 */
export function markAwaitingPwaExportReturn() {
  if (!isIosPwaContext()) return;
  awaitingPwaExportReturn = true;
  armInteractionRecovery();
}

function armInteractionRecovery() {
  if (!lifecycleGetState || !lifecycleUpdateButtons || !lifecycleAdapters) {
    return;
  }
  disarmInteractionRecovery();

  const { forceExportUiReset, isExportInProgress, isExportOptionsOpen } =
    lifecycleAdapters;

  const reset = () => {
    forceExportUiReset(lifecycleGetState(), lifecycleUpdateButtons);
    requestAnimationFrame(() => {
      forceExportUiReset(lifecycleGetState(), lifecycleUpdateButtons);
    });
  };

  const tryRecover = () => {
    if (!awaitingPwaExportReturn
      && !isExportInProgress()
      && !isExportOptionsOpen()) {
      return;
    }
    awaitingPwaExportReturn = false;
    reset();
    disarmInteractionRecovery();
  };

  const onTouch = () => tryRecover();
  const onFocus = () => tryRecover();

  document.addEventListener('touchstart', onTouch, { capture: true, passive: true });
  document.addEventListener('pointerdown', onTouch, { capture: true, passive: true });
  window.addEventListener('focus', onFocus, { capture: true });

  interactionTeardown = () => {
    document.removeEventListener('touchstart', onTouch, { capture: true });
    document.removeEventListener('pointerdown', onTouch, { capture: true });
    window.removeEventListener('focus', onFocus, { capture: true });
  };

  interactionTimer = setTimeout(() => {
    awaitingPwaExportReturn = false;
    disarmInteractionRecovery();
  }, INTERACTION_RECOVERY_MS);
}

/** @internal Resets PWA return flag for unit tests. */
export function resetAwaitingPwaExportReturnForTests() {
  awaitingPwaExportReturn = false;
  disarmInteractionRecovery();
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
  lifecycleGetState = getState;
  lifecycleUpdateButtons = updateActionButtons;
  lifecycleAdapters = adapters;

  const {
    forceExportUiReset,
    isExportInProgress,
    isExportOptionsOpen,
    getExportPhase,
  } = adapters;

  const reset = (options = {}) => {
    forceExportUiReset(getState(), updateActionButtons, options);
  };

  const isIosPwa = () => isIosPwaContext();

  const doubleReset = () => {
    reset();
    requestAnimationFrame(() => reset());
  };

  const recoverPwaReturn = () => {
    if (!awaitingPwaExportReturn) return false;
    awaitingPwaExportReturn = false;
    disarmInteractionRecovery();
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
    disarmInteractionRecovery();
    lifecycleGetState = null;
    lifecycleUpdateButtons = null;
    lifecycleAdapters = null;
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pageshow', syncOnShow);
    window.removeEventListener('pagehide', syncOnHide);
    window.removeEventListener('focus', syncOnFocus);
    document.removeEventListener('freeze', syncOnFreeze);
    document.removeEventListener('resume', syncOnResume);
  };
}
