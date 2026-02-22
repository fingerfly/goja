import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { showToast } from '../../js/toast.js';

describe('toast', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates and shows a toast element with message', () => {
    const toast = showToast('Export saved', 'success');
    expect(toast).toBeInstanceOf(HTMLDivElement);
    expect(toast.textContent).toBe('Export saved');
    expect(toast.className).toContain('toast');
    expect(toast.className).toContain('toast--success');
    expect(document.body.contains(toast)).toBe(true);
  });

  it('applies error class for error type', () => {
    const toast = showToast('Export failed', 'error');
    expect(toast.className).toContain('toast--error');
  });

  it('has accessibility attributes', () => {
    const toast = showToast('Message', 'success');
    expect(toast.getAttribute('role')).toBe('status');
    expect(toast.getAttribute('aria-live')).toBe('polite');
    expect(toast.getAttribute('aria-atomic')).toBe('true');
  });

  it('replaces previous toast when showing a new one', () => {
    vi.useFakeTimers();
    const first = showToast('First', 'success');
    const second = showToast('Second', 'success');
    expect(document.body.contains(first)).toBe(false);
    expect(document.body.contains(second)).toBe(true);
    expect(second.textContent).toBe('Second');
  });
});
