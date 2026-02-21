const ROTATED_ORIENTATIONS = new Set([5, 6, 7, 8]);
const SWAPPED_ORIENTATIONS = new Set([5, 6, 7, 8]);

export function needsExifRotation(orientation) {
  if (!orientation) return false;
  return ROTATED_ORIENTATIONS.has(orientation);
}

export function correctedDimensions(width, height, orientation) {
  if (orientation && SWAPPED_ORIENTATIONS.has(orientation)) {
    return { width: height, height: width };
  }
  return { width, height };
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
