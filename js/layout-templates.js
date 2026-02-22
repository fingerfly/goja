let templatesCache = null;

export async function ensureTemplatesLoaded() {
  if (templatesCache) return templatesCache;
  const [small, large] = await Promise.all([
    import('./templates-small.js'),
    import('./templates-large.js'),
  ]);
  templatesCache = [...small.TEMPLATES_SMALL, ...large.TEMPLATES_LARGE];
  return templatesCache;
}

export function getTemplatesForCount(count) {
  if (!templatesCache) throw new Error('Templates not loaded');
  return templatesCache.filter((t) => t.photoCount === count);
}
