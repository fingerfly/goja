export function normalizeAngle(deg) {
  if (!Number.isFinite(deg)) return 0;
  const normalized = deg % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function computeAngleDeg(cx, cy, px, py) {
  const dx = px - cx;
  const dy = py - cy;
  if (dx === 0 && dy === 0) return 0;
  const rad = Math.atan2(dx, -dy);
  return normalizeAngle((rad * 180) / Math.PI);
}

export function fitScaleFactor(angleDeg, cellW, cellH) {
  if (!Number.isFinite(cellW) || !Number.isFinite(cellH) || cellW <= 0 || cellH <= 0) return 1;
  const theta = (normalizeAngle(angleDeg) * Math.PI) / 180;
  const absCos = Math.abs(Math.cos(theta));
  const absSin = Math.abs(Math.sin(theta));
  const bbW = cellW * absCos + cellH * absSin;
  const bbH = cellW * absSin + cellH * absCos;
  if (bbW <= 0 || bbH <= 0) return 1;
  const scale = Math.min(cellW / bbW, cellH / bbH);
  return Math.min(scale, 1);
}
