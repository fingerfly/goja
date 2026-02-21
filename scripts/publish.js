#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(__dirname, '..');
const PUBLISH = path.join(os(), 'goja-publish');
const REMOTE = 'git@github.com:fingerfly/goja.git';

const EXCLUDE = new Set([
  '.git', 'node_modules', 'playwright-report',
  'test-results', 'package-lock.json',
]);

function os() {
  return process.env.TMPDIR || process.env.TEMP || process.env.TMP || '/tmp';
}

function git(args, cwd = PUBLISH) {
  return execSync(`git ${args}`, { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
}

function gitLive(args, cwd = PUBLISH) {
  execSync(`git ${args}`, { cwd, stdio: 'inherit' });
}

function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  fs.mkdirSync(dest, { recursive: true });

  const copied = new Set();
  for (const entry of entries) {
    if (EXCLUDE.has(entry.name)) continue;
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
    if (EXCLUDE.has(entry.name)) continue;
    if (!copied.has(entry.name)) {
      const target = path.join(dest, entry.name);
      fs.rmSync(target, { recursive: true, force: true });
    }
  }
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer); });
  });
}

async function main() {
  console.log('=== Goja Publish ===');
  console.log(`Source:  ${SOURCE}`);
  console.log(`Publish: ${PUBLISH}`);
  console.log('');

  if (fs.existsSync(path.join(PUBLISH, '.git'))) {
    console.log('[1/5] Pulling latest from remote...');
    gitLive('pull --ff-only origin main');
  } else {
    console.log('[1/5] Cloning repo...');
    execSync(`git clone "${REMOTE}" "${PUBLISH}"`, { stdio: 'inherit' });
  }

  console.log('[2/5] Syncing files...');
  copyRecursive(SOURCE, PUBLISH);

  git('add -A');

  const diff = git('diff --cached --stat');
  if (!diff) {
    console.log('\nNo changes to publish. Everything is up to date.');
    return;
  }

  console.log('\n[3/5] Changes to publish:');
  console.log(diff);
  console.log('');

  const msg = await prompt('Commit message (or Ctrl-C to abort): ');
  if (!msg.trim()) {
    console.log('Aborted: empty commit message.');
    process.exit(1);
  }

  git(`commit -m "${msg.replace(/"/g, '\\"')}"`);

  console.log('\n[4/5] Pushing to GitHub...');
  gitLive('push origin main');

  console.log('\n[5/5] Done! Site will update shortly at:');
  console.log('       https://fingerfly.github.io/goja/');
}

main().catch((err) => { console.error(err.message); process.exit(1); });
