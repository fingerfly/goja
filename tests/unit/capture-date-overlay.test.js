import { describe, it, expect, vi, beforeEach } from 'vitest';
import { drawCaptureDateOverlay } from '../../js/capture-date-overlay.js';

let mockCtx;

beforeEach(() => {
  mockCtx = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    fillText: vi.fn(),
    fillStyle: '',
    font: '',
    globalAlpha: 1,
    textAlign: '',
    textBaseline: '',
  };
});

describe('drawCaptureDateOverlay', () => {
  const cell = { x: 10, y: 20, width: 200, height: 150 };

  it('does nothing when text is empty', () => {
    drawCaptureDateOverlay(mockCtx, cell, '', {});
    expect(mockCtx.fillText).not.toHaveBeenCalled();
  });

  it('does nothing when text is null', () => {
    drawCaptureDateOverlay(mockCtx, cell, null, {});
    expect(mockCtx.fillText).not.toHaveBeenCalled();
  });

  it('does nothing when text is whitespace only', () => {
    drawCaptureDateOverlay(mockCtx, cell, '   ', {});
    expect(mockCtx.fillText).not.toHaveBeenCalled();
  });

  it('draws text when given valid string', () => {
    drawCaptureDateOverlay(mockCtx, cell, 'Feb 22, 2025', {});
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.translate).toHaveBeenCalledWith(10, 20);
    expect(mockCtx.fillText).toHaveBeenCalledWith('Feb 22, 2025', expect.any(Number), expect.any(Number));
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('uses black fill for light background', () => {
    drawCaptureDateOverlay(mockCtx, cell, 'Date', { backgroundColor: '#ffffff' });
    expect(mockCtx.fillStyle).toBe('rgb(0, 0, 0)');
  });

  it('uses white fill for dark background', () => {
    drawCaptureDateOverlay(mockCtx, cell, 'Date', { backgroundColor: '#111111' });
    expect(mockCtx.fillStyle).toBe('rgb(255, 255, 255)');
  });

  it('restores context after drawing', () => {
    drawCaptureDateOverlay(mockCtx, cell, 'Date', {});
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('scales font with fontScale option', () => {
    drawCaptureDateOverlay(mockCtx, cell, 'A', { fontScale: 1.2 });
    expect(mockCtx.font).toMatch(/\d+px/);
    const size1 = parseInt(mockCtx.font.match(/(\d+)px/)[1], 10);
    mockCtx.font = '';
    drawCaptureDateOverlay(mockCtx, cell, 'A', { fontScale: 0.8 });
    const size2 = parseInt(mockCtx.font.match(/(\d+)px/)[1], 10);
    expect(size1).toBeGreaterThan(size2);
  });
});
