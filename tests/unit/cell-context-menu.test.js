import { describe, it, expect, beforeEach, vi } from 'vitest';
import { enableCellContextMenu } from '../../js/cell-context-menu.js';

function dispatchTouchStart(el, x = 24, y = 36) {
  const ev = new Event('touchstart', { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'touches', { value: [{ clientX: x, clientY: y }], configurable: true });
  el.dispatchEvent(ev);
}

function dispatchTouchEnd(el, x = 24, y = 36) {
  const ev = new Event('touchend', { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'changedTouches', { value: [{ clientX: x, clientY: y }], configurable: true });
  el.dispatchEvent(ev);
}

describe('cell-context-menu touch interactions', () => {
  let grid;
  let img;
  let onRemove;

  beforeEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    grid = document.createElement('div');
    img = document.createElement('img');
    grid.appendChild(img);
    document.body.appendChild(grid);
    onRemove = vi.fn();
    enableCellContextMenu(grid, () => ({ photoOrder: [0] }), onRemove, () => 'Remove');
  });

  it('opens Goja remove menu on quick touch tap', () => {
    dispatchTouchStart(img);
    dispatchTouchEnd(img);
    const menu = document.querySelector('.cell-context-menu');
    expect(menu).toBeTruthy();
    expect(menu?.textContent).toContain('Remove');
  });

  it('keeps only one menu after repeated taps', () => {
    dispatchTouchStart(img, 20, 20);
    dispatchTouchEnd(img, 20, 20);
    dispatchTouchStart(img, 40, 40);
    dispatchTouchEnd(img, 40, 40);
    const menus = document.querySelectorAll('.cell-context-menu');
    expect(menus).toHaveLength(1);
  });

  it('auto-dismisses the menu after idle timeout', () => {
    vi.useFakeTimers();
    dispatchTouchStart(img);
    dispatchTouchEnd(img);
    expect(document.querySelector('.cell-context-menu')).toBeTruthy();
    vi.advanceTimersByTime(1500);
    expect(document.querySelector('.cell-context-menu')).toBeFalsy();
  });

  it('keeps replacement menu alive until its own timeout', () => {
    vi.useFakeTimers();
    dispatchTouchStart(img, 20, 20);
    dispatchTouchEnd(img, 20, 20);
    vi.advanceTimersByTime(1000);
    dispatchTouchStart(img, 40, 40);
    dispatchTouchEnd(img, 40, 40);
    vi.advanceTimersByTime(600);
    expect(document.querySelector('.cell-context-menu')).toBeTruthy();
    vi.advanceTimersByTime(900);
    expect(document.querySelector('.cell-context-menu')).toBeFalsy();
  });
});
