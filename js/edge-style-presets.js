/**
 * Purpose: Normalize edge style IDs and expose waveform profiles.
 * Description:
 * - Maps legacy labels to current style identifiers.
 * - Returns profile settings used by edge-path generators.
 */
const LEGACY_STYLE_MAP = {
  wavy: 'silk-wave',
  jagged: 'paper-torn',
};

const STYLE_PROFILES = {
  straight: { waveform: 'none', ampScale: 0, freqScale: 0, jitter: 0 },
  'paper-torn': { waveform: 'triangle', ampScale: 0.64, freqScale: 0.9, jitter: 0.14 },
  'film-scallop': { waveform: 'scallop', ampScale: 0.56, freqScale: 1.25, jitter: 0.06 },
  'graphic-zigzag': { waveform: 'zigzag', ampScale: 0.5, freqScale: 1.45, jitter: 0.04 },
  'silk-wave': { waveform: 'sine', ampScale: 0.48, freqScale: 0.88, jitter: 0.02 },
  'linen-deckle': { waveform: 'triangle', ampScale: 0.4, freqScale: 0.68, jitter: 0.06 },
  'postage-perf': { waveform: 'scallop', ampScale: 0.42, freqScale: 1.6, jitter: 0.03 },
};

export const EDGE_STYLE_CANDIDATES = [
  { id: 'paper-torn', intent: 'organic paper tear', quality: 'high', approved: true },
  { id: 'film-scallop', intent: 'classic film perforation', quality: 'high', approved: true },
  { id: 'graphic-zigzag', intent: 'graphic editorial edge', quality: 'high', approved: true },
  { id: 'silk-wave', intent: 'refined photo-lab wave', quality: 'candidate', approved: false },
  { id: 'linen-deckle', intent: 'subtle handmade deckle', quality: 'candidate', approved: false },
  { id: 'postage-perf', intent: 'clean postage perforation', quality: 'candidate', approved: false },
];

/**
 * Normalize edge style IDs, including legacy aliases.
 * @param {string} style
 * @returns {string}
 */
export function normalizeEdgeStyle(style) {
  const raw = String(style ?? 'straight');
  const mapped = LEGACY_STYLE_MAP[raw] ?? raw;
  return STYLE_PROFILES[mapped] ? mapped : 'straight';
}

/**
 * Resolve the waveform/amplitude/frequency profile for a style.
 * @param {string} style
 * @returns {{ waveform: string, ampScale: number, freqScale: number,
 *   jitter: number }}
 */
export function getEdgeStyleProfile(style) {
  return STYLE_PROFILES[normalizeEdgeStyle(style)];
}
