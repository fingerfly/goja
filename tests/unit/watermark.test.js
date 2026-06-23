import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveWatermarkText,
  drawWatermark,
  computeTiledRowSpacing,
  computeTiledColSpacing,
  computeTiledSafeSpacing,
} from '../../js/watermark.js';

let mockCtx;

beforeEach(() => {
  mockCtx = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    globalAlpha: 1,
    font: '',
    fillStyle: '',
    textAlign: '',
    textBaseline: '',
  };
});

describe('resolveWatermarkText', () => {
  it('returns empty string for type "none"', () => {
    expect(resolveWatermarkText('none', 'anything')).toBe('');
  });

  it('returns user text for type "text"', () => {
    expect(resolveWatermarkText('text', 'Hello')).toBe('Hello');
  });

  it('returns empty string for "text" with blank input', () => {
    expect(resolveWatermarkText('text', '  ')).toBe('');
  });

  it('returns © prefixed string for type "copyright"', () => {
    expect(resolveWatermarkText('copyright', 'Luke')).toBe('© Luke');
  });

  it('returns just © for "copyright" with blank input', () => {
    const result = resolveWatermarkText('copyright', '');
    expect(result).toMatch(/^©/);
  });

  it('returns a date/time string for type "datetime"', () => {
    const result = resolveWatermarkText('datetime', '');
    expect(result).toMatch(/\d{4}/);
  });

  it('ignores user text for "datetime"', () => {
    const result = resolveWatermarkText('datetime', 'ignored');
    expect(result).toMatch(/\d{4}/);
  });
});

describe('computeTiledRowSpacing', () => {
  it('adds vertical pixel gap to font size for row step', () => {
    expect(computeTiledRowSpacing(32, 40)).toBe(72);
  });

  it('clamps negative gap to zero', () => {
    expect(computeTiledRowSpacing(50, -5)).toBe(50);
  });
});

describe('computeTiledColSpacing', () => {
  it('adds horizontal pixel gap to text width for column step', () => {
    expect(computeTiledColSpacing(100, 40)).toBe(140);
  });

  it('clamps negative gap to zero', () => {
    expect(computeTiledColSpacing(80, -5)).toBe(80);
  });
});

describe('computeTiledSafeSpacing', () => {
  it('never returns zero row or column spacing', () => {
    const { rowSpacing, colSpacing } = computeTiledSafeSpacing(0, 0, 0, 0);
    expect(rowSpacing).toBeGreaterThanOrEqual(1);
    expect(colSpacing).toBeGreaterThanOrEqual(1);
  });

  it('uses font-based fallback when text width is zero', () => {
    const { colSpacing } = computeTiledSafeSpacing(0, 32, 0, 0);
    expect(colSpacing).toBeGreaterThanOrEqual(32);
  });
});

describe('drawWatermark', () => {
  it('does nothing when type is "none"', () => {
    drawWatermark(mockCtx, 1080, 1080, { type: 'none', text: '' });
    expect(mockCtx.fillText).not.toHaveBeenCalled();
  });

  it('does nothing when resolved text is empty', () => {
    drawWatermark(mockCtx, 1080, 1080, { type: 'text', text: '', position: 'center' });
    expect(mockCtx.fillText).not.toHaveBeenCalled();
  });

  it('draws center watermark at position "center"', () => {
    drawWatermark(mockCtx, 1080, 1080, { type: 'text', text: 'Hi', position: 'center' });
    expect(mockCtx.fillText).toHaveBeenCalledTimes(1);
    expect(mockCtx.rotate).toHaveBeenCalled();
  });

  it('draws bottom-right watermark at position "bottom-right"', () => {
    drawWatermark(mockCtx, 1080, 1080, { type: 'text', text: 'CR', position: 'bottom-right' });
    expect(mockCtx.fillText).toHaveBeenCalledTimes(1);
    expect(mockCtx.rotate).not.toHaveBeenCalled();
  });

  it('draws tiled watermark at position "tiled"', () => {
    drawWatermark(mockCtx, 1080, 1080, { type: 'text', text: 'T', position: 'tiled' });
    expect(mockCtx.fillText.mock.calls.length).toBeGreaterThan(1);
    expect(mockCtx.rotate).toHaveBeenCalled();
  });

  it('tiled watermark uses measureText for spacing to prevent overlap', () => {
    mockCtx.measureText = vi.fn((t) => ({ width: t.length * 20 }));
    drawWatermark(mockCtx, 1080, 1080, { type: 'text', text: 'Short', position: 'tiled' });
    expect(mockCtx.measureText).toHaveBeenCalledWith('Short');
    const shortCount = mockCtx.fillText.mock.calls.length;
    mockCtx.fillText.mockClear();
    mockCtx.measureText = vi.fn(() => ({ width: 400 }));
    drawWatermark(mockCtx, 1080, 1080, { type: 'text', text: 'Very Long Watermark Text', position: 'tiled' });
    const longCount = mockCtx.fillText.mock.calls.length;
    expect(longCount).toBeLessThan(shortCount);
  });

  it('defaults to bottom-right when position is omitted', () => {
    drawWatermark(mockCtx, 1080, 1080, { type: 'text', text: 'X' });
    expect(mockCtx.fillText).toHaveBeenCalledTimes(1);
    expect(mockCtx.textBaseline).toBe('bottom');
  });

  it('resolves copyright text automatically', () => {
    drawWatermark(mockCtx, 1080, 1080, { type: 'copyright', text: 'Luke', position: 'center' });
    expect(mockCtx.fillText.mock.calls[0][0]).toBe('© Luke');
  });

  it('resolves datetime text automatically', () => {
    drawWatermark(mockCtx, 1080, 1080, { type: 'datetime', text: '', position: 'center' });
    expect(mockCtx.fillText.mock.calls[0][0]).toMatch(/\d{4}/);
  });

  it('scales font size with canvas width', () => {
    drawWatermark(mockCtx, 500, 500, { type: 'text', text: 'A', position: 'center' });
    const smallFont = mockCtx.font;
    mockCtx.font = '';
    drawWatermark(mockCtx, 2000, 2000, { type: 'text', text: 'A', position: 'center' });
    const bigFont = mockCtx.font;
    const extractSize = (f) => parseInt(f.match(/(\d+)px/)[1], 10);
    expect(extractSize(bigFont)).toBeGreaterThan(extractSize(smallFont));
  });

  it('restores context state after drawing', () => {
    drawWatermark(mockCtx, 1080, 1080, { type: 'text', text: 'X', position: 'center' });
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('uses white fill for dark background (dark mode watermark)', () => {
    drawWatermark(mockCtx, 1080, 1080, {
      type: 'text', text: 'X', position: 'bottom-right',
      backgroundColor: '#111111',
    });
    expect(mockCtx.fillStyle).toBe('rgb(255, 255, 255)');
  });

  it('uses black fill for light background', () => {
    drawWatermark(mockCtx, 1080, 1080, {
      type: 'text', text: 'X', position: 'bottom-right',
      backgroundColor: '#ffffff',
    });
    expect(mockCtx.fillStyle).toBe('rgb(0, 0, 0)');
  });

  it('uses explicit color when provided', () => {
    drawWatermark(mockCtx, 1080, 1080, {
      type: 'text', text: 'X', position: 'bottom-right',
      backgroundColor: '#ffffff',
      color: '#ff0000',
    });
    expect(mockCtx.fillStyle).toBe('#ff0000');
  });

  it('draws tiled watermark with custom vertical pixel gap', () => {
    drawWatermark(mockCtx, 1080, 1080, {
      type: 'text', text: 'T', position: 'tiled', tileSpacing: 40,
    });
    expect(mockCtx.fillText.mock.calls.length).toBeGreaterThan(1);
  });

  it('tighter vertical gap tiles more rows than a wide gap', () => {
    mockCtx.measureText = vi.fn(() => ({ width: 80 }));
    drawWatermark(mockCtx, 1080, 1080, {
      type: 'text', text: 'T', position: 'tiled', tileSpacing: 0,
    });
    const tightCount = mockCtx.fillText.mock.calls.length;
    mockCtx.fillText.mockClear();
    drawWatermark(mockCtx, 1080, 1080, {
      type: 'text', text: 'T', position: 'tiled', tileSpacing: 200,
    });
    expect(tightCount).toBeGreaterThan(mockCtx.fillText.mock.calls.length);
  });

  it('tighter horizontal gap tiles more columns than a wide gap', () => {
    mockCtx.measureText = vi.fn(() => ({ width: 80 }));
    drawWatermark(mockCtx, 1080, 1080, {
      type: 'text', text: 'T', position: 'tiled', tileColSpacing: 0,
    });
    const tightCount = mockCtx.fillText.mock.calls.length;
    mockCtx.fillText.mockClear();
    drawWatermark(mockCtx, 1080, 1080, {
      type: 'text', text: 'T', position: 'tiled', tileColSpacing: 200,
    });
    expect(tightCount).toBeGreaterThan(mockCtx.fillText.mock.calls.length);
  });

  it('tiled watermark completes when measureText returns zero width', () => {
    mockCtx.measureText = vi.fn(() => ({ width: 0 }));
    drawWatermark(mockCtx, 1080, 1080, {
      type: 'text',
      text: 'X',
      position: 'tiled',
      tileSpacing: 0,
      tileColSpacing: 0,
    });
    expect(mockCtx.fillText.mock.calls.length).toBeGreaterThan(0);
    expect(mockCtx.fillText.mock.calls.length).toBeLessThan(50000);
  });

  it('applies custom tile rotation in radians', () => {
    drawWatermark(mockCtx, 1080, 1080, {
      type: 'text', text: 'T', position: 'tiled', tileRotation: -25,
    });
    expect(mockCtx.rotate).toHaveBeenCalledWith((-25 * Math.PI) / 180);
  });
});
