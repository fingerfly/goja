import { describe, it, expect, vi } from 'vitest';
import {
  normalizeHexColor,
  shouldUseSafeBgColorFallback,
  initBackgroundColorControl,
} from '../../js/bg-color-control.js';

describe('normalizeHexColor', () => {
  it('normalizes 3-digit and 6-digit hex values to lowercase #rrggbb', () => {
    expect(normalizeHexColor('#AbC')).toBe('#aabbcc');
    expect(normalizeHexColor('A1B2C3')).toBe('#a1b2c3');
  });

  it('falls back to #ffffff for invalid values', () => {
    expect(normalizeHexColor('')).toBe('#ffffff');
    expect(normalizeHexColor('#12')).toBe('#ffffff');
    expect(normalizeHexColor('not-a-color')).toBe('#ffffff');
  });
});

describe('shouldUseSafeBgColorFallback', () => {
  it('uses fallback for OPPO-like Android user agents', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 14; CPH2651 Build/UP1A) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 OPPOReno';
    expect(shouldUseSafeBgColorFallback({ userAgent: ua })).toBe(true);
  });

  it('keeps native picker for iPhone Safari', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1';
    expect(shouldUseSafeBgColorFallback({ userAgent: ua })).toBe(false);
  });
});

describe('initBackgroundColorControl', () => {
  it('switches to safe text mode, normalizes invalid values, and emits input-compatible updates', () => {
    const input = document.createElement('input');
    input.type = 'color';
    input.id = 'bgColor';
    input.value = '#123456';

    const onInput = vi.fn();
    input.addEventListener('input', onInput);

    initBackgroundColorControl(input, {
      forceSafeFallback: true,
      userAgent: 'test-agent',
    });

    expect(input.type).toBe('text');
    input.value = 'bad-value';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(input.value).toBe('#ffffff');
    expect(onInput).toHaveBeenCalled();
  });
});
