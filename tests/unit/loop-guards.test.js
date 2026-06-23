import { describe, it, expect, vi } from 'vitest';
import {
  positiveStep,
  boundedCount,
  boundedContourSamples,
  forEachByStep,
  advanceWhile,
  MIN_POSITIVE_STEP,
} from '../../js/loop-guards.js';

describe('positiveStep', () => {
  it('returns min when step is zero or invalid', () => {
    expect(positiveStep(0)).toBe(MIN_POSITIVE_STEP);
    expect(positiveStep(-5)).toBe(MIN_POSITIVE_STEP);
    expect(positiveStep(Number.NaN)).toBe(MIN_POSITIVE_STEP);
  });

  it('returns the step when it is positive', () => {
    expect(positiveStep(40)).toBe(40);
  });
});

describe('boundedCount', () => {
  it('clamps to min and max', () => {
    expect(boundedCount(-3, { min: 1, max: 10, fallback: 5 })).toBe(1);
    expect(boundedCount(999, { min: 1, max: 10, fallback: 5 })).toBe(10);
  });

  it('uses fallback for non-finite input', () => {
    expect(boundedCount('x', { min: 3, fallback: 7 })).toBe(7);
  });
});

describe('boundedContourSamples', () => {
  it('never returns below contour minimum', () => {
    expect(boundedContourSamples(0)).toBeGreaterThanOrEqual(24);
  });
});

describe('forEachByStep', () => {
  it('terminates when step would otherwise be zero', () => {
    const fn = vi.fn();
    forEachByStep({ start: 0, end: 10, step: 0, onStep: fn, maxIterations: 20 });
    expect(fn.mock.calls.length).toBeGreaterThan(0);
    expect(fn.mock.calls.length).toBeLessThanOrEqual(20);
  });

  it('invokes callback once per positive step', () => {
    const values = [];
    forEachByStep({
      start: 0,
      end: 10,
      step: 4,
      onStep: (v) => values.push(v),
    });
    expect(values).toEqual([0, 4, 8]);
  });
});

describe('advanceWhile', () => {
  it('stops at maxIterations even if test stays true', () => {
    let iter = 0;
    const count = advanceWhile({
      test: () => true,
      body: () => { iter += 1; },
      maxIterations: 5,
    });
    expect(count).toBe(5);
    expect(iter).toBe(5);
  });
});
