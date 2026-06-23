import { describe, it, expect } from 'vitest';
import {
  normalizeTileSpacing,
  normalizeTileRotation,
} from '../../js/watermark-tile-controls.js';

describe('normalizeTileSpacing', () => {
  it('clamps below minimum to 0.02', () => {
    expect(normalizeTileSpacing('0.015')).toBe(0.02);
  });

  it('clamps above maximum to 0.5', () => {
    expect(normalizeTileSpacing('0.555')).toBe(0.5);
  });

  it('returns default for invalid input', () => {
    expect(normalizeTileSpacing('abc')).toBe(0.2);
  });

  it('rounds to two decimal places', () => {
    expect(normalizeTileSpacing('0.123')).toBe(0.12);
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
