import { computeGridLayout } from './layout-engine.js';
import { readImageDimensions } from './utils.js';
import { handleExport, downloadBlob } from './export-handler.js';
import { VERSION_STRING } from './version.js';
import { swapOrder, enableDragAndDrop } from './drag-handler.js';
import { initSettingsPanel, closeSettings } from './settings-panel.js';
import { ratiosToFrString, recomputePixelCells } from './resize-engine.js';
import { enableGridResize } from './resize-handler.js';

const $ = (sel) => document.querySelector(sel);
const [dropZone, fileInput, preview, previewGrid] =
  ['#dropZone', '#fileInput', '#preview', '#previewGrid'].map($);
const [gapSlider, bgColor, formatSelect, addBtn, exportBtn, clearBtn, frameW, frameH] =
  ['#gapSlider', '#bgColor', '#formatSelect', '#addBtn', '#exportBtn', '#clearBtn', '#frameWidth', '#frameHeight'].map($);
const [wmType, wmText, wmTextGroup, wmPos, wmPosGroup] =
  ['#watermarkType', '#watermarkText', '#watermarkTextGroup', '#watermarkPos', '#watermarkPosGroup'].map($);
const [sPanel, sBackdrop] = ['#settingsPanel', '#settingsBackdrop'].map($);
const MAX_PHOTOS = 9; let photos = [], currentLayout = null, cleanupResize = null;

async function loadPhotos(files) {
  const items = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (items.length === 0) return;
  const slots = MAX_PHOTOS - photos.length;
  if (slots <= 0) return;
  const accepted = items.slice(0, slots);
  for (const file of accepted) {
    const dims = await readImageDimensions(file);
    photos.push({ file, url: URL.createObjectURL(file), ...dims });
  }
  updatePreview();
}

function updatePreview() {
  if (photos.length === 0) { showUI(false); return; }
  const opts = { gap: parseInt(gapSlider.value, 10), outputWidth: parseInt(frameW.value, 10), outputHeight: parseInt(frameH.value, 10) };
  currentLayout = computeGridLayout(photos.map(p => ({ width: p.width, height: p.height })), opts);
  renderGrid(currentLayout);
  if (cleanupResize) cleanupResize();
  cleanupResize = enableGridResize(previewGrid, currentLayout, (ratios) => {
    Object.assign(currentLayout, ratios);
    currentLayout.cells = recomputePixelCells(currentLayout);
    Object.assign(previewGrid.style, { gridTemplateColumns: ratiosToFrString(currentLayout.colRatios), gridTemplateRows: ratiosToFrString(currentLayout.rowRatios) });
  });
  showUI(true);
}

function showUI(show) {
  preview.classList.toggle('active', show);
  dropZone.classList.toggle('hidden', show);
  exportBtn.disabled = !show; clearBtn.disabled = !show;
}

function renderGrid(layout) {
  const g = previewGrid, gap = `${layout.gap}px`;
  g.innerHTML = '';
  Object.assign(g.style, { gridTemplateRows: ratiosToFrString(layout.rowRatios),
    gridTemplateColumns: ratiosToFrString(layout.colRatios),
    gap, background: bgColor.value, padding: gap,
    aspectRatio: `${layout.canvasWidth} / ${layout.canvasHeight}` });
  const order = layout.photoOrder || photos.map((_, i) => i);
  for (let i = 0; i < layout.cells.length; i++) {
    const c = layout.cells[i], img = document.createElement('img');
    img.src = photos[order[i]].url; img.alt = `Photo ${i + 1}`;
    Object.assign(img.style, { gridRow: `${c.rowStart} / ${c.rowEnd}`, gridColumn: `${c.colStart} / ${c.colEnd}` });
    img.draggable = true; g.appendChild(img);
  }
}

async function onExport() {
  if (!currentLayout || photos.length === 0) return;
  exportBtn.disabled = true; exportBtn.textContent = 'Exporting...';
  try {
    const blob = await handleExport(photos, currentLayout, {
      backgroundColor: bgColor.value, format: formatSelect.value,
      watermarkType: wmType.value, watermarkText: wmText.value, watermarkPos: wmPos.value,
    });
    downloadBlob(blob, formatSelect.value);
  } catch (err) { console.warn('Export failed:', err); }
  finally { exportBtn.disabled = false; exportBtn.textContent = 'Export'; }
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
$('#versionLabel').textContent = `v${VERSION_STRING}`;
[gapSlider, bgColor, frameW, frameH].forEach(el => el.addEventListener('input', updatePreview));
exportBtn.addEventListener('click', onExport);
clearBtn.addEventListener('click', clearAll);
wmType.addEventListener('change', () => { const v = wmType.value;
  wmPosGroup.style.display = v === 'none' ? 'none' : '';
  wmTextGroup.style.display = (v === 'text' || v === 'copyright') ? '' : 'none'; });
initSettingsPanel(sPanel, sBackdrop, $('#settingsBtn'), $('#settingsCloseBtn'));
enableDragAndDrop(previewGrid, (srcIdx, tgtIdx) => {
  if (!currentLayout) return;
  currentLayout.photoOrder = swapOrder(currentLayout.photoOrder, srcIdx, tgtIdx);
  renderGrid(currentLayout);
});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}
