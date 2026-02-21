import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveWatermarkText, drawWatermark } from '../../js/watermark.js';

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
});
