import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const swSource = fs.readFileSync(path.join(root, 'sw.js'), 'utf-8');

const EXPORT_PIPELINE_ASSETS = [
  './js/loop-guards.js',
  './js/unified-canvas-pipeline.js',
  './js/shape-clip-utils.js',
  './js/frame-shape-geometry.js',
  './js/shape-contour.js',
  './js/polygon-shape.js',
  './js/edge-export-clip.js',
  './js/edge-shape-engine.js',
  './js/edge-rng.js',
  './js/edge-style-presets.js',
];

describe('sw.js export pipeline precache', () => {
  it('lists unified canvas and edge modules required by export worker', () => {
    for (const asset of EXPORT_PIPELINE_ASSETS) {
      expect(swSource, `missing ${asset}`).toContain(`'${asset}'`);
    }
  });

  it('does not intercept non-http(s) fetch requests such as blob URLs', () => {
    expect(swSource).toMatch(/protocol !== 'http:' && protocol !== 'https:'/);
  });
});
