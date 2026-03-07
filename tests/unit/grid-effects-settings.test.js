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
      globalFrameShape: { value: 'ellipse' },
      globalFrameStrokeEnabled: { checked: true },
      globalFrameStrokeWidth: { value: '6' },
      globalFrameStrokeColor: { value: '#123456' },
      globalFrameStrokeOpacity: { value: '0.65' },
      outsideBackgroundColor: { value: '#111111' },
      cellShapeTemplate: { value: 'hexagon' },
      cellShapeOrientation: { value: 'vertical' },
    };
    const form = buildFormFromRefs(refs);
    expect(form.wmType).toBe('text');
    expect(form.wmText).toBe('Hi');
    expect(form.showCaptureDate).toBe(true);
    expect(form.filterPreset).toBe('grayscale');
    expect(form.edgeStyle).toBe('wavy');
    expect(form.globalFrameShape).toBe('ellipse');
    expect(form.globalFrameStrokeEnabled).toBe(true);
    expect(form.globalFrameStrokeWidth).toBe('6');
    expect(form.globalFrameStrokeColor).toBe('#123456');
    expect(form.globalFrameStrokeOpacity).toBe('0.65');
    expect(form.outsideBackgroundColor).toBe('#111111');
    expect(form.cellShapeTemplate).toBe('hexagon');
    expect(form.cellShapeOrientation).toBe('vertical');
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
      globalFrameShape: 'ellipse',
      globalFrameStrokeEnabled: true,
      globalFrameStrokeWidth: '3',
      globalFrameStrokeColor: '#eeeeee',
      globalFrameStrokeOpacity: '0.7',
      outsideBackgroundColor: '#000000',
      cellShapeTemplate: 'hexagon',
      cellShapeOrientation: 'horizontal',
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
    expect(opts.globalFrameShape).toBe('ellipse');
    expect(opts.globalFrameStrokeEnabled).toBe(true);
    expect(opts.globalFrameStrokeWidth).toBe(3);
    expect(opts.globalFrameStrokeColor).toBe('#eeeeee');
    expect(opts.globalFrameStrokeOpacity).toBe(0.7);
    expect(opts.outsideBackgroundColor).toBe('#000000');
    expect(opts.cellShapeTemplate).toBe('regular-octagon');
    expect(opts.cellShapeOrientation).toBe('horizontal');
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
      globalFrameShape: 'ellipse',
      cellShapeTemplate: 'hexagon',
    };
    const opts = getGridEffectsOptions(form, [], formatDateTimeOriginal, getLocale);
    expect(opts.edgeAdvancedSupported).toBe(false);
    expect(opts.edgeStyle).toBe('straight');
    expect(opts.edgeIntensity).toBe(0.7);
    expect(opts.globalFrameShape).toBe('rect');
    expect(opts.cellShapeTemplate).toBe('rect');
  });

  it('normalizes edge frequency to bounded integer for number-stepper control', () => {
    const form = {
      edgeStyle: 'silk-wave',
      edgeIntensity: '0.5',
      edgeFrequency: '4.9',
      edgeFeatureAvailable: 'true',
    };
    const opts = getGridEffectsOptions(form, [], formatDateTimeOriginal, getLocale);
    expect(opts.edgeFrequency).toBe(5);
  });

  it('clamps edge frequency with new upper bound 20', () => {
    const form = {
      edgeStyle: 'silk-wave',
      edgeIntensity: '0.5',
      edgeFrequency: '88',
      edgeFeatureAvailable: 'true',
    };
    const opts = getGridEffectsOptions(form, [], formatDateTimeOriginal, getLocale);
    expect(opts.edgeFrequency).toBe(20);
  });

  it('supports migrated edgeAmplitude while keeping legacy edgeIntensity fallback', () => {
    const migrated = getGridEffectsOptions({
      edgeStyle: 'silk-wave',
      edgeAmplitude: '0.33',
      edgeIntensity: '0.8',
      edgeFeatureAvailable: 'true',
    }, [], formatDateTimeOriginal, getLocale);
    expect(migrated.edgeIntensity).toBe(0.33);

    const legacy = getGridEffectsOptions({
      edgeStyle: 'silk-wave',
      edgeIntensity: '0.41',
      edgeFeatureAvailable: 'true',
    }, [], formatDateTimeOriginal, getLocale);
    expect(legacy.edgeIntensity).toBe(0.41);
  });

  it('throws fail-fast error for removed legacy soft-wave style', () => {
    expect(() => getGridEffectsOptions({
      edgeStyle: 'soft-wave',
      edgeFeatureAvailable: 'true',
    }, [], formatDateTimeOriginal, getLocale)).toThrow(/soft-wave/);
  });

  it('migrates legacy polygon shape values to regular-octagon', () => {
    const opts = getGridEffectsOptions({
      edgeStyle: 'straight',
      edgeFeatureAvailable: 'true',
      globalFrameShape: 'regular-hexagon',
      cellShapeTemplate: 'regular-nonagon',
    }, [], formatDateTimeOriginal, getLocale);
    expect(opts.globalFrameShape).toBe('regular-octagon');
    expect(opts.cellShapeTemplate).toBe('regular-octagon');
  });

  it('migrates removed regular-triangle values to rect', () => {
    const opts = getGridEffectsOptions({
      edgeStyle: 'straight',
      edgeFeatureAvailable: 'true',
      globalFrameShape: 'regular-triangle',
      cellShapeTemplate: 'regular-triangle',
    }, [], formatDateTimeOriginal, getLocale);
    expect(opts.globalFrameShape).toBe('rect');
    expect(opts.cellShapeTemplate).toBe('rect');
  });

  it('accepts heart as frame and cell shape template', () => {
    const opts = getGridEffectsOptions({
      edgeStyle: 'straight',
      edgeFeatureAvailable: 'true',
      globalFrameShape: 'heart',
      cellShapeTemplate: 'heart',
    }, [], formatDateTimeOriginal, getLocale);
    expect(opts.globalFrameShape).toBe('heart');
    expect(opts.cellShapeTemplate).toBe('heart');
  });

  it('accepts wave11 frame+cell shared shape catalog', () => {
    const shapes = ['regular-decagon', 'regular-dodecagon', 'regular-hexadecagon', 'regular-36-gon', 'regular-64-gon', 'rounded-rect', 'superellipse'];
    for (const shape of shapes) {
      const opts = getGridEffectsOptions({
        edgeStyle: 'straight',
        edgeFeatureAvailable: 'true',
        globalFrameShape: shape,
        cellShapeTemplate: shape,
      }, [], formatDateTimeOriginal, getLocale);
      expect(opts.globalFrameShape).toBe(shape);
      expect(opts.cellShapeTemplate).toBe(shape);
    }
  });

  it('keeps capsule and diamond as frame-only shapes', () => {
    const capsule = getGridEffectsOptions({
      edgeStyle: 'straight',
      edgeFeatureAvailable: 'true',
      globalFrameShape: 'capsule',
      cellShapeTemplate: 'capsule',
    }, [], formatDateTimeOriginal, getLocale);
    expect(capsule.globalFrameShape).toBe('capsule');
    expect(capsule.cellShapeTemplate).toBe('rect');
    const diamond = getGridEffectsOptions({
      edgeStyle: 'straight',
      edgeFeatureAvailable: 'true',
      globalFrameShape: 'diamond',
      cellShapeTemplate: 'diamond',
    }, [], formatDateTimeOriginal, getLocale);
    expect(diamond.globalFrameShape).toBe('diamond');
    expect(diamond.cellShapeTemplate).toBe('rect');
  });

  it('normalizes global superellipse exponent with bounds', () => {
    const low = getGridEffectsOptions({
      edgeStyle: 'straight',
      edgeFeatureAvailable: 'true',
      superellipseExponent: 0.5,
    }, [], formatDateTimeOriginal, getLocale);
    const high = getGridEffectsOptions({
      edgeStyle: 'straight',
      edgeFeatureAvailable: 'true',
      superellipseExponent: 999,
    }, [], formatDateTimeOriginal, getLocale);
    const def = getGridEffectsOptions({
      edgeStyle: 'straight',
      edgeFeatureAvailable: 'true',
    }, [], formatDateTimeOriginal, getLocale);
    expect(low.superellipseExponent).toBe(2.2);
    expect(high.superellipseExponent).toBe(8);
    expect(def.superellipseExponent).toBe(4);
  });
});
