/**
 * App bootstrap: DOM refs, state, updater, handlers, initApp.
 * Keeps app.js minimal.
 */
import { computeGridLayout } from './layout-engine.js';
import { getTemplatesForCount, ensureTemplatesLoaded } from './layout-templates.js';
import { getStoredTemplate, setStoredTemplate, populateTemplateSelect } from './template-storage.js';
import { readImageDimensions, debounce } from './utils.js';
import { loadPhotos as loadPhotosFromFiles } from './photo-loader.js';
import { readDateTimeOriginal, formatDateTimeOriginal } from './exif.js';
import { handleExport, downloadBlob, shareBlob, copyBlobToClipboard } from './export-handler.js';
import { runExport } from './export-flow.js';
import { buildFormFromRefs, getGridEffectsOptions } from './grid-effects-settings.js';
import { renderGrid } from './preview-renderer.js';
import { showExportOptions } from './export-options.js';
import { swapOrder, enableDragAndDrop } from './drag-handler.js';
import { initSettingsPanel, closeSettings } from './settings-panel.js';
import { ratiosToFrString, recomputePixelCells } from './resize-engine.js';
import { enableGridResize } from './resize-handler.js';
import { init as initI18n, t, getLocale, setLocale, applyToDOM } from './i18n.js';
import { VERSION_STRING } from './version.js';
import { showToast } from './toast.js';
import { MAX_PHOTOS } from './config.js';
import { clampFrameValue, isFrameValueValid, setFrameInputInvalidState, createFrameInputHandler } from './frame-validation.js';
import { enableCellContextMenu } from './cell-context-menu.js';
import { enableCellKeyboardNav } from './cell-keyboard-nav.js';
import { enableRotation } from './rotation-handler.js';
import { initServiceWorkerUpdate } from './update-banner.js';
import { pushState, undo, redo } from './state.js';
import { syncActionButtons } from './action-buttons.js';
import { createPreviewUpdater } from './preview-updater.js';
import { initApp } from './app-init.js';
import { initSettingsTabsNav } from './settings-tabs-nav.js';

const $ = (sel) => document.querySelector(sel);

export function bootstrap() {
  const [dropZone, fileInput, preview, previewGrid] = ['#dropZone', '#fileInput', '#preview', '#previewGrid'].map($);
  const [gapSlider, bgColor, formatSelect, addBtn, exportBtn, clearBtn, frameW, frameH, imageFit, templateSelect, exportFilename, exportUseDate] =
    ['#gapSlider', '#bgColor', '#formatSelect', '#addBtn', '#exportBtn', '#clearBtn', '#frameWidth', '#frameHeight', '#imageFit', '#templateSelect', '#exportFilename', '#exportUseDate'].map($);
  const [wmType, wmText, wmTextGroup, wmPos, wmPosGroup, wmOpacity, wmOpacityGroup, wmFontSize, wmFontSizeGroup] =
    ['#watermarkType', '#watermarkText', '#watermarkTextGroup', '#watermarkPos', '#watermarkPosGroup', '#watermarkOpacity', '#watermarkOpacityGroup', '#watermarkFontSize', '#watermarkFontSizeGroup'].map($);
  const [showCaptureDate, captureDateOptionsGroup, captureDatePos, captureDateOpacity, captureDateFontSize] =
    ['#showCaptureDate', '#captureDateOptionsGroup', '#captureDatePos', '#captureDateOpacity', '#captureDateFontSize'].map($);
  const [filterPreset, vignetteEnabled, vignetteOptionsGroup, vignetteStrength] =
    ['#filterPreset', '#vignetteEnabled', '#vignetteOptionsGroup', '#vignetteStrength'].map($);
  const [sPanel, sBackdrop] = ['#settingsPanel', '#settingsBackdrop'].map($);
  const [settingsPanelBody, settingsSectionTabs, settingsDoneBtn, settingsResetSectionBtn, settingsResetAllBtn] =
    ['#settingsPanelBody', '#settingsSectionTabs', '#settingsDoneBtn', '#settingsResetSectionBtn', '#settingsResetAllBtn'].map($);
  const [loadingOverlay, loadingText, offlineBanner] = ['#loadingOverlay', '#loadingText', '#offlineBanner'].map($);
  const langSelect = $('#langSelect');

  const formRefs = { wmType, wmText, wmPos, wmOpacity, wmFontSize, showCaptureDate, captureDatePos, captureDateOpacity, captureDateFontSize, vignetteEnabled, vignetteStrength, filterPreset, imageFit, bgColor, formatSelect };
  const buildForm = (inc) => buildFormFromRefs(formRefs, inc);
  const stateRef = { photos: [], currentLayout: null, cleanupResize: null };

  const updater = createPreviewUpdater(stateRef, { previewGrid, preview, gapSlider, frameW, frameH, imageFit, templateSelect, dropZone, addBtn, clearBtn, exportBtn }, {
    ensureTemplatesLoaded, populateTemplateSelect, getTemplatesForCount, getStoredTemplate, clampFrameValue, computeGridLayout, renderGrid, ratiosToFrString, recomputePixelCells, pushState, buildForm, formatDateTimeOriginal, getLocale, t, syncActionButtons, enableGridResize,
  });
  const { updatePreview: baseUpdatePreview, applyRestoredState: baseApplyRestoredState, showUI, updateActionButtons } = updater;

  let cleanupRotation = null;
  function refreshRotationHandles() {
    cleanupRotation?.();
    if (!stateRef.currentLayout || stateRef.photos.length === 0) return;
    cleanupRotation = enableRotation(
      previewGrid,
      () => stateRef.photos,
      () => stateRef.currentLayout,
      (cellIndex, angle) => {
        const order = stateRef.currentLayout?.photoOrder || stateRef.photos.map((_, i) => i);
        const photoIndex = order[cellIndex];
        if (photoIndex == null || photoIndex < 0 || photoIndex >= stateRef.photos.length) return;
        stateRef.photos[photoIndex].angle = angle;
        updatePreview();
      },
      () => pushState(stateRef.photos, stateRef.currentLayout),
      () => t('rotatePhoto')
    );
  }
  const updatePreview = async () => {
    await baseUpdatePreview();
    refreshRotationHandles();
  };
  const applyRestoredState = (restored) => {
    baseApplyRestoredState(restored);
    refreshRotationHandles();
  };

  const loadPhotos = (files) => loadPhotosFromFiles(files, { photos: stateRef.photos, maxPhotos: MAX_PHOTOS, currentLayout: stateRef.currentLayout, pushState, onComplete: updatePreview, onLoadError: (err) => showToast(`${t('loadFailed')} — ${err?.message ?? err}`, 'error'), loadingOverlay, loadingText, t, readImageDimensions, readDateTimeOriginal });
  const onExport = () => runExport({ frameW, frameH, exportFilename, exportUseDate, formatSelect, exportBtn }, { photos: stateRef.photos, currentLayout: stateRef.currentLayout }, { clampFrameValue, showToast, t, buildForm, getGridEffectsOptions, handleExport, showExportOptions, downloadBlob, shareBlob, copyBlobToClipboard, formatDateTimeOriginal, getLocale, updateActionButtons, updatePreview });
  const clearAll = () => {
    stateRef.photos.forEach((p) => URL.revokeObjectURL(p.url));
    cleanupRotation?.();
    cleanupRotation = null;
    if (stateRef.cleanupResize) { stateRef.cleanupResize(); stateRef.cleanupResize = null; }
    stateRef.photos = []; stateRef.currentLayout = null;
    previewGrid.innerHTML = '';
    preview?.querySelector('.watermark-preview-overlay')?.remove();
    showUI(false); closeSettings(sPanel, sBackdrop);
  };

  initI18n();
  langSelect.value = getLocale();
  applyToDOM();

  const frameInput = createFrameInputHandler({ clampFrameValue, isFrameValueValid, setFrameInputInvalidState, showToast, t, debounce });
  updateActionButtons(0);
  $('#versionLabel').textContent = `v${VERSION_STRING}`;

  initApp({ dropZone, fileInput, addBtn, gapSlider, bgColor, frameW, frameH, imageFit, templateSelect, exportBtn, clearBtn, wmType, wmPosGroup, wmOpacityGroup, wmFontSizeGroup, wmTextGroup, wmPos, wmOpacity, wmFontSize, wmText, showCaptureDate, captureDateOptionsGroup, vignetteEnabled, vignetteOptionsGroup, filterPreset, vignetteStrength, captureDatePos, captureDateOpacity, captureDateFontSize, previewGrid, preview, sPanel, sBackdrop, offlineBanner, langSelect, settingsPanelBody, settingsSectionTabs, settingsDoneBtn, settingsResetSectionBtn, settingsResetAllBtn }, stateRef, { loadPhotos, updatePreview, onExport, clearAll, applyRestoredState, onLangChange: () => { setLocale(langSelect.value); applyToDOM(); if (stateRef.photos.length > 0) populateTemplateSelect(templateSelect, stateRef.photos.length, getTemplatesForCount, t); if (stateRef.currentLayout) { renderGrid(previewGrid, preview, stateRef.photos, stateRef.currentLayout, buildForm(), { formatDateTimeOriginal, getLocale, t }); refreshRotationHandles(); } }, openFile: () => fileInput.click() }, frameInput, { setStoredTemplate, populateTemplateSelect, getTemplatesForCount, renderGrid, buildForm, formatDateTimeOriginal, getLocale, t, pushState, undo, redo, swapOrder, initSettingsPanel, initSettingsTabsNav, enableDragAndDrop, enableCellContextMenu, enableCellKeyboardNav, refreshRotationHandles });

  function updateOfflineBanner() { if (offlineBanner) offlineBanner.hidden = navigator.onLine; }
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) { updateOfflineBanner(); window.addEventListener('offline', updateOfflineBanner); window.addEventListener('online', updateOfflineBanner); }
  if ('serviceWorker' in navigator) {
    let r = false;
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((reg) => {
      initServiceWorkerUpdate(reg, () => { r = true; });
      // Re-check for updates when the tab regains focus/visibility.
      const checkForUpdates = () => reg.update?.().catch(() => {});
      window.addEventListener('focus', checkForUpdates);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdates();
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (r) window.location.reload(); });
  }
}
