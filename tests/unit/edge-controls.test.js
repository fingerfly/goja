import { describe, it, expect } from 'vitest';
import {
  normalizeEdgeAmplitude,
  normalizeEdgeFrequency,
  normalizeEdgeSeed,
  prefersTextNumericInput,
} from '../../js/edge-controls.js';

describe('edge-controls', () => {
  it('normalizes amplitude to fine-grained 0..1 range', () => {
    expect(normalizeEdgeAmplitude('0.336')).toBe(0.34);
    expect(normalizeEdgeAmplitude('-1')).toBe(0);
    expect(normalizeEdgeAmplitude('2')).toBe(1);
  });

  it('normalizes frequency and seed as bounded integers', () => {
    expect(normalizeEdgeFrequency('4.8')).toBe(5);
    expect(normalizeEdgeFrequency('abc')).toBe(4);
    expect(normalizeEdgeFrequency('20.2')).toBe(20);
    expect(normalizeEdgeFrequency('999')).toBe(20);
    expect(normalizeEdgeSeed('100000')).toBe(99999);
    expect(normalizeEdgeSeed('-1')).toBe(0);
  });

  it('uses text+numeric input mode for iPhone class devices', () => {
    expect(prefersTextNumericInput('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true);
    expect(prefersTextNumericInput('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false);
  });
});
