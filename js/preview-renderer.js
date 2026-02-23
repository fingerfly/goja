/**
 * Renders the preview grid DOM (cells, images, vignette, capture date, watermark overlay).
 * Extracted from app.js for modularity.
 */
import { ratiosToFrString } from './resize-engine.js';
import { getFilterCss } from './image-effects.js';
import { resolveWatermarkText, drawWatermark } from './watermark.js';
import { getWatermarkOptions, getCaptureDateOptions, getVignetteOptions } from './grid-effects-settings.js';

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
      const span = document.createElement('span');
      span.className = `capture-date-overlay capture-date-overlay--${capture.position}`;
      span.setAttribute('aria-hidden', 'true');
      span.textContent = dateStr;
      span.style.opacity = String(capture.opacity);
      span.style.fontSize = `calc(var(--font-size-sm) * ${capture.fontScale})`;
      cell.appendChild(span);
    }

    container.appendChild(cell);
  }

  preview?.querySelector('.watermark-preview-overlay')?.remove();
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
