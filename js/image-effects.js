import {
  FILTER_PRESET_GRAYSCALE,
  FILTER_PRESET_SEPIA,
  FILTER_PRESET_BRIGHTNESS,
  FILTER_PRESET_CONTRAST,
  FILTER_PRESET_SATURATED,
  FILTER_PRESET_FADED,
  FILTER_PRESET_VINTAGE,
  FILTER_PRESET_BLUR,
  FILTER_GRAYSCALE_VALUE,
  FILTER_SEPIA_VALUE,
  FILTER_BRIGHTNESS_VALUE,
  FILTER_CONTRAST_VALUE,
  FILTER_SATURATE_VALUE,
  FILTER_FADED_SATURATE,
  FILTER_FADED_BRIGHTNESS,
  FILTER_VINTAGE_SEPIA,
  FILTER_VINTAGE_BRIGHTNESS,
  FILTER_VINTAGE_CONTRAST,
  FILTER_BLUR_PX,
} from './config.js';

/**
 * Returns CSS filter string for a filter preset, or 'none'.
 * @param {string} filterPreset - preset name
 * @returns {string}
 */
export function getFilterCss(filterPreset) {
  if (filterPreset === FILTER_PRESET_GRAYSCALE) {
    return `grayscale(${FILTER_GRAYSCALE_VALUE * 100}%)`;
  }
  if (filterPreset === FILTER_PRESET_SEPIA) {
    return `sepia(${FILTER_SEPIA_VALUE * 100}%)`;
  }
  if (filterPreset === FILTER_PRESET_BRIGHTNESS) {
    return `brightness(${FILTER_BRIGHTNESS_VALUE})`;
  }
  if (filterPreset === FILTER_PRESET_CONTRAST) {
    return `contrast(${FILTER_CONTRAST_VALUE})`;
  }
  if (filterPreset === FILTER_PRESET_SATURATED) {
    return `saturate(${FILTER_SATURATE_VALUE})`;
  }
  if (filterPreset === FILTER_PRESET_FADED) {
    return `saturate(${FILTER_FADED_SATURATE}) brightness(${FILTER_FADED_BRIGHTNESS})`;
  }
  if (filterPreset === FILTER_PRESET_VINTAGE) {
    return `sepia(${FILTER_VINTAGE_SEPIA * 100}%) brightness(${FILTER_VINTAGE_BRIGHTNESS}) contrast(${FILTER_VINTAGE_CONTRAST})`;
  }
  if (filterPreset === FILTER_PRESET_BLUR) {
    return `blur(${FILTER_BLUR_PX}px)`;
  }
  return 'none';
}

/**
 * Draws a vignette overlay (dark edges) on the cell region.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x: number, y: number, width: number, height: number}} cell
 * @param {{strength?: number}} options - strength 0-1, 0 = no effect
 */
export function drawVignetteOverlay(ctx, cell, options = {}) {
  const strength = options.strength ?? 0;
  if (strength <= 0) return;

  const cx = cell.x + cell.width / 2;
  const cy = cell.y + cell.height / 2;
  const r = Math.max(cell.width, cell.height) / 2;

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, `rgba(0, 0, 0, ${strength})`);

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
  ctx.restore();
}

/**
 * Checks if ctx.filter is supported (Safari lacks it).
 * @param {CanvasRenderingContext2D|null} ctx
 * @returns {boolean}
 */
export function isFilterSupported(ctx) {
  if (!ctx) return false;
  try {
    const prev = ctx.filter;
    ctx.filter = 'grayscale(0%)';
    const ok = ctx.filter !== undefined;
    ctx.filter = prev;
    return ok;
  } catch {
    return false;
  }
}
