/**
 * Builds normalized grid effect options from form state.
 * Shared by preview (preview-renderer.js renderGrid) and export (handleExport).
 */
import {
  WATERMARK_OPACITY_DEFAULT,
  WATERMARK_POSITION_DEFAULT,
  WATERMARK_FONT_SCALE_DEFAULT,
  CAPTURE_DATE_OPACITY_DEFAULT,
  CAPTURE_DATE_POSITION_DEFAULT,
  CAPTURE_DATE_FONT_SCALE_DEFAULT,
  VIGNETTE_STRENGTH_DEFAULT,
  GLOBAL_FRAME_SHAPE_DEFAULT,
  GLOBAL_FRAME_STROKE_ENABLED_DEFAULT,
  GLOBAL_FRAME_STROKE_WIDTH_DEFAULT,
  GLOBAL_FRAME_STROKE_COLOR_DEFAULT,
  GLOBAL_FRAME_STROKE_OPACITY_DEFAULT,
  OUTSIDE_BACKGROUND_COLOR_DEFAULT,
  CELL_SHAPE_TEMPLATE_DEFAULT,
  CELL_SHAPE_ORIENTATION_DEFAULT,
  SUPERELLIPSE_EXPONENT_DEFAULT,
  SUPERELLIPSE_EXPONENT_MIN,
  SUPERELLIPSE_EXPONENT_MAX,
} from './config.js';
import { getFilterCss } from './image-effects.js';
import { normalizeEdgeStyle } from './edge-style-presets.js';
import {
  normalizeGlobalFrameShape,
  normalizeCellShapeTemplate,
  normalizeShapeOrientation,
  normalizeSuperellipseExponent,
} from './frame-shape-geometry.js';

function parseNum(val, defaultVal) {
  if (val == null || val === '') return defaultVal;
  const n = parseFloat(val);
  return Number.isNaN(n) ? defaultVal : n;
}

function parseIntBounded(val, defaultVal, min, max) {
  const n = Math.round(Number(val));
  if (Number.isNaN(n)) return defaultVal;
  return Math.max(min, Math.min(max, n));
}

function parseBoolish(val, fallback = false) {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val.toLowerCase() === 'true';
  return fallback;
}

function parseNumBounded(val, defaultVal, min, max) {
  const n = parseNum(val, defaultVal);
  return Math.max(min, Math.min(max, n));
}

function assertSupportedEdgeStyle(style) {
  if (style === 'soft-wave') {
    throw new Error('Removed edge style: soft-wave');
  }
}

export function getWatermarkOptions(form, locale = 'en') {
  return {
    type: form.wmType ?? 'none',
    text: (form.wmText ?? '').trim(),
    position: form.wmPos ?? WATERMARK_POSITION_DEFAULT,
    opacity: parseNum(form.wmOpacity, WATERMARK_OPACITY_DEFAULT),
    fontScale: parseNum(form.wmFontSize, WATERMARK_FONT_SCALE_DEFAULT),
    backgroundColor: form.bgColor ?? '#ffffff',
    locale: locale ?? 'en',
  };
}

export function getCaptureDateOptions(form) {
  return {
    position: form.captureDatePos ?? CAPTURE_DATE_POSITION_DEFAULT,
    opacity: parseNum(form.captureDateOpacity, CAPTURE_DATE_OPACITY_DEFAULT),
    fontScale: parseNum(form.captureDateFontSize, CAPTURE_DATE_FONT_SCALE_DEFAULT),
  };
}

export function getVignetteOptions(form) {
  return {
    enabled: form.vignetteEnabled ?? false,
    strength: parseNum(form.vignetteStrength, VIGNETTE_STRENGTH_DEFAULT),
  };
}

/**
 * Builds form object from DOM refs for grid effects.
 * @param {{ wmType?: HTMLSelectElement, wmText?: HTMLInputElement, wmPos?: HTMLSelectElement, wmOpacity?: HTMLInputElement, wmFontSize?: HTMLInputElement, showCaptureDate?: HTMLInputElement, captureDatePos?: HTMLSelectElement, captureDateOpacity?: HTMLInputElement, captureDateFontSize?: HTMLInputElement, vignetteEnabled?: HTMLInputElement, vignetteStrength?: HTMLInputElement, filterPreset?: HTMLSelectElement, imageFit?: HTMLSelectElement, bgColor?: HTMLInputElement, formatSelect?: HTMLSelectElement }} refs
 * @param {boolean} [includeFormat]
 * @returns {Record<string, unknown>}
 */
export function buildFormFromRefs(refs, includeFormat = false) {
  const f = {
    wmType: refs.wmType?.value,
    wmText: refs.wmText?.value,
    wmPos: refs.wmPos?.value,
    wmOpacity: refs.wmOpacity?.value,
    wmFontSize: refs.wmFontSize?.value,
    showCaptureDate: refs.showCaptureDate?.checked,
    captureDatePos: refs.captureDatePos?.value,
    captureDateOpacity: refs.captureDateOpacity?.value,
    captureDateFontSize: refs.captureDateFontSize?.value,
    vignetteEnabled: refs.vignetteEnabled?.checked,
    vignetteStrength: refs.vignetteStrength?.value,
    filterPreset: refs.filterPreset?.value,
    imageFit: refs.imageFit?.value,
    bgColor: refs.bgColor?.value,
    edgeStyle: refs.edgeStyle?.value,
    edgeAmplitude: refs.edgeIntensityInput?.value ?? refs.edgeIntensity?.value,
    edgeIntensity: refs.edgeIntensity?.value,
    edgeFrequency: refs.edgeFrequency?.value,
    edgeSeed: refs.edgeSeed?.value,
    edgeFeatureAvailable: refs.edgeFeatureAvailable?.value,
    globalFrameShape: refs.globalFrameShape?.value,
    globalFrameStrokeEnabled: refs.globalFrameStrokeEnabled?.checked,
    globalFrameStrokeWidth: refs.globalFrameStrokeWidth?.value,
    globalFrameStrokeColor: refs.globalFrameStrokeColor?.value,
    globalFrameStrokeOpacity: refs.globalFrameStrokeOpacity?.value,
    outsideBackgroundColor: refs.outsideBackgroundColor?.value,
    superellipseExponent: refs.superellipseExponent?.value,
    cellShapeTemplate: refs.cellShapeTemplate?.value,
    cellShapeOrientation: refs.cellShapeOrientation?.value,
  };
  if (includeFormat) f.format = refs.formatSelect?.value;
  return f;
}

export function getGridEffectsOptions(form, photos, formatDateTimeOriginal, getLocale) {
  const locale = typeof getLocale === 'function' ? getLocale() : (getLocale ?? 'en');
  const wm = getWatermarkOptions(form, locale);
  const capture = getCaptureDateOptions(form);
  const vignette = getVignetteOptions(form);
  const showCaptureDate = form.showCaptureDate ?? false;
  const dateOriginals = showCaptureDate && Array.isArray(photos) && formatDateTimeOriginal
    ? photos.map((p) => (p?.dateOriginal ? formatDateTimeOriginal(p.dateOriginal, locale) : null))
    : [];
  const edgeAdvancedSupported = parseBoolish(form.edgeFeatureAvailable, false);
  assertSupportedEdgeStyle(form.edgeStyle);
  const edgeStyle = edgeAdvancedSupported ? normalizeEdgeStyle(form.edgeStyle ?? 'straight') : 'straight';
  const globalFrameShape = edgeAdvancedSupported
    ? normalizeGlobalFrameShape(form.globalFrameShape ?? GLOBAL_FRAME_SHAPE_DEFAULT)
    : GLOBAL_FRAME_SHAPE_DEFAULT;
  const cellShapeTemplate = edgeAdvancedSupported
    ? normalizeCellShapeTemplate(form.cellShapeTemplate ?? CELL_SHAPE_TEMPLATE_DEFAULT)
    : CELL_SHAPE_TEMPLATE_DEFAULT;
  const superellipseExponent = edgeAdvancedSupported
    ? parseNumBounded(
      normalizeSuperellipseExponent(form.superellipseExponent ?? SUPERELLIPSE_EXPONENT_DEFAULT),
      SUPERELLIPSE_EXPONENT_DEFAULT,
      SUPERELLIPSE_EXPONENT_MIN,
      SUPERELLIPSE_EXPONENT_MAX
    )
    : SUPERELLIPSE_EXPONENT_DEFAULT;
  return {
    backgroundColor: form.bgColor ?? '#ffffff',
    format: form.format ?? 'image/jpeg',
    fitMode: form.imageFit ?? 'cover',
    filter: getFilterCss(form.filterPreset ?? 'none'),
    vignetteEnabled: vignette.enabled,
    vignetteStrength: vignette.strength,
    watermarkType: wm.type,
    watermarkText: wm.text,
    watermarkPos: wm.position,
    watermarkOpacity: wm.opacity,
    watermarkFontScale: wm.fontScale,
    locale: wm.locale,
    showCaptureDate,
    captureDatePos: capture.position,
    captureDateOpacity: capture.opacity,
    captureDateFontScale: capture.fontScale,
    dateOriginals,
    edgeStyle,
    edgeIntensity: parseNum(form.edgeAmplitude ?? form.edgeIntensity, 0.5),
    edgeFrequency: parseIntBounded(form.edgeFrequency, 4, 1, 20),
    edgeSeed: parseNum(form.edgeSeed, 0),
    edgeAdvancedSupported,
    globalFrameShape,
    globalFrameStrokeEnabled: parseBoolish(form.globalFrameStrokeEnabled, GLOBAL_FRAME_STROKE_ENABLED_DEFAULT),
    globalFrameStrokeWidth: parseNumBounded(form.globalFrameStrokeWidth, GLOBAL_FRAME_STROKE_WIDTH_DEFAULT, 0, 20),
    globalFrameStrokeColor: form.globalFrameStrokeColor ?? GLOBAL_FRAME_STROKE_COLOR_DEFAULT,
    globalFrameStrokeOpacity: parseNumBounded(form.globalFrameStrokeOpacity, GLOBAL_FRAME_STROKE_OPACITY_DEFAULT, 0, 1),
    outsideBackgroundColor: form.outsideBackgroundColor ?? OUTSIDE_BACKGROUND_COLOR_DEFAULT,
    superellipseExponent,
    cellShapeTemplate,
    cellShapeOrientation: normalizeShapeOrientation(form.cellShapeOrientation ?? CELL_SHAPE_ORIENTATION_DEFAULT),
  };
}
