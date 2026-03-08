/**
 * Purpose: Normalize and safely handle grid background color input.
 * Description:
 * - Normalizes color values to canonical hex format.
 * - Enables text-input fallback for problematic mobile environments.
 * - Syncs optional swatch palette buttons with current color value.
 */
const HEX_SHORT_RE = /^#?([0-9a-fA-F]{3})$/;
const HEX_LONG_RE = /^#?([0-9a-fA-F]{6})$/;
const DEFAULT_BG_COLOR = '#ffffff';
const PALETTE_BUTTON_SELECTOR = '[data-bg-color]';

function normalizeHexBody(hexBody) {
  if (hexBody.length === 3) {
    return hexBody.split('').map((ch) => `${ch}${ch}`).join('').toLowerCase();
  }
  return hexBody.toLowerCase();
}

/**
 * Normalize hex color input to `#rrggbb`.
 * @param {string} value
 * @param {string} [fallback]
 * @returns {string}
 */
export function normalizeHexColor(value, fallback = DEFAULT_BG_COLOR) {
  const raw = String(value ?? '').trim();
  const short = raw.match(HEX_SHORT_RE);
  if (short) return `#${normalizeHexBody(short[1])}`;
  const long = raw.match(HEX_LONG_RE);
  if (long) return `#${normalizeHexBody(long[1])}`;
  return fallback;
}

/**
 * Decide whether to force a text-input safe fallback.
 * @param {{
 *   userAgent?: string,
 *   forceSafeFallback?: boolean,
 *   hasNativeColorInput?: boolean
 * }} [options]
 * @returns {boolean}
 */
export function shouldUseSafeBgColorFallback({
  userAgent = '',
  forceSafeFallback = false,
  hasNativeColorInput = true,
} = {}) {
  if (forceSafeFallback || !hasNativeColorInput) return true;
  const ua = String(userAgent).toLowerCase();
  if (/(iphone|ipad|ipod)/.test(ua)) return false;
  if (!/android/.test(ua)) return false;
  if (/(oppo|heytap|coloros|cph\d+)/.test(ua)) return true;
  const chromiumMobile = /chrome\/\d+/.test(ua) && /mobile/.test(ua) && /safari\/\d+/.test(ua);
  const webView = /; wv\)|\bwv\b/.test(ua);
  return !(chromiumMobile && !webView);
}

function emitInput(inputEl) {
  inputEl.dispatchEvent(new Event('input', { bubbles: true }));
}

function normalizeAndEmit(inputEl) {
  const normalized = normalizeHexColor(inputEl.value);
  inputEl.value = normalized;
  emitInput(inputEl);
}

function bindPalette(inputEl, paletteRoot) {
  if (!paletteRoot) return;
  const buttons = Array.from(paletteRoot.querySelectorAll(PALETTE_BUTTON_SELECTOR));
  if (buttons.length === 0) return;

  const syncActiveButton = () => {
    const current = normalizeHexColor(inputEl.value);
    buttons.forEach((btn) => {
      const swatch = normalizeHexColor(btn.getAttribute('data-bg-color'));
      const selected = swatch === current;
      btn.classList.toggle('is-active', selected);
      btn.setAttribute('aria-pressed', String(selected));
    });
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const swatch = normalizeHexColor(btn.getAttribute('data-bg-color'));
      inputEl.value = swatch;
      emitInput(inputEl);
      syncActiveButton();
    });
  });

  inputEl.addEventListener('input', syncActiveButton);
  syncActiveButton();
}

/**
 * Initialize background-color input behavior and palette syncing.
 * @param {HTMLInputElement | null} inputEl
 * @param {{ paletteRoot?: HTMLElement | null, userAgent?: string,
 *   forceSafeFallback?: boolean }} [options]
 * @returns {boolean} True when text fallback mode is enabled.
 */
export function initBackgroundColorControl(inputEl, options = {}) {
  if (!inputEl) return false;
  inputEl.value = normalizeHexColor(inputEl.value);
  bindPalette(inputEl, options.paletteRoot);
  const useFallback = shouldUseSafeBgColorFallback({
    userAgent: options.userAgent ?? navigator?.userAgent ?? '',
    forceSafeFallback: options.forceSafeFallback ?? false,
    hasNativeColorInput: inputEl.type === 'color',
  });
  if (!useFallback) return false;
  inputEl.type = 'text';
  inputEl.setAttribute('inputmode', 'text');
  inputEl.setAttribute('spellcheck', 'false');
  inputEl.setAttribute('autocapitalize', 'off');
  inputEl.setAttribute('autocomplete', 'off');
  inputEl.setAttribute('placeholder', '#rrggbb');
  inputEl.setAttribute('pattern', '#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?');
  inputEl.addEventListener('change', () => { normalizeAndEmit(inputEl); });
  inputEl.addEventListener('blur', () => { normalizeAndEmit(inputEl); });
  return true;
}
