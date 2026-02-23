/**
 * Frame dimension validation and clamping.
 * Pure logic for unit testing; app.js wires DOM and toast.
 */
import { FRAME_MIN, FRAME_MAX, FRAME_INPUT_DEBOUNCE_MS } from './config.js';

/**
 * Clamp a parsed or raw value to [FRAME_MIN, FRAME_MAX].
 * @param {string | number} value - Raw input (string or number)
 * @returns {number} Clamped value
 */
export function clampFrameValue(value) {
  const v = parseInt(String(value), 10);
  if (Number.isNaN(v)) return FRAME_MIN;
  return Math.min(FRAME_MAX, Math.max(FRAME_MIN, v));
}

/**
 * Check if value is within valid range.
 * @param {string | number} value
 * @returns {boolean}
 */
export function isFrameValueValid(value) {
  const v = parseInt(String(value), 10);
  return !Number.isNaN(v) && v >= FRAME_MIN && v <= FRAME_MAX;
}

/**
 * Set aria-invalid and .invalid class on frame input element.
 * @param {HTMLInputElement | null} el
 * @param {boolean} invalid
 */
export function setFrameInputInvalidState(el, invalid) {
  if (!el) return;
  el.setAttribute('aria-invalid', String(invalid));
  el.classList.toggle('invalid', invalid);
}

/**
 * Creates frame input handlers with DOM/toast wiring.
 * @param {{ clampFrameValue: (v: unknown) => number, isFrameValueValid: (v: unknown) => boolean, setFrameInputInvalidState: (el: HTMLInputElement | null, invalid: boolean) => void, showToast: (msg: string, type: string) => void, t: (key: string) => string, debounce: (fn: (...args: unknown[]) => void, ms: number) => (...args: unknown[]) => void, debounceMs?: number }} deps
 * @returns {{ validateFrameInput: (el: HTMLInputElement | null, options?: { showClampedToast?: boolean }) => number, onFrameInputDebounced: (el: HTMLInputElement | null) => void, debouncedFrameInput: (el: HTMLInputElement | null) => void }}
 */
export function createFrameInputHandler(deps) {
  const { clampFrameValue, isFrameValueValid, setFrameInputInvalidState, showToast, t, debounce } = deps;
  const debounceMs = deps.debounceMs ?? FRAME_INPUT_DEBOUNCE_MS;
  const frameToastShownThisSession = new Set();

  function validateFrameInput(el, options = {}) {
    const { showClampedToast = true } = options;
    if (!el) return FRAME_MIN;
    const wasInvalid = !isFrameValueValid(el.value);
    if (wasInvalid) {
      const v = clampFrameValue(el.value);
      el.value = String(v);
      setFrameInputInvalidState(el, false);
      if (showClampedToast) showToast(t('frameDimensionClamped'), 'error');
      return v;
    }
    setFrameInputInvalidState(el, false);
    return parseInt(el.value, 10);
  }

  function onFrameInputDebounced(el) {
    if (!el) return;
    if (!isFrameValueValid(el.value)) {
      const clamped = clampFrameValue(el.value);
      el.value = String(clamped);
      setFrameInputInvalidState(el, false);
      if (!frameToastShownThisSession.has(el)) {
        frameToastShownThisSession.add(el);
        showToast(t('frameDimensionClamped'), 'error');
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      frameToastShownThisSession.delete(el);
      setFrameInputInvalidState(el, false);
    }
  }

  const debouncedFrameInput = debounce(onFrameInputDebounced, debounceMs);

  return {
    validateFrameInput,
    onFrameInputDebounced,
    debouncedFrameInput,
    clearToastSessionFor(el) {
      frameToastShownThisSession.delete(el);
    },
  };
}
