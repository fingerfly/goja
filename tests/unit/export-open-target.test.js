import { describe, it, expect, vi, afterEach } from 'vitest';
import { shouldUseInAppBlobPreview } from '../../js/export-open-target.js';

vi.mock('../../js/export-handler.js', () => ({
  isIosLikeDevice: vi.fn(() => true),
}));

vi.mock('../../js/display-mode.js', () => ({
  isStandaloneDisplayMode: vi.fn(() => false),
  isIosStandaloneWebApp: vi.fn(() => false),
}));

import { isIosLikeDevice } from '../../js/export-handler.js';
import {
  isStandaloneDisplayMode,
  isIosStandaloneWebApp,
} from '../../js/display-mode.js';

describe('shouldUseInAppBlobPreview', () => {
  afterEach(() => {
    vi.mocked(isIosLikeDevice).mockReturnValue(true);
    vi.mocked(isStandaloneDisplayMode).mockReturnValue(false);
    vi.mocked(isIosStandaloneWebApp).mockReturnValue(false);
  });

  it('returns false on non-iOS', () => {
    vi.mocked(isIosLikeDevice).mockReturnValue(false);
    expect(shouldUseInAppBlobPreview()).toBe(false);
  });

  it('returns true when iOS standalone display mode', () => {
    vi.mocked(isStandaloneDisplayMode).mockReturnValue(true);
    expect(shouldUseInAppBlobPreview()).toBe(true);
  });

  it('returns true when iOS standalone web app heuristic matches', () => {
    vi.mocked(isIosStandaloneWebApp).mockReturnValue(true);
    expect(shouldUseInAppBlobPreview()).toBe(true);
  });
});
