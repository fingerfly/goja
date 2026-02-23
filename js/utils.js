/**
 * Returns a debounced version of fn that waits ms before invoking.
 * @param {(...args: unknown[]) => void} fn
 * @param {number} ms
 * @returns {(...args: unknown[]) => void}
 */
export function debounce(fn, ms) {
  let tid;
  return (...args) => {
    clearTimeout(tid);
    tid = setTimeout(() => fn(...args), ms);
  };
}

export function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}
