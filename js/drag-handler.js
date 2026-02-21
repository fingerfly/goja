export function swapOrder(photoOrder, sourceIdx, targetIdx) {
  const result = [...photoOrder];
  result[sourceIdx] = photoOrder[targetIdx];
  result[targetIdx] = photoOrder[sourceIdx];
  return result;
}

export function enableDragAndDrop(gridElement, onSwap) {
  let dragSourceIdx = -1;

  function getImgIndex(el) {
    const imgs = Array.from(gridElement.querySelectorAll('img'));
    return imgs.indexOf(el.closest('img'));
  }

  gridElement.addEventListener('dragstart', (e) => {
    const idx = getImgIndex(e.target);
    if (idx === -1) return;
    dragSourceIdx = idx;
    e.target.classList.add('drag-source');
    e.dataTransfer.effectAllowed = 'move';
  });

  gridElement.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const img = e.target.closest('img');
    if (img) img.classList.add('drag-target');
  });

  gridElement.addEventListener('dragleave', (e) => {
    const img = e.target.closest('img');
    if (img) img.classList.remove('drag-target');
  });

  gridElement.addEventListener('drop', (e) => {
    e.preventDefault();
    gridElement.querySelectorAll('.drag-source, .drag-target').forEach(el => {
      el.classList.remove('drag-source', 'drag-target');
    });
    const targetIdx = getImgIndex(e.target);
    if (targetIdx === -1 || dragSourceIdx === -1 || dragSourceIdx === targetIdx) return;
    onSwap(dragSourceIdx, targetIdx);
    dragSourceIdx = -1;
  });

  gridElement.addEventListener('dragend', () => {
    gridElement.querySelectorAll('.drag-source, .drag-target').forEach(el => {
      el.classList.remove('drag-source', 'drag-target');
    });
    dragSourceIdx = -1;
  });

  setupTouch(gridElement, onSwap, getImgIndex);
}

function setupTouch(gridElement, onSwap, getImgIndex) {
  let touchSourceIdx = -1;
  let touchClone = null;

  gridElement.addEventListener('touchstart', (e) => {
    const img = e.target.closest('img');
    if (!img) return;
    touchSourceIdx = getImgIndex(img);
    if (touchSourceIdx === -1) return;
    img.classList.add('drag-source');
  }, { passive: true });

  gridElement.addEventListener('touchmove', (e) => {
    if (touchSourceIdx === -1) return;
    e.preventDefault();
  }, { passive: false });

  gridElement.addEventListener('touchend', (e) => {
    if (touchSourceIdx === -1) return;
    gridElement.querySelectorAll('.drag-source').forEach(el => el.classList.remove('drag-source'));
    const touch = e.changedTouches[0];
    const dropEl = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!dropEl) { touchSourceIdx = -1; return; }
    const targetIdx = getImgIndex(dropEl);
    if (targetIdx !== -1 && targetIdx !== touchSourceIdx) {
      onSwap(touchSourceIdx, targetIdx);
    }
    touchSourceIdx = -1;
  });
}
