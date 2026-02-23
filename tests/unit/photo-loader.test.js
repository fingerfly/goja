import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadPhotos } from '../../js/photo-loader.js';

describe('loadPhotos', () => {
  let photos;
  let context;

  beforeEach(() => {
    photos = [];
    context = {
      photos,
      maxPhotos: 9,
      currentLayout: null,
      pushState: vi.fn(),
      onComplete: vi.fn(),
      loadingOverlay: null,
      loadingText: null,
      t: (key, p) => (key === 'loadingPhotos' ? `Loading ${p?.current ?? 0}/${p?.total ?? 0}` : key),
      readImageDimensions: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
      readDateTimeOriginal: vi.fn().mockResolvedValue(null),
    };
  });

  it('does nothing when no image files', async () => {
    await loadPhotos([], context);
    expect(photos.length).toBe(0);
    expect(context.onComplete).not.toHaveBeenCalled();
  });

  it('loads image files and pushes to photos', async () => {
    const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' });
    await loadPhotos([file], context);
    expect(photos.length).toBe(1);
    expect(photos[0]).toHaveProperty('url');
    expect(photos[0]).toHaveProperty('width', 100);
    expect(photos[0]).toHaveProperty('height', 100);
    expect(context.onComplete).toHaveBeenCalled();
  });

  it('ignores non-image files', async () => {
    const pdf = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    await loadPhotos([pdf], context);
    expect(photos.length).toBe(0);
  });

  it('ignores SVG files', async () => {
    const svg = new File(['<svg></svg>'], 'icon.svg', { type: 'image/svg+xml' });
    await loadPhotos([svg], context);
    expect(photos.length).toBe(0);
  });

  it('calls onLoadError and onComplete when readImageDimensions rejects', async () => {
    const onLoadError = vi.fn();
    context.onLoadError = onLoadError;
    const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' });
    context.readImageDimensions.mockRejectedValue(new Error('Failed to load'));
    await loadPhotos([file], context);
    expect(onLoadError).toHaveBeenCalledWith(expect.any(Error));
    expect(context.onComplete).toHaveBeenCalled();
    expect(photos.length).toBe(0);
  });
});
