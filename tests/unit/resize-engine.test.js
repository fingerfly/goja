import { describe, it, expect } from 'vitest';
import {
  defaultRatios, ratiosToFrString, adjustRatio, recomputePixelCells,
} from '../../js/resize-engine.js';

describe('defaultRatios', () => {
  it('returns array of 1s with given length', () => {
    expect(defaultRatios(3)).toEqual([1, 1, 1]);
    expect(defaultRatios(1)).toEqual([1]);
    expect(defaultRatios(5)).toEqual([1, 1, 1, 1, 1]);
  });
});

describe('ratiosToFrString', () => {
  it('converts ratios to CSS fr string', () => {
    expect(ratiosToFrString([2, 1, 1])).toBe('2fr 1fr 1fr');
    expect(ratiosToFrString([1])).toBe('1fr');
    expect(ratiosToFrString([1, 1])).toBe('1fr 1fr');
  });

  it('handles decimal ratios', () => {
    expect(ratiosToFrString([1.5, 0.5])).toBe('1.5fr 0.5fr');
  });
});

describe('adjustRatio', () => {
  it('increases left track and decreases right on positive delta', () => {
    const result = adjustRatio([1, 1, 1], 0, 50, 300, 0.2);
    expect(result[0]).toBeGreaterThan(1);
    expect(result[1]).toBeLessThan(1);
    expect(result[2]).toBe(1);
  });

  it('decreases left track and increases right on negative delta', () => {
    const result = adjustRatio([1, 1, 1], 0, -50, 300, 0.2);
    expect(result[0]).toBeLessThan(1);
    expect(result[1]).toBeGreaterThan(1);
    expect(result[2]).toBe(1);
  });

  it('preserves total ratio sum', () => {
    const ratios = [2, 1, 1];
    const result = adjustRatio(ratios, 1, 30, 400, 0.2);
    const origSum = ratios.reduce((a, b) => a + b, 0);
    const newSum = result.reduce((a, b) => a + b, 0);
    expect(newSum).toBeCloseTo(origSum, 5);
  });

  it('returns unchanged ratios on zero delta', () => {
    const ratios = [1, 1, 1];
    expect(adjustRatio(ratios, 0, 0, 300, 0.2)).toEqual([1, 1, 1]);
  });

  it('does not mutate the input array', () => {
    const ratios = [1, 1, 1];
    adjustRatio(ratios, 0, 50, 300, 0.2);
    expect(ratios).toEqual([1, 1, 1]);
  });

  it('respects minFraction — neither track collapses', () => {
    const result = adjustRatio([1, 1], 0, 9999, 300, 0.2);
    expect(result[0]).toBeGreaterThan(0);
    expect(result[1]).toBeGreaterThan(0);
    const avg = (result[0] + result[1]) / 2;
    expect(result[1] / avg).toBeGreaterThanOrEqual(0.19);
  });

  it('works at last valid boundary index', () => {
    const result = adjustRatio([1, 1, 1], 1, 50, 300, 0.2);
    expect(result[0]).toBe(1);
    expect(result[1]).toBeGreaterThan(1);
    expect(result[2]).toBeLessThan(1);
  });
});

describe('recomputePixelCells', () => {
  const twoColLayout = {
    baseRows: 1, baseCols: 2, gap: 0, canvasWidth: 300, canvasHeight: 150,
    colRatios: [1, 1], rowRatios: [1],
    cells: [
      { rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2 },
      { rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 3 },
    ],
  };

  it('with uniform ratios produces equal-width cells', () => {
    const cells = recomputePixelCells(twoColLayout);
    expect(cells[0].width).toBe(cells[1].width);
    expect(cells[0].x).toBe(0);
    expect(cells[1].x).toBe(150);
  });

  it('with [2,1] colRatios gives first column double width', () => {
    const layout = { ...twoColLayout, colRatios: [2, 1] };
    const cells = recomputePixelCells(layout);
    expect(cells[0].width).toBe(200);
    expect(cells[1].width).toBe(100);
    expect(cells[1].x).toBe(200);
  });

  it('accounts for gap in pixel positions', () => {
    const layout = { ...twoColLayout, gap: 10, canvasWidth: 310, canvasHeight: 150 };
    const cells = recomputePixelCells(layout);
    expect(cells[0].width).toBe(150);
    expect(cells[1].x).toBe(160);
    expect(cells[1].width).toBe(150);
  });

  it('handles spanning slots with non-uniform ratios', () => {
    const layout = {
      baseRows: 2, baseCols: 2, gap: 0, canvasWidth: 300, canvasHeight: 300,
      colRatios: [2, 1], rowRatios: [1, 1],
      cells: [
        { rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 3 },
        { rowStart: 2, rowEnd: 3, colStart: 1, colEnd: 2 },
        { rowStart: 2, rowEnd: 3, colStart: 2, colEnd: 3 },
      ],
    };
    const cells = recomputePixelCells(layout);
    expect(cells[0].width).toBe(300);
    expect(cells[1].width).toBe(200);
    expect(cells[2].width).toBe(100);
  });

  it('preserves total canvas width across all cells in a row', () => {
    const layout = { ...twoColLayout, colRatios: [3, 1] };
    const cells = recomputePixelCells(layout);
    const rightEdge = cells[1].x + cells[1].width;
    expect(rightEdge).toBe(300);
  });

  it('with non-uniform rowRatios adjusts heights proportionally', () => {
    const layout = {
      baseRows: 2, baseCols: 1, gap: 0, canvasWidth: 200, canvasHeight: 400,
      colRatios: [1], rowRatios: [2, 1],
      cells: [
        { rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2 },
        { rowStart: 2, rowEnd: 3, colStart: 1, colEnd: 2 },
      ],
    };
    const cells = recomputePixelCells(layout);
    expect(cells[0].height).toBeGreaterThan(cells[1].height);
    expect(Math.abs(cells[0].height - cells[1].height * 2)).toBeLessThanOrEqual(1);
  });

  it('with uniform ratios matches original layout-engine output for multi-row', () => {
    const layout = {
      baseRows: 2, baseCols: 3, gap: 4, canvasWidth: 1080, canvasHeight: 719,
      colRatios: [1, 1, 1], rowRatios: [1, 1],
      cells: [
        { rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 4 },
        { rowStart: 2, rowEnd: 3, colStart: 1, colEnd: 2 },
        { rowStart: 2, rowEnd: 3, colStart: 2, colEnd: 3 },
        { rowStart: 2, rowEnd: 3, colStart: 3, colEnd: 4 },
      ],
    };
    const cells = recomputePixelCells(layout);
    expect(cells[0].height).toBe(cells[1].height);
    expect(cells[1].width).toBe(cells[2].width);
    expect(cells[0].width).toBe(1080);
  });

  it('with non-square canvasHeight produces correct row heights', () => {
    const layout = {
      baseRows: 2, baseCols: 2, gap: 0, canvasWidth: 1080, canvasHeight: 1350,
      colRatios: [1, 1], rowRatios: [1, 1],
      cells: [
        { rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2 },
        { rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 3 },
        { rowStart: 2, rowEnd: 3, colStart: 1, colEnd: 2 },
        { rowStart: 2, rowEnd: 3, colStart: 2, colEnd: 3 },
      ],
    };
    const cells = recomputePixelCells(layout);
    expect(cells[0].width).toBe(540);
    expect(cells[0].height).toBe(675);
    expect(cells[0].height).toBeGreaterThan(cells[0].width);
  });

  it('total cell height equals canvasHeight for non-square frame', () => {
    const layout = {
      baseRows: 2, baseCols: 1, gap: 10, canvasWidth: 1080, canvasHeight: 1350,
      colRatios: [1], rowRatios: [1, 1],
      cells: [
        { rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2 },
        { rowStart: 2, rowEnd: 3, colStart: 1, colEnd: 2 },
      ],
    };
    const cells = recomputePixelCells(layout);
    const totalH = cells[1].y + cells[1].height;
    expect(totalH).toBe(1350);
  });
});
