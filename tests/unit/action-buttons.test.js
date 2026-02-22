import { describe, it, expect, beforeEach } from 'vitest';
import { syncActionButtons } from '../../js/action-buttons.js';

describe('syncActionButtons', () => {
  let addBtn, clearBtn, exportBtn, t;

  beforeEach(() => {
    addBtn = document.createElement('button');
    clearBtn = document.createElement('button');
    exportBtn = document.createElement('button');
    t = (key) => (key === 'exporting' ? 'Exporting...' : 'Export');
  });

  it('enables Add and Clear, disables Export when photosCount is 0', () => {
    syncActionButtons(addBtn, clearBtn, exportBtn, t, 0);
    expect(addBtn.disabled).toBe(false);
    expect(clearBtn.disabled).toBe(false);
    expect(exportBtn.disabled).toBe(true);
    expect(exportBtn.textContent).toBe('Export');
  });

  it('enables Add, Clear, and Export when photosCount > 0', () => {
    syncActionButtons(addBtn, clearBtn, exportBtn, t, 3);
    expect(addBtn.disabled).toBe(false);
    expect(clearBtn.disabled).toBe(false);
    expect(exportBtn.disabled).toBe(false);
    expect(exportBtn.textContent).toBe('Export');
  });

  it('disables Export and sets exporting text when isExporting is true', () => {
    syncActionButtons(addBtn, clearBtn, exportBtn, t, 3, true);
    expect(addBtn.disabled).toBe(false);
    expect(clearBtn.disabled).toBe(false);
    expect(exportBtn.disabled).toBe(true);
    expect(exportBtn.textContent).toBe('Exporting...');
  });
});
