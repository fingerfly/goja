import { describe, it, expect, beforeEach } from 'vitest';
import { showUpdateBanner } from '../../js/update-banner.js';

describe('showUpdateBanner', () => {
  beforeEach(() => {
    document.getElementById('updateBanner')?.remove();
  });

  it('does not create a second banner if one already exists', () => {
    const reg = { waiting: null };
    showUpdateBanner(reg, () => {});
    const first = document.getElementById('updateBanner');
    expect(first).toBeTruthy();
    showUpdateBanner(reg, () => {});
    const banners = document.querySelectorAll('#updateBanner');
    expect(banners.length).toBe(1);
  });

  it('creates banner with Refresh and Dismiss buttons', () => {
    const reg = { waiting: null };
    showUpdateBanner(reg, () => {});
    expect(document.getElementById('updateRefreshBtn')).toBeTruthy();
    expect(document.getElementById('updateDismissBtn')).toBeTruthy();
  });

  it('Dismiss button removes the banner', () => {
    const reg = { waiting: null };
    showUpdateBanner(reg, () => {});
    const dismissBtn = document.getElementById('updateDismissBtn');
    dismissBtn.click();
    expect(document.getElementById('updateBanner')).toBeFalsy();
  });
});
