import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workflowsDir = path.join(__dirname, '..', '..', '.github', 'workflows');

function readWorkflow(name) {
  return fs.readFileSync(path.join(workflowsDir, name), 'utf8');
}

describe('CI workflow contracts', () => {
  it('test workflow runs npm audit at moderate level or higher', () => {
    const yml = readWorkflow('test.yml');
    expect(yml).toMatch(/^\s*audit:/m);
    expect(yml).toContain('npm audit --audit-level=moderate');
  });

  it('deploy workflow waits for a successful Test workflow on main', () => {
    const yml = readWorkflow('deploy.yml');
    expect(yml).toContain('workflow_run:');
    expect(yml).toMatch(/workflows:\s*\[Test\]/);
    expect(yml).toContain('branches: [main]');
    expect(yml).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(yml).toContain('github.event.workflow_run.head_sha');
    expect(yml).not.toMatch(/^on:\s*\n\s*push:/m);
  });

  it('deploy workflow vendors exifr before collecting the Pages artifact', () => {
    const yml = readWorkflow('deploy.yml');
    expect(yml).toContain('npm run copy:vendor');
    expect(yml).toContain('test -f js/vendor/exifr.mjs');
  });

  it('test workflow cancels outdated runs for the same ref', () => {
    const yml = readWorkflow('test.yml');
    expect(yml).toContain('concurrency:');
    expect(yml).toContain('cancel-in-progress: true');
  });

  it('security sweep workflow audits and runs full test matrix', () => {
    const yml = readWorkflow('security-sweep.yml');
    expect(yml).toContain('npm audit --audit-level=moderate');
    expect(yml).toContain('npm test');
    expect(yml).toContain('npm run test:e2e');
    expect(yml).toMatch(/cron:\s*'0 6 \* \* 1'/);
  });
});

describe('Dependabot config', () => {
  it('groups dev tooling and uses chore(goja) commit prefix', () => {
    const yml = fs.readFileSync(
      path.join(__dirname, '..', '..', '.github', 'dependabot.yml'),
      'utf8',
    );
    expect(yml).toContain('dev-tooling:');
    expect(yml).toContain('prefix: chore(goja)');
    expect(yml).toContain('- security');
  });
});
