/**
 * Preview update and state restore.
 * Extracted from app.js for modularity.
 */

/**
 * Creates preview updater functions that manage layout, renderGrid, resize, and UI.
 * @param {{ photos: object[], currentLayout: object | null, cleanupResize: (() => void) | null }} stateRef
 * @param {{ previewGrid: HTMLElement, preview: HTMLElement, gapSlider: HTMLInputElement, frameW: HTMLInputElement, frameH: HTMLInputElement, imageFit: HTMLSelectElement, templateSelect: HTMLSelectElement | null, dropZone: HTMLElement, addBtn: HTMLElement, clearBtn: HTMLElement, exportBtn: HTMLElement }} refs
 * @param {{ ensureTemplatesLoaded: () => Promise<void>, populateTemplateSelect: (sel: HTMLSelectElement | null, count: number, getTemplatesForCount: (n: number) => object[], t: (k: string) => string) => void, getTemplatesForCount: (n: number) => object[], getStoredTemplate: (n: number) => string, clampFrameValue: (v: unknown) => number, computeGridLayout: (dims: object[], opts: object) => object, renderGrid: (cont: HTMLElement, prev: HTMLElement, photos: object[], layout: object, form: object, deps: object) => void, ratiosToFrString: (ratios: number[]) => string, recomputePixelCells: (layout: object) => void, pushState: (photos: object[], layout: object | null) => void, buildForm: (inc?: boolean) => object, formatDateTimeOriginal: (d: Date, loc: string) => string, getLocale: () => string, t: (k: string, p?: object) => string, syncActionButtons: (add: HTMLElement, clear: HTMLElement, exp: HTMLElement, t: (k: string) => string, count: number, exporting: boolean) => void, enableGridResize: (grid: HTMLElement, layout: object, onRatios: (r: number[]) => void, onPush: () => void) => () => void }} deps
 */
export function createPreviewUpdater(stateRef, refs, deps) {
  const { ensureTemplatesLoaded, populateTemplateSelect, getTemplatesForCount, getStoredTemplate,
    clampFrameValue, computeGridLayout, renderGrid, ratiosToFrString, recomputePixelCells, pushState, buildForm,
    formatDateTimeOriginal, getLocale, t, syncActionButtons, enableGridResize } = deps;
  const { previewGrid, preview, gapSlider, frameW, frameH, imageFit, templateSelect, addBtn, clearBtn, exportBtn, dropZone } = refs;

  function updateActionButtons(photosCount, isExporting = false) {
    syncActionButtons(addBtn, clearBtn, exportBtn, t, photosCount, isExporting);
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
