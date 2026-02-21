#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { execFileSync } from 'child_process';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(__dirname, '..');
const PUBLISH = path.join(process.env.TMPDIR || process.env.TEMP || process.env.TMP || '/tmp', 'goja-publish');
const REMOTE = 'git@github.com:fingerfly/goja.git';

const EXCLUDE = new Set([
  '.git', 'node_modules', 'playwright-report',
  'test-results', 'package-lock.json',
]);

function shouldExclude(name) {
  if (EXCLUDE.has(name)) return true;
  if (name.startsWith('.env')) return true;
  if (/\.(pem|key)$/i.test(name) || name.includes('client_secret')) return true;
  return false;
}

export function git(args, cwd = PUBLISH) {
  return execFileSync('git', args, { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
}

export function gitLive(args, cwd = PUBLISH) {
  execFileSync('git', args, { cwd, stdio: 'inherit' });
}

function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  fs.mkdirSync(dest, { recursive: true });

  const copied = new Set();
  for (const entry of entries) {
    if (shouldExclude(entry.name)) continue;
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
    if (shouldExclude(entry.name)) continue;
    if (!copied.has(entry.name)) {
      fs.rmSync(path.join(dest, entry.name), { recursive: true, force: true });
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

  let needClone = true;
  if (fs.existsSync(path.join(PUBLISH, '.git'))) {
    try {
      const remote = git(['remote', 'get-url', 'origin']);
      if (remote.includes('fingerfly/goja')) {
        needClone = false;
        console.log('[1/5] Pulling latest from remote...');
        gitLive(['pull', '--ff-only', 'origin', 'main']);
      }
    } catch {
      /* not a git repo or missing remote */
    }
    if (needClone) {
      console.log('[1/5] Re-cloning repo...');
      if (fs.existsSync(PUBLISH)) {
        fs.rmSync(PUBLISH, { recursive: true, force: true });
      }
      execFileSync('git', ['clone', REMOTE, PUBLISH], { stdio: 'inherit' });
    }
  } else {
    console.log('[1/5] Cloning repo...');
    execFileSync('git', ['clone', REMOTE, PUBLISH], { stdio: 'inherit' });
  }

  console.log('[2/5] Syncing files...');
  copyRecursive(SOURCE, PUBLISH);

  git(['add', '-A']);

  const diff = git(['diff', '--cached', '--stat']);
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

  git(['commit', '-m', msg.trim()]);

  const publishRemote = git(['remote', 'get-url', 'origin']);
  const expected = 'fingerfly/goja';
  if (!publishRemote.includes(expected)) {
    throw new Error(`Safety check failed: publish repo remote is "${publishRemote}", expected "${expected}". Refusing to push.`);
  }

  console.log('\n[4/5] Pushing to GitHub...');
  gitLive(['push', 'origin', 'main']);

  console.log('\n[5/5] Done! Site will update shortly at:');
  console.log('       https://fingerfly.github.io/goja/');
}

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((err) => { console.error(err.message); process.exit(1); });
}
