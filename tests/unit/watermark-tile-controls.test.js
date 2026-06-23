import { describe, it, expect } from 'vitest';
import {
  normalizeTileSpacing,
  normalizeTileColSpacing,
  normalizeTileRotation,
} from '../../js/watermark-tile-controls.js';

describe('normalizeTileSpacing', () => {
  it('clamps below minimum to 0', () => {
    expect(normalizeTileSpacing('-5')).toBe(0);
  });

  it('clamps above maximum to 400', () => {
    expect(normalizeTileSpacing('555')).toBe(400);
  });

  it('returns default for invalid input', () => {
    expect(normalizeTileSpacing('abc')).toBe(80);
  });

  it('rounds to integer pixels', () => {
    expect(normalizeTileSpacing('42.6')).toBe(43);
  });
});

describe('normalizeTileColSpacing', () => {
  it('clamps below minimum to 0', () => {
    expect(normalizeTileColSpacing('-5')).toBe(0);
  });

  it('clamps above maximum to 400', () => {
    expect(normalizeTileColSpacing('555')).toBe(400);
  });

  it('returns default for invalid input', () => {
    expect(normalizeTileColSpacing('abc')).toBe(0);
  });
});

describe('normalizeTileRotation', () => {
  it('clamps below minimum to -90', () => {
    expect(normalizeTileRotation('-91')).toBe(-90);
  });

  it('clamps above maximum to 90', () => {
    expect(normalizeTileRotation('91')).toBe(90);
  });

  it('returns default for invalid input', () => {
    expect(normalizeTileRotation('abc')).toBe(-30);
  });

  it('rounds fractional degrees', () => {
    expect(normalizeTileRotation('-25.6')).toBe(-26);
  });
});
