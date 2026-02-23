import { describe, it, expect } from 'vitest';
import {
  getWatermarkOptions,
  getCaptureDateOptions,
  getVignetteOptions,
  getGridEffectsOptions,
} from '../../js/grid-effects-settings.js';

describe('getWatermarkOptions', () => {
  it('returns normalized options from form with config defaults', () => {
    const form = { wmType: 'text', wmText: 'Hi', wmPos: 'center', wmOpacity: '0.5', wmFontSize: '1.2', bgColor: '#fff' };
    const opts = getWatermarkOptions(form, 'en');
    expect(opts.type).toBe('text');
    expect(opts.text).toBe('Hi');
    expect(opts.position).toBe('center');
    expect(opts.opacity).toBe(0.5);
    expect(opts.fontScale).toBe(1.2);
    expect(opts.backgroundColor).toBe('#fff');
    expect(opts.locale).toBe('en');
  });

  it('uses config defaults when form values are missing', () => {
    const opts = getWatermarkOptions({}, 'de');
    expect(opts.position).toBe('bottom-right');
    expect(opts.opacity).toBe(0.8);
    expect(opts.fontScale).toBe(1);
    expect(opts.backgroundColor).toBe('#ffffff');
  });
});

describe('getCaptureDateOptions', () => {
  it('returns position, opacity, fontScale from form', () => {
    const form = { captureDatePos: 'top-right', captureDateOpacity: '0.6', captureDateFontSize: '0.8' };
    const opts = getCaptureDateOptions(form);
    expect(opts.position).toBe('top-right');
    expect(opts.opacity).toBe(0.6);
    expect(opts.fontScale).toBe(0.8);
  });

  it('uses config defaults when form values are missing', () => {
    const opts = getCaptureDateOptions({});
    expect(opts.position).toBe('bottom-left');
    expect(opts.opacity).toBe(0.7);
    expect(opts.fontScale).toBe(1);
  });
});

describe('getVignetteOptions', () => {
  it('returns enabled and strength from form', () => {
    const form = { vignetteEnabled: true, vignetteStrength: '0.6' };
    const opts = getVignetteOptions(form);
    expect(opts.enabled).toBe(true);
    expect(opts.strength).toBe(0.6);
  });

  it('uses config default for strength when missing', () => {
    const opts = getVignetteOptions({ vignetteEnabled: true });
    expect(opts.strength).toBe(0.5);
  });
});

describe('getGridEffectsOptions', () => {
  const formatDateTimeOriginal = (d, locale) => (d ? d.toISOString().slice(0, 10) : null);
  const getLocale = () => 'en';

  it('returns full export options including dateOriginals when photos have dateOriginal', () => {
    const form = {
      wmType: 'text', wmText: 'X', wmPos: 'bottom-right', wmOpacity: '0.8', wmFontSize: '1', bgColor: '#ffffff',
      showCaptureDate: true, captureDatePos: 'bottom-left', captureDateOpacity: '0.7', captureDateFontSize: '1',
      vignetteEnabled: true, vignetteStrength: '0.5', filterPreset: 'none', imageFit: 'cover',
    };
    const photos = [
      { dateOriginal: new Date('2025-02-22T12:00:00') },
      { dateOriginal: null },
    ];
    const opts = getGridEffectsOptions(form, photos, formatDateTimeOriginal, getLocale);
    expect(opts.watermarkType).toBe('text');
    expect(opts.showCaptureDate).toBe(true);
    expect(opts.dateOriginals).toEqual(['2025-02-22', null]);
    expect(opts.vignetteEnabled).toBe(true);
    expect(opts.fitMode).toBe('cover');
  });

  it('returns empty dateOriginals when showCaptureDate is false', () => {
    const form = { showCaptureDate: false };
    const photos = [{ dateOriginal: new Date() }];
    const opts = getGridEffectsOptions(form, photos, formatDateTimeOriginal, getLocale);
    expect(opts.showCaptureDate).toBe(false);
    expect(opts.dateOriginals).toEqual([]);
  });
});
