import { describe, it, expect } from 'vitest';
import { clampFrameValue, isFrameValueValid } from '../../js/frame-validation.js';

describe('clampFrameValue', () => {
  it('returns 320 for NaN', () => {
    expect(clampFrameValue('')).toBe(320);
    expect(clampFrameValue('abc')).toBe(320);
    expect(clampFrameValue(NaN)).toBe(320);
  });

  it('clamps values below 320 to 320', () => {
    expect(clampFrameValue(0)).toBe(320);
    expect(clampFrameValue(100)).toBe(320);
    expect(clampFrameValue('100')).toBe(320);
  });

  it('clamps values above 4096 to 4096', () => {
    expect(clampFrameValue(5000)).toBe(4096);
    expect(clampFrameValue(10000)).toBe(4096);
    expect(clampFrameValue('5000')).toBe(4096);
  });

  it('returns valid values unchanged', () => {
    expect(clampFrameValue(320)).toBe(320);
    expect(clampFrameValue(1080)).toBe(1080);
    expect(clampFrameValue(4096)).toBe(4096);
  });
});

describe('isFrameValueValid', () => {
  it('returns false for NaN', () => {
    expect(isFrameValueValid('')).toBe(false);
    expect(isFrameValueValid('abc')).toBe(false);
  });

  it('returns false for out-of-range values', () => {
    expect(isFrameValueValid(100)).toBe(false);
    expect(isFrameValueValid(5000)).toBe(false);
    expect(isFrameValueValid(319)).toBe(false);
    expect(isFrameValueValid(4097)).toBe(false);
  });

  it('returns true for valid values', () => {
    expect(isFrameValueValid(320)).toBe(true);
    expect(isFrameValueValid(1080)).toBe(true);
    expect(isFrameValueValid(4096)).toBe(true);
    expect(isFrameValueValid('1080')).toBe(true);
  });
});
