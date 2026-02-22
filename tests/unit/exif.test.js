import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../js/vendor/exifr.mjs', () => ({ default: { parse: vi.fn() } }));

import exifr from '../../js/vendor/exifr.mjs';
import { readDateTimeOriginal, formatDateTimeOriginal } from '../../js/exif.js';

const mockParse = vi.mocked(exifr.parse);

describe('readDateTimeOriginal', () => {
  beforeEach(() => {
    mockParse.mockReset();
  });

  it('returns Date when exifr finds DateTimeOriginal', async () => {
    const date = new Date('2025-02-22T14:30:00');
    mockParse.mockResolvedValue({ DateTimeOriginal: date });
    const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' });
    const result = await readDateTimeOriginal(file);
    expect(result).toBeInstanceOf(Date);
    expect(result?.getTime()).toBe(date.getTime());
    expect(mockParse).toHaveBeenCalledWith(file, ['DateTimeOriginal']);
  });

  it('returns null when exifr finds no DateTimeOriginal', async () => {
    mockParse.mockResolvedValue({});
    const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' });
    const result = await readDateTimeOriginal(file);
    expect(result).toBeNull();
  });

  it('returns null on parse error', async () => {
    mockParse.mockRejectedValue(new Error('Parse failed'));
    const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' });
    const result = await readDateTimeOriginal(file);
    expect(result).toBeNull();
  });

  it('returns null when DateTimeOriginal is undefined', async () => {
    mockParse.mockResolvedValue({ Make: 'Canon' });
    const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' });
    const result = await readDateTimeOriginal(file);
    expect(result).toBeNull();
  });
});

describe('formatDateTimeOriginal', () => {
  it('formats Date to locale string', () => {
    const date = new Date('2025-02-22T14:30:00');
    const result = formatDateTimeOriginal(date, 'en');
    expect(result).toMatch(/\d/);
    expect(typeof result).toBe('string');
  });

  it('handles ISO string input', () => {
    const result = formatDateTimeOriginal('2025-02-22T14:30:00', 'en');
    expect(result).toMatch(/\d/);
    expect(typeof result).toBe('string');
  });

  it('returns empty string for null/undefined', () => {
    expect(formatDateTimeOriginal(null, 'en')).toBe('');
    expect(formatDateTimeOriginal(undefined, 'en')).toBe('');
  });

  it('uses locale for formatting', () => {
    const date = new Date('2025-02-22T14:30:00');
    const en = formatDateTimeOriginal(date, 'en');
    const de = formatDateTimeOriginal(date, 'de');
    expect(typeof en).toBe('string');
    expect(typeof de).toBe('string');
  });

  it('returns empty string for invalid date string', () => {
    expect(formatDateTimeOriginal('not-a-date', 'en')).toBe('');
  });

  it('returns empty string for invalid Date (NaN getTime)', () => {
    expect(formatDateTimeOriginal(new Date('invalid'), 'en')).toBe('');
  });
});
