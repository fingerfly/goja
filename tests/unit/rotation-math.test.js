import { describe, it, expect } from 'vitest';
import { computeAngleDeg, fitScaleFactor, normalizeAngle } from '../../js/rotation-math.js';

describe('computeAngleDeg', () => {
  it('returns cardinal direction angles', () => {
    expect(computeAngleDeg(0, 0, 0, -1)).toBeCloseTo(0, 8);
    expect(computeAngleDeg(0, 0, 1, 0)).toBeCloseTo(90, 8);
    expect(computeAngleDeg(0, 0, 0, 1)).toBeCloseTo(180, 8);
    expect(computeAngleDeg(0, 0, -1, 0)).toBeCloseTo(270, 8);
  });

  it('returns 0 when point equals center', () => {
    expect(computeAngleDeg(10, 20, 10, 20)).toBe(0);
  });
});

describe('fitScaleFactor', () => {
  it('returns 1 at 0 degrees for any shape', () => {
    expect(fitScaleFactor(0, 100, 100)).toBeCloseTo(1, 8);
    expect(fitScaleFactor(0, 200, 100)).toBeCloseTo(1, 8);
    expect(fitScaleFactor(360, 200, 100)).toBeCloseTo(1, 8);
  });

  it('returns expected values for known cases', () => {
    expect(fitScaleFactor(45, 100, 100)).toBeCloseTo(Math.SQRT1_2, 6);
    expect(fitScaleFactor(90, 100, 100)).toBeCloseTo(1, 8);
    expect(fitScaleFactor(90, 200, 100)).toBeCloseTo(0.5, 8);
    expect(fitScaleFactor(45, 200, 100)).toBeCloseTo(0.47140452079, 6);
  });

  it('handles negative angles and never exceeds 1', () => {
    expect(fitScaleFactor(-45, 100, 100)).toBeCloseTo(Math.SQRT1_2, 6);
    expect(fitScaleFactor(-90, 200, 100)).toBeCloseTo(0.5, 8);
    expect(fitScaleFactor(270, 200, 100)).toBeLessThanOrEqual(1);
  });
});

describe('normalizeAngle', () => {
  it('normalizes into [0, 360)', () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(720)).toBe(0);
    expect(normalizeAngle(-90)).toBe(270);
    expect(normalizeAngle(-450)).toBe(270);
  });
});
