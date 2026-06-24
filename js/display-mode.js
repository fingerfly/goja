/**
 * Purpose: Detect installed PWA / standalone display contexts.
 * Description:
 * - Covers display-mode media query, legacy iOS navigator.standalone,
 *   and iOS home-screen heuristic when browser display-mode is off.
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
  const ua = navigator?.userAgent ?? '';
  if (/iPhone|iPad|iPod/i.test(ua)) {
    const browserMode = window.matchMedia?.('(display-mode: browser)');
    if (browserMode && browserMode.media !== 'not all' && !browserMode.matches) {
      return true;
    }
  }
  if (typeof navigator !== 'undefined'
    && navigator.platform === 'MacIntel'
    && navigator.maxTouchPoints > 1) {
    return matches('(display-mode: standalone)')
      || matches('(display-mode: fullscreen)')
      || matches('(display-mode: minimal-ui)');
  }
  return false;
}
