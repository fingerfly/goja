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

describe('deploy remote resolution and safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GOJA_DEPLOY_REMOTE;
  });

  it('resolveDeployRemote() prefers GOJA_DEPLOY_REMOTE override', async () => {
    process.env.GOJA_DEPLOY_REMOTE = 'https://github.com/fingerfly/goja.git';
    vi.resetModules();
    const mod = await import('../../scripts/deploy.js');
    expect(mod.resolveDeployRemote()).toBe('https://github.com/fingerfly/goja.git');
  });

  it('resolveDeployRemote() uses OS-aware defaults when override is unset', async () => {
    vi.resetModules();
    const mod = await import('../../scripts/deploy.js');
    expect(mod.resolveDeployRemote('win32')).toBe('https://github.com/fingerfly/goja.git');
    expect(mod.resolveDeployRemote('darwin')).toBe('git@github.com:fingerfly/goja.git');
    expect(mod.resolveDeployRemote('freebsd')).toBe('git@github.com:fingerfly/goja.git');
  });

  it('isExpectedDeployRepo() accepts canonical SSH and HTTPS remotes', async () => {
    vi.resetModules();
    const mod = await import('../../scripts/deploy.js');
    expect(mod.isExpectedDeployRepo('git@github.com:fingerfly/goja.git')).toBe(true);
    expect(mod.isExpectedDeployRepo('https://github.com/fingerfly/goja.git')).toBe(true);
    expect(mod.isExpectedDeployRepo('https://github.com/fingerfly/00_Mundo.git')).toBe(false);
  });

  it('normalizeRemoteRepo() handles ssh URL form and trailing separators', async () => {
    vi.resetModules();
    const mod = await import('../../scripts/deploy.js');
    expect(mod.normalizeRemoteRepo('ssh://git@github.com/fingerfly/goja.git')).toBe('fingerfly/goja');
    expect(mod.normalizeRemoteRepo('https://github.com/fingerfly/goja.git/')).toBe('fingerfly/goja');
    expect(mod.normalizeRemoteRepo('https://github.com/fingerfly/goja/')).toBe('fingerfly/goja');
    expect(mod.normalizeRemoteRepo('https://github.com/fingerfly/00_Mundo.git')).toBe('fingerfly/00_mundo');
  });
});

describe('deploy vendor and audit preflight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GOJA_DEPLOY_REMOTE;
  });

  it('prepareVendorBundle() throws when exifr vendor file is missing', async () => {
    execFileSync.mockReturnValue('');
    const fs = await import('fs');
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.resetModules();
    const mod = await import('../../scripts/deploy.js');
    const npmCmd = mod.npmCommand();

    expect(() => mod.prepareVendorBundle('/tmp/goja')).toThrow(/Vendor file missing/);
    expect(execFileSync).toHaveBeenCalledWith(
      npmCmd, ['run', 'copy:vendor'],
      expect.objectContaining({ cwd: '/tmp/goja' }),
    );
  });

  it('runDeploy() fails audit preflight before upgrade-version', async () => {
    execFileSync.mockImplementation((cmd, args = []) => {
      if (cmd === 'git' && args[0] === 'ls-remote') return '';
      if ((cmd === 'npm' || cmd === 'npm.cmd') && args.includes('audit:check')) {
        throw new Error('npm audit found vulnerabilities');
      }
      return '';
    });

    vi.resetModules();
    const mod = await import('../../scripts/deploy.js');

    expect(() => mod.runDeploy('patch')).toThrow(/vulnerabilities|audit/i);

    const upgradeCalls = execFileSync.mock.calls.filter(
      ([cmd, args = []]) => cmd === 'node' && args.some((arg) => String(arg).includes('upgrade-version.js')),
    );
    expect(upgradeCalls).toHaveLength(0);
  });
});

describe('deploy preflight ordering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GOJA_DEPLOY_REMOTE;
  });

  it('runDeploy() fails preflight before running upgrade-version side effects', async () => {
    execFileSync.mockImplementation((cmd, args = []) => {
      if (cmd === 'git' && args[0] === 'ls-remote') {
        throw new Error('Permission denied (publickey)');
      }
      return '';
    });

    vi.resetModules();
    const mod = await import('../../scripts/deploy.js');

    expect(() => mod.runDeploy('patch')).toThrow(/Permission denied|Deploy preflight failed/i);

    const upgradeCalls = execFileSync.mock.calls.filter(
      ([cmd, args = []]) => cmd === 'node' && Array.isArray(args) && args.some((arg) => String(arg).includes('upgrade-version.js'))
    );
    expect(upgradeCalls).toHaveLength(0);
  });
});
