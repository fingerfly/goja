/**
 * Photo loading from files (with EXIF and dimensions).
 * Extracted from app.js for modularity.
 */

/**
 * Loads image files, reads dimensions and EXIF, pushes to photos array, calls onComplete.
 * @param {FileList | File[]} files
 * @param {{ photos: { url: string, file: File, width: number, height: number, dateOriginal: Date | null }[], maxPhotos: number, currentLayout: unknown, pushState: (photos: unknown[], layout: unknown) => void, onComplete: () => Promise<void>, loadingOverlay?: HTMLElement | null, loadingText?: HTMLElement | null, t: (key: string, params?: Record<string, unknown>) => string, readImageDimensions: (f: File) => Promise<{ width: number, height: number }>, readDateTimeOriginal: (f: File) => Promise<Date | null> }} context
 */
export async function loadPhotos(files, context) {
  const items = Array.from(files).filter((f) => f.type.startsWith('image/'));
  if (items.length === 0) return;
  const { photos, maxPhotos, currentLayout, pushState, onComplete, loadingOverlay, loadingText, t, readImageDimensions, readDateTimeOriginal } = context;
  const slots = maxPhotos - photos.length;
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
  await onComplete();
}
