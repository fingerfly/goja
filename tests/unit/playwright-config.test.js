import { describe, it, expect, vi } from 'vitest';

async function loadPlaywrightConfigWithEnv(ciValue) {
  const previousCI = process.env.CI;
  if (ciValue === undefined) {
    delete process.env.CI;
  } else {
    process.env.CI = ciValue;
  }

  try {
    vi.resetModules();
    const mod = await import('../../playwright.config.js');
    return mod.default;
  } finally {
    if (previousCI === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = previousCI;
    }
  }
}

describe('playwright config', () => {
  it('uses CI-safe retries and worker count on CI', async () => {
    const config = await loadPlaywrightConfigWithEnv('true');
    expect(config.retries).toBe(2);
    expect(config.workers).toBe(1);
    expect(config.projects[0].name).toBe('chromium');
    expect(config.projects[0].use.channel).toBeUndefined();
  });

  it('keeps local browser channel settings outside CI', async () => {
    const config = await loadPlaywrightConfigWithEnv(undefined);
    expect(config.retries).toBe(0);
    expect(config.workers).toBeUndefined();
    expect(config.projects[0].name).toBe('chromium');
    expect(config.projects[0].use.channel).toBe('chrome');
  });
});
