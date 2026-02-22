import { describe, it, expect } from 'vitest';
import {
  JPEG_QUALITY,
  MIN_FRACTION,
  FRAME_MIN,
  FRAME_MAX,
  MAX_PHOTOS,
  GAP_MIN,
  GAP_MAX,
  GAP_DEFAULT,
  WATERMARK_OPACITY_MIN,
  WATERMARK_OPACITY_MAX,
  WATERMARK_OPACITY_DEFAULT,
} from '../../js/config.js';

describe('config', () => {
  it('exports JPEG_QUALITY', () => {
    expect(JPEG_QUALITY).toBe(0.92);
  });

  it('exports MIN_FRACTION', () => {
    expect(MIN_FRACTION).toBe(0.2);
  });

  it('exports FRAME_MIN', () => {
    expect(FRAME_MIN).toBe(320);
  });

  it('exports FRAME_MAX', () => {
    expect(FRAME_MAX).toBe(4096);
  });

  it('exports MAX_PHOTOS', () => {
    expect(MAX_PHOTOS).toBe(9);
  });

  it('exports GAP_MIN', () => {
    expect(GAP_MIN).toBe(0);
  });

  it('exports GAP_MAX', () => {
    expect(GAP_MAX).toBe(20);
  });

  it('exports GAP_DEFAULT', () => {
    expect(GAP_DEFAULT).toBe(4);
  });

  it('exports WATERMARK_OPACITY_MIN', () => {
    expect(WATERMARK_OPACITY_MIN).toBe(0.3);
  });

  it('exports WATERMARK_OPACITY_MAX', () => {
    expect(WATERMARK_OPACITY_MAX).toBe(0.9);
  });

  it('exports WATERMARK_OPACITY_DEFAULT', () => {
    expect(WATERMARK_OPACITY_DEFAULT).toBe(0.8);
  });
});
