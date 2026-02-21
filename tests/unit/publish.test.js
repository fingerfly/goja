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

describe('publish git helpers', () => {
  let git, gitLive;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../../scripts/publish.js');
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
