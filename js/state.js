/**
 * Undo/redo history for photos and layout.
 * Maintains last 5 states. Call pushState before changes; undo/redo return restored state.
 */
const MAX_HISTORY = 5;

let undoStack = [];
let redoStack = [];

function snapshot(photos, layout) {
  return {
    photos: photos.map((p) => ({ ...p })),
    layout: layout ? JSON.parse(JSON.stringify(layout)) : null,
  };
}

export function pushState(photos, layout) {
  if (photos.length === 0 && !layout) return;
  undoStack.push(snapshot(photos, layout));
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
}

export function undo(currentPhotos, currentLayout) {
  if (undoStack.length === 0) return null;
  redoStack.push(snapshot(currentPhotos, currentLayout));
  return undoStack.pop();
}

export function redo(currentPhotos, currentLayout) {
  if (redoStack.length === 0) return null;
  undoStack.push(snapshot(currentPhotos, currentLayout));
  return redoStack.pop();
}

export function canUndo() {
  return undoStack.length > 0;
}

export function canRedo() {
  return redoStack.length > 0;
}

/** Reset history (for tests) */
export function resetHistory() {
  undoStack = [];
  redoStack = [];
}
