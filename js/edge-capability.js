/**
 * Purpose: Detect runtime capability for advanced edge rendering paths.
 * Description:
 * - Probes Path2D, CSS clip-path support, and canvas clip readiness.
 * - Returns a normalized feature-support object for UI gating.
 */
function defaultCanvasProbe() {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext('2d');
  if (!ctx || typeof ctx.clip !== 'function') return false;
  return true;
}

function defaultPreviewProbe(env) {
  if (!env?.CSS?.supports) return false;
  return env.CSS.supports('clip-path', "path('M0 0 L1 0 L1 1 L0 1 Z')");
}

function defaultPreviewPolygonProbe(env) {
  if (!env?.CSS?.supports) return false;
  return env.CSS.supports('clip-path', 'polygon(50% 0%, 100% 100%, 0% 100%)');
}

/**
 * Resolve advanced edge-feature support in current environment.
 * @param {any} [env]
 * @param {object} [probes]
 * @returns {{
 *   status: string,
 *   advancedSupported: boolean,
 *   canvasOk?: boolean,
 *   previewPathOk?: boolean,
 *   previewPolygonOk?: boolean,
 *   previewOk?: boolean,
 *   previewClipMode?: string
 * }}
 */
export function resolveEdgeSupport(
  env = globalThis,
  probes = {
    canvasProbe: defaultCanvasProbe,
    previewProbe: defaultPreviewProbe,
    previewPolygonProbe: defaultPreviewPolygonProbe,
  }
) {
  const hasPath2D = typeof env?.Path2D === 'function';
  const hasCss = typeof env?.CSS?.supports === 'function';
  const hasDoc = typeof env?.document !== 'undefined';
  if (!hasPath2D || !hasCss || !hasDoc) {
    return { status: 'advancedUnsupported', advancedSupported: false };
  }
  const canvasOk = probes.canvasProbe();
  const previewPathOk = probes.previewProbe(env);
  const previewPolygonProbe = probes.previewPolygonProbe ?? defaultPreviewPolygonProbe;
  const previewPolygonOk = previewPolygonProbe(env);
  const previewOk = Boolean(previewPathOk || previewPolygonOk);
  const advancedSupported = Boolean(canvasOk && previewOk);
  return {
    status: advancedSupported ? 'advancedSupported' : 'advancedUnsupported',
    advancedSupported,
    canvasOk,
    previewPathOk,
    previewPolygonOk,
    previewOk,
    previewClipMode: previewPathOk ? 'path' : (previewPolygonOk ? 'polygon' : 'none'),
  };
}
