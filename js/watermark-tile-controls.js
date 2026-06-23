/**
 * Purpose: Normalize watermark tile spacing and rotation UI values.
 * Description:
 * - Clamps pixel gap between tiled watermarks and rotation angle to config bounds.
 * - Applies platform-appropriate input modes for tile controls.
 */
import {
  WATERMARK_TILE_SPACING_MIN,
  WATERMARK_TILE_SPACING_MAX,
  WATERMARK_TILE_SPACING_DEFAULT,
  WATERMARK_TILE_SPACING_STEP,
  WATERMARK_TILE_ROTATION_MIN,
  WATERMARK_TILE_ROTATION_MAX,
  WATERMARK_TILE_ROTATION_DEFAULT,
  WATERMARK_TILE_ROTATION_STEP,
} from './config.js';
import { applyPlatformNumericInputMode } from './edge-controls.js';

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/**
 * Normalize tile spacing gap (px) between watermarks to [min, max].
 * @param {unknown} value
 * @returns {number}
 */
export function normalizeTileSpacing(value) {
  return Math.round(clamp(
    value,
    WATERMARK_TILE_SPACING_MIN,
    WATERMARK_TILE_SPACING_MAX,
    WATERMARK_TILE_SPACING_DEFAULT
  ));
}

/**
 * Normalize tile rotation to integer degrees in [min, max].
 * @param {unknown} value
 * @returns {number}
 */
export function normalizeTileRotation(value) {
  return Math.round(clamp(
    value,
    WATERMARK_TILE_ROTATION_MIN,
    WATERMARK_TILE_ROTATION_MAX,
    WATERMARK_TILE_ROTATION_DEFAULT
  ));
}

/**
 * Apply integer pixel input mode for tile spacing gap.
 * @param {HTMLInputElement | null} inputEl
 * @param {string} [userAgent]
 */
export function applyTileSpacingInputMode(inputEl, userAgent = '') {
  applyPlatformNumericInputMode(inputEl, userAgent);
  if (!inputEl) return;
  inputEl.step = String(WATERMARK_TILE_SPACING_STEP);
  inputEl.min = String(WATERMARK_TILE_SPACING_MIN);
  inputEl.max = String(WATERMARK_TILE_SPACING_MAX);
}

/**
 * Apply rotation input mode; iPhone uses text+numeric via edge-controls.
 * @param {HTMLInputElement | null} inputEl
 * @param {string} [userAgent]
 */
export function applyTileRotationInputMode(inputEl, userAgent = '') {
  applyPlatformNumericInputMode(inputEl, userAgent);
  if (!inputEl) return;
  inputEl.step = String(WATERMARK_TILE_ROTATION_STEP);
  inputEl.min = String(WATERMARK_TILE_ROTATION_MIN);
  inputEl.max = String(WATERMARK_TILE_ROTATION_MAX);
}

/**
 * Write normalized spacing back to a tile spacing input element.
 * @param {HTMLInputElement | null} inputEl
 */
export function normalizeTileSpacingInput(inputEl) {
  if (!inputEl) return;
  inputEl.value = String(normalizeTileSpacing(inputEl.value));
}

/**
 * Write normalized rotation back to a tile rotation input element.
 * @param {HTMLInputElement | null} inputEl
 */
export function normalizeTileRotationInput(inputEl) {
  if (!inputEl) return;
  inputEl.value = String(normalizeTileRotation(inputEl.value));
}
