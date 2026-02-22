import { describe, it, expect, beforeEach } from 'vitest';
import {
  pushState,
  undo,
  redo,
  canUndo,
  canRedo,
  resetHistory,
} from '../../js/state.js';

describe('state', () => {
  beforeEach(() => {
    resetHistory();
  });

  it('pushState stores snapshot of photos and layout', () => {
    const photos = [{ id: 'a', url: 'blob:a' }];
    const layout = { cells: [{ x: 0 }] };
    pushState(photos, layout);
    expect(canUndo()).toBe(true);
    expect(canRedo()).toBe(false);

    const restored = undo([], null);
    expect(restored).not.toBeNull();
    expect(restored.photos).toHaveLength(1);
    expect(restored.photos[0].id).toBe('a');
    expect(restored.layout.cells[0].x).toBe(0);
  });

  it('undo returns null when empty', () => {
    expect(undo([], null)).toBeNull();
    expect(canUndo()).toBe(false);
  });

  it('redo returns null when empty', () => {
    expect(redo([], null)).toBeNull();
    expect(canRedo()).toBe(false);
  });

  it('undo pushes current state to redo stack', () => {
    pushState([{ id: '1' }], null);
    const current = [{ id: '2' }];
    const restored = undo(current, null);
    expect(restored.photos[0].id).toBe('1');
    expect(canRedo()).toBe(true);

    const redone = redo(restored.photos, restored.layout);
    expect(redone.photos[0].id).toBe('2');
  });

  it('pushState clears redo stack', () => {
    pushState([{ id: '1' }], null);
    undo([{ id: '2' }], null);
    expect(canRedo()).toBe(true);
    pushState([{ id: '3' }], null);
    expect(canRedo()).toBe(false);
  });

  it('limits history to 5 entries', () => {
    for (let i = 0; i < 7; i++) {
      pushState([{ id: `p${i}` }], null);
    }
    for (let i = 6; i >= 2; i--) {
      const r = undo([], null);
      expect(r.photos[0].id).toBe(`p${i}`);
    }
    expect(undo([], null)).toBeNull();
  });

  it('pushState ignores empty photos without layout', () => {
    pushState([], null);
    expect(canUndo()).toBe(false);
  });
});
