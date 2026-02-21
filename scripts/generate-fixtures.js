#!/usr/bin/env node
/**
 * Generates minimal E2E test fixture images (landscape, portrait, square).
 * Run before E2E tests when fixtures are not committed (e.g. in CI).
 *
 * Layout engine classifies by aspect ratio:
 * - landscape: width/height >= 1.1
 * - portrait: height/width >= 1.1
 * - square: else
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jpeg from 'jpeg-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '..', 'tests', 'fixtures');

function fill(buffer, r, g, b) {
  for (let i = 0; i < buffer.length; i += 4) {
    buffer[i] = r;
    buffer[i + 1] = g;
    buffer[i + 2] = b;
    buffer[i + 3] = 255;
  }
}

function createJpeg(width, height, quality = 80) {
  const size = width * height * 4;
  const data = Buffer.alloc(size);
  fill(data, 0xf0, 0xf0, 0xf0);
  const encoded = jpeg.encode({ data, width, height }, quality);
  return encoded.data;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function main() {
  ensureDir(FIXTURES);
  fs.writeFileSync(path.join(FIXTURES, 'landscape.jpg'), createJpeg(400, 300));
  fs.writeFileSync(path.join(FIXTURES, 'portrait.jpg'), createJpeg(300, 400));
  fs.writeFileSync(path.join(FIXTURES, 'square.jpg'), createJpeg(300, 300));
}

main();
