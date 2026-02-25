/**
 * App initialization: form defaults and event binding.
 * Extracted from app.js for modularity.
 */
import {
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
  VIGNETTE_STRENGTH_MIN,
  VIGNETTE_STRENGTH_MAX,
  VIGNETTE_STRENGTH_DEFAULT,
} from './config.js';

/**
 * Sets form default values from config.
 */
function setFormDefaults(refs) {
  const { gapSlider, wmOpacity, captureDatePos, captureDateOpacity, vignetteStrength } = refs;
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
  if (vignetteStrength) {
    vignetteStrength.min = String(VIGNETTE_STRENGTH_MIN);
    vignetteStrength.max = String(VIGNETTE_STRENGTH_MAX);
    vignetteStrength.value = String(VIGNETTE_STRENGTH_DEFAULT);
  }
}

function syncSettingsVisibility(refs) {
  const show = refs.wmType?.value !== 'none';
  refs.wmPosGroup?.classList.toggle('hidden', !show);
  refs.wmOpacityGroup?.classList.toggle('hidden', !show);
  refs.wmFontSizeGroup?.classList.toggle('hidden', !show);
  refs.wmTextGroup?.classList.toggle('hidden', refs.wmType?.value !== 'text' && refs.wmType?.value !== 'copyright');
  refs.captureDateOptionsGroup?.classList.toggle('hidden', !refs.showCaptureDate?.checked);
  refs.vignetteOptionsGroup?.classList.toggle('hidden', !refs.vignetteEnabled?.checked);
}

function resetControls(rootEl) {
  rootEl?.querySelectorAll('input, select, textarea').forEach((el) => {
    if (el.type === 'checkbox' || el.type === 'radio') el.checked = el.defaultChecked;
    else if (el.tagName === 'SELECT') {
      const selected = Array.from(el.options).find((opt) => opt.defaultSelected);
      el.value = selected ? selected.value : el.options[0]?.value ?? '';
    } else el.value = el.defaultValue;
    el.dispatchEvent(new Event(el.type === 'range' ? 'input' : 'change', { bubbles: true }));
  });
}

/**
 * Attaches all event listeners.
 * @param {object} refs - DOM refs
 * @param {object} stateRef - { photos, currentLayout }
 * @param {object} handlers - { loadPhotos, updatePreview, onExport, clearAll, applyRestoredState, onLangChange, openFile }
 * @param {object} frameInput - { validateFrameInput, debouncedFrameInput, clearToastSessionFor }
 * @param {object} deps - { setStoredTemplate, populateTemplateSelect, getTemplatesForCount, renderGrid, buildForm, formatDateTimeOriginal, getLocale, t, pushState, undo, redo, swapOrder, initSettingsPanel }
 */
export function initApp(refs, stateRef, handlers, frameInput, deps) {
  const {
    dropZone, fileInput, addBtn, gapSlider, bgColor, frameW, frameH, imageFit, templateSelect,
    exportBtn, clearBtn, wmType, wmPosGroup, wmOpacityGroup, wmFontSizeGroup, wmTextGroup,
    wmPos, wmOpacity, wmFontSize, wmText, showCaptureDate, captureDateOptionsGroup,
    vignetteEnabled, vignetteOptionsGroup, filterPreset, vignetteStrength, captureDatePos,
    captureDateOpacity, captureDateFontSize, previewGrid, preview, sPanel, sBackdrop,
    offlineBanner, langSelect, settingsPanelBody, settingsSectionTabs, settingsDoneBtn,
    settingsResetSectionBtn, settingsResetAllBtn,
  } = refs;
  const { loadPhotos, updatePreview, onExport, clearAll, applyRestoredState, onLangChange, openFile } = handlers;
  const { validateFrameInput, debouncedFrameInput, clearToastSessionFor } = frameInput;
  const { setStoredTemplate, populateTemplateSelect, getTemplatesForCount, renderGrid, buildForm,
    formatDateTimeOriginal, getLocale, t, pushState, undo, redo, swapOrder, initSettingsPanel,
    initSettingsTabsNav, refreshRotationHandles } = deps;

  setFormDefaults(refs);
  syncSettingsVisibility(refs);

  dropZone?.addEventListener('click', openFile);
  addBtn?.addEventListener('click', openFile);
  dropZone?.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    loadPhotos(e.dataTransfer.files);
  });
  fileInput?.addEventListener('change', () => {
    loadPhotos(fileInput.files);
    fileInput.value = '';
  });
  langSelect?.addEventListener('change', onLangChange);

  [gapSlider, bgColor, frameW, frameH, imageFit].filter(Boolean).forEach((el) => el.addEventListener('input', updatePreview));
  frameW?.addEventListener('input', () => debouncedFrameInput(frameW));
  frameH?.addEventListener('input', () => debouncedFrameInput(frameH));
  frameW?.addEventListener('blur', () => { clearToastSessionFor(frameW); validateFrameInput(frameW); });
  frameH?.addEventListener('blur', () => { clearToastSessionFor(frameH); validateFrameInput(frameH); });
  document.getElementById('aspectPresets')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-w][data-h]');
    if (!btn) return;
    const presetButtons = document.querySelectorAll('#aspectPresets button[data-w][data-h]');
    presetButtons.forEach((el) => el.setAttribute('aria-pressed', String(el === btn)));
    frameW.value = btn.dataset.w;
    frameH.value = btn.dataset.h;
    frameW.dispatchEvent(new Event('input', { bubbles: true }));
  });
  imageFit?.addEventListener('change', updatePreview);
  templateSelect?.addEventListener('change', () => {
    if (stateRef.photos.length > 0) {
      setStoredTemplate(stateRef.photos.length, templateSelect.value);
      updatePreview();
    }
  });
  exportBtn?.addEventListener('click', onExport);
  clearBtn?.addEventListener('click', clearAll);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        const restored = redo(stateRef.photos, stateRef.currentLayout);
        if (restored) applyRestoredState(restored);
      } else {
        const restored = undo(stateRef.photos, stateRef.currentLayout);
        if (restored) applyRestoredState(restored);
      }
    }
  });

  wmType?.addEventListener('change', () => {
    syncSettingsVisibility(refs);
    updatePreview();
  });
  wmPos?.addEventListener('change', updatePreview);
  wmOpacity?.addEventListener('input', updatePreview);
  wmFontSize?.addEventListener('change', updatePreview);
  wmText?.addEventListener('input', updatePreview);
  showCaptureDate?.addEventListener('change', () => {
    syncSettingsVisibility(refs);
    updatePreview();
  });
  vignetteEnabled?.addEventListener('change', () => {
    syncSettingsVisibility(refs);
    updatePreview();
  });
  filterPreset?.addEventListener('change', updatePreview);
  vignetteStrength?.addEventListener('input', updatePreview);
  captureDatePos?.addEventListener('change', updatePreview);
  captureDateOpacity?.addEventListener('input', updatePreview);
  captureDateFontSize?.addEventListener('change', updatePreview);
  initSettingsPanel?.(sPanel, sBackdrop, document.getElementById('settingsBtn'), document.getElementById('settingsCloseBtn'));
  initSettingsTabsNav?.(settingsPanelBody, settingsSectionTabs);
  settingsDoneBtn?.addEventListener('click', () => document.getElementById('settingsCloseBtn')?.click());
  settingsResetSectionBtn?.addEventListener('click', () => {
    const active = settingsSectionTabs?.querySelector('.is-active')?.dataset.settingsTab || 'language';
    resetControls(settingsPanelBody?.querySelector(`[data-settings-section="${active}"]`));
    setFormDefaults(refs);
    syncSettingsVisibility(refs);
    updatePreview();
  });
  settingsResetAllBtn?.addEventListener('click', () => {
    resetControls(settingsPanelBody);
    setFormDefaults(refs);
    syncSettingsVisibility(refs);
    updatePreview();
  });
  deps.enableDragAndDrop(previewGrid, (srcIdx, tgtIdx) => {
    if (!stateRef.currentLayout) return;
    pushState(stateRef.photos, stateRef.currentLayout);
    stateRef.currentLayout.photoOrder = swapOrder(stateRef.currentLayout.photoOrder, srcIdx, tgtIdx);
    renderGrid(previewGrid, preview, stateRef.photos, stateRef.currentLayout, buildForm(), { formatDateTimeOriginal, getLocale, t });
    refreshRotationHandles?.();
  });
  deps.enableCellContextMenu(previewGrid, () => stateRef.currentLayout, (cellIndex) => {
    if (!stateRef.currentLayout || stateRef.photos.length === 0) return;
    pushState(stateRef.photos, stateRef.currentLayout);
    const photoOrder = stateRef.currentLayout.photoOrder || stateRef.photos.map((_, i) => i);
    const photoIndex = photoOrder[cellIndex];
    if (photoIndex == null || photoIndex < 0 || photoIndex >= stateRef.photos.length) return;
    URL.revokeObjectURL(stateRef.photos[photoIndex].url);
    stateRef.photos.splice(photoIndex, 1);
    updatePreview();
  }, t);
  deps.enableCellKeyboardNav(previewGrid, () => stateRef.currentLayout, (srcIdx, tgtIdx) => {
    if (!stateRef.currentLayout) return;
    pushState(stateRef.photos, stateRef.currentLayout);
    stateRef.currentLayout.photoOrder = swapOrder(stateRef.currentLayout.photoOrder, srcIdx, tgtIdx);
    renderGrid(previewGrid, preview, stateRef.photos, stateRef.currentLayout, buildForm(), { formatDateTimeOriginal, getLocale, t });
    refreshRotationHandles?.();
  });
}
