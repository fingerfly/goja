/**
 * Purpose: Detect installed PWA / standalone display contexts.
 * Description:
 * - Covers display-mode media query and legacy iOS navigator.standalone.
 */

/**
 * True when the app runs as an installed PWA (home screen / standalone).
 * @returns {boolean}
 */
export function isStandaloneDisplayMode() {
  if (typeof window === 'undefined') return false;
  const matches = (q) => window.matchMedia?.(q)?.matches === true;
  if (matches('(display-mode: standalone)')) return true;
  if (matches('(display-mode: fullscreen)')) return true;
  if (matches('(display-mode: minimal-ui)')) return true;
  if (typeof navigator !== 'undefined' && navigator.standalone === true) {
    return true;
  }
  return false;
}

/**
 * True on iPhone/iPad home-screen WebKit where browser display-mode is off.
 * @param {string} [userAgent]
 * @returns {boolean}
 */
export function isIosStandaloneWebApp(userAgent = navigator?.userAgent ?? '') {
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    if (typeof navigator !== 'undefined' && navigator.standalone === true) {
      return true;
    }
    const browserMode = window.matchMedia?.('(display-mode: browser)');
    if (browserMode && browserMode.media !== 'not all' && !browserMode.matches) {
      return true;
    }
  }
  if (typeof navigator === 'undefined') return false;
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
    return isStandaloneDisplayMode();
  }
  return false;
}
