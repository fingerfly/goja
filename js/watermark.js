const ROTATION_DEG = -30;
const ROTATION_RAD = (ROTATION_DEG * Math.PI) / 180;
const CENTER_FONT_RATIO = 0.08;
const CORNER_FONT_RATIO = 0.025;
const TILED_FONT_RATIO = 0.03;
const TILE_SPACING_RATIO = 0.2;
const CORNER_MARGIN_RATIO = 0.02;

/** Returns 0–1 luminance (dark ≈ 0, light ≈ 1) from hex/rgb color */
function luminanceFromColor(cssColor) {
  if (!cssColor) return 1;
  let r = 1, g = 1, b = 1;
  const hex = cssColor.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    const s = hex[1];
    if (s.length === 3) {
      r = parseInt(s[0] + s[0], 16) / 255;
      g = parseInt(s[1] + s[1], 16) / 255;
      b = parseInt(s[2] + s[2], 16) / 255;
    } else {
      r = parseInt(s.slice(0, 2), 16) / 255;
      g = parseInt(s.slice(2, 4), 16) / 255;
      b = parseInt(s.slice(4, 6), 16) / 255;
    }
  }
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function resolveWatermarkText(type, userText, locale = 'en') {
  if (type === 'none') return '';
  if (type === 'text') return (userText || '').trim();
  if (type === 'datetime') {
    return new Date().toLocaleString(locale);
  }
  if (type === 'copyright') {
    const name = (userText || '').trim();
    return name ? `© ${name}` : '©';
  }
  return '';
}

export function drawWatermark(ctx, canvasWidth, canvasHeight, options) {
  const {
    type, text, position = 'bottom-right', locale = 'en',
    opacity = 0.8, fontScale = 1, backgroundColor = '#ffffff',
  } = options;
  const resolved = resolveWatermarkText(type, text, locale);
  if (!resolved) return;

  ctx.save();
  const lum = luminanceFromColor(backgroundColor);
  const isDark = lum < 0.5;
  const alpha = Math.min(0.9, Math.max(0.3, opacity));
  ctx.fillStyle = isDark ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)';
  ctx.textBaseline = 'middle';

  const opts = { fontScale, alpha };
  if (position === 'center') drawCenter(ctx, canvasWidth, canvasHeight, resolved, opts);
  else if (position === 'tiled') drawTiled(ctx, canvasWidth, canvasHeight, resolved, opts);
  else if (position === 'top-left') drawTopLeft(ctx, canvasWidth, canvasHeight, resolved, opts);
  else if (position === 'top-right') drawTopRight(ctx, canvasWidth, canvasHeight, resolved, opts);
  else if (position === 'bottom-left') drawBottomLeft(ctx, canvasWidth, canvasHeight, resolved, opts);
  else drawBottomRight(ctx, canvasWidth, canvasHeight, resolved, opts);

  ctx.restore();
}

function drawCenter(ctx, w, h, text, opts = {}) {
  const scale = opts.fontScale ?? 1;
  const alpha = (opts.alpha ?? 0.8) * 0.38;
  const fontSize = Math.round(w * CENTER_FONT_RATIO * scale);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.translate(w / 2, h / 2);
  ctx.rotate(ROTATION_RAD);
  ctx.fillText(text, 0, 0);
}

function drawCorner(ctx, w, h, text, opts, align, x, y, baseline) {
  const scale = opts.fontScale ?? 1;
  const alpha = (opts.alpha ?? 0.8) * 0.625;
  const fontSize = Math.round(w * CORNER_FONT_RATIO * scale);
  const margin = Math.round(w * CORNER_MARGIN_RATIO);
  ctx.font = `${fontSize}px sans-serif`;
  ctx.globalAlpha = alpha;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
}

function drawBottomRight(ctx, w, h, text, opts = {}) {
  const margin = Math.round(w * CORNER_MARGIN_RATIO);
  drawCorner(ctx, w, h, text, opts, 'right', w - margin, h - margin, 'bottom');
}

function drawBottomLeft(ctx, w, h, text, opts = {}) {
  const margin = Math.round(w * CORNER_MARGIN_RATIO);
  drawCorner(ctx, w, h, text, opts, 'left', margin, h - margin, 'bottom');
}

function drawTopRight(ctx, w, h, text, opts = {}) {
  const margin = Math.round(w * CORNER_MARGIN_RATIO);
  drawCorner(ctx, w, h, text, opts, 'right', w - margin, margin, 'top');
}

function drawTopLeft(ctx, w, h, text, opts = {}) {
  const margin = Math.round(w * CORNER_MARGIN_RATIO);
  drawCorner(ctx, w, h, text, opts, 'left', margin, margin, 'top');
}

function drawTiled(ctx, w, h, text, opts = {}) {
  const scale = opts.fontScale ?? 1;
  const alpha = (opts.alpha ?? 0.8) * 0.1875;
  const fontSize = Math.round(w * TILED_FONT_RATIO * scale);
  ctx.font = `${fontSize}px sans-serif`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const minSpacing = Math.max(textWidth, fontSize * 1.2) + fontSize * 0.5;
  const spacing = Math.max(minSpacing, Math.round(w * TILE_SPACING_RATIO));
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.translate(w / 2, h / 2);
  ctx.rotate(ROTATION_RAD);
  const diag = Math.sqrt(w * w + h * h);
  for (let y = -diag; y < diag; y += spacing) {
    for (let x = -diag; x < diag; x += spacing) {
      ctx.fillText(text, x, y);
    }
  }
}
