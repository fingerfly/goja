/**
 * Service worker update banner and update-found wiring.
 * Extracted from app.js for modularity.
 */

/**
 * Shows a banner prompting the user to refresh for a new version.
 * @param {ServiceWorkerRegistration} reg
 * @param {() => void} [onRefreshClick]
 */
export function showUpdateBanner(reg, onRefreshClick) {
  if (document.getElementById('updateBanner')) return;
  const banner = document.createElement('div');
  banner.id = 'updateBanner';
  Object.assign(banner.style, {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    padding: '12px 16px', backgroundColor: 'var(--color-primary)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '12px', zIndex: 10000, boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
  });
  banner.innerHTML = `
    <span>New version available. Refresh to update.</span>
    <div style="display:flex;gap:8px;">
      <button id="updateRefreshBtn" style="padding:8px 16px;border:none;border-radius:6px;background:#fff;color:var(--color-primary);cursor:pointer;font-weight:600;">Refresh</button>
      <button id="updateDismissBtn" style="padding:8px 16px;border:1px solid rgba(255,255,255,0.5);border-radius:6px;background:transparent;color:#fff;cursor:pointer;">Dismiss</button>
    </div>
  `;
  document.body.appendChild(banner);
  document.getElementById('updateRefreshBtn').addEventListener('click', () => {
    if (reg.waiting) {
      onRefreshClick?.();
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  });
  document.getElementById('updateDismissBtn').addEventListener('click', () => {
    banner.remove();
  });
}

/**
 * Wires updatefound/statechange on the registration to show the banner when a new worker is installed.
 * @param {ServiceWorkerRegistration} reg
 * @param {() => void} onSkipWaiting
 */
export function initServiceWorkerUpdate(reg, onSkipWaiting) {
  const tryActivateWaitingWorker = () => {
    if (!reg.waiting || !navigator.serviceWorker?.controller) return false;
    onSkipWaiting?.();
    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    return true;
  };

  tryActivateWaitingWorker();
  if (typeof reg.update === 'function') {
    reg.update().catch(() => {});
  }
  reg.addEventListener('updatefound', () => {
    const newWorker = reg.installing;
    if (!newWorker) return;
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        if (!tryActivateWaitingWorker()) {
          showUpdateBanner(reg, onSkipWaiting);
        }
      }
    });
  });
}
