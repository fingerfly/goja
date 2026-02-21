const ROTATION_DEG = -30;
const ROTATION_RAD = (ROTATION_DEG * Math.PI) / 180;
const CENTER_ALPHA = 0.3;
const CORNER_ALPHA = 0.5;
const TILED_ALPHA = 0.15;
const CENTER_FONT_RATIO = 0.08;
const CORNER_FONT_RATIO = 0.025;
const TILED_FONT_RATIO = 0.03;
const TILE_SPACING_RATIO = 0.2;
const CORNER_MARGIN_RATIO = 0.02;

export function resolveWatermarkText(type, userText) {
  if (type === 'none') return '';
  if (type === 'text') return (userText || '').trim();
  if (type === 'datetime') {
    return new Date().toLocaleString();
  }
  if (type === 'copyright') {
    const name = (userText || '').trim();
    return name ? `© ${name}` : '©';
  }
  return '';
}

export function drawWatermark(ctx, canvasWidth, canvasHeight, options) {
  const { type, text, position = 'bottom-right' } = options;
  const resolved = resolveWatermarkText(type, text);
  if (!resolved) return;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.textBaseline = 'middle';

  if (position === 'center') drawCenter(ctx, canvasWidth, canvasHeight, resolved);
  else if (position === 'tiled') drawTiled(ctx, canvasWidth, canvasHeight, resolved);
  else drawBottomRight(ctx, canvasWidth, canvasHeight, resolved);

  ctx.restore();
}

function drawCenter(ctx, w, h, text) {
  const fontSize = Math.round(w * CENTER_FONT_RATIO);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.globalAlpha = CENTER_ALPHA;
  ctx.textAlign = 'center';
  ctx.translate(w / 2, h / 2);
  ctx.rotate(ROTATION_RAD);
  ctx.fillText(text, 0, 0);
}

function drawBottomRight(ctx, w, h, text) {
  const fontSize = Math.round(w * CORNER_FONT_RATIO);
  const margin = Math.round(w * CORNER_MARGIN_RATIO);
  ctx.font = `${fontSize}px sans-serif`;
  ctx.globalAlpha = CORNER_ALPHA;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(text, w - margin, h - margin);
}

function drawTiled(ctx, w, h, text) {
  const fontSize = Math.round(w * TILED_FONT_RATIO);
  const spacing = Math.round(w * TILE_SPACING_RATIO);
  ctx.font = `${fontSize}px sans-serif`;
  ctx.globalAlpha = TILED_ALPHA;
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
