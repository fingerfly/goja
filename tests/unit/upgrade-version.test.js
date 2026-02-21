import { describe, it, expect } from 'vitest';
import {
  parseVersionFromCode,
  computeBumpedVersion,
  applyVersionToCode,
  normalizeBumpArg,
  BUMP_TYPES,
} from '../../scripts/upgrade-version-lib.js';

describe('parseVersionFromCode', () => {
  it('parses major, minor, patch, build from version.js format', () => {
    const code = 'const version = { major: 0, minor: 1, patch: 0, build: 1 };';
    expect(parseVersionFromCode(code)).toEqual({ major: 0, minor: 1, patch: 0, build: 1 });
  });

  it('returns build 1 when build is missing', () => {
    const code = 'major: 1, minor: 0, patch: 0';
    expect(parseVersionFromCode(code)).toEqual({ major: 1, minor: 0, patch: 0, build: 1 });
  });

  it('returns null when any required field is missing', () => {
    expect(parseVersionFromCode('minor: 1, patch: 0')).toBeNull();
    expect(parseVersionFromCode('major: 1, patch: 0')).toBeNull();
    expect(parseVersionFromCode('major: 1, minor: 0')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseVersionFromCode('')).toBeNull();
  });
});

describe('computeBumpedVersion', () => {
  it('build bump increments build only', () => {
    expect(computeBumpedVersion({ major: 0, minor: 1, patch: 0, build: 1 }, 'build'))
      .toEqual({ major: 0, minor: 1, patch: 0, build: 2 });
  });

  it('patch bump increments patch and resets build', () => {
    expect(computeBumpedVersion({ major: 0, minor: 1, patch: 0, build: 3 }, 'patch'))
      .toEqual({ major: 0, minor: 1, patch: 1, build: 1 });
  });

  it('minor bump increments minor, resets patch and build', () => {
    expect(computeBumpedVersion({ major: 0, minor: 1, patch: 2, build: 3 }, 'minor'))
      .toEqual({ major: 0, minor: 2, patch: 0, build: 1 });
  });

  it('major bump increments major, resets rest', () => {
    expect(computeBumpedVersion({ major: 0, minor: 1, patch: 2, build: 3 }, 'major'))
      .toEqual({ major: 1, minor: 0, patch: 0, build: 1 });
  });
});

describe('applyVersionToCode', () => {
  it('replaces all version fields in code', () => {
    const code = 'const version = { major: 0, minor: 1, patch: 0, build: 1 };';
    const result = applyVersionToCode(code, { major: 0, minor: 1, patch: 1, build: 1 });
    expect(result).toContain('patch: 1');
    expect(result).toContain('major: 0');
    expect(result).toContain('minor: 1');
    expect(result).toContain('build: 1');
  });

  it('preserves surrounding code', () => {
    const code = 'const version = { major: 0, minor: 1, patch: 0, build: 1 };\nexport const VERSION = "...";';
    const result = applyVersionToCode(code, { major: 1, minor: 0, patch: 0, build: 1 });
    expect(result).toContain('export const VERSION');
  });
});

describe('normalizeBumpArg', () => {
  it('throws when arg is undefined', () => {
    expect(() => normalizeBumpArg(undefined)).toThrow(/required/i);
  });

  it('throws when arg is empty', () => {
    expect(() => normalizeBumpArg('')).toThrow(/required/i);
  });

  it('accepts valid bump types', () => {
    expect(normalizeBumpArg('build')).toBe('build');
    expect(normalizeBumpArg('patch')).toBe('patch');
    expect(normalizeBumpArg('minor')).toBe('minor');
    expect(normalizeBumpArg('major')).toBe('major');
  });

  it('is case-insensitive and strips dashes', () => {
    expect(normalizeBumpArg('--PATCH')).toBe('patch');
    expect(normalizeBumpArg('-Build')).toBe('build');
  });

  it('throws for invalid type', () => {
    expect(() => normalizeBumpArg('invalid')).toThrow(/Invalid bump type/);
  });
});
