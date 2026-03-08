/**
 * Purpose: Normalize edge-control values from UI inputs.
 * Description:
 * - Clamps amplitude/frequency/seed to supported ranges.
 * - Adapts numeric input mode for platform-specific keyboard behavior.
 */
function clamp(v, min, max, fallback) {
  const n = Number(v);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/**
 * Normalize edge amplitude to [0, 1] with 2-decimal precision.
 * @param {unknown} value
 * @returns {number}
 */
export function normalizeEdgeAmplitude(value) {
  const rounded = Math.round(clamp(value, 0, 1, 0.5) * 100) / 100;
  return Number(rounded.toFixed(2));
}

/**
 * Normalize edge frequency to integer range [1, 20].
 * @param {unknown} value
 * @returns {number}
 */
export function normalizeEdgeFrequency(value) {
  return Math.round(clamp(value, 1, 20, 4));
}

/**
 * Normalize seed value to integer range [0, 99999].
 * @param {unknown} value
 * @returns {number}
 */
export function normalizeEdgeSeed(value) {
  return Math.round(clamp(value, 0, 99999, 0));
}

/**
 * Detect platforms that benefit from text-based numeric input.
 * @param {string} [userAgent]
 * @returns {boolean}
 */
export function prefersTextNumericInput(userAgent = '') {
  const ua = String(userAgent || '').toLowerCase();
  return ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod');
}

/**
 * Apply numeric input mode based on platform behavior.
 * @param {HTMLInputElement | null} inputEl
 * @param {string} [userAgent]
 */
export function applyPlatformNumericInputMode(inputEl, userAgent = '') {
  if (!inputEl) return;
  if (prefersTextNumericInput(userAgent)) {
    inputEl.type = 'text';
    inputEl.inputMode = 'numeric';
    inputEl.pattern = '[0-9]*';
    return;
  }
  inputEl.type = 'number';
  inputEl.inputMode = 'numeric';
}
