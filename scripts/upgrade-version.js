#!/usr/bin/env node
/**
 * Usage: node scripts/upgrade-version.js <build|patch|minor|major>
 *
 * Via npm:
 *   npm run upgrade-version -- build
 *   npm run upgrade-version -- patch
 *   npm run upgrade-version -- minor
 *   npm run upgrade-version -- major
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import {
  parseVersionFromCode, computeBumpedVersion, applyVersionToCode,
  normalizeBumpArg, BUMP_TYPES,
} from './upgrade-version-lib.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const versionPath = path.join(root, 'js', 'version.js');

let bump;
try { bump = normalizeBumpArg(process.argv[2]); } catch {
  console.error('Usage: npm run upgrade-version -- <build|patch|minor|major>');
  process.exit(1);
}

const code = fs.readFileSync(versionPath, 'utf-8');
const parsed = parseVersionFromCode(code);
if (!parsed) { console.error('Could not parse version from js/version.js'); process.exit(1); }

const oldFull = `${parsed.major}.${parsed.minor}.${parsed.patch} (${parsed.build})`;
const bumped = computeBumpedVersion(parsed, bump);
fs.writeFileSync(versionPath, applyVersionToCode(code, bumped));

const newVer = `${bumped.major}.${bumped.minor}.${bumped.patch}`;
const newFull = `${newVer} (${bumped.build})`;
console.log(`Bumped version: ${oldFull} -> ${newFull} (${bump})\n`);

execSync('npm run sync-version', { cwd: root, stdio: 'inherit' });
console.log('');

if (bump === BUMP_TYPES.build) {
  updateChangelogDate(newVer);
} else {
  execSync('node scripts/changelog-add-version-heading.js', { cwd: root, stdio: 'inherit' });
}
console.log('');

execSync('npm run validate-version', { cwd: root, stdio: 'inherit' });
console.log(`\nVersion upgrade complete: ${newFull}`);

function updateChangelogDate(version) {
  const clPath = path.join(root, 'CHANGELOG.md');
  let cl = fs.readFileSync(clPath, 'utf-8');
  const d = new Date();
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const re = new RegExp(`(## \\[${version.replace(/\./g, '\\.')}\\] - )\\d{4}-\\d{2}-\\d{2}`);
  if (re.test(cl)) {
    fs.writeFileSync(clPath, cl.replace(re, `$1${dateStr}`));
    console.log(`Updated CHANGELOG.md date for [${version}] to ${dateStr}`);
  } else {
    console.warn(`Could not find ## [${version}] heading in CHANGELOG.md; skipping date update.`);
  }
}
