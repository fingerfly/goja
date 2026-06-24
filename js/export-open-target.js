/**
 * Purpose: Decide how exported blobs are opened for preview.
 * Description:
 * - iOS PWA standalone uses in-app preview (window.open breaks on return).
 * - Browser tabs keep open-in-new-tab behavior.
 */
import { isIosLikeDevice } from './export-handler.js';
import { isStandaloneDisplayMode, isIosStandaloneWebApp } from './display-mode.js';

/**
 * True when blob preview must stay inside the PWA webview (iOS home screen).
 * @returns {boolean}
 */
export function shouldUseInAppBlobPreview() {
  if (!isIosLikeDevice()) return false;
  return isStandaloneDisplayMode() || isIosStandaloneWebApp();
}
