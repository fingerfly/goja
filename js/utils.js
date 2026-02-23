import { EXPORT_FILENAME_DEFAULT, EXPORT_FILENAME_MAX_LENGTH } from './config.js';

const RESERVED_CHARS = /[/\\?%*:|"<>]/g;
const DOT_DOT = /\.+/g;

/**
 * Sanitizes a filename for safe export: strips path separators, reserved chars, collapses dots.
 * @param {string | null | undefined} name - Raw filename
 * @param {string} defaultName - Fallback when name is empty/invalid
 * @returns {string}
 */
export function sanitizeFilename(name, defaultName = EXPORT_FILENAME_DEFAULT) {
  const s = (name ?? '').trim();
  if (!s) return defaultName;
  const cleaned = s
    .replace(RESERVED_CHARS, '')
    .replace(DOT_DOT, '')
    .slice(0, EXPORT_FILENAME_MAX_LENGTH);
  return cleaned || defaultName;
}

/**
 * Returns a debounced version of fn that waits ms before invoking.
 * @param {(...args: unknown[]) => void} fn
 * @param {number} ms
 * @returns {(...args: unknown[]) => void}
 */
export function debounce(fn, ms) {
  let tid;
  return (...args) => {
    clearTimeout(tid);
    tid = setTimeout(() => fn(...args), ms);
  };
}

export function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}
