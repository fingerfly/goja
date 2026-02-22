import en from './locales/en.js';
import zhHans from './locales/zh-Hans.js';
import zhHant from './locales/zh-Hant.js';
import de from './locales/de.js';
import nl from './locales/nl.js';
import es from './locales/es.js';
import it from './locales/it.js';
import tr from './locales/tr.js';
import fi from './locales/fi.js';
import ja from './locales/ja.js';
import eo from './locales/eo.js';

const STORAGE_KEY = 'goja-locale';
const LOCALES = {
  en, 'zh-Hans': zhHans, 'zh-Hant': zhHant,
  de, nl, es, it, tr, fi, ja, eo,
};
const AVAILABLE = ['en', 'zh-Hans', 'zh-Hant', 'de', 'nl', 'es', 'it', 'tr', 'fi', 'ja', 'eo'];
let currentLocale = 'en';

function interpolate(str, params) {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? ''));
}

export function t(key, params) {
  const dict = LOCALES[currentLocale] || en;
  let val = dict[key];
  if (val === undefined) val = en[key];
  if (val === undefined) return key;
  return interpolate(val, params);
}

export function getLocale() {
  return currentLocale;
}

export function setLocale(locale) {
  if (!AVAILABLE.includes(locale)) return;
  currentLocale = locale;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, locale);
  }
}

export function getAvailableLocales() {
  return [...AVAILABLE];
}

function detectBrowserLocale() {
  const raw = typeof navigator !== 'undefined' && (navigator.language || navigator.languages?.[0]);
  if (!raw) return 'en';
  const lower = raw.toLowerCase();
  if (lower.startsWith('zh-hant') || lower.startsWith('zh-tw') || lower.startsWith('zh-hk')) return 'zh-Hant';
  if (lower.startsWith('zh')) return 'zh-Hans';
  if (lower.startsWith('de')) return 'de';
  if (lower.startsWith('nl')) return 'nl';
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('it')) return 'it';
  if (lower.startsWith('tr')) return 'tr';
  if (lower.startsWith('fi')) return 'fi';
  if (lower.startsWith('ja')) return 'ja';
  if (lower.startsWith('eo')) return 'eo';
  return 'en';
}

export function init() {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && AVAILABLE.includes(stored)) {
      currentLocale = stored;
      return;
    }
  }
  currentLocale = detectBrowserLocale();
}

export function applyToDOM() {
  if (typeof document === 'undefined') return;
  const langMap = { 'zh-Hans': 'zh-Hans', 'zh-Hant': 'zh-Hant', de: 'de', nl: 'nl', es: 'es', it: 'it', tr: 'tr', fi: 'fi', ja: 'ja', eo: 'eo' };
  document.documentElement.lang = langMap[currentLocale] || 'en';
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
  });
}
