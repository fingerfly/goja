import { describe, it, expect } from 'vitest';
import { trackBoundaryPos } from '../../js/resize-handler.js';

describe('resize-handler', () => {
  describe('trackBoundaryPos', () => {
    it('returns position for first boundary with equal ratios', () => {
      const pos = trackBoundaryPos([1, 1], 0, 100, 4);
      expect(pos).toBeCloseTo(50);
      expect(pos).toBeGreaterThan(0);
      expect(pos).toBeLessThan(100);
    });

    it('accounts for gap between cells', () => {
      const pos = trackBoundaryPos([1, 1, 1], 1, 100, 10);
      expect(pos).toBeGreaterThan(50);
      expect(pos).toBeLessThan(100);
    });

    it('returns value for single ratio', () => {
      const pos = trackBoundaryPos([1], 0, 100, 0);
      expect(typeof pos).toBe('number');
      expect(pos).toBe(100);
    });
  });
});
