/**
 * Purpose: Isolate preview global-frame clip and stroke rendering.
 * Description:
 * - Applies canonical frame clip-path to the preview grid container.
 * - Draws frame stroke overlay from shared contour model in SVG.
 */
import { OUTSIDE_BACKGROUND_COLOR_DEFAULT } from './config.js';
import {
  buildFrameStrokeModel,
  getFrameCssClipFromLayout,
} from './shape-clip-utils.js';

/**
 * Apply canonical frame clip and outside background for preview.
 * @param {HTMLElement} container
 * @param {HTMLElement | null} preview
 * @param {{ canvasWidth: number, canvasHeight: number }} layout
 * @param {{
 *   shape: string,
 *   strokeEnabled: unknown,
 *   strokeWidth: unknown,
 *   superellipseExponent: unknown,
 *   outsideBackgroundColor?: string
 * }} options
 */
export function applyPreviewFrameClip(container, preview, layout, options) {
  const frameInset = options.strokeEnabled
    ? (Number(options.strokeWidth) || 0) / 2
    : 0;
  const frameCssClip = getFrameCssClipFromLayout(layout, {
    shape: options.shape,
    orientation: 'auto',
    inset: frameInset,
    superellipseExponent: options.superellipseExponent,
  });
  if (frameCssClip !== 'none') {
    container.style.clipPath = frameCssClip;
    container.style.webkitClipPath = frameCssClip;
    if (preview) {
      preview.style.background = options.outsideBackgroundColor
        ?? OUTSIDE_BACKGROUND_COLOR_DEFAULT;
    }
    return;
  }
  container.style.clipPath = '';
  container.style.webkitClipPath = '';
  if (preview) preview.style.background = '';
}

/**
 * Render frame stroke overlay following shared frame contour geometry.
 * @param {HTMLElement | null} preview
 * @param {{ canvasWidth: number, canvasHeight: number }} layout
 * @param {{
 *   shape: string,
 *   strokeEnabled: unknown,
 *   strokeWidth: unknown,
 *   strokeColor: unknown,
 *   strokeOpacity: unknown,
 *   superellipseExponent: unknown
 * }} options
 */
export function renderPreviewFrameStrokeOverlay(preview, layout, options) {
  if (!preview || options.shape === 'rect') return;
  const model = buildFrameStrokeModel(layout, {
    shape: options.shape,
    strokeEnabled: options.strokeEnabled,
    strokeWidth: options.strokeWidth,
    strokeColor: options.strokeColor,
    strokeOpacity: options.strokeOpacity,
    superellipseExponent: options.superellipseExponent,
  });
  if (!model) return;
  const overlay = document.createElement('div');
  overlay.className = 'preview-frame-stroke-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
  });
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', `0 0 ${layout.canvasWidth} ${layout.canvasHeight}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', model.pathD);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', model.strokeStyle);
  path.setAttribute('stroke-width', String(model.lineWidth));
  path.setAttribute('vector-effect', 'non-scaling-stroke');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);
  overlay.appendChild(svg);
  preview.appendChild(overlay);
}
