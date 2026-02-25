// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('child_process', () => ({
  execFileSync: vi.fn(() => ''),
  execSync: vi.fn(() => ''),
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: { ...actual, existsSync: vi.fn(() => false), readdirSync: vi.fn(() => []) },
    existsSync: vi.fn(() => false),
    readdirSync: vi.fn(() => []),
  };
});

const { execFileSync, execSync } = await import('child_process');

describe('deploy git helpers', () => {
  let git, gitLive;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../../scripts/deploy.js');
    git = mod.git;
    gitLive = mod.gitLive;
  });

  it('git() calls execFileSync with "git" and an argument array', () => {
    git(['status'], '/tmp/test');
    expect(execFileSync).toHaveBeenCalledWith(
      'git', ['status'],
      expect.objectContaining({ cwd: '/tmp/test' }),
    );
  });

  it('git() does NOT pass arguments through a shell string', () => {
    git(['commit', '-m', 'hello world'], '/tmp/test');
    expect(execSync).not.toHaveBeenCalled();
  });

  it('shell metacharacters are passed through safely as raw args', () => {
    const dangerous = 'test $(rm -rf /) `whoami` && echo pwned; cat /etc/passwd';
    git(['commit', '-m', dangerous], '/tmp/test');
    expect(execFileSync).toHaveBeenCalledWith(
      'git', ['commit', '-m', dangerous],
      expect.objectContaining({ cwd: '/tmp/test' }),
    );
  });

  it('gitLive() calls execFileSync with "git" and an argument array', () => {
    gitLive(['push', 'origin', 'main'], '/tmp/test');
    expect(execFileSync).toHaveBeenCalledWith(
      'git', ['push', 'origin', 'main'],
      expect.objectContaining({ cwd: '/tmp/test' }),
    );
  });

  it('gitLive() does NOT pass arguments through a shell string', () => {
    gitLive(['pull', '--ff-only', 'origin', 'main'], '/tmp/test');
    expect(execSync).not.toHaveBeenCalled();
  });
});

describe('deploy commit identity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GOJA_DEPLOY_GIT_NAME;
    delete process.env.GOJA_DEPLOY_GIT_EMAIL;
  });

  it('commitRelease() forces explicit author and committer defaults', async () => {
    vi.resetModules();
    const mod = await import('../../scripts/deploy.js');

    mod.commitRelease('Release v1.2.3 (4)', '/tmp/test');

    expect(execFileSync).toHaveBeenCalledWith(
      'git',
      [
        'commit',
        '--author',
        'goja-release <10357401+fingerfly@users.noreply.github.com>',
        '-m',
        'Release v1.2.3 (4)',
        '--no-verify',
      ],
      expect.objectContaining({
        cwd: '/tmp/test',
        env: expect.objectContaining({
          GIT_COMMITTER_NAME: 'goja-release',
          GIT_COMMITTER_EMAIL: '10357401+fingerfly@users.noreply.github.com',
        }),
      }),
    );
  });

  it('commitRelease() honors GOJA_DEPLOY_GIT_NAME/EMAIL overrides', async () => {
    process.env.GOJA_DEPLOY_GIT_NAME = 'Test User';
    process.env.GOJA_DEPLOY_GIT_EMAIL = 'test@demo.invalid';
    vi.resetModules();
    const mod = await import('../../scripts/deploy.js');

    mod.commitRelease('Release v1.2.3 (5)', '/tmp/test');

    expect(execFileSync).toHaveBeenCalledWith(
      'git',
      [
        'commit',
        '--author',
        'Test User <test@demo.invalid>',
        '-m',
        'Release v1.2.3 (5)',
        '--no-verify',
      ],
      expect.objectContaining({
        cwd: '/tmp/test',
        env: expect.objectContaining({
          GIT_COMMITTER_NAME: 'Test User',
          GIT_COMMITTER_EMAIL: 'test@demo.invalid',
        }),
      }),
    );
  });
});
