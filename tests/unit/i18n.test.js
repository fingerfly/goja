import { describe, it, expect, vi, beforeEach } from 'vitest';
import { t, setLocale, getLocale, init, applyToDOM, getAvailableLocales } from '../../js/i18n.js';
import en from '../../js/locales/en.js';
import zhHans from '../../js/locales/zh-Hans.js';
import zhHant from '../../js/locales/zh-Hant.js';
import es from '../../js/locales/es.js';
import ja from '../../js/locales/ja.js';
import eo from '../../js/locales/eo.js';

const REQUIRED_FILENAME_KEYS = ['exportFilename', 'exportFilenamePlaceholder', 'exportUseDate'];
const REQUIRED_CAPTURE_DATE_KEYS = ['showCaptureDate', 'captureDatePos', 'captureDateOpacity', 'captureDateFontSize'];
const REQUIRED_EFFECTS_KEYS = [
  'effectsSection', 'filterPreset', 'filterNone', 'filterGrayscale', 'filterSepia',
  'filterBrightness', 'filterContrast', 'filterSaturated', 'filterFaded', 'filterVintage', 'filterBlur',
  'vignetteEnabled', 'vignetteStrength',
];
const REQUIRED_LEGAL_KEYS = ['legalNoticeTitle', 'agplSourceNotice', 'viewSourceCode', 'viewLicense'];
const REQUIRED_FRAME_HINT_KEY = 'frameDimensionHint';
const ALL_LOCALES = [
  ['en', en],
  ['zh-Hans', zhHans],
  ['zh-Hant', zhHant],
  ['es', es],
  ['ja', ja],
  ['eo', eo],
];

describe('i18n', () => {
  const STORAGE_KEY = 'goja-locale';

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('getAvailableLocales', () => {
    it('returns all available locales', () => {
      expect(getAvailableLocales()).toEqual(['en', 'zh-Hans', 'zh-Hant', 'es', 'ja', 'eo']);
    });
  });

  describe('t', () => {
    beforeEach(() => {
      setLocale('en');
    });

    it('returns translation for current locale', () => {
      expect(t('addBtn')).toBe('+ Add');
      expect(t('exportBtn')).toBe('Export');
    });

    it('falls back to en if key missing in current locale', () => {
      setLocale('zh-Hans');
      expect(t('_fallbackTest')).toBe('fallback');
    });

    it('all locales have required filename i18n keys', () => {
      for (const [name, dict] of ALL_LOCALES) {
        for (const key of REQUIRED_FILENAME_KEYS) {
          expect(dict[key], `${name} missing ${key}`).toBeDefined();
          expect(typeof dict[key], `${name} ${key} must be string`).toBe('string');
        }
      }
    });

    it('all locales have required capture date i18n keys', () => {
      for (const [name, dict] of ALL_LOCALES) {
        for (const key of REQUIRED_CAPTURE_DATE_KEYS) {
          expect(dict[key], `${name} missing ${key}`).toBeDefined();
          expect(typeof dict[key], `${name} ${key} must be string`).toBe('string');
        }
      }
    });

    it('all locales have required effects i18n keys', () => {
      for (const [name, dict] of ALL_LOCALES) {
        for (const key of REQUIRED_EFFECTS_KEYS) {
          expect(dict[key], `${name} missing ${key}`).toBeDefined();
          expect(typeof dict[key], `${name} ${key} must be string`).toBe('string');
        }
      }
    });

    it('all locales have required legal notice i18n keys', () => {
      for (const [name, dict] of ALL_LOCALES) {
        for (const key of REQUIRED_LEGAL_KEYS) {
          expect(dict[key], `${name} missing ${key}`).toBeDefined();
          expect(typeof dict[key], `${name} ${key} must be string`).toBe('string');
        }
      }
    });

    it('all locales have frameDimensionHint', () => {
      for (const [name, dict] of ALL_LOCALES) {
        expect(dict[REQUIRED_FRAME_HINT_KEY], `${name} missing frameDimensionHint`).toBeDefined();
        expect(typeof dict[REQUIRED_FRAME_HINT_KEY], `${name} frameDimensionHint must be string`).toBe('string');
      }
    });

    it('preset34 returns 3:4 (aspect ratio for 1080×1440 portrait)', () => {
      setLocale('en');
      expect(t('preset34')).toBe('3:4');
    });

    it('returns key if not found anywhere', () => {
      expect(t('nonexistentKey')).toBe('nonexistentKey');
    });

    it('supports simple interpolation', () => {
      expect(t('photoAlt', { n: 1 })).toBe('Photo 1');
      expect(t('photoAlt', { n: 3 })).toBe('Photo 3');
    });
  });

  describe('setLocale and getLocale', () => {
    it('getLocale returns current locale', () => {
      setLocale('en');
      expect(getLocale()).toBe('en');
      setLocale('zh-Hant');
      expect(getLocale()).toBe('zh-Hant');
    });

    it('setLocale persists to localStorage', () => {
      setLocale('zh-Hans');
      expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'zh-Hans');
    });
  });

  describe('init', () => {
    it('uses stored locale when present', () => {
      localStorage.getItem.mockReturnValue('zh-Hant');
      init();
      expect(getLocale()).toBe('zh-Hant');
    });

    it('falls back to en when no stored locale', () => {
      localStorage.getItem.mockReturnValue(null);
      init();
      expect(getLocale()).toBe('en');
    });
  });
});
