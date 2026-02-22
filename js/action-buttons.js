/**
 * Centralized logic for Add, Clear, and Export button states.
 * Single source of truth for workflow-appropriate enabled/disabled state.
 */
export function syncActionButtons(addBtn, clearBtn, exportBtn, t, photosCount, isExporting = false) {
  const hasPhotos = photosCount > 0;
  addBtn.disabled = false;
  clearBtn.disabled = false;
  exportBtn.disabled = !hasPhotos || isExporting;
  exportBtn.textContent = isExporting ? t('exporting') : t('exportBtn');
}
