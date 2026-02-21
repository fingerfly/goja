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
const full = `${version} (${v.build})`;
const pkgVersion = `${version}-${v.build}`;

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf-8'));

const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf-8');
const swMatch = sw.match(/const CACHE_NAME = 'goja-v([^']+)'/);
const expectedCache = `${version}-${v.build}`;

let failed = false;
if (pkg.version !== pkgVersion) {
  console.error(`package.json version ${pkg.version} !== expected ${pkgVersion}`);
  failed = true;
}
if (manifest.version !== version) {
  console.error(`manifest.json version ${manifest.version} !== expected ${version}`);
  failed = true;
}
if (manifest.version_name !== full) {
  console.error(`manifest.json version_name ${manifest.version_name} !== expected ${full}`);
  failed = true;
}
if (!swMatch || swMatch[1] !== expectedCache) {
  console.error(`sw.js CACHE_NAME ${swMatch ? swMatch[1] : '(not found)'} !== expected ${expectedCache}`);
  failed = true;
}
if (failed) process.exit(1);
console.log(`Version consistent: ${full}`);
