import { describe, it, expect } from 'vitest';
import {
  JPEG_QUALITY,
  MIN_FRACTION,
  FRAME_MIN,
  FRAME_MAX,
  FRAME_INPUT_DEBOUNCE_MS,
  MAX_PHOTOS,
  GAP_MIN,
  GAP_MAX,
  GAP_DEFAULT,
  TEMPLATE_STORAGE_KEY,
  WATERMARK_OPACITY_MIN,
  WATERMARK_OPACITY_MAX,
  WATERMARK_OPACITY_DEFAULT,
  WATERMARK_POSITION_DEFAULT,
  WATERMARK_FONT_SCALE_DEFAULT,
  EXIF_TAG_SET,
  CAPTURE_DATE_POSITION_DEFAULT,
  CAPTURE_DATE_OPACITY_MIN,
  CAPTURE_DATE_OPACITY_MAX,
  CAPTURE_DATE_OPACITY_DEFAULT,
  CAPTURE_DATE_FONT_RATIO,
  CAPTURE_DATE_MARGIN_RATIO,
  CAPTURE_DATE_FONT_SCALE_DEFAULT,
  FILTER_PRESET_NONE,
  FILTER_PRESET_GRAYSCALE,
  FILTER_PRESET_SEPIA,
  FILTER_PRESET_BRIGHTNESS,
  FILTER_PRESET_CONTRAST,
  FILTER_PRESET_SATURATED,
  FILTER_PRESET_FADED,
  FILTER_PRESET_VINTAGE,
  FILTER_PRESET_BLUR,
  FILTER_GRAYSCALE_VALUE,
  FILTER_SEPIA_VALUE,
  FILTER_BRIGHTNESS_VALUE,
  FILTER_CONTRAST_VALUE,
  FILTER_SATURATE_VALUE,
  FILTER_FADED_SATURATE,
  FILTER_FADED_BRIGHTNESS,
  FILTER_VINTAGE_SEPIA,
  FILTER_VINTAGE_BRIGHTNESS,
  FILTER_VINTAGE_CONTRAST,
  FILTER_BLUR_PX,
  EXPORT_URL_REVOKE_DELAY_MS,
  VIGNETTE_STRENGTH_MIN,
  VIGNETTE_STRENGTH_MAX,
  VIGNETTE_STRENGTH_DEFAULT,
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

  it('exports FRAME_INPUT_DEBOUNCE_MS', () => {
    expect(FRAME_INPUT_DEBOUNCE_MS).toBe(200);
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

  it('exports TEMPLATE_STORAGE_KEY', () => {
    expect(TEMPLATE_STORAGE_KEY).toBe('goja-template');
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

  it('exports WATERMARK_POSITION_DEFAULT', () => {
    expect(WATERMARK_POSITION_DEFAULT).toBe('bottom-right');
  });

  it('exports WATERMARK_FONT_SCALE_DEFAULT', () => {
    expect(WATERMARK_FONT_SCALE_DEFAULT).toBe(1);
  });

  it('exports EXIF_TAG_SET', () => {
    expect(EXIF_TAG_SET).toEqual(['DateTimeOriginal']);
  });

  it('exports CAPTURE_DATE_POSITION_DEFAULT', () => {
    expect(CAPTURE_DATE_POSITION_DEFAULT).toBe('bottom-left');
  });

  it('exports CAPTURE_DATE_OPACITY_MIN', () => {
    expect(CAPTURE_DATE_OPACITY_MIN).toBe(0.3);
  });

  it('exports CAPTURE_DATE_OPACITY_MAX', () => {
    expect(CAPTURE_DATE_OPACITY_MAX).toBe(0.9);
  });

  it('exports CAPTURE_DATE_OPACITY_DEFAULT', () => {
    expect(CAPTURE_DATE_OPACITY_DEFAULT).toBe(0.7);
  });

  it('exports CAPTURE_DATE_FONT_RATIO', () => {
    expect(CAPTURE_DATE_FONT_RATIO).toBe(0.025);
  });

  it('exports CAPTURE_DATE_MARGIN_RATIO', () => {
    expect(CAPTURE_DATE_MARGIN_RATIO).toBe(0.02);
  });

  it('exports CAPTURE_DATE_FONT_SCALE_DEFAULT', () => {
    expect(CAPTURE_DATE_FONT_SCALE_DEFAULT).toBe(1);
  });

  it('exports FILTER_PRESET_NONE', () => {
    expect(FILTER_PRESET_NONE).toBe('none');
  });

  it('exports FILTER_PRESET_GRAYSCALE', () => {
    expect(FILTER_PRESET_GRAYSCALE).toBe('grayscale');
  });

  it('exports FILTER_PRESET_SEPIA', () => {
    expect(FILTER_PRESET_SEPIA).toBe('sepia');
  });

  it('exports FILTER_GRAYSCALE_VALUE', () => {
    expect(FILTER_GRAYSCALE_VALUE).toBe(1);
  });

  it('exports FILTER_SEPIA_VALUE', () => {
    expect(FILTER_SEPIA_VALUE).toBe(0.8);
  });

  it('exports FILTER_PRESET_BRIGHTNESS', () => {
    expect(FILTER_PRESET_BRIGHTNESS).toBe('brightness');
  });

  it('exports FILTER_PRESET_CONTRAST', () => {
    expect(FILTER_PRESET_CONTRAST).toBe('contrast');
  });

  it('exports FILTER_PRESET_SATURATED', () => {
    expect(FILTER_PRESET_SATURATED).toBe('saturated');
  });

  it('exports FILTER_PRESET_FADED', () => {
    expect(FILTER_PRESET_FADED).toBe('faded');
  });

  it('exports FILTER_PRESET_VINTAGE', () => {
    expect(FILTER_PRESET_VINTAGE).toBe('vintage');
  });

  it('exports FILTER_PRESET_BLUR', () => {
    expect(FILTER_PRESET_BLUR).toBe('blur');
  });

  it('exports FILTER_BRIGHTNESS_VALUE', () => {
    expect(FILTER_BRIGHTNESS_VALUE).toBe(1.15);
  });

  it('exports FILTER_CONTRAST_VALUE', () => {
    expect(FILTER_CONTRAST_VALUE).toBe(1.2);
  });

  it('exports FILTER_SATURATE_VALUE', () => {
    expect(FILTER_SATURATE_VALUE).toBe(1.4);
  });

  it('exports FILTER_FADED_SATURATE', () => {
    expect(FILTER_FADED_SATURATE).toBe(0.65);
  });

  it('exports FILTER_FADED_BRIGHTNESS', () => {
    expect(FILTER_FADED_BRIGHTNESS).toBe(1.05);
  });

  it('exports FILTER_VINTAGE_SEPIA', () => {
    expect(FILTER_VINTAGE_SEPIA).toBe(0.35);
  });

  it('exports FILTER_VINTAGE_BRIGHTNESS', () => {
    expect(FILTER_VINTAGE_BRIGHTNESS).toBe(1.05);
  });

  it('exports FILTER_VINTAGE_CONTRAST', () => {
    expect(FILTER_VINTAGE_CONTRAST).toBe(1.1);
  });

  it('exports FILTER_BLUR_PX', () => {
    expect(FILTER_BLUR_PX).toBe(1.5);
  });

  it('exports EXPORT_URL_REVOKE_DELAY_MS', () => {
    expect(EXPORT_URL_REVOKE_DELAY_MS).toBe(60000);
  });

  it('exports VIGNETTE_STRENGTH_MIN', () => {
    expect(VIGNETTE_STRENGTH_MIN).toBe(0.2);
  });

  it('exports VIGNETTE_STRENGTH_MAX', () => {
    expect(VIGNETTE_STRENGTH_MAX).toBe(0.8);
  });

  it('exports VIGNETTE_STRENGTH_DEFAULT', () => {
    expect(VIGNETTE_STRENGTH_DEFAULT).toBe(0.5);
  });
});
