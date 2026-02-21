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
console.log(`Extracted version: ${full}`);

const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const oldPkg = pkg.version;
pkg.version = `${version}-${v.build}`;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Updated package.json: ${oldPkg} -> ${pkg.version}`);

const mPath = path.join(root, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(mPath, 'utf-8'));
manifest.version = version;
manifest.version_name = full;
fs.writeFileSync(mPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Updated manifest.json: ${version} / ${full}`);

const swPath = path.join(root, 'sw.js');
if (fs.existsSync(swPath)) {
  let sw = fs.readFileSync(swPath, 'utf-8');
  const re = /(const CACHE_NAME = 'goja-v)\S+(')/;
  if (re.test(sw)) {
    sw = sw.replace(re, `$1${version}-${v.build}$2`);
    fs.writeFileSync(swPath, sw);
    console.log(`Updated sw.js CACHE_NAME: goja-v${version}-${v.build}`);
  }
}

console.log(`\nVersion sync complete: ${full}`);
