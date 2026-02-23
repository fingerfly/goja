import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clampFrameValue, isFrameValueValid, setFrameInputInvalidState, createFrameInputHandler } from '../../js/frame-validation.js';

describe('clampFrameValue', () => {
  it('returns 320 for NaN', () => {
    expect(clampFrameValue('')).toBe(320);
    expect(clampFrameValue('abc')).toBe(320);
    expect(clampFrameValue(NaN)).toBe(320);
  });

  it('clamps values below 320 to 320', () => {
    expect(clampFrameValue(0)).toBe(320);
    expect(clampFrameValue(100)).toBe(320);
    expect(clampFrameValue('100')).toBe(320);
  });

  it('clamps values above 4096 to 4096', () => {
    expect(clampFrameValue(5000)).toBe(4096);
    expect(clampFrameValue(10000)).toBe(4096);
    expect(clampFrameValue('5000')).toBe(4096);
  });

  it('returns valid values unchanged', () => {
    expect(clampFrameValue(320)).toBe(320);
    expect(clampFrameValue(1080)).toBe(1080);
    expect(clampFrameValue(4096)).toBe(4096);
  });
});

describe('isFrameValueValid', () => {
  it('returns false for NaN', () => {
    expect(isFrameValueValid('')).toBe(false);
    expect(isFrameValueValid('abc')).toBe(false);
  });

  it('returns false for out-of-range values', () => {
    expect(isFrameValueValid(100)).toBe(false);
    expect(isFrameValueValid(5000)).toBe(false);
    expect(isFrameValueValid(319)).toBe(false);
    expect(isFrameValueValid(4097)).toBe(false);
  });

  it('returns true for valid values', () => {
    expect(isFrameValueValid(320)).toBe(true);
    expect(isFrameValueValid(1080)).toBe(true);
    expect(isFrameValueValid(4096)).toBe(true);
    expect(isFrameValueValid('1080')).toBe(true);
  });
});

describe('setFrameInputInvalidState', () => {
  let el;

  beforeEach(() => {
    el = document.createElement('input');
    document.body.appendChild(el);
  });

  it('sets aria-invalid and invalid class when invalid is true', () => {
    setFrameInputInvalidState(el, true);
    expect(el.getAttribute('aria-invalid')).toBe('true');
    expect(el.classList.contains('invalid')).toBe(true);
  });

  it('clears aria-invalid and invalid class when invalid is false', () => {
    el.setAttribute('aria-invalid', 'true');
    el.classList.add('invalid');
    setFrameInputInvalidState(el, false);
    expect(el.getAttribute('aria-invalid')).toBe('false');
    expect(el.classList.contains('invalid')).toBe(false);
  });

  it('does nothing when el is null', () => {
    expect(() => setFrameInputInvalidState(null, true)).not.toThrow();
  });
});

describe('createFrameInputHandler', () => {
  let el;
  let showToast;

  beforeEach(() => {
    el = document.createElement('input');
    document.body.appendChild(el);
    showToast = vi.fn();
  });

  it('returns validateFrameInput that clamps invalid value and shows toast', () => {
    const handler = createFrameInputHandler({
      clampFrameValue,
      isFrameValueValid,
      setFrameInputInvalidState,
      showToast,
      t: (k) => k,
      debounce: (fn) => fn,
    });
    el.value = '100';
    const result = handler.validateFrameInput(el);
    expect(result).toBe(320);
    expect(el.value).toBe('320');
    expect(showToast).toHaveBeenCalledWith('frameDimensionClamped', 'error');
  });

  it('validateFrameInput returns parsed value when valid', () => {
    const handler = createFrameInputHandler({
      clampFrameValue,
      isFrameValueValid,
      setFrameInputInvalidState,
      showToast,
      t: (k) => k,
      debounce: (fn) => fn,
    });
    el.value = '1080';
    expect(handler.validateFrameInput(el)).toBe(1080);
    expect(showToast).not.toHaveBeenCalled();
  });

  it('returns clearToastSessionFor', () => {
    const handler = createFrameInputHandler({
      clampFrameValue,
      isFrameValueValid,
      setFrameInputInvalidState,
      showToast,
      t: (k) => k,
      debounce: (fn) => fn,
    });
    expect(typeof handler.clearToastSessionFor).toBe('function');
    expect(() => handler.clearToastSessionFor(el)).not.toThrow();
  });
});
