/**
 * Builds normalized grid effect options from form state.
 * Shared by preview (app.js renderGrid) and export (handleExport).
 */
import {
  WATERMARK_OPACITY_DEFAULT,
  WATERMARK_POSITION_DEFAULT,
  WATERMARK_FONT_SCALE_DEFAULT,
  CAPTURE_DATE_OPACITY_DEFAULT,
  CAPTURE_DATE_POSITION_DEFAULT,
  CAPTURE_DATE_FONT_SCALE_DEFAULT,
  VIGNETTE_STRENGTH_DEFAULT,
} from './config.js';
import { getFilterCss } from './image-effects.js';

function parseNum(val, defaultVal) {
  if (val == null || val === '') return defaultVal;
  const n = parseFloat(val);
  return Number.isNaN(n) ? defaultVal : n;
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

export function getGridEffectsOptions(form, photos, formatDateTimeOriginal, getLocale) {
  const locale = typeof getLocale === 'function' ? getLocale() : (getLocale ?? 'en');
  const wm = getWatermarkOptions(form, locale);
  const capture = getCaptureDateOptions(form);
  const vignette = getVignetteOptions(form);
  const showCaptureDate = form.showCaptureDate ?? false;
  const dateOriginals = showCaptureDate && Array.isArray(photos) && formatDateTimeOriginal
    ? photos.map((p) => (p?.dateOriginal ? formatDateTimeOriginal(p.dateOriginal, locale) : null))
    : [];
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
  };
}
