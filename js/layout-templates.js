/**
 * Purpose: Load and expose layout templates by photo count.
 * Description:
 * - Lazily imports small and large template sets.
 * - Caches merged templates for repeated layout computations.
 */
let templatesCache = null;

/**
 * Ensure template collections are loaded into local cache.
 * @returns {Promise<object[]>}
 */
export async function ensureTemplatesLoaded() {
  if (templatesCache) return templatesCache;
  const [small, large] = await Promise.all([
    import('./templates-small.js'),
    import('./templates-large.js'),
  ]);
  templatesCache = [...small.TEMPLATES_SMALL, ...large.TEMPLATES_LARGE];
  return templatesCache;
}

/**
 * Return templates matching a specific photo count.
 * @param {number} count
 * @returns {object[]}
 * @throws {Error} When templates are requested before initialization.
 */
export function getTemplatesForCount(count) {
  if (!templatesCache) throw new Error('Templates not loaded');
  return templatesCache.filter((t) => t.photoCount === count);
}
