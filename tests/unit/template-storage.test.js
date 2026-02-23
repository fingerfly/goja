import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getStoredTemplate,
  setStoredTemplate,
  populateTemplateSelect,
} from '../../js/template-storage.js';

const STORAGE_KEY_PREFIX = 'goja-template';

describe('template-storage', () => {
  let originalLocalStorage;

  beforeEach(() => {
    originalLocalStorage = globalThis.localStorage;
    vi.stubGlobal('localStorage', {
      data: {},
      getItem(key) {
        return this.data[key] ?? null;
      },
      setItem(key, val) {
        this.data[key] = String(val);
      },
    });
  });

  afterEach(() => {
    vi.stubGlobal('localStorage', originalLocalStorage);
  });

  describe('getStoredTemplate', () => {
    it('returns auto when not set', () => {
      expect(getStoredTemplate(3)).toBe('auto');
    });

    it('returns stored value for count', () => {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}-4`, '1x1');
      expect(getStoredTemplate(4)).toBe('1x1');
    });

    it('returns auto when localStorage throws', () => {
      vi.stubGlobal('localStorage', {
        getItem: () => {
          throw new Error('quota exceeded');
        },
      });
      expect(getStoredTemplate(3)).toBe('auto');
    });
  });

  describe('setStoredTemplate', () => {
    it('stores value for count', () => {
      setStoredTemplate(5, '2x2');
      expect(localStorage.getItem(`${STORAGE_KEY_PREFIX}-5`)).toBe('2x2');
    });

    it('does not throw when localStorage fails', () => {
      vi.stubGlobal('localStorage', {
        setItem: () => {
          throw new Error('quota exceeded');
        },
      });
      expect(() => setStoredTemplate(3, '1x1')).not.toThrow();
    });
  });

  describe('populateTemplateSelect', () => {
    it('populates select with auto and templates', () => {
      const select = document.createElement('select');
      const getTemplatesForCount = () => [{ id: '1x1' }, { id: '2x2' }];
      const t = (key) => (key === 'templateAuto' ? 'Auto' : key);
      populateTemplateSelect(select, 2, getTemplatesForCount, t);
      expect(select.options.length).toBe(3);
      expect(select.options[0].value).toBe('auto');
      expect(select.options[0].textContent).toBe('Auto');
      expect(select.options[1].value).toBe('1x1');
      expect(select.options[2].value).toBe('2x2');
    });

    it('does nothing when templateSelect is null', () => {
      const getTemplatesForCount = () => [];
      const t = () => '';
      expect(() => populateTemplateSelect(null, 1, getTemplatesForCount, t)).not.toThrow();
    });
  });
});
