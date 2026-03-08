/**
 * Purpose: Provide deterministic pseudo-random numbers from string seeds.
 * Description:
 * - Uses a stable string hash and compact PRNG step function.
 * - Keeps edge-style noise reproducible across preview/export paths.
 */
function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Build a deterministic random-number generator.
 * @param {string} seedText
 * @returns {() => number} Generator returning values in [0, 1).
 */
export function makeSeededRng(seedText) {
  let t = hashString(String(seedText)) || 1;
  return () => {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
