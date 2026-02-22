#!/usr/bin/env node
/**
 * deploy.js
 *
 * Automated deploy pipeline: bump version → sync files → push to GitHub.
 * Ensures the service worker cache version is always updated before deployment,
 * preventing stale-cache issues on client devices.
 *
 * Usage:
 *   npm run deploy -- patch     # bug fix release
 *   npm run deploy -- minor     # new feature release
 *   npm run deploy -- major     # breaking change release
 *   npm run deploy -- build     # build number bump only
 *
 * What it does (in order):
 *   1. Validates the bump type argument
 *   2. Runs upgrade-version (bumps version, syncs files, updates CHANGELOG)
 *   3. Pushes to GitHub (clone/copy, commit, push) → GitHub Actions deploys to Pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const SOURCE = projectRoot;
const DEPLOY_DIR = path.join(process.env.TMPDIR || process.env.TEMP || process.env.TMP || '/tmp', 'goja-deploy');
const REMOTE = 'git@github.com:fingerfly/goja.git';

const VALID_TYPES = ['build', 'patch', 'minor', 'major'];

const EXCLUDE = new Set([
  '.git', 'node_modules', 'playwright-report',
  'test-results',
]);

function shouldExclude(name, parentPath = '') {
  if (EXCLUDE.has(name)) return true;
  if (name.startsWith('.env')) return true;
  if (/\.(pem|key)$/i.test(name) || name.includes('client_secret')) return true;
  if (parentPath.includes('tests' + path.sep + 'fixtures') && /\.jpg$/i.test(name)) return true;
  return false;
}

export function git(args, cwd = DEPLOY_DIR) {
  return execFileSync('git', args, { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
}

export function gitLive(args, cwd = DEPLOY_DIR) {
  execFileSync('git', args, { cwd, stdio: 'inherit' });
}

function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  fs.mkdirSync(dest, { recursive: true });

  const copied = new Set();
  for (const entry of entries) {
    if (shouldExclude(entry.name, src)) continue;
    copied.add(entry.name);
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }

  for (const entry of fs.readdirSync(dest, { withFileTypes: true })) {
    if (shouldExclude(entry.name, dest)) continue;
    if (!copied.has(entry.name)) {
      fs.rmSync(path.join(dest, entry.name), { recursive: true, force: true });
    }
  }
}

function getVersionForCommitMessage() {
  const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
  const v = pkg.version;
  const match = v.match(/^(\d+\.\d+\.\d+)(?:-(\d+))?$/);
  if (!match) return v;
  const semver = match[1];
  const build = match[2] || '1';
  return `v${semver} (${build})`;
}

function runDeploy(bumpType) {
  // Step 1: Bump version, sync files, update CHANGELOG
  console.log('🚀 Step 1/2: Upgrading version...\n');
  execFileSync('node', [path.join(projectRoot, 'scripts/upgrade-version.js'), bumpType], { cwd: projectRoot, stdio: 'inherit' });

  // Step 2: Push to GitHub
  console.log('\n🚀 Step 2/2: Pushing to GitHub...\n');
  console.log(`Source:  ${SOURCE}`);
  console.log(`Deploy:  ${DEPLOY_DIR}`);
  console.log('');

  let needClone = true;
  if (fs.existsSync(path.join(DEPLOY_DIR, '.git'))) {
    try {
      const remote = git(['remote', 'get-url', 'origin']);
      if (remote.includes('fingerfly/goja')) {
        needClone = false;
        console.log('[1/4] Pulling latest from remote...');
        gitLive(['pull', '--ff-only', 'origin', 'main']);
      }
    } catch {
      /* not a git repo or missing remote */
    }
    if (needClone) {
      console.log('[1/4] Re-cloning repo...');
      if (fs.existsSync(DEPLOY_DIR)) {
        fs.rmSync(DEPLOY_DIR, { recursive: true, force: true });
      }
      execFileSync('git', ['clone', REMOTE, DEPLOY_DIR], { stdio: 'inherit' });
    }
  } else {
    console.log('[1/4] Cloning repo...');
    execFileSync('git', ['clone', REMOTE, DEPLOY_DIR], { stdio: 'inherit' });
  }

  console.log('[2/4] Syncing files...');
  copyRecursive(SOURCE, DEPLOY_DIR);

  try {
    execFileSync('git', ['rm', '--cached', 'tests/fixtures/landscape.jpg', 'tests/fixtures/portrait.jpg', 'tests/fixtures/square.jpg'], { cwd: DEPLOY_DIR, stdio: 'pipe' });
  } catch {
    /* files not tracked or already removed */
  }

  git(['add', '-A']);

  const diff = git(['diff', '--cached', '--stat']);
  if (!diff) {
    console.log('\nNo changes to deploy. Everything is up to date.');
    return;
  }

  console.log('\n[3/4] Changes to deploy:');
  console.log(diff);
  console.log('');

  const commitMsg = `Release ${getVersionForCommitMessage()}`;
  git(['commit', '-m', commitMsg]);

  const deployRemote = git(['remote', 'get-url', 'origin']);
  const expected = 'fingerfly/goja';
  if (!deployRemote.includes(expected)) {
    throw new Error(`Safety check failed: deploy repo remote is "${deployRemote}", expected "${expected}". Refusing to push.`);
  }

  console.log('\n[4/4] Pushing to GitHub...');
  gitLive(['push', 'origin', 'main']);

  console.log('\n✅ Deploy complete! Site will update shortly at:');
  console.log('   https://fingerfly.github.io/goja/');
}

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const bumpType = process.argv[2];

  if (!bumpType) {
    console.error('❌ Missing version bump type.\n');
    console.error('Usage: npm run deploy -- <build|patch|minor|major>\n');
    console.error('  build  - increment build number only (e.g. 2.2.0 (1) → 2.2.0 (2))');
    console.error('  patch  - bug fixes (e.g. 2.2.0 → 2.2.1)');
    console.error('  minor  - new features (e.g. 2.2.0 → 2.3.0)');
    console.error('  major  - breaking changes (e.g. 2.2.0 → 3.0.0)');
    process.exit(1);
  }

  if (!VALID_TYPES.includes(bumpType.toLowerCase())) {
    console.error(`❌ Invalid bump type: "${bumpType}"`);
    console.error(`   Valid types: ${VALID_TYPES.join(', ')}`);
    process.exit(1);
  }

  try {
    runDeploy(bumpType);
  } catch (err) {
    console.error('\n❌ Deploy failed:', err.message);
    process.exit(1);
  }
}
