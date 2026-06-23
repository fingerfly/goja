/**
 * Purpose: Recompute layout, render preview, and sync visible UI state.
 * Description:
 * - Rebuilds layout when frame/gap/template options change.
 * - Restores historical state for undo/redo operations.
 * - Rebinds resize handlers and action-button enabled states.
 */
import { isExportInProgress } from './export-flow.js';

/**
 * Build preview updater functions that own render/restore orchestration.
 * @param {object} stateRef
 * @param {object} refs
 * @param {object} deps
 * @returns {{
 *   updatePreview: () => Promise<void>,
 *   applyRestoredState: (restored: {
 *     photos: object[],
 *     layout: object | null
 *   }) => void,
 *   showUI: (show: boolean) => void,
 *   updateActionButtons: (photosCount: number, isExporting?: boolean) => void
 * }}
 */
export function createPreviewUpdater(stateRef, refs, deps) {
  const { ensureTemplatesLoaded, populateTemplateSelect, getTemplatesForCount, getStoredTemplate,
    clampFrameValue, computeGridLayout, renderGrid, ratiosToFrString, recomputePixelCells, pushState, buildForm,
    formatDateTimeOriginal, getLocale, t, syncActionButtons, enableGridResize } = deps;
  const { previewGrid, preview, gapSlider, frameW, frameH, imageFit, templateSelect, addBtn, clearBtn, exportBtn, dropZone } = refs;

  function updateActionButtons(photosCount, isExporting = false) {
    syncActionButtons(
      addBtn,
      clearBtn,
      exportBtn,
      t,
      photosCount,
      isExporting || isExportInProgress()
    );
  }

  function showUI(show) {
    preview.classList.toggle('active', show);
    dropZone.classList.toggle('hidden', show);
    updateActionButtons(stateRef.photos.length);
  }

  async function updatePreview() {
    if (stateRef.photos.length === 0) { showUI(false); return; }
    await ensureTemplatesLoaded();
    populateTemplateSelect(templateSelect, stateRef.photos.length, getTemplatesForCount, t);
    const w = clampFrameValue(frameW.value);
    const h = clampFrameValue(frameH.value);
    const opts = {
      gap: parseInt(gapSlider.value, 10),
      outputWidth: w,
      outputHeight: h,
      fitMode: imageFit.value,
      templateId: templateSelect?.value || getStoredTemplate(stateRef.photos.length),
    };
    stateRef.currentLayout = computeGridLayout(stateRef.photos.map((p) => ({ width: p.width, height: p.height })), opts);
    renderGrid(previewGrid, preview, stateRef.photos, stateRef.currentLayout, buildForm(), { formatDateTimeOriginal, getLocale, t });
    showUI(true);
    if (stateRef.cleanupResize) stateRef.cleanupResize();
    stateRef.cleanupResize = enableGridResize(previewGrid, stateRef.currentLayout, (ratios) => {
      Object.assign(stateRef.currentLayout, ratios);
      stateRef.currentLayout.cells = recomputePixelCells(stateRef.currentLayout);
      Object.assign(previewGrid.style, { gridTemplateColumns: ratiosToFrString(stateRef.currentLayout.colRatios), gridTemplateRows: ratiosToFrString(stateRef.currentLayout.rowRatios) });
    }, () => pushState(stateRef.photos, stateRef.currentLayout));
  }

  function applyRestoredState(restored) {
    stateRef.photos = restored.photos;
    stateRef.currentLayout = restored.layout;
    if (stateRef.photos.length === 0) {
      showUI(false);
      previewGrid.innerHTML = '';
      if (stateRef.cleanupResize) { stateRef.cleanupResize(); stateRef.cleanupResize = null; }
      return;
    }
    renderGrid(previewGrid, preview, stateRef.photos, stateRef.currentLayout, buildForm(), { formatDateTimeOriginal, getLocale, t });
    showUI(true);
    if (stateRef.cleanupResize) stateRef.cleanupResize();
    stateRef.cleanupResize = enableGridResize(previewGrid, stateRef.currentLayout, (ratios) => {
      Object.assign(stateRef.currentLayout, ratios);
      stateRef.currentLayout.cells = recomputePixelCells(stateRef.currentLayout);
      Object.assign(previewGrid.style, { gridTemplateColumns: ratiosToFrString(stateRef.currentLayout.colRatios), gridTemplateRows: ratiosToFrString(stateRef.currentLayout.rowRatios) });
    }, () => pushState(stateRef.photos, stateRef.currentLayout));
  }

  return { updatePreview, applyRestoredState, showUI, updateActionButtons };
}
