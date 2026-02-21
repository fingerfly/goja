import { describe, it, expect } from 'vitest';
import { needsExifRotation, correctedDimensions } from '../../js/utils.js';

describe('needsExifRotation', () => {
  it('returns false for orientation 1 (normal)', () => {
    expect(needsExifRotation(1)).toBe(false);
  });

  it('returns true for orientation 6 (rotated 90 CW)', () => {
    expect(needsExifRotation(6)).toBe(true);
  });

  it('returns true for orientation 8 (rotated 270 CW)', () => {
    expect(needsExifRotation(8)).toBe(true);
  });

  it('returns true for orientation 5 (mirrored + rotated)', () => {
    expect(needsExifRotation(5)).toBe(true);
  });

  it('returns true for orientation 7 (mirrored + rotated)', () => {
    expect(needsExifRotation(7)).toBe(true);
  });

  it('returns false for orientation 2 (mirrored, no rotation)', () => {
    expect(needsExifRotation(2)).toBe(false);
  });

  it('returns false for orientation 3 (rotated 180)', () => {
    expect(needsExifRotation(3)).toBe(false);
  });

  it('returns false for undefined/null orientation', () => {
    expect(needsExifRotation(undefined)).toBe(false);
    expect(needsExifRotation(null)).toBe(false);
  });
});

describe('correctedDimensions', () => {
  it('returns original dimensions for normal orientation', () => {
    const result = correctedDimensions(1600, 900, 1);
    expect(result).toEqual({ width: 1600, height: 900 });
  });

  it('swaps dimensions for orientation 6 (90 CW)', () => {
    const result = correctedDimensions(1600, 900, 6);
    expect(result).toEqual({ width: 900, height: 1600 });
  });

  it('swaps dimensions for orientation 8 (270 CW)', () => {
    const result = correctedDimensions(1600, 900, 8);
    expect(result).toEqual({ width: 900, height: 1600 });
  });

  it('keeps dimensions for orientation 3 (180)', () => {
    const result = correctedDimensions(1600, 900, 3);
    expect(result).toEqual({ width: 1600, height: 900 });
  });

  it('swaps dimensions for orientation 5', () => {
    const result = correctedDimensions(1600, 900, 5);
    expect(result).toEqual({ width: 900, height: 1600 });
  });

  it('swaps dimensions for orientation 7', () => {
    const result = correctedDimensions(1600, 900, 7);
    expect(result).toEqual({ width: 900, height: 1600 });
  });

  it('returns original dimensions when orientation is undefined', () => {
    const result = correctedDimensions(1600, 900);
    expect(result).toEqual({ width: 1600, height: 900 });
  });
});
