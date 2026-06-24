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
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  if (window.matchMedia?.('(display-mode: fullscreen)').matches) return true;
  if (typeof navigator !== 'undefined' && navigator.standalone === true) {
    return true;
  }
  return false;
}
