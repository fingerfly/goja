import { describe, it, expect } from 'vitest';
import { getEdgeStyleProfile, normalizeEdgeStyle, EDGE_STYLE_CANDIDATES } from '../../js/edge-style-presets.js';

describe('edge-style-presets', () => {
  it('keeps legacy mappings backward compatible', () => {
    expect(normalizeEdgeStyle('wavy')).toBe('silk-wave');
    expect(normalizeEdgeStyle('jagged')).toBe('paper-torn');
  });

  it('keeps silk-wave smoother than paper-torn profile', () => {
    const soft = getEdgeStyleProfile('silk-wave');
    const torn = getEdgeStyleProfile('paper-torn');
    expect(soft.jitter).toBeLessThan(torn.jitter);
    expect(soft.freqScale).toBeLessThan(torn.freqScale);
  });

  it('exposes curated shortlist candidates marked approved', () => {
    expect(EDGE_STYLE_CANDIDATES.filter((c) => c.approved)).toHaveLength(3);
    expect(EDGE_STYLE_CANDIDATES).toHaveLength(6);
    expect(EDGE_STYLE_CANDIDATES.some((c) => c.id === 'soft-wave')).toBe(false);
  });

  it('includes new selectable style ids with profiles', () => {
    expect(normalizeEdgeStyle('silk-wave')).toBe('silk-wave');
    expect(normalizeEdgeStyle('linen-deckle')).toBe('linen-deckle');
    expect(normalizeEdgeStyle('postage-perf')).toBe('postage-perf');
    expect(getEdgeStyleProfile('postage-perf').waveform).toBe('scallop');
  });
});
