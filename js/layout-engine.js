import { getTemplatesForCount } from './layout-templates.js';

const SQUARE_THRESHOLD = 1.1;
const DEFAULT_OUTPUT_WIDTH = 1080;
const DEFAULT_GAP = 4;
const MATCH_SCORE = 3;
const ANY_SCORE = 1;
const MISMATCH_SCORE = 0;

export function classifyPhoto(width, height) {
  const ratio = width / height;
  if (ratio >= SQUARE_THRESHOLD) return 'landscape';
  if (ratio <= 1 / SQUARE_THRESHOLD) return 'portrait';
  return 'square';
}

export function scoreTemplate(template, orientations) {
  let score = 0;
  for (let i = 0; i < template.slots.length; i++) {
    const pref = template.slots[i].prefer;
    const orient = orientations[i] || 'square';
    if (pref === 'any') score += ANY_SCORE;
    else if (pref === orient) score += MATCH_SCORE;
    else score += MISMATCH_SCORE;
  }
  return score;
}

export function assignPhotosToSlots(photos, template) {
  const orientations = photos.map(p => classifyPhoto(p.width, p.height));
  const used = new Set();
  const result = new Array(template.slots.length).fill(-1);

  for (let s = 0; s < template.slots.length; s++) {
    const pref = template.slots[s].prefer;
    if (pref === 'any') continue;
    const bestIdx = orientations.findIndex((o, i) => o === pref && !used.has(i));
    if (bestIdx !== -1) { result[s] = bestIdx; used.add(bestIdx); }
  }

  const remaining = photos.map((_, i) => i).filter(i => !used.has(i));
  let ri = 0;
  for (let s = 0; s < result.length; s++) {
    if (result[s] === -1) { result[s] = remaining[ri++]; }
  }
  return result;
}

function computePixelCells(template, indices, photos, outputWidth, gap) {
  const { baseRows, baseCols } = template;
  const colUnit = (outputWidth - gap * (baseCols - 1)) / baseCols;
  const rowUnit = colUnit;
  const cells = [];

  for (let i = 0; i < template.slots.length; i++) {
    const slot = template.slots[i];
    const colSpan = slot.colEnd - slot.colStart;
    const rowSpan = slot.rowEnd - slot.rowStart;
    const x = (slot.colStart - 1) * (colUnit + gap);
    const y = (slot.rowStart - 1) * (rowUnit + gap);
    const w = colSpan * colUnit + (colSpan - 1) * gap;
    const h = rowSpan * rowUnit + (rowSpan - 1) * gap;
    cells.push({
      rowStart: slot.rowStart, rowEnd: slot.rowEnd,
      colStart: slot.colStart, colEnd: slot.colEnd,
      x: Math.round(x), y: Math.round(y),
      width: Math.round(w), height: Math.round(h),
    });
  }
  return cells;
}

export function computeGridLayout(photos, options = {}) {
  if (!photos || photos.length === 0) throw new Error('At least one photo is required');

  const outputWidth = options.outputWidth || DEFAULT_OUTPUT_WIDTH;
  const gap = options.gap ?? DEFAULT_GAP;
  const orientations = photos.map(p => classifyPhoto(p.width, p.height));
  const candidates = getTemplatesForCount(photos.length);
  if (candidates.length === 0) throw new Error(`No template for ${photos.length} photos`);

  let best = candidates[0];
  let bestScore = -1;
  for (const tpl of candidates) {
    const s = scoreTemplate(tpl, orientations);
    if (s > bestScore) { bestScore = s; best = tpl; }
  }

  const indices = assignPhotosToSlots(photos, best);
  const cells = computePixelCells(best, indices, photos, outputWidth, gap);
  const totalH = Math.round(best.baseRows * ((outputWidth - gap * (best.baseCols - 1)) / best.baseCols) + gap * (best.baseRows - 1));

  return {
    baseRows: best.baseRows, baseCols: best.baseCols,
    gap, cells, photoOrder: indices,
    canvasWidth: outputWidth, canvasHeight: totalH,
  };
}
