import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPreviewUpdater } from '../../js/preview-updater.js';

describe('createPreviewUpdater', () => {
  let stateRef;
  let refs;
  let deps;

  beforeEach(() => {
    stateRef = { photos: [], currentLayout: null, cleanupResize: null };
    refs = {
      previewGrid: document.createElement('div'),
      preview: document.createElement('div'),
      gapSlider: { value: '4' },
      frameW: { value: '1080' },
      frameH: { value: '720' },
      imageFit: { value: 'cover' },
      templateSelect: { value: 'auto' },
      dropZone: document.createElement('div'),
      addBtn: document.createElement('button'),
      clearBtn: document.createElement('button'),
      exportBtn: document.createElement('button'),
    };
    deps = {
      ensureTemplatesLoaded: vi.fn().mockResolvedValue(),
      populateTemplateSelect: vi.fn(),
      getTemplatesForCount: () => [],
      getStoredTemplate: () => 'auto',
      computeGridLayout: vi.fn().mockReturnValue({ cells: [], gap: 4, rowRatios: [1], colRatios: [1] }),
      renderGrid: vi.fn(),
      ratiosToFrString: (r) => r.join(' '),
      recomputePixelCells: (l) => l.cells || [],
      pushState: vi.fn(),
      buildForm: vi.fn().mockReturnValue({}),
      formatDateTimeOriginal: vi.fn(),
      getLocale: () => 'en',
      t: (k) => k,
      syncActionButtons: vi.fn(),
      enableGridResize: vi.fn().mockReturnValue(() => {}),
    };
  });

  it('returns updatePreview, applyRestoredState, showUI, updateActionButtons', () => {
    const updater = createPreviewUpdater(stateRef, refs, deps);
    expect(typeof updater.updatePreview).toBe('function');
    expect(typeof updater.applyRestoredState).toBe('function');
    expect(typeof updater.showUI).toBe('function');
    expect(typeof updater.updateActionButtons).toBe('function');
  });

  it('updatePreview calls showUI(false) when photos is empty', async () => {
    const updater = createPreviewUpdater(stateRef, refs, deps);
    await updater.updatePreview();
    expect(refs.preview.classList.contains('active')).toBe(false);
  });

  it('updatePreview computes layout and renders when photos exist', async () => {
    stateRef.photos = [{ url: 'blob:1', width: 100, height: 100 }];
    const updater = createPreviewUpdater(stateRef, refs, deps);
    await updater.updatePreview();
    expect(deps.computeGridLayout).toHaveBeenCalled();
    expect(deps.renderGrid).toHaveBeenCalled();
  });
});
