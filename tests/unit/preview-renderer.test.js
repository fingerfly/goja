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
        { rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, width: 100, height: 100 },
        { rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 3, width: 100, height: 100 },
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
      cells: [{ rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, width: 100, height: 100 }],
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
        { rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, width: 100, height: 100 },
        { rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 3, width: 100, height: 100 },
      ],
      photoOrder: [0, 999],
    };
    const form = { imageFit: 'cover', bgColor: '#fff', filterPreset: 'none', showCaptureDate: false };
    const deps = { formatDateTimeOriginal: () => '', getLocale: () => 'en', t: (k, p) => (k === 'photoAlt' ? `Photo ${p?.n ?? ''}` : k) };
    expect(() => renderGrid(container, preview, photos, layout, form, deps)).not.toThrow();
    expect(container.querySelectorAll('.preview-cell').length).toBe(1);
  });

  it('applies rotation transform and cell scale variable when photo has angle', () => {
    const photos = [{ url: 'blob:1', dateOriginal: null, angle: 45 }];
    const layout = {
      gap: 0,
      rowRatios: [1],
      colRatios: [1],
      canvasWidth: 100,
      canvasHeight: 100,
      cells: [{ rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, width: 100, height: 100 }],
      photoOrder: [0],
    };
    const form = { imageFit: 'cover', bgColor: '#fff', filterPreset: 'none', showCaptureDate: false };
    const deps = { formatDateTimeOriginal: () => '', getLocale: () => 'en', t: (k, p) => (k === 'photoAlt' ? `Photo ${p?.n ?? ''}` : k) };
    renderGrid(container, preview, photos, layout, form, deps);
    const cell = container.querySelector('.preview-cell');
    expect(cell.style.transform).toContain('rotate(45deg)');
    expect(cell.style.getPropertyValue('--cell-scale')).not.toBe('');
  });

  it('applies non-rect edge clip when advanced support is enabled', () => {
    const photos = [{ url: 'blob:1', dateOriginal: null }];
    const layout = {
      gap: 0,
      rowRatios: [1],
      colRatios: [1],
      canvasWidth: 100,
      canvasHeight: 100,
      cells: [{ rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, x: 0, y: 0, width: 100, height: 100 }],
      photoOrder: [0],
    };
    const form = {
      imageFit: 'cover',
      bgColor: '#fff',
      filterPreset: 'none',
      showCaptureDate: false,
      edgeStyle: 'wavy',
      edgeIntensity: 0.5,
      edgeFrequency: 5,
      edgeSeed: 7,
      edgeAdvancedSupported: true,
    };
    const deps = { formatDateTimeOriginal: () => '', getLocale: () => 'en', t: (k, p) => (k === 'photoAlt' ? `Photo ${p?.n ?? ''}` : k) };
    renderGrid(container, preview, photos, layout, form, deps);
    const cell = container.querySelector('.preview-cell');
    expect(cell.style.clipPath).toContain('path(');
  });

  it('applies global frame clip and cell template clip in advanced mode', () => {
    const photos = [{ url: 'blob:1', dateOriginal: null }];
    const layout = {
      gap: 0,
      rowRatios: [1],
      colRatios: [1],
      canvasWidth: 100,
      canvasHeight: 100,
      cells: [{ rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, x: 0, y: 0, width: 100, height: 100 }],
      photoOrder: [0],
    };
    const form = {
      imageFit: 'cover',
      bgColor: '#fff',
      filterPreset: 'none',
      showCaptureDate: false,
      edgeStyle: 'straight',
      edgeAdvancedSupported: true,
      globalFrameShape: 'regular-octagon',
      globalFrameStrokeEnabled: true,
      globalFrameStrokeWidth: 2,
      globalFrameStrokeColor: '#ff0000',
      globalFrameStrokeOpacity: 0.5,
      outsideBackgroundColor: '#000000',
      cellShapeTemplate: 'circle',
      cellShapeOrientation: 'auto',
    };
    const deps = { formatDateTimeOriginal: () => '', getLocale: () => 'en', t: (k, p) => (k === 'photoAlt' ? `Photo ${p?.n ?? ''}` : k) };
    renderGrid(container, preview, photos, layout, form, deps);
    const cell = container.querySelector('.preview-cell');
    expect(container.style.clipPath).toContain('polygon(');
    expect(cell.style.clipPath).toContain('circle(');
    expect(preview.querySelector('.preview-frame-stroke-overlay')).toBeTruthy();
  });

  it('keeps ellipse visually distinct from circle in preview frame clip', () => {
    const photos = [{ url: 'blob:1', dateOriginal: null }];
    const layout = {
      gap: 0,
      rowRatios: [1],
      colRatios: [1],
      canvasWidth: 240,
      canvasHeight: 120,
      cells: [{ rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, x: 0, y: 0, width: 240, height: 120 }],
      photoOrder: [0],
    };
    const base = {
      imageFit: 'cover',
      bgColor: '#fff',
      filterPreset: 'none',
      showCaptureDate: false,
      edgeStyle: 'straight',
      edgeAdvancedSupported: true,
    };
    const deps = { formatDateTimeOriginal: () => '', getLocale: () => 'en', t: (k, p) => (k === 'photoAlt' ? `Photo ${p?.n ?? ''}` : k) };
    renderGrid(container, preview, photos, layout, { ...base, globalFrameShape: 'circle' }, deps);
    const circleClip = container.style.clipPath;
    renderGrid(container, preview, photos, layout, { ...base, globalFrameShape: 'ellipse' }, deps);
    const ellipseClip = container.style.clipPath;
    expect(circleClip).toContain('circle(');
    expect(ellipseClip).toContain('ellipse(');
    expect(ellipseClip).not.toBe(circleClip);
  });

  it('keeps centered circle clip anchors in preview', () => {
    const photos = [{ url: 'blob:1', dateOriginal: null }];
    const layout = {
      gap: 0,
      rowRatios: [1],
      colRatios: [1],
      canvasWidth: 240,
      canvasHeight: 120,
      cells: [{ rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, x: 0, y: 0, width: 240, height: 120 }],
      photoOrder: [0],
    };
    const form = {
      imageFit: 'cover',
      bgColor: '#fff',
      filterPreset: 'none',
      showCaptureDate: false,
      edgeStyle: 'straight',
      edgeAdvancedSupported: true,
      globalFrameShape: 'circle',
      cellShapeTemplate: 'circle',
      cellShapeOrientation: 'auto',
    };
    const deps = { formatDateTimeOriginal: () => '', getLocale: () => 'en', t: (k, p) => (k === 'photoAlt' ? `Photo ${p?.n ?? ''}` : k) };
    renderGrid(container, preview, photos, layout, form, deps);
    const cell = container.querySelector('.preview-cell');
    expect(container.style.clipPath).toContain('50% at 50% 50%');
    expect(cell.style.clipPath).toContain('50% at 50% 50%');
  });

  it('uses a single boundary clip when edge style and cell template are both active', () => {
    const photos = [{ url: 'blob:1', dateOriginal: null }];
    const layout = {
      gap: 0,
      rowRatios: [1],
      colRatios: [1],
      canvasWidth: 240,
      canvasHeight: 120,
      cells: [{ rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, x: 0, y: 0, width: 240, height: 120 }],
      photoOrder: [0],
    };
    const form = {
      imageFit: 'cover',
      bgColor: '#fff',
      filterPreset: 'none',
      showCaptureDate: false,
      edgeStyle: 'paper-torn',
      edgeIntensity: 0.6,
      edgeFrequency: 7,
      edgeSeed: 11,
      edgeAdvancedSupported: true,
      globalFrameShape: 'rect',
      cellShapeTemplate: 'circle',
      cellShapeOrientation: 'auto',
    };
    const deps = { formatDateTimeOriginal: () => '', getLocale: () => 'en', t: (k, p) => (k === 'photoAlt' ? `Photo ${p?.n ?? ''}` : k) };
    renderGrid(container, preview, photos, layout, form, deps);
    const cell = container.querySelector('.preview-cell');
    const img = container.querySelector('.preview-cell img');
    expect(cell.style.clipPath).toContain('path(');
    expect(img.style.clipPath === '' || img.style.clipPath === 'none').toBeTruthy();
  });
});
