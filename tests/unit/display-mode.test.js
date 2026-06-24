import { describe, it, expect, vi, afterEach } from 'vitest';
import { isStandaloneDisplayMode } from '../../js/display-mode.js';

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
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
    vi.stubGlobal('navigator', { standalone: false });
    expect(isStandaloneDisplayMode()).toBe(false);
  });
});
