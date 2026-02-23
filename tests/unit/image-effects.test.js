import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getFilterCss,
  drawVignetteOverlay,
  isFilterSupported,
} from '../../js/image-effects.js';

describe('getFilterCss', () => {
  it('returns "none" for preset "none"', () => {
    expect(getFilterCss('none')).toBe('none');
  });

  it('returns grayscale filter for preset "grayscale"', () => {
    expect(getFilterCss('grayscale')).toBe('grayscale(100%)');
  });

  it('returns sepia filter for preset "sepia"', () => {
    expect(getFilterCss('sepia')).toBe('sepia(80%)');
  });

  it('returns "none" for unknown preset', () => {
    expect(getFilterCss('unknown')).toBe('none');
  });

  it('returns "none" for empty string', () => {
    expect(getFilterCss('')).toBe('none');
  });

  it('returns brightness filter for preset "brightness"', () => {
    expect(getFilterCss('brightness')).toBe('brightness(1.15)');
  });

  it('returns contrast filter for preset "contrast"', () => {
    expect(getFilterCss('contrast')).toBe('contrast(1.2)');
  });

  it('returns saturate filter for preset "saturated"', () => {
    expect(getFilterCss('saturated')).toBe('saturate(1.4)');
  });

  it('returns faded combo filter for preset "faded"', () => {
    expect(getFilterCss('faded')).toBe('saturate(0.65) brightness(1.05)');
  });

  it('returns vintage combo filter for preset "vintage"', () => {
    expect(getFilterCss('vintage')).toBe('sepia(35%) brightness(1.05) contrast(1.1)');
  });

  it('returns blur filter for preset "blur"', () => {
    expect(getFilterCss('blur')).toBe('blur(1.5px)');
  });
});

describe('drawVignetteOverlay', () => {
  const mockGradient = {
    addColorStop: vi.fn(),
  };
  const mockCtx = {
    createRadialGradient: vi.fn(() => mockGradient),
    fillStyle: '',
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when strength is 0', () => {
    const cell = { x: 0, y: 0, width: 100, height: 100 };
    drawVignetteOverlay(mockCtx, cell, { strength: 0 });
    expect(mockCtx.createRadialGradient).not.toHaveBeenCalled();
  });

  it('does nothing when strength is negative', () => {
    const cell = { x: 10, y: 20, width: 80, height: 60 };
    drawVignetteOverlay(mockCtx, cell, { strength: -0.1 });
    expect(mockCtx.createRadialGradient).not.toHaveBeenCalled();
  });

  it('creates radial gradient and fills when strength > 0', () => {
    const cell = { x: 10, y: 20, width: 80, height: 60 };
    drawVignetteOverlay(mockCtx, cell, { strength: 0.5 });
    expect(mockCtx.createRadialGradient).toHaveBeenCalled();
    expect(mockGradient.addColorStop).toHaveBeenCalledWith(0, expect.any(String));
    expect(mockGradient.addColorStop).toHaveBeenCalledWith(1, expect.any(String));
    expect(mockCtx.fillRect).toHaveBeenCalledWith(10, 20, 80, 60);
  });
});

describe('isFilterSupported', () => {
  it('returns boolean', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const result = isFilterSupported(ctx);
    expect(typeof result).toBe('boolean');
  });
});
