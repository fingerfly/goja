/**
 * Renders the preview grid DOM (cells, images, vignette, capture date, watermark overlay).
 * Extracted from app.js for modularity.
 */
import { ratiosToFrString } from './resize-engine.js';
import { getFilterCss } from './image-effects.js';
import { resolveWatermarkText, drawWatermark } from './watermark.js';
import { getWatermarkOptions, getCaptureDateOptions, getVignetteOptions } from './grid-effects-settings.js';
import {
  ROTATION_DEFAULT_ANGLE,
  GLOBAL_FRAME_SHAPE_DEFAULT,
  OUTSIDE_BACKGROUND_COLOR_DEFAULT,
  CELL_SHAPE_TEMPLATE_DEFAULT,
  CELL_SHAPE_ORIENTATION_DEFAULT,
} from './config.js';
import { fitScaleFactor } from './rotation-math.js';
import { drawCaptureDateOverlay } from './capture-date-overlay.js';
import { applyPreviewEdgeClip } from './edge-preview-clip.js';
import { normalizeEdgeStyle } from './edge-style-presets.js';
import { normalizeFrameShape, normalizeShapeOrientation } from './frame-shape-geometry.js';
import { getShapeCssClip } from './shape-clip-utils.js';

function colorWithOpacity(hex, opacity) {
  const c = String(hex || '#ffffff').trim();
  const alpha = Math.max(0, Math.min(1, Number(opacity) || 0));
  if (!c.startsWith('#') || (c.length !== 7 && c.length !== 4)) return `rgba(255,255,255,${alpha})`;
  const full = c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c;
  const r = parseInt(full.slice(1, 3), 16);
  const g = parseInt(full.slice(3, 5), 16);
  const b = parseInt(full.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Renders the grid preview into container and optionally watermark overlay into preview.
 * @param {HTMLElement} container - The grid container (e.g. #previewGrid)
 * @param {HTMLElement | null} preview - The preview parent for watermark overlay (e.g. #preview)
 * @param {{ url: string, dateOriginal?: Date | null }[]} photos
 * @param {{ gap: number, rowRatios: number[], colRatios: number[], canvasWidth: number, canvasHeight: number, cells: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }[], photoOrder?: number[] }} layout
 * @param {Record<string, unknown>} form - From buildFormFromRefs
 * @param {{ formatDateTimeOriginal: (d: Date, locale: string) => string, getLocale: () => string, t: (key: string, params?: Record<string, unknown>) => string }} deps
 */
export function renderGrid(container, preview, photos, layout, form, deps) {
  const { formatDateTimeOriginal, getLocale, t } = deps;
  const gap = `${layout.gap}px`;
  container.innerHTML = '';
  const fitVal = form.imageFit ?? 'cover';
  container.style.setProperty('--image-fit', fitVal);
  Object.assign(container.style, {
    gridTemplateRows: ratiosToFrString(layout.rowRatios),
    gridTemplateColumns: ratiosToFrString(layout.colRatios),
    gap,
    background: form.bgColor ?? '#ffffff',
    padding: gap,
    aspectRatio: `${layout.canvasWidth} / ${layout.canvasHeight}`,
  });
  const order = layout.photoOrder || photos.map((_, i) => i);
  const capture = getCaptureDateOptions(form);
  const vignette = getVignetteOptions(form);
  const filterCss = getFilterCss(form.filterPreset ?? 'none');
  const edgeFrequency = Math.max(1, Math.min(20, Math.round(Number(form.edgeFrequency ?? 4) || 4)));
  const edgeIntensity = Number(form.edgeAmplitude ?? form.edgeIntensity ?? 0.5);
  const edgeAdvancedSupported = form.edgeAdvancedSupported === true || form.edgeFeatureAvailable === true || form.edgeFeatureAvailable === 'true';
  const globalFrameShape = edgeAdvancedSupported
    ? normalizeFrameShape(form.globalFrameShape ?? GLOBAL_FRAME_SHAPE_DEFAULT)
    : GLOBAL_FRAME_SHAPE_DEFAULT;
  const cellShapeTemplate = edgeAdvancedSupported
    ? normalizeFrameShape(form.cellShapeTemplate ?? CELL_SHAPE_TEMPLATE_DEFAULT)
    : CELL_SHAPE_TEMPLATE_DEFAULT;
  const cellShapeOrientation = normalizeShapeOrientation(form.cellShapeOrientation ?? CELL_SHAPE_ORIENTATION_DEFAULT);
  const frameCssClip = getShapeCssClip(globalFrameShape, 'auto');
  if (frameCssClip !== 'none') {
    container.style.clipPath = frameCssClip;
    container.style.webkitClipPath = frameCssClip;
    if (preview) preview.style.background = form.outsideBackgroundColor ?? OUTSIDE_BACKGROUND_COLOR_DEFAULT;
  } else {
    container.style.clipPath = '';
    container.style.webkitClipPath = '';
    if (preview) preview.style.background = '';
  }

  for (let i = 0; i < layout.cells.length; i++) {
    const idx = order[i];
    if (idx == null || idx < 0 || idx >= photos.length) continue;
    const c = layout.cells[i];
    const cell = document.createElement('div');
    cell.className = 'preview-cell';
    Object.assign(cell.style, {
      gridRow: `${c.rowStart} / ${c.rowEnd}`,
      gridColumn: `${c.colStart} / ${c.colEnd}`,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'stretch',
    });

    const img = document.createElement('img');
    img.src = photos[idx].url;
    img.alt = t('photoAlt', { n: i + 1 });
    img.style.objectFit = fitVal;
    img.style.width = '100%';
    img.style.height = '100%';
    if (filterCss && filterCss !== 'none') {
      img.style.filter = filterCss;
    }
    img.draggable = true;
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    cell.appendChild(img);

    const angle = photos[idx].angle ?? ROTATION_DEFAULT_ANGLE;
    if (angle !== 0) {
      const scale = fitScaleFactor(angle, c.width, c.height);
      cell.style.transform = `rotate(${angle}deg) scale(${scale})`;
      cell.style.setProperty('--cell-scale', String(scale));
      cell.style.setProperty('--cell-angle', `${angle}deg`);
    } else {
      cell.style.setProperty('--cell-scale', '1');
      cell.style.setProperty('--cell-angle', '0deg');
    }

    applyPreviewEdgeClip(cell, c, i, {
      edgeStyle: normalizeEdgeStyle(form.edgeStyle ?? 'straight'),
      edgeIntensity,
      edgeFrequency,
      edgeSeed: form.edgeSeed ?? 0,
      edgeAdvancedSupported,
    });
    if (cellShapeTemplate !== 'rect') {
      const cellCssClip = getShapeCssClip(cellShapeTemplate, cellShapeOrientation);
      if (normalizeEdgeStyle(form.edgeStyle ?? 'straight') === 'straight') {
        cell.style.clipPath = cellCssClip;
        cell.style.webkitClipPath = cellCssClip;
      } else {
        img.style.clipPath = cellCssClip;
        img.style.webkitClipPath = cellCssClip;
      }
    }

    if (vignette.enabled && vignette.strength > 0) {
      const vignetteEl = document.createElement('div');
      vignetteEl.className = 'vignette-overlay';
      vignetteEl.setAttribute('aria-hidden', 'true');
      vignetteEl.style.background = `radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,${vignette.strength}) 100%)`;
      cell.appendChild(vignetteEl);
    }

    const photo = photos[idx];
    if (form.showCaptureDate && photo?.dateOriginal) {
      const dateStr = formatDateTimeOriginal(photo.dateOriginal, getLocale());
      const overlayCanvas = document.createElement('canvas');
      overlayCanvas.className = 'capture-date-canvas-overlay';
      overlayCanvas.setAttribute('aria-hidden', 'true');
      overlayCanvas.width = c.width;
      overlayCanvas.height = c.height;
      Object.assign(overlayCanvas.style, {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
      });
      const overlayCtx = overlayCanvas.getContext('2d');
      if (overlayCtx) {
        drawCaptureDateOverlay(
          overlayCtx,
          { x: 0, y: 0, width: c.width, height: c.height },
          dateStr,
          {
            position: capture.position,
            opacity: capture.opacity,
            fontScale: capture.fontScale,
            backgroundColor: form.bgColor ?? '#ffffff',
          }
        );
      }
      cell.appendChild(overlayCanvas);
    }

    container.appendChild(cell);
  }

  preview?.querySelector('.watermark-preview-overlay')?.remove();
  preview?.querySelector('.preview-frame-stroke-overlay')?.remove();
  if (globalFrameShape !== 'rect' && form.globalFrameStrokeEnabled) {
    const frameOverlay = document.createElement('div');
    frameOverlay.className = 'preview-frame-stroke-overlay';
    frameOverlay.setAttribute('aria-hidden', 'true');
    Object.assign(frameOverlay.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      border: `${Math.max(0, Number(form.globalFrameStrokeWidth) || 0)}px solid ${colorWithOpacity(form.globalFrameStrokeColor, form.globalFrameStrokeOpacity)}`,
      clipPath: frameCssClip,
      webkitClipPath: frameCssClip,
      boxSizing: 'border-box',
    });
    preview?.appendChild(frameOverlay);
  }
  const locale = getLocale();
  const wmOpts = getWatermarkOptions(form, locale);
  const wmResolved = wmOpts.type && wmOpts.type !== 'none'
    ? resolveWatermarkText(wmOpts.type, wmOpts.text, wmOpts.locale)
    : '';
  if (wmResolved && layout?.canvasWidth && layout?.canvasHeight) {
    const w = layout.canvasWidth;
    const h = layout.canvasHeight;
    const overlay = document.createElement('div');
    overlay.className = 'watermark-preview-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    Object.assign(overlay.style, {
      position: 'absolute',
      inset: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
    });
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawWatermark(ctx, w, h, wmOpts);
    }
    overlay.appendChild(canvas);
    preview.appendChild(overlay);
  }
}
