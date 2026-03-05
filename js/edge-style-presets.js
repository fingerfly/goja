const LEGACY_STYLE_MAP = {
  wavy: 'soft-wave',
  jagged: 'paper-torn',
};

const STYLE_PROFILES = {
  straight: { waveform: 'none', ampScale: 0, freqScale: 0, jitter: 0 },
  'soft-wave': { waveform: 'sine', ampScale: 0.72, freqScale: 0.75, jitter: 0.08 },
  'paper-torn': { waveform: 'triangle', ampScale: 0.64, freqScale: 0.9, jitter: 0.14 },
  'film-scallop': { waveform: 'scallop', ampScale: 0.56, freqScale: 1.25, jitter: 0.06 },
  'graphic-zigzag': { waveform: 'zigzag', ampScale: 0.5, freqScale: 1.45, jitter: 0.04 },
};

export function normalizeEdgeStyle(style) {
  const raw = String(style ?? 'straight');
  const mapped = LEGACY_STYLE_MAP[raw] ?? raw;
  return STYLE_PROFILES[mapped] ? mapped : 'straight';
}

export function getEdgeStyleProfile(style) {
  return STYLE_PROFILES[normalizeEdgeStyle(style)];
}
