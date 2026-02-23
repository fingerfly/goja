import { describe, it, expect, beforeEach } from 'vitest';
import { renderGrid } from '../../js/preview-renderer.js';

describe('renderGrid', () => {
  let container;
  let preview;

  beforeEach(() => {
    container = document.createElement('div');
    preview = document.createElement('div');
    preview.appendChild(container);
    document.body.appendChild(preview);
  });

  it('renders cells for each layout cell', () => {
    const photos = [
      { url: 'blob:1', dateOriginal: null },
      { url: 'blob:2', dateOriginal: null },
    ];
    const layout = {
      gap: 4,
      rowRatios: [1],
      colRatios: [1, 1],
      canvasWidth: 200,
      canvasHeight: 100,
      cells: [
        { rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2 },
        { rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 3 },
      ],
      photoOrder: [0, 1],
    };
    const form = { imageFit: 'cover', bgColor: '#fff', filterPreset: 'none', showCaptureDate: false };
    const deps = {
      formatDateTimeOriginal: () => '',
      getLocale: () => 'en',
      t: (key, p) => (key === 'photoAlt' ? `Photo ${p?.n ?? ''}` : key),
    };
    renderGrid(container, preview, photos, layout, form, deps);
    expect(container.querySelectorAll('.preview-cell').length).toBe(2);
    expect(container.querySelectorAll('img').length).toBe(2);
  });

  it('does not add watermark overlay when form has no watermark', () => {
    const photos = [{ url: 'blob:1', dateOriginal: null }];
    const layout = {
      gap: 0,
      rowRatios: [1],
      colRatios: [1],
      canvasWidth: 100,
      canvasHeight: 100,
      cells: [{ rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2 }],
    };
    const form = { wmType: 'none', imageFit: 'cover', bgColor: '#fff', filterPreset: 'none', showCaptureDate: false };
    const deps = { formatDateTimeOriginal: () => '', getLocale: () => 'en', t: (k, p) => (k === 'photoAlt' ? `Photo ${p?.n ?? ''}` : k) };
    renderGrid(container, preview, photos, layout, form, deps);
    expect(preview.querySelector('.watermark-preview-overlay')).toBeFalsy();
  });

  it('skips cells when photoOrder has out-of-bounds index without throwing', () => {
    const photos = [{ url: 'blob:1', dateOriginal: null }];
    const layout = {
      gap: 4,
      rowRatios: [1],
      colRatios: [1, 1],
      canvasWidth: 200,
      canvasHeight: 100,
      cells: [
        { rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2 },
        { rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 3 },
      ],
      photoOrder: [0, 999],
    };
    const form = { imageFit: 'cover', bgColor: '#fff', filterPreset: 'none', showCaptureDate: false };
    const deps = { formatDateTimeOriginal: () => '', getLocale: () => 'en', t: (k, p) => (k === 'photoAlt' ? `Photo ${p?.n ?? ''}` : k) };
    expect(() => renderGrid(container, preview, photos, layout, form, deps)).not.toThrow();
    expect(container.querySelectorAll('.preview-cell').length).toBe(1);
  });
});
