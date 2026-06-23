/**
 * Purpose: Defensive guards for loops with dynamic step sizes or counts.
 * Description:
 * - Ensures positive step increments for ranged for-loops.
 * - Caps iteration counts and while-loops to prevent runaway work.
 * - Shared by watermark tiling, contour sampling, and edge paths.
 */

export const MIN_POSITIVE_STEP = 1;
export const DEFAULT_MAX_LOOP_ITERATIONS = 1_000_000;
export const DEFAULT_MAX_CONTOUR_SAMPLES = 2000;
export const MIN_CONTOUR_SAMPLES = 24;
export const MIN_HEART_SAMPLES = 64;

/**
 * Return a finite step size of at least `min` for ranged loops.
 * @param {unknown} step
 * @param {number} [min=MIN_POSITIVE_STEP]
 * @returns {number}
 */
export function positiveStep(step, min = MIN_POSITIVE_STEP) {
  const n = Number(step);
  if (!Number.isFinite(n) || n < min) return min;
  return n;
}

/**
 * Clamp a loop count to a safe integer range.
 * @param {unknown} count
 * @param {{ min?: number, max?: number, fallback?: number }} [bounds]
 * @returns {number}
 */
export function boundedCount(count, bounds = {}) {
  const {
    min = 0,
    max = DEFAULT_MAX_LOOP_ITERATIONS,
    fallback = min,
  } = bounds;
  const n = Math.round(Number(count));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/**
 * Clamp contour sample counts used in shape loops.
 * @param {unknown} samples
 * @param {number} [fallback=120]
 * @returns {number}
 */
export function boundedContourSamples(samples, fallback = 120) {
  return boundedCount(samples, {
    min: MIN_CONTOUR_SAMPLES,
    max: DEFAULT_MAX_CONTOUR_SAMPLES,
    fallback,
  });
}

/**
 * Iterate from start toward end using a positive step.
 * @param {object} opts
 * @param {number} opts.start
 * @param {number} opts.end
 * @param {number} opts.step
 * @param {(value: number, index: number) => void} opts.onStep
 * @param {number} [opts.maxIterations]
 */
export function forEachByStep({
  start,
  end,
  step,
  onStep,
  maxIterations = DEFAULT_MAX_LOOP_ITERATIONS,
}) {
  const delta = positiveStep(step);
  let value = start;
  let iter = 0;
  while (value < end && iter < maxIterations) {
    onStep(value, iter);
    value += delta;
    iter += 1;
  }
}

/**
 * While-loop helper with a hard iteration cap.
 * @param {object} opts
 * @param {() => boolean} opts.test
 * @param {() => void} opts.body
 * @param {number} [opts.maxIterations]
 * @returns {number} iterations executed
 */
export function advanceWhile({
  test,
  body,
  maxIterations = DEFAULT_MAX_LOOP_ITERATIONS,
}) {
  let iter = 0;
  while (test() && iter < maxIterations) {
    body();
    iter += 1;
  }
  return iter;
}
