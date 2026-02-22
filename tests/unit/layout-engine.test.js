import { describe, it, expect, beforeEach } from 'vitest';
import { classifyPhoto, computeGridLayout, scoreTemplate, assignPhotosToSlots } from '../../js/layout-engine.js';
import { ensureTemplatesLoaded } from '../../js/layout-templates.js';

const L = { width: 1600, height: 900 };
const P = { width: 900, height: 1600 };
const SQ = { width: 1000, height: 1000 };

describe('classifyPhoto', () => {
  it('returns "landscape" for width > height by more than 10%', () => {
    expect(classifyPhoto(1600, 900)).toBe('landscape');
    expect(classifyPhoto(4000, 3000)).toBe('landscape');
  });

  it('returns "portrait" for height > width by more than 10%', () => {
    expect(classifyPhoto(900, 1600)).toBe('portrait');
    expect(classifyPhoto(3000, 4000)).toBe('portrait');
  });

  it('returns "square" for nearly equal dimensions', () => {
    expect(classifyPhoto(1000, 1000)).toBe('square');
    expect(classifyPhoto(1050, 1000)).toBe('square');
  });

  it('handles edge cases', () => {
    expect(classifyPhoto(1, 1)).toBe('square');
    expect(classifyPhoto(2, 1)).toBe('landscape');
    expect(classifyPhoto(1, 2)).toBe('portrait');
  });
});

describe('scoreTemplate', () => {
  it('scores higher when orientations match slot preferences', () => {
    const tplLandscape = { slots: [{ prefer: 'landscape' }, { prefer: 'any' }] };
    const tplPortrait = { slots: [{ prefer: 'portrait' }, { prefer: 'any' }] };
    const orientations = ['landscape', 'landscape'];
    expect(scoreTemplate(tplLandscape, orientations)).toBeGreaterThan(
      scoreTemplate(tplPortrait, orientations)
    );
  });

  it('gives neutral score for "any" preference', () => {
    const tpl = { slots: [{ prefer: 'any' }, { prefer: 'any' }] };
    const score = scoreTemplate(tpl, ['landscape', 'portrait']);
    expect(score).toBeGreaterThan(0);
  });
});

describe('assignPhotosToSlots', () => {
  it('assigns landscape photos to landscape-preferring slots', () => {
    const photos = [P, L, P];
    const tpl = {
      slots: [
        { prefer: 'landscape' },
        { prefer: 'any' },
        { prefer: 'any' },
      ],
    };
    const indices = assignPhotosToSlots(photos, tpl);
    expect(classifyPhoto(photos[indices[0]].width, photos[indices[0]].height)).toBe('landscape');
  });

  it('returns correct number of indices', () => {
    const photos = [L, P, SQ];
    const tpl = { slots: [{ prefer: 'any' }, { prefer: 'any' }, { prefer: 'any' }] };
    const indices = assignPhotosToSlots(photos, tpl);
    expect(indices).toHaveLength(3);
    expect(new Set(indices).size).toBe(3);
  });
});

describe('computeGridLayout', () => {
  beforeEach(async () => {
    await ensureTemplatesLoaded();
  });

  it('returns baseRows, baseCols, gap, and cells', () => {
    const layout = computeGridLayout([L, L]);
    expect(layout).toHaveProperty('baseRows');
    expect(layout).toHaveProperty('baseCols');
    expect(layout).toHaveProperty('gap');
    expect(layout).toHaveProperty('cells');
    expect(layout.cells).toHaveLength(2);
  });

  it('cells have grid coords and pixel coords', () => {
    const layout = computeGridLayout([L, L, L]);
    for (const cell of layout.cells) {
      expect(cell).toHaveProperty('rowStart');
      expect(cell).toHaveProperty('rowEnd');
      expect(cell).toHaveProperty('colStart');
      expect(cell).toHaveProperty('colEnd');
      expect(cell).toHaveProperty('x');
      expect(cell).toHaveProperty('y');
      expect(cell).toHaveProperty('width');
      expect(cell).toHaveProperty('height');
      expect(cell.width).toBeGreaterThan(0);
      expect(cell.height).toBeGreaterThan(0);
    }
  });

  it('3 landscape photos -> 1 top + 2 bottom (NOT 1x3)', () => {
    const layout = computeGridLayout([L, L, L]);
    expect(layout.baseRows).toBe(2);
    const topCell = layout.cells.find(c => c.rowStart === 1 && c.colEnd - c.colStart === 2);
    expect(topCell).toBeDefined();
  });

  it('3 portrait photos -> 1 left spanning + 2 right', () => {
    const layout = computeGridLayout([P, P, P]);
    expect(layout.baseCols).toBe(2);
    const bigCell = layout.cells.find(c => c.rowEnd - c.rowStart === 2);
    expect(bigCell).toBeDefined();
  });

  it('4 photos with 1 landscape -> landscape gets spanning slot', () => {
    const layout = computeGridLayout([L, P, P, P]);
    const spanningCell = layout.cells.find(c =>
      (c.colEnd - c.colStart) > 1 || (c.rowEnd - c.rowStart) > 1
    );
    expect(spanningCell).toBeDefined();
  });

  it('handles single photo', () => {
    const layout = computeGridLayout([L]);
    expect(layout.cells).toHaveLength(1);
    expect(layout.baseRows).toBe(1);
    expect(layout.baseCols).toBe(1);
  });

  it('throws on empty array', () => {
    expect(() => computeGridLayout([])).toThrow();
  });

  it('handles 9 photos as 3x3', () => {
    const layout = computeGridLayout(Array(9).fill(SQ));
    expect(layout.baseRows).toBe(3);
    expect(layout.baseCols).toBe(3);
    expect(layout.cells).toHaveLength(9);
  });

  it('pixel coords fit within outputWidth', () => {
    const layout = computeGridLayout([L, L, L], { outputWidth: 1080 });
    for (const cell of layout.cells) {
      expect(cell.x + cell.width).toBeLessThanOrEqual(1080);
    }
  });

  it('includes colRatios and rowRatios arrays', () => {
    const layout = computeGridLayout([L, L, L]);
    expect(layout.colRatios).toBeDefined();
    expect(layout.rowRatios).toBeDefined();
    expect(layout.colRatios).toHaveLength(layout.baseCols);
    expect(layout.rowRatios).toHaveLength(layout.baseRows);
  });

  it('default ratios are all 1s', () => {
    const layout = computeGridLayout([L, P, SQ, L]);
    expect(layout.colRatios.every(r => r === 1)).toBe(true);
    expect(layout.rowRatios.every(r => r === 1)).toBe(true);
  });

  it('with outputHeight sets canvasHeight to that value', () => {
    const layout = computeGridLayout([L, L], { outputWidth: 1080, outputHeight: 1350 });
    expect(layout.canvasHeight).toBe(1350);
    expect(layout.canvasWidth).toBe(1080);
  });

  it('with outputHeight row height differs from col width', () => {
    const layout = computeGridLayout([SQ, SQ, SQ, SQ], { outputWidth: 1080, outputHeight: 1350 });
    const colWidth = layout.cells[0].width;
    const rowHeight = layout.cells[0].height;
    expect(rowHeight).not.toBe(colWidth);
  });

  it('templateId overrides auto-selection', () => {
    const twoPhotos = [L, L];
    const autoLayout = computeGridLayout(twoPhotos);
    const forced2V = computeGridLayout(twoPhotos, { templateId: '2V' });
    const forced2H = computeGridLayout(twoPhotos, { templateId: '2H' });
    expect(forced2V.baseRows).toBe(2);
    expect(forced2V.baseCols).toBe(1);
    expect(forced2H.baseRows).toBe(1);
    expect(forced2H.baseCols).toBe(2);
  });

  it('templateId "auto" uses auto-selection', () => {
    const layout = computeGridLayout([L, L], { templateId: 'auto' });
    expect(layout.cells).toHaveLength(2);
  });

  it('invalid templateId falls back to auto', () => {
    const layout = computeGridLayout([L, L], { templateId: 'invalid' });
    expect(layout.cells).toHaveLength(2);
  });

  it('pixel coords fit within outputHeight when provided', () => {
    const layout = computeGridLayout([L, L, L], { outputWidth: 1080, outputHeight: 1350 });
    for (const cell of layout.cells) {
      expect(cell.y + cell.height).toBeLessThanOrEqual(1350);
    }
  });

  it('without outputHeight uses default height', () => {
    const layout = computeGridLayout([L, L]);
    expect(layout.canvasHeight).toBeDefined();
    expect(layout.canvasHeight).toBeGreaterThan(0);
  });

  it('with fitMode cover: 2 landscape photos use vertical stack (same as contain)', () => {
    const layout = computeGridLayout([L, L], {
      outputWidth: 1080,
      outputHeight: 1350,
      fitMode: 'cover',
    });
    expect(layout.baseRows).toBe(2);
    expect(layout.baseCols).toBe(1);
  });

  it('with fitMode contain: 2 landscape photos use vertical stack (2 rows 1 col)', () => {
    const layout = computeGridLayout([L, L], {
      outputWidth: 1080,
      outputHeight: 1350,
      fitMode: 'contain',
    });
    expect(layout.baseRows).toBe(2);
    expect(layout.baseCols).toBe(1);
  });

  it('with fitMode contain: 2 portrait photos use horizontal layout (1 row 2 cols)', () => {
    const layout = computeGridLayout([P, P], {
      outputWidth: 1080,
      outputHeight: 1350,
      fitMode: 'contain',
    });
    expect(layout.baseRows).toBe(1);
    expect(layout.baseCols).toBe(2);
  });

  it('with fitMode contain: 3 landscape photos use top-spanning template (3T)', () => {
    const layout = computeGridLayout([L, L, L], {
      outputWidth: 1080,
      outputHeight: 1350,
      fitMode: 'contain',
    });
    const spanningCell = layout.cells.find(c => (c.colEnd - c.colStart) === 2);
    expect(spanningCell).toBeDefined();
    expect(spanningCell.rowStart).toBe(1);
  });

  it('with fitMode contain: 3 portrait photos use left-spanning template (3L)', () => {
    const layout = computeGridLayout([P, P, P], {
      outputWidth: 1080,
      outputHeight: 1350,
      fitMode: 'contain',
    });
    const spanningCell = layout.cells.find(c => (c.rowEnd - c.rowStart) === 2);
    expect(spanningCell).toBeDefined();
    expect(spanningCell.colStart).toBe(1);
  });

  it('with fitMode contain: 4 landscape photos get valid 4-cell layout', () => {
    const layout = computeGridLayout([L, L, L, L], {
      outputWidth: 1080,
      outputHeight: 1350,
      fitMode: 'contain',
    });
    expect(layout.cells).toHaveLength(4);
    expect(layout.baseRows).toBeGreaterThanOrEqual(2);
    expect(layout.baseCols).toBeGreaterThanOrEqual(2);
  });

  it('with fitMode contain: 4 portrait photos get valid 4-cell layout', () => {
    const layout = computeGridLayout([P, P, P, P], {
      outputWidth: 1080,
      outputHeight: 1350,
      fitMode: 'contain',
    });
    expect(layout.cells).toHaveLength(4);
  });

  it('with fitMode contain: 6 landscape photos use 3×2 (6V) not 2×3 (6H)', () => {
    const layout = computeGridLayout(Array(6).fill(L), {
      outputWidth: 1080,
      outputHeight: 1350,
      fitMode: 'contain',
    });
    expect(layout.baseRows).toBe(3);
    expect(layout.baseCols).toBe(2);
  });
});
