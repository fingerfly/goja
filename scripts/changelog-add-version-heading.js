#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseVersionFromCode } from './upgrade-version-lib.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const code = fs.readFileSync(path.join(root, 'js', 'version.js'), 'utf-8');
const v = parseVersionFromCode(code);
if (!v) { console.error('Could not parse version from js/version.js'); process.exit(1); }

const version = `${v.major}.${v.minor}.${v.patch}`;
const d = new Date();
const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const clPath = path.join(root, 'CHANGELOG.md');
let changelog = fs.readFileSync(clPath, 'utf-8');
const marker = '## [Unreleased]';
const idx = changelog.indexOf(marker);
if (idx === -1) { console.error('Could not find ## [Unreleased] in CHANGELOG.md'); process.exit(1); }

if (changelog.includes(`## [${version}]`)) {
  console.warn(`CHANGELOG.md already contains ## [${version}]; skipping.`);
  process.exit(0);
}

const insertAt = idx + marker.length;
const section = `\n\n## [${version}] - ${dateStr}\n`;
fs.writeFileSync(clPath, changelog.slice(0, insertAt) + section + changelog.slice(insertAt));
console.log(`Added ## [${version}] - ${dateStr} to CHANGELOG.md`);
