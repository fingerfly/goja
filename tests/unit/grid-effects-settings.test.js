import { describe, it, expect } from 'vitest';
import {
  buildFormFromRefs,
  getWatermarkOptions,
  getCaptureDateOptions,
  getVignetteOptions,
  getGridEffectsOptions,
} from '../../js/grid-effects-settings.js';

describe('buildFormFromRefs', () => {
  it('extracts values from refs into form object', () => {
    const refs = {
      wmType: { value: 'text' },
      wmText: { value: 'Hi' },
      wmPos: { value: 'center' },
      wmOpacity: { value: '0.5' },
      wmFontSize: { value: '1' },
      showCaptureDate: { checked: true },
      captureDatePos: { value: 'bottom-left' },
      captureDateOpacity: { value: '0.7' },
      captureDateFontSize: { value: '1' },
      vignetteEnabled: { checked: true },
      vignetteStrength: { value: '0.5' },
      filterPreset: { value: 'grayscale' },
      imageFit: { value: 'cover' },
      bgColor: { value: '#fff' },
      edgeStyle: { value: 'wavy' },
      edgeIntensity: { value: '0.6' },
      edgeFrequency: { value: '5' },
      edgeSeed: { value: '22' },
      edgeFeatureAvailable: { value: 'true' },
    };
    const form = buildFormFromRefs(refs);
    expect(form.wmType).toBe('text');
    expect(form.wmText).toBe('Hi');
    expect(form.showCaptureDate).toBe(true);
    expect(form.filterPreset).toBe('grayscale');
    expect(form.edgeStyle).toBe('wavy');
  });

  it('includes format when includeFormat is true', () => {
    const refs = { formatSelect: { value: 'image/png' } };
    const form = buildFormFromRefs(refs, true);
    expect(form.format).toBe('image/png');
  });

  it('omits format when includeFormat is false', () => {
    const refs = { formatSelect: { value: 'image/png' } };
    const form = buildFormFromRefs(refs, false);
    expect(form.format).toBeUndefined();
  });
});

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
      edgeStyle: 'paper-torn', edgeIntensity: '0.6', edgeFrequency: '4', edgeSeed: '8', edgeFeatureAvailable: 'true',
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
    expect(opts.edgeStyle).toBe('paper-torn');
    expect(opts.edgeIntensity).toBe(0.6);
    expect(opts.edgeFrequency).toBe(4);
    expect(opts.edgeSeed).toBe(8);
    expect(opts.edgeAdvancedSupported).toBe(true);
  });

  it('returns empty dateOriginals when showCaptureDate is false', () => {
    const form = { showCaptureDate: false };
    const photos = [{ dateOriginal: new Date() }];
    const opts = getGridEffectsOptions(form, photos, formatDateTimeOriginal, getLocale);
    expect(opts.showCaptureDate).toBe(false);
    expect(opts.dateOriginals).toEqual([]);
  });

  it('forces edgeStyle to straight when advanced edge support is unavailable', () => {
    const form = {
      edgeStyle: 'paper-torn',
      edgeIntensity: '0.7',
      edgeFrequency: '5',
      edgeSeed: '10',
      edgeFeatureAvailable: 'false',
    };
    const opts = getGridEffectsOptions(form, [], formatDateTimeOriginal, getLocale);
    expect(opts.edgeAdvancedSupported).toBe(false);
    expect(opts.edgeStyle).toBe('straight');
    expect(opts.edgeIntensity).toBe(0.7);
  });

  it('normalizes edge frequency to bounded integer for number-stepper control', () => {
    const form = {
      edgeStyle: 'soft-wave',
      edgeIntensity: '0.5',
      edgeFrequency: '4.9',
      edgeFeatureAvailable: 'true',
    };
    const opts = getGridEffectsOptions(form, [], formatDateTimeOriginal, getLocale);
    expect(opts.edgeFrequency).toBe(5);
  });

  it('clamps edge frequency with new upper bound 20', () => {
    const form = {
      edgeStyle: 'soft-wave',
      edgeIntensity: '0.5',
      edgeFrequency: '88',
      edgeFeatureAvailable: 'true',
    };
    const opts = getGridEffectsOptions(form, [], formatDateTimeOriginal, getLocale);
    expect(opts.edgeFrequency).toBe(20);
  });

  it('supports migrated edgeAmplitude while keeping legacy edgeIntensity fallback', () => {
    const migrated = getGridEffectsOptions({
      edgeStyle: 'soft-wave',
      edgeAmplitude: '0.33',
      edgeIntensity: '0.8',
      edgeFeatureAvailable: 'true',
    }, [], formatDateTimeOriginal, getLocale);
    expect(migrated.edgeIntensity).toBe(0.33);

    const legacy = getGridEffectsOptions({
      edgeStyle: 'soft-wave',
      edgeIntensity: '0.41',
      edgeFeatureAvailable: 'true',
    }, [], formatDateTimeOriginal, getLocale);
    expect(legacy.edgeIntensity).toBe(0.41);
  });
});
