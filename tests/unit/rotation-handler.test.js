import { describe, it, expect, vi } from 'vitest';
import { applyCellRotation, enableRotation } from '../../js/rotation-handler.js';

describe('applyCellRotation', () => {
  it('applies rotate and scale styles', () => {
    const cell = document.createElement('div');
    applyCellRotation(cell, 45, 100, 100);
    expect(cell.style.transform).toContain('rotate(45deg)');
    expect(cell.style.transform).toContain('scale(');
    expect(cell.style.getPropertyValue('--cell-scale')).not.toBe('');
  });
});

describe('enableRotation', () => {
  function setupGrid() {
    const grid = document.createElement('div');
    grid.innerHTML = `
      <div class="preview-cell"></div>
      <div class="preview-cell"></div>
    `;
    const cells = Array.from(grid.querySelectorAll('.preview-cell'));
    cells.forEach((cell) => {
      cell.getBoundingClientRect = () => ({
        left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100,
      });
    });
    return { grid, cells };
  }

  it('adds one rotation handle per cell', () => {
    const { grid } = setupGrid();
    const cleanup = enableRotation(
      grid,
      () => [{ angle: 0 }, { angle: 0 }],
      () => ({ cells: [{ width: 100, height: 100 }, { width: 100, height: 100 }], photoOrder: [0, 1] }),
      () => {},
      () => {}
    );
    expect(grid.querySelectorAll('.rotation-handle')).toHaveLength(2);
    cleanup();
  });

  it('calls onRotateStart and onRotate on drag end', () => {
    const { grid } = setupGrid();
    const onRotateStart = vi.fn();
    const onRotate = vi.fn();
    enableRotation(
      grid,
      () => [{ angle: 0 }, { angle: 0 }],
      () => ({ cells: [{ width: 100, height: 100 }, { width: 100, height: 100 }], photoOrder: [0, 1] }),
      onRotate,
      onRotateStart
    );
    const handle = grid.querySelector('.rotation-handle');
    handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 50, clientY: 0 }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 100, clientY: 50 }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 100, clientY: 50 }));
    expect(onRotateStart).toHaveBeenCalledTimes(1);
    expect(onRotate).toHaveBeenCalledTimes(1);
    expect(onRotate.mock.calls[0][0]).toBe(0);
    expect(typeof onRotate.mock.calls[0][1]).toBe('number');
  });

  it('supports keyboard left/right angle updates', () => {
    const { grid } = setupGrid();
    const onRotateStart = vi.fn();
    const onRotate = vi.fn();
    enableRotation(
      grid,
      () => [{ angle: 10 }, { angle: 0 }],
      () => ({ cells: [{ width: 100, height: 100 }, { width: 100, height: 100 }], photoOrder: [0, 1] }),
      onRotate,
      onRotateStart
    );
    const handle = grid.querySelector('.rotation-handle');
    handle.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }));
    expect(onRotateStart).toHaveBeenCalledTimes(1);
    expect(onRotate).toHaveBeenCalledWith(0, 11);
  });
});
