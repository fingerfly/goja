import { describe, it, expect, vi } from 'vitest';

async function loadPlaywrightConfigWithEnv(ciValue, baseUrlValue) {
  const previousCI = process.env.CI;
  const previousBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
  if (ciValue === undefined) {
    delete process.env.CI;
  } else {
    process.env.CI = ciValue;
  }
  if (baseUrlValue === undefined) {
    delete process.env.PLAYWRIGHT_BASE_URL;
  } else {
    process.env.PLAYWRIGHT_BASE_URL = baseUrlValue;
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
    if (previousBaseUrl === undefined) {
      delete process.env.PLAYWRIGHT_BASE_URL;
    } else {
      process.env.PLAYWRIGHT_BASE_URL = previousBaseUrl;
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
    expect(config.reporter).toEqual([
      ['list'],
      ['html', { open: 'never' }],
    ]);
  });

  it('keeps local browser channel settings outside CI', async () => {
    const config = await loadPlaywrightConfigWithEnv(undefined);
    expect(config.retries).toBe(0);
    expect(config.workers).toBeUndefined();
    expect(config.projects[0].name).toBe('chromium');
    expect(config.projects[0].use.channel).toBe('chrome');
    expect(config.reporter).toBe('html');
    expect(config.webServer).toBeDefined();
  });

  it('disables local webServer when PLAYWRIGHT_BASE_URL is provided', async () => {
    const config = await loadPlaywrightConfigWithEnv(undefined, 'http://127.0.0.1:3000');
    expect(config.use.baseURL).toBe('http://127.0.0.1:3000');
    expect(config.webServer).toBeUndefined();
  });
});
