/**
 * Frame dimension validation and clamping.
 * Pure logic for unit testing; app.js wires DOM and toast.
 */
import { FRAME_MIN, FRAME_MAX } from './config.js';

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
