import { describe, it, expect, vi, afterEach } from 'vitest';
import { isStandaloneDisplayMode } from '../../js/display-mode.js';

describe('isStandaloneDisplayMode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true for display-mode standalone', () => {
    vi.stubGlobal('matchMedia', vi.fn((q) => ({
      matches: q === '(display-mode: standalone)',
      media: q,
    })));
    expect(isStandaloneDisplayMode()).toBe(true);
  });

  it('returns true for legacy iOS navigator.standalone', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, media: 'not all' })));
    vi.stubGlobal('navigator', { standalone: true, userAgent: '' });
    expect(isStandaloneDisplayMode()).toBe(true);
  });

  it('returns false in normal browser tab', () => {
    vi.stubGlobal('matchMedia', vi.fn((q) => ({
      matches: q === '(display-mode: browser)',
      media: q,
    })));
    vi.stubGlobal('navigator', {
      standalone: false,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
    });
    expect(isStandaloneDisplayMode()).toBe(false);
  });

  it('returns true on iPhone when display-mode browser is false', () => {
    vi.stubGlobal('matchMedia', vi.fn((q) => ({
      matches: false,
      media: q,
    })));
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      standalone: false,
    });
    expect(isStandaloneDisplayMode()).toBe(true);
  });
});
