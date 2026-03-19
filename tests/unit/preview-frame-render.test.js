import { describe, it, expect } from 'vitest';
import {
  applyPreviewFrameClip,
  renderPreviewFrameStrokeOverlay,
} from '../../js/preview-frame-render.js';

describe('preview-frame-render', () => {
  it('applies frame clip and outside background for non-rect frame', () => {
    const container = document.createElement('div');
    const preview = document.createElement('div');
    const layout = { canvasWidth: 240, canvasHeight: 120 };
    applyPreviewFrameClip(container, preview, layout, {
      shape: 'regular-octagon',
      strokeEnabled: false,
      strokeWidth: 0,
      superellipseExponent: 4,
      outsideBackgroundColor: '#123456',
    });
    expect(container.style.clipPath).toContain('polygon(');
    expect(preview.style.background).toBe('rgb(18, 52, 86)');
  });

  it('clears frame clip and outside background for rect frame', () => {
    const container = document.createElement('div');
    const preview = document.createElement('div');
    const layout = { canvasWidth: 240, canvasHeight: 120 };
    applyPreviewFrameClip(container, preview, layout, {
      shape: 'rect',
      strokeEnabled: false,
      strokeWidth: 0,
      superellipseExponent: 4,
      outsideBackgroundColor: '#123456',
    });
    expect(container.style.clipPath).toBe('');
    expect(preview.style.background).toBe('');
  });

  it('renders svg contour stroke overlay for non-rect frame', () => {
    const preview = document.createElement('div');
    const layout = { canvasWidth: 300, canvasHeight: 200 };
    renderPreviewFrameStrokeOverlay(preview, layout, {
      shape: 'regular-octagon',
      strokeEnabled: true,
      strokeWidth: 20,
      strokeColor: '#00ff00',
      strokeOpacity: 1,
      superellipseExponent: 4,
    });
    const path = preview.querySelector('.preview-frame-stroke-overlay svg path');
    expect(path).toBeTruthy();
    expect(path?.getAttribute('stroke-width')).toBe('20');
  });
});
