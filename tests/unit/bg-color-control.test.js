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

  it('keeps native color picker mode for non-fallback user agents', () => {
    const input = document.createElement('input');
    input.type = 'color';
    input.id = 'bgColor';
    input.value = '#abcdef';

    const changed = initBackgroundColorControl(input, {
      forceSafeFallback: false,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
    });

    expect(changed).toBe(false);
    expect(input.type).toBe('color');
  });

  it('binds safe palette buttons and emits input on tap', () => {
    const input = document.createElement('input');
    input.type = 'color';
    input.id = 'bgColor';
    input.value = '#ffffff';
    const paletteRoot = document.createElement('div');
    const black = document.createElement('button');
    black.type = 'button';
    black.setAttribute('data-bg-color', '#000000');
    const blue = document.createElement('button');
    blue.type = 'button';
    blue.setAttribute('data-bg-color', '#1976d2');
    paletteRoot.append(black, blue);

    const onInput = vi.fn();
    input.addEventListener('input', onInput);

    initBackgroundColorControl(input, {
      forceSafeFallback: true,
      userAgent: 'test-agent',
      paletteRoot,
    });

    blue.click();
    expect(input.value).toBe('#1976d2');
    expect(onInput).toHaveBeenCalled();
  });
});
