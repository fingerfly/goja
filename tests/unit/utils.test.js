import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, sanitizeFilename } from '../../js/utils.js';
import { EXPORT_FILENAME_DEFAULT, EXPORT_FILENAME_MAX_LENGTH } from '../../js/config.js';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls fn after ms when invoked once', () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d('a');
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('resets timer when invoked multiple times before ms', () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d('a');
    vi.advanceTimersByTime(50);
    d('b');
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');
  });
});

describe('sanitizeFilename', () => {
  it('returns default when empty', () => {
    expect(sanitizeFilename('', 'fallback')).toBe('fallback');
  });

  it('returns default when null or undefined', () => {
    expect(sanitizeFilename(null, 'fallback')).toBe('fallback');
    expect(sanitizeFilename(undefined, 'fallback')).toBe('fallback');
  });

  it('returns default when whitespace only', () => {
    expect(sanitizeFilename('   ', 'fallback')).toBe('fallback');
  });

  it('strips path separators and reserved chars', () => {
    expect(sanitizeFilename('a/b\\c?d%e*f:g|h"i<j>k', 'fallback')).toBe('abcdefghijk');
  });

  it('collapses dot-dot sequences', () => {
    expect(sanitizeFilename('..safe..name..', 'fallback')).toBe('safename');
  });

  it('truncates to EXPORT_FILENAME_MAX_LENGTH', () => {
    const long = 'a'.repeat(EXPORT_FILENAME_MAX_LENGTH + 50);
    expect(sanitizeFilename(long, 'fallback').length).toBe(EXPORT_FILENAME_MAX_LENGTH);
  });

  it('preserves safe characters', () => {
    expect(sanitizeFilename('my-grid_123', 'fallback')).toBe('my-grid_123');
  });
});
