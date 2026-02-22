import { describe, it, expect, vi, beforeEach } from 'vitest';
import { t, setLocale, getLocale, init, applyToDOM, getAvailableLocales } from '../../js/i18n.js';

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
      expect(getAvailableLocales()).toEqual(['en', 'zh-Hans', 'zh-Hant', 'de', 'nl', 'es', 'it', 'tr', 'fi', 'ja', 'eo']);
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
