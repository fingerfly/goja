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

export function resolveEdgeSupport(
  env = globalThis,
  probes = { canvasProbe: defaultCanvasProbe, previewProbe: defaultPreviewProbe }
) {
  const hasPath2D = typeof env?.Path2D === 'function';
  const hasCss = typeof env?.CSS?.supports === 'function';
  const hasDoc = typeof env?.document !== 'undefined';
  if (!hasPath2D || !hasCss || !hasDoc) {
    return { status: 'advancedUnsupported', advancedSupported: false };
  }
  const canvasOk = probes.canvasProbe();
  const previewOk = probes.previewProbe(env);
  const advancedSupported = Boolean(canvasOk && previewOk);
  return {
    status: advancedSupported ? 'advancedSupported' : 'advancedUnsupported',
    advancedSupported,
    canvasOk,
    previewOk,
  };
}
