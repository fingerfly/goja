const HEX_SHORT_RE = /^#?([0-9a-fA-F]{3})$/;
const HEX_LONG_RE = /^#?([0-9a-fA-F]{6})$/;
const DEFAULT_BG_COLOR = '#ffffff';

function normalizeHexBody(hexBody) {
  if (hexBody.length === 3) {
    return hexBody.split('').map((ch) => `${ch}${ch}`).join('').toLowerCase();
  }
  return hexBody.toLowerCase();
}

export function normalizeHexColor(value, fallback = DEFAULT_BG_COLOR) {
  const raw = String(value ?? '').trim();
  const short = raw.match(HEX_SHORT_RE);
  if (short) return `#${normalizeHexBody(short[1])}`;
  const long = raw.match(HEX_LONG_RE);
  if (long) return `#${normalizeHexBody(long[1])}`;
  return fallback;
}

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
  const changed = inputEl.value !== normalized;
  inputEl.value = normalized;
  emitInput(inputEl);
  return changed;
}

export function initBackgroundColorControl(inputEl, options = {}) {
  if (!inputEl) return false;
  inputEl.value = normalizeHexColor(inputEl.value);
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
  inputEl.setAttribute('pattern', '#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?');
  inputEl.addEventListener('change', () => { normalizeAndEmit(inputEl); });
  inputEl.addEventListener('blur', () => { normalizeAndEmit(inputEl); });
  return true;
}
