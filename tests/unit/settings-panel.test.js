import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openSettings, closeSettings, isOpen } from '../../js/settings-panel.js';

let panel, backdrop;

beforeEach(() => {
  panel = document.createElement('aside');
  panel.classList.add('settings-panel');
  panel.setAttribute('aria-hidden', 'true');
  backdrop = document.createElement('div');
  backdrop.classList.add('settings-backdrop');
});

describe('isOpen', () => {
  it('returns false when panel has no open class', () => {
    expect(isOpen(panel)).toBe(false);
  });

  it('returns true when panel has open class', () => {
    panel.classList.add('open');
    expect(isOpen(panel)).toBe(true);
  });
});

describe('openSettings', () => {
  it('adds open class to panel', () => {
    openSettings(panel, backdrop);
    expect(panel.classList.contains('open')).toBe(true);
  });

  it('adds open class to backdrop', () => {
    openSettings(panel, backdrop);
    expect(backdrop.classList.contains('open')).toBe(true);
  });

  it('sets aria-hidden to false', () => {
    openSettings(panel, backdrop);
    expect(panel.getAttribute('aria-hidden')).toBe('false');
  });
});

describe('closeSettings', () => {
  it('removes open class from panel', () => {
    panel.classList.add('open');
    backdrop.classList.add('open');
    closeSettings(panel, backdrop);
    expect(panel.classList.contains('open')).toBe(false);
  });

  it('removes open class from backdrop', () => {
    panel.classList.add('open');
    backdrop.classList.add('open');
    closeSettings(panel, backdrop);
    expect(backdrop.classList.contains('open')).toBe(false);
  });

  it('sets aria-hidden to true', () => {
    panel.setAttribute('aria-hidden', 'false');
    closeSettings(panel, backdrop);
    expect(panel.getAttribute('aria-hidden')).toBe('true');
  });

  it('does nothing if already closed', () => {
    closeSettings(panel, backdrop);
    expect(panel.classList.contains('open')).toBe(false);
    expect(panel.getAttribute('aria-hidden')).toBe('true');
  });
});
