#!/usr/bin/env node
/**
 * Copies exifr ESM build to js/vendor for offline use.
 * Run via npm run copy:vendor or postinstall.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const src = path.join(root, 'node_modules', 'exifr', 'dist', 'full.esm.mjs');
const dest = path.join(root, 'js', 'vendor', 'exifr.mjs');

try {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  if (!fs.existsSync(src)) {
    console.warn('exifr not found at', src, '- run npm install');
    process.exit(0);
  }
  fs.copyFileSync(src, dest);
  console.log('Copied exifr to js/vendor/exifr.mjs');
} catch (err) {
  console.error('Failed to copy exifr:', err.message);
  process.exit(1);
}
