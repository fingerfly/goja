import { describe, it, expect } from 'vitest';
import { applyPreviewEdgeClip } from '../../js/edge-preview-clip.js';

describe('applyPreviewEdgeClip', () => {
  it('uses local clip coordinates for non-origin cells', () => {
    const el = document.createElement('div');
    const cell = { x: 200, y: 120, width: 100, height: 80 };
    applyPreviewEdgeClip(el, cell, 2, {
      edgeStyle: 'wavy',
      edgeIntensity: 0.5,
      edgeFrequency: 4,
      edgeSeed: 11,
      edgeAdvancedSupported: true,
    });
    const clipPath = el.style.clipPath;
    expect(clipPath).toContain("path('M 0 0");
    expect(clipPath).not.toContain('200 120');
  });

  it('removes clip-path when style is straight', () => {
    const el = document.createElement('div');
    el.style.clipPath = "path('M 0 0 L 1 1 Z')";
    applyPreviewEdgeClip(el, { x: 0, y: 0, width: 10, height: 10 }, 0, {
      edgeStyle: 'straight',
      edgeAdvancedSupported: true,
    });
    expect(el.style.clipPath).toBe('');
  });
});
