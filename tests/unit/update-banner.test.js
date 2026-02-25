import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showUpdateBanner, initServiceWorkerUpdate } from '../../js/update-banner.js';

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

describe('initServiceWorkerUpdate', () => {
  beforeEach(() => {
    document.getElementById('updateBanner')?.remove();
  });

  it('activates immediately when a waiting worker already exists', () => {
    const listeners = {};
    const postMessage = vi.fn();
    const onSkipWaiting = vi.fn();
    const reg = {
      waiting: { postMessage },
      addEventListener: (name, handler) => { listeners[name] = handler; },
    };
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { controller: {} },
    });

    initServiceWorkerUpdate(reg, onSkipWaiting);

    expect(onSkipWaiting).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(document.getElementById('updateBanner')).toBeFalsy();
    expect(typeof listeners.updatefound).toBe('function');
  });

  it('activates when a newly installed worker is found', () => {
    const regListeners = {};
    const workerListeners = {};
    const postMessage = vi.fn();
    const onSkipWaiting = vi.fn();
    const newWorker = {
      state: 'installing',
      addEventListener: (name, handler) => { workerListeners[name] = handler; },
    };
    const reg = {
      waiting: { postMessage },
      installing: newWorker,
      addEventListener: (name, handler) => { regListeners[name] = handler; },
    };
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { controller: {} },
    });

    initServiceWorkerUpdate(reg, onSkipWaiting);
    regListeners.updatefound();
    newWorker.state = 'installed';
    workerListeners.statechange();

    expect(onSkipWaiting).toHaveBeenCalledTimes(2);
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(document.getElementById('updateBanner')).toBeFalsy();
  });

  it('requests a fresh service worker check on startup', () => {
    const reg = {
      waiting: null,
      addEventListener: () => {},
      update: vi.fn(() => Promise.resolve()),
    };
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { controller: {} },
    });

    initServiceWorkerUpdate(reg, () => {});

    expect(reg.update).toHaveBeenCalledTimes(1);
  });
});
