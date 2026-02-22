import { computeGridLayout } from './layout-engine.js';
import { getTemplatesForCount, ensureTemplatesLoaded } from './layout-templates.js';
import { readImageDimensions } from './utils.js';
import { readDateTimeOriginal, formatDateTimeOriginal } from './exif.js';
import { handleExport, downloadBlob, shareBlob, copyBlobToClipboard } from './export-handler.js';
import { showExportOptions } from './export-options.js';
import { VERSION_STRING } from './version.js';
import { swapOrder, enableDragAndDrop } from './drag-handler.js';
import { initSettingsPanel, closeSettings } from './settings-panel.js';
import { ratiosToFrString, recomputePixelCells } from './resize-engine.js';
import { enableGridResize } from './resize-handler.js';
import { t, init as initI18n, getLocale, setLocale, applyToDOM } from './i18n.js';
import { showToast } from './toast.js';
import {
  MAX_PHOTOS,
  FRAME_MIN,
  FRAME_MAX,
  GAP_MIN,
  GAP_MAX,
  GAP_DEFAULT,
  WATERMARK_OPACITY_MIN,
  WATERMARK_OPACITY_MAX,
  WATERMARK_OPACITY_DEFAULT,
  CAPTURE_DATE_POSITION_DEFAULT,
  CAPTURE_DATE_OPACITY_MIN,
  CAPTURE_DATE_OPACITY_MAX,
  CAPTURE_DATE_OPACITY_DEFAULT,
} from './config.js';
import { clampFrameValue, isFrameValueValid } from './frame-validation.js';
import { enableCellContextMenu } from './cell-context-menu.js';
import { enableCellKeyboardNav } from './cell-keyboard-nav.js';
import { pushState, undo, redo, canUndo, canRedo } from './state.js';
import { syncActionButtons } from './action-buttons.js';

const $ = (sel) => document.querySelector(sel);
const [dropZone, fileInput, preview, previewGrid] =
  ['#dropZone', '#fileInput', '#preview', '#previewGrid'].map($);
const [gapSlider, bgColor, formatSelect, addBtn, exportBtn, clearBtn, frameW, frameH, imageFit, templateSelect, exportFilename, exportUseDate] =
  ['#gapSlider', '#bgColor', '#formatSelect', '#addBtn', '#exportBtn', '#clearBtn', '#frameWidth', '#frameHeight', '#imageFit', '#templateSelect', '#exportFilename', '#exportUseDate'].map($);
const [wmType, wmText, wmTextGroup, wmPos, wmPosGroup, wmOpacity, wmOpacityGroup, wmFontSize, wmFontSizeGroup] =
  ['#watermarkType', '#watermarkText', '#watermarkTextGroup', '#watermarkPos', '#watermarkPosGroup', '#watermarkOpacity', '#watermarkOpacityGroup', '#watermarkFontSize', '#watermarkFontSizeGroup'].map($);
const [showCaptureDate, captureDateOptionsGroup, captureDatePos, captureDateOpacity, captureDateFontSize] =
  ['#showCaptureDate', '#captureDateOptionsGroup', '#captureDatePos', '#captureDateOpacity', '#captureDateFontSize'].map($);
const [sPanel, sBackdrop] = ['#settingsPanel', '#settingsBackdrop'].map($);
const [loadingOverlay, loadingText, offlineBanner] = ['#loadingOverlay', '#loadingText', '#offlineBanner'].map($);
const langSelect = $('#langSelect');
let photos = [], currentLayout = null, cleanupResize = null;

async function loadPhotos(files) {
  const items = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (items.length === 0) return;
  const slots = MAX_PHOTOS - photos.length;
  if (slots <= 0) return;
  pushState(photos, currentLayout);
  const accepted = items.slice(0, slots);
  const total = accepted.length;
  if (loadingOverlay && loadingText) {
    loadingOverlay.hidden = false;
    loadingText.textContent = t('loadingPhotos', { current: 0, total });
  }
  for (let i = 0; i < accepted.length; i++) {
    if (loadingText) loadingText.textContent = t('loadingPhotos', { current: i + 1, total });
    const [dims, dateOriginal] = await Promise.all([
      readImageDimensions(accepted[i]),
      readDateTimeOriginal(accepted[i]),
    ]);
    photos.push({
      file: accepted[i],
      url: URL.createObjectURL(accepted[i]),
      ...dims,
      dateOriginal: dateOriginal ?? null,
    });
  }
  if (loadingOverlay) loadingOverlay.hidden = true;
  await updatePreview();
}

const TEMPLATE_STORAGE_KEY = 'goja-template';

function getStoredTemplate(count) {
  try {
    return localStorage.getItem(`${TEMPLATE_STORAGE_KEY}-${count}`) || 'auto';
  } catch {
    return 'auto';
  }
}

function setStoredTemplate(count, id) {
  try {
    localStorage.setItem(`${TEMPLATE_STORAGE_KEY}-${count}`, id);
  } catch {}
}

function populateTemplateSelect(count) {
  if (!templateSelect) return;
  const templates = getTemplatesForCount(count);
  const current = templateSelect.value || getStoredTemplate(count);
  templateSelect.innerHTML = '';
  const auto = document.createElement('option');
  auto.value = 'auto';
  auto.textContent = t('templateAuto');
  templateSelect.appendChild(auto);
  for (const tpl of templates) {
    const opt = document.createElement('option');
    opt.value = tpl.id;
    opt.textContent = tpl.id;
    templateSelect.appendChild(opt);
  }
  const valid = ['auto', ...templates.map((t) => t.id)].includes(current);
  templateSelect.value = valid ? current : 'auto';
}

async function updatePreview() {
  if (photos.length === 0) { showUI(false); return; }
  await ensureTemplatesLoaded();
  populateTemplateSelect(photos.length);
  const opts = {
    gap: parseInt(gapSlider.value, 10),
    outputWidth: parseInt(frameW.value, 10),
    outputHeight: parseInt(frameH.value, 10),
    fitMode: imageFit.value,
    templateId: templateSelect?.value || getStoredTemplate(photos.length),
  };
  currentLayout = computeGridLayout(photos.map(p => ({ width: p.width, height: p.height })), opts);
  renderGrid(currentLayout);
  showUI(true);
  if (cleanupResize) cleanupResize();
  cleanupResize = enableGridResize(previewGrid, currentLayout, (ratios) => {
    Object.assign(currentLayout, ratios);
    currentLayout.cells = recomputePixelCells(currentLayout);
    Object.assign(previewGrid.style, { gridTemplateColumns: ratiosToFrString(currentLayout.colRatios), gridTemplateRows: ratiosToFrString(currentLayout.rowRatios) });
  }, () => pushState(photos, currentLayout));
}

function updateActionButtons(photosCount, isExporting = false) {
  syncActionButtons(addBtn, clearBtn, exportBtn, t, photosCount, isExporting);
}

function showUI(show) {
  preview.classList.toggle('active', show);
  dropZone.classList.toggle('hidden', show);
  updateActionButtons(photos.length);
}

function renderGrid(layout) {
  const g = previewGrid, gap = `${layout.gap}px`;
  g.innerHTML = '';
  const fitVal = imageFit.value;
  g.style.setProperty('--image-fit', fitVal);
  Object.assign(g.style, { gridTemplateRows: ratiosToFrString(layout.rowRatios),
    gridTemplateColumns: ratiosToFrString(layout.colRatios),
    gap, background: bgColor.value, padding: gap,
    aspectRatio: `${layout.canvasWidth} / ${layout.canvasHeight}` });
  const order = layout.photoOrder || photos.map((_, i) => i);
  const showDate = showCaptureDate?.checked ?? false;
  const posClass = captureDatePos?.value ?? 'bottom-left';

  for (let i = 0; i < layout.cells.length; i++) {
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
    img.src = photos[order[i]].url;
    img.alt = t('photoAlt', { n: i + 1 });
    img.style.objectFit = fitVal;
    img.style.width = '100%';
    img.style.height = '100%';
    img.draggable = true;
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    cell.appendChild(img);

    const photo = photos[order[i]];
    if (showDate && photo?.dateOriginal) {
      const dateStr = formatDateTimeOriginal(photo.dateOriginal, getLocale());
      const span = document.createElement('span');
      span.className = `capture-date-overlay capture-date-overlay--${posClass}`;
      span.setAttribute('aria-hidden', 'true');
      span.textContent = dateStr;
      cell.appendChild(span);
    }

    g.appendChild(cell);
  }
}

async function onExport() {
  if (!currentLayout || photos.length === 0) return;
  let w = clampFrameValue(frameW.value);
  let h = clampFrameValue(frameH.value);
  if (w !== parseInt(frameW.value, 10) || h !== parseInt(frameH.value, 10)) {
    frameW.value = String(w);
    frameH.value = String(h);
    showToast(t('frameDimensionClamped'), 'error');
    updatePreview();
  }
  const fitVal = imageFit.value;
  updateActionButtons(photos.length, true);
  try {
    const dateOriginals = photos.map(p => (p.dateOriginal ? formatDateTimeOriginal(p.dateOriginal, getLocale()) : null));
    const blob = await handleExport(photos, currentLayout, {
      backgroundColor: bgColor.value, format: formatSelect.value,
      fitMode: fitVal,
      watermarkType: wmType.value, watermarkText: wmText.value, watermarkPos: wmPos.value,
      watermarkOpacity: parseFloat(wmOpacity?.value ?? '0.8'),
      watermarkFontScale: parseFloat(wmFontSize?.value ?? '1'),
      locale: getLocale(),
      showCaptureDate: showCaptureDate?.checked ?? false,
      captureDatePos: captureDatePos?.value ?? 'bottom-left',
      captureDateOpacity: parseFloat(captureDateOpacity?.value ?? '0.7'),
      captureDateFontScale: parseFloat(captureDateFontSize?.value ?? '1'),
      dateOriginals,
    });
    const base = (exportFilename?.value?.trim()) || 'goja-grid';
    const withDate = exportUseDate?.checked ? `${base}-${new Date().toISOString().slice(0, 10)}` : base;
    showExportOptions(blob, withDate, formatSelect.value, {
      onShare: () => {
        shareBlob(blob, withDate).then(
          () => showToast(t('exportSuccess'), 'success'),
          (err) => { if (err?.name !== 'AbortError') showToast(`${t('exportShareFailed')} — ${err.message}`, 'error'); }
        );
      },
      onDownload: () => {
        downloadBlob(blob, formatSelect.value, withDate);
        showToast(t('exportSuccess'), 'success');
      },
      onCopy: () => {
        copyBlobToClipboard(blob).then(
          () => showToast(t('exportCopySuccess'), 'success'),
          (err) => showToast(`${t('exportCopyFailed')} — ${err?.message ?? err}`, 'error')
        );
      },
      onOpenInNewTab: () => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        showToast(t('exportSuccess'), 'success');
      },
    }, { focusReturnEl: exportBtn });
  } catch (err) {
    showToast(`${t('exportFailed')} — ${err.message}`, 'error');
  }
  finally { updateActionButtons(photos.length, false); }
}

function clearAll() {
  photos.forEach(p => URL.revokeObjectURL(p.url));
  if (cleanupResize) { cleanupResize(); cleanupResize = null; }
  photos = []; currentLayout = null; previewGrid.innerHTML = '';
  showUI(false); closeSettings(sPanel, sBackdrop);
}

const openFile = () => fileInput.click();
dropZone.addEventListener('click', openFile); addBtn.addEventListener('click', openFile);
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); loadPhotos(e.dataTransfer.files); });
fileInput.addEventListener('change', () => { loadPhotos(fileInput.files); fileInput.value = ''; });
initI18n();
langSelect.value = getLocale();
langSelect.addEventListener('change', () => {
  setLocale(langSelect.value);
  applyToDOM();
  if (photos.length > 0) populateTemplateSelect(photos.length);
  if (currentLayout) renderGrid(currentLayout);
});
applyToDOM();
if (gapSlider) {
  gapSlider.min = String(GAP_MIN);
  gapSlider.max = String(GAP_MAX);
  gapSlider.value = String(GAP_DEFAULT);
}
if (wmOpacity) {
  wmOpacity.min = String(WATERMARK_OPACITY_MIN);
  wmOpacity.max = String(WATERMARK_OPACITY_MAX);
  wmOpacity.value = String(WATERMARK_OPACITY_DEFAULT);
}
if (captureDatePos) captureDatePos.value = CAPTURE_DATE_POSITION_DEFAULT;
if (captureDateOpacity) {
  captureDateOpacity.min = String(CAPTURE_DATE_OPACITY_MIN);
  captureDateOpacity.max = String(CAPTURE_DATE_OPACITY_MAX);
  captureDateOpacity.value = String(CAPTURE_DATE_OPACITY_DEFAULT);
}
updateActionButtons(0);
$('#versionLabel').textContent = `v${VERSION_STRING}`;

function setFrameInputInvalidState(el, invalid) {
  if (!el) return;
  el.setAttribute('aria-invalid', String(invalid));
  el.classList.toggle('invalid', invalid);
}

function validateFrameInput(el, options = {}) {
  const { showClampedToast = true } = options;
  if (!el) return FRAME_MIN;
  const wasInvalid = !isFrameValueValid(el.value);
  if (wasInvalid) {
    const v = clampFrameValue(el.value);
    el.value = String(v);
    setFrameInputInvalidState(el, false);
    if (showClampedToast) showToast(t('frameDimensionClamped'), 'error');
    return v;
  }
  setFrameInputInvalidState(el, false);
  return parseInt(el.value, 10);
}

const frameToastShownThisSession = new Set();
function onFrameInputDebounced(el) {
  if (!el) return;
  if (!isFrameValueValid(el.value)) {
    const clamped = clampFrameValue(el.value);
    el.value = String(clamped);
    setFrameInputInvalidState(el, false);
    if (!frameToastShownThisSession.has(el)) {
      frameToastShownThisSession.add(el);
      showToast(t('frameDimensionClamped'), 'error');
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    frameToastShownThisSession.delete(el);
    setFrameInputInvalidState(el, false);
  }
}

function debounce(fn, ms) {
  let tid;
  return (...args) => {
    clearTimeout(tid);
    tid = setTimeout(() => fn(...args), ms);
  };
}

const debouncedFrameInput = debounce(onFrameInputDebounced, 200);

[gapSlider, bgColor, frameW, frameH, imageFit].filter(Boolean).forEach(el => el.addEventListener('input', updatePreview));
frameW?.addEventListener('input', () => debouncedFrameInput(frameW));
frameH?.addEventListener('input', () => debouncedFrameInput(frameH));
frameW?.addEventListener('blur', () => {
  frameToastShownThisSession.delete(frameW);
  validateFrameInput(frameW);
});
frameH?.addEventListener('blur', () => {
  frameToastShownThisSession.delete(frameH);
  validateFrameInput(frameH);
});
$('#aspectPresets')?.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-w][data-h]');
  if (!btn) return;
  frameW.value = btn.dataset.w;
  frameH.value = btn.dataset.h;
  frameW.dispatchEvent(new Event('input', { bubbles: true }));
});
imageFit.addEventListener('change', updatePreview);
if (templateSelect) {
  templateSelect.addEventListener('change', () => {
    if (photos.length > 0) {
      setStoredTemplate(photos.length, templateSelect.value);
      updatePreview();
    }
  });
}
exportBtn.addEventListener('click', onExport);
clearBtn.addEventListener('click', clearAll);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    if (e.shiftKey) {
      const restored = redo(photos, currentLayout);
      if (restored) applyRestoredState(restored);
    } else {
      const restored = undo(photos, currentLayout);
      if (restored) applyRestoredState(restored);
    }
  }
});

function applyRestoredState(restored) {
  photos = restored.photos;
  currentLayout = restored.layout;
  if (photos.length === 0) {
    showUI(false);
    previewGrid.innerHTML = '';
    if (cleanupResize) { cleanupResize(); cleanupResize = null; }
    return;
  }
  renderGrid(currentLayout);
  showUI(true);
  if (cleanupResize) cleanupResize();
  cleanupResize = enableGridResize(previewGrid, currentLayout, (ratios) => {
    Object.assign(currentLayout, ratios);
    currentLayout.cells = recomputePixelCells(currentLayout);
    Object.assign(previewGrid.style, { gridTemplateColumns: ratiosToFrString(currentLayout.colRatios), gridTemplateRows: ratiosToFrString(currentLayout.rowRatios) });
  }, () => pushState(photos, currentLayout));
}
wmType.addEventListener('change', () => {
  const v = wmType.value;
  const show = v !== 'none';
  wmPosGroup?.classList.toggle('hidden', !show);
  wmOpacityGroup?.classList.toggle('hidden', !show);
  wmFontSizeGroup?.classList.toggle('hidden', !show);
  wmTextGroup?.classList.toggle('hidden', v !== 'text' && v !== 'copyright');
});
showCaptureDate?.addEventListener('change', () => {
  captureDateOptionsGroup?.classList.toggle('hidden', !showCaptureDate?.checked);
  updatePreview();
});
captureDatePos?.addEventListener('change', updatePreview);
captureDateOpacity?.addEventListener('input', updatePreview);
captureDateFontSize?.addEventListener('change', updatePreview);
initSettingsPanel(sPanel, sBackdrop, $('#settingsBtn'), $('#settingsCloseBtn'));
enableDragAndDrop(previewGrid, (srcIdx, tgtIdx) => {
  if (!currentLayout) return;
  pushState(photos, currentLayout);
  currentLayout.photoOrder = swapOrder(currentLayout.photoOrder, srcIdx, tgtIdx);
  renderGrid(currentLayout);
});
enableCellContextMenu(previewGrid, () => currentLayout, (cellIndex) => {
  if (!currentLayout || photos.length === 0) return;
  pushState(photos, currentLayout);
  const photoOrder = currentLayout.photoOrder || photos.map((_, i) => i);
  const photoIndex = photoOrder[cellIndex];
  URL.revokeObjectURL(photos[photoIndex].url);
  photos.splice(photoIndex, 1);
  updatePreview();
}, t);
enableCellKeyboardNav(previewGrid, () => currentLayout, (srcIdx, tgtIdx) => {
  if (!currentLayout) return;
  pushState(photos, currentLayout);
  currentLayout.photoOrder = swapOrder(currentLayout.photoOrder, srcIdx, tgtIdx);
  renderGrid(currentLayout);
});
function updateOfflineBanner() {
  if (!offlineBanner) return;
  offlineBanner.hidden = navigator.onLine;
}
if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
  updateOfflineBanner();
  window.addEventListener('offline', updateOfflineBanner);
  window.addEventListener('online', updateOfflineBanner);
}
if ('serviceWorker' in navigator) {
  let skipWaitingRequested = false;
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner(reg, () => { skipWaitingRequested = true; });
        }
      });
    });
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (skipWaitingRequested) window.location.reload();
  });
}

function showUpdateBanner(reg, onRefreshClick) {
  if (document.getElementById('updateBanner')) return;
  const banner = document.createElement('div');
  banner.id = 'updateBanner';
  Object.assign(banner.style, {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    padding: '12px 16px', backgroundColor: 'var(--color-primary)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '12px', zIndex: 10000, boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
  });
  banner.innerHTML = `
    <span>New version available. Refresh to update.</span>
    <div style="display:flex;gap:8px;">
      <button id="updateRefreshBtn" style="padding:8px 16px;border:none;border-radius:6px;background:#fff;color:var(--color-primary);cursor:pointer;font-weight:600;">Refresh</button>
      <button id="updateDismissBtn" style="padding:8px 16px;border:1px solid rgba(255,255,255,0.5);border-radius:6px;background:transparent;color:#fff;cursor:pointer;">Dismiss</button>
    </div>
  `;
  document.body.appendChild(banner);
  document.getElementById('updateRefreshBtn').addEventListener('click', () => {
    if (reg.waiting) {
      onRefreshClick?.();
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  });
  document.getElementById('updateDismissBtn').addEventListener('click', () => {
    banner.remove();
  });
}
