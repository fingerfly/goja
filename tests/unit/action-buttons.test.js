import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncActionButtons } from '../../js/action-buttons.js';

describe('syncActionButtons', () => {
  let addBtn, clearBtn, exportBtn, t;

  beforeEach(() => {
    addBtn = document.createElement('button');
    clearBtn = document.createElement('button');
    exportBtn = document.createElement('button');
    t = (key) => (key === 'exporting' ? 'Exporting...' : 'Export');
  });

  // TDD: Workflow state - Empty (startup or after clear)
  it('enables Add and Clear, disables Export when photosCount is 0', () => {
    syncActionButtons(addBtn, clearBtn, exportBtn, t, 0);
    expect(addBtn.disabled).toBe(false);
    expect(clearBtn.disabled).toBe(false);
    expect(exportBtn.disabled).toBe(true);
    expect(exportBtn.textContent).toBe('Export');
  });

  // TDD: Workflow state - Has photos
  it('enables Add, Clear, and Export when photosCount > 0', () => {
    syncActionButtons(addBtn, clearBtn, exportBtn, t, 3);
    expect(addBtn.disabled).toBe(false);
    expect(clearBtn.disabled).toBe(false);
    expect(exportBtn.disabled).toBe(false);
    expect(exportBtn.textContent).toBe('Export');
  });

  // TDD: Workflow state - Exporting
  it('disables Export and sets exporting text when isExporting is true', () => {
    syncActionButtons(addBtn, clearBtn, exportBtn, t, 3, true);
    expect(addBtn.disabled).toBe(false);
    expect(clearBtn.disabled).toBe(false);
    expect(exportBtn.disabled).toBe(true);
    expect(exportBtn.textContent).toBe('Exporting...');
  });

  // TDD: Edge case - single photo
  it('enables all buttons with exactly one photo', () => {
    syncActionButtons(addBtn, clearBtn, exportBtn, t, 1);
    expect(addBtn.disabled).toBe(false);
    expect(clearBtn.disabled).toBe(false);
    expect(exportBtn.disabled).toBe(false);
  });

  // TDD: Edge case - isExporting with zero photos (Export still disabled)
  it('disables Export when isExporting even with 0 photos', () => {
    syncActionButtons(addBtn, clearBtn, exportBtn, t, 0, true);
    expect(exportBtn.disabled).toBe(true);
    expect(exportBtn.textContent).toBe('Exporting...');
  });

  // TDD: i18n - t is called with correct keys
  it('calls t with exportBtn when not exporting', () => {
    const tSpy = vi.fn((key) => (key === 'exporting' ? 'Exporting...' : 'Export'));
    syncActionButtons(addBtn, clearBtn, exportBtn, tSpy, 2);
    expect(tSpy).toHaveBeenCalledWith('exportBtn');
  });

  it('calls t with exporting when isExporting', () => {
    const tSpy = vi.fn((key) => (key === 'exporting' ? 'Exporting...' : 'Export'));
    syncActionButtons(addBtn, clearBtn, exportBtn, tSpy, 2, true);
    expect(tSpy).toHaveBeenCalledWith('exporting');
  });

  // TDD: Overrides previous disabled state
  it('enables Add and Clear even if they were disabled', () => {
    addBtn.disabled = true;
    clearBtn.disabled = true;
    syncActionButtons(addBtn, clearBtn, exportBtn, t, 0);
    expect(addBtn.disabled).toBe(false);
    expect(clearBtn.disabled).toBe(false);
  });
});
