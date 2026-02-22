import exifr from './vendor/exifr.mjs';
import { EXIF_TAG_SET } from './config.js';

/**
 * Reads DateTimeOriginal from a photo file's EXIF.
 * @param {File} file - Image file
 * @returns {Promise<Date|null>} Raw Date or null if no EXIF/DateTimeOriginal
 */
export async function readDateTimeOriginal(file) {
  try {
    const result = await exifr.parse(file, EXIF_TAG_SET);
    const d = result?.DateTimeOriginal;
    if (d instanceof Date) return d;
    if (typeof d === 'string') return new Date(d);
    return null;
  } catch {
    return null;
  }
}

/**
 * Formats a Date or ISO string for display in the given locale.
 * @param {Date|string|null|undefined} value - Date, ISO string, or null
 * @param {string} locale - BCP 47 locale (e.g. 'en', 'de')
 * @returns {string} Formatted date string or ''
 */
export function formatDateTimeOriginal(value, locale = 'en') {
  if (value == null) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
