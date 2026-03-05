function clamp(v, min, max, fallback) {
  const n = Number(v);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export function normalizeEdgeAmplitude(value) {
  const rounded = Math.round(clamp(value, 0, 1, 0.5) * 100) / 100;
  return Number(rounded.toFixed(2));
}

export function normalizeEdgeFrequency(value) {
  return Math.round(clamp(value, 1, 20, 4));
}

export function normalizeEdgeSeed(value) {
  return Math.round(clamp(value, 0, 99999, 0));
}

export function prefersTextNumericInput(userAgent = '') {
  const ua = String(userAgent || '').toLowerCase();
  return ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod');
}

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
