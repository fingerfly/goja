/**
 * Toast notification component.
 * Shows success/error messages with auto-dismiss (~3s). Mobile-friendly.
 */
const TOAST_DURATION_MS = 3000;
const TOAST_Z_INDEX = 9999;

let activeToast = null;
let dismissTimer = null;

export function showToast(message, type = 'success') {
  if (activeToast) {
    activeToast.remove();
    if (dismissTimer) clearTimeout(dismissTimer);
  }

  const toast = document.createElement('div');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');
  toast.className = `toast toast--${type}`;

  Object.assign(toast.style, {
    position: 'fixed',
    bottom: 'calc(var(--bottom-bar-height, 60px) + 16px)',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 20px',
    minWidth: 'min(280px, calc(100vw - 32px))',
    maxWidth: '90vw',
    borderRadius: 'var(--radius-md, 10px)',
    fontSize: 'var(--font-size-sm, 0.875rem)',
    fontWeight: 500,
    color: '#fff',
    backgroundColor: type === 'error' ? 'var(--color-danger, #ef4444)' : 'var(--color-primary, #0d9488)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: TOAST_Z_INDEX,
    transition: 'opacity 0.2s, transform 0.2s',
  });

  toast.textContent = message;
  document.body.appendChild(toast);

  activeToast = toast;
  dismissTimer = setTimeout(() => {
    dismissToast();
  }, TOAST_DURATION_MS);

  return toast;
}

function dismissToast() {
  if (activeToast) {
    activeToast.style.opacity = '0';
    activeToast.style.transform = 'translateX(-50%) translateY(8px)';
    setTimeout(() => {
      activeToast?.remove();
      activeToast = null;
    }, 200);
  }
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
}
