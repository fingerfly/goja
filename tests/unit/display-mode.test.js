import { describe, it, expect, vi, afterEach } from 'vitest';
import { isStandaloneDisplayMode, isIosStandaloneWebApp } from '../../js/display-mode.js';

describe('isStandaloneDisplayMode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true for display-mode standalone', () => {
    vi.stubGlobal('matchMedia', vi.fn((q) => ({
      matches: q === '(display-mode: standalone)',
    })));
    expect(isStandaloneDisplayMode()).toBe(true);
  });

  it('returns true for legacy iOS navigator.standalone', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
    vi.stubGlobal('navigator', { standalone: true });
    expect(isStandaloneDisplayMode()).toBe(true);
  });

  it('returns false in normal browser tab', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, media: '(display-mode: browser)' })));
    vi.stubGlobal('navigator', { standalone: false });
    expect(isStandaloneDisplayMode()).toBe(false);
    expect(isIosStandaloneWebApp()).toBe(false);
  });
});

describe('isIosStandaloneWebApp', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true when display-mode browser is false on iPhone', () => {
    vi.stubGlobal('matchMedia', vi.fn((q) => ({
      matches: q !== '(display-mode: browser)',
      media: q,
    })));
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      standalone: false,
    });
    expect(isIosStandaloneWebApp()).toBe(true);
  });
});
