import { describe, it, expect } from 'vitest';
import { swapOrder } from '../../js/drag-handler.js';

describe('swapOrder', () => {
  it('swaps two indices in the array', () => {
    expect(swapOrder([0, 1, 2], 0, 2)).toEqual([2, 1, 0]);
  });

  it('returns identical array when indices are the same', () => {
    expect(swapOrder([0, 1, 2], 1, 1)).toEqual([0, 1, 2]);
  });

  it('does not mutate the input array', () => {
    const input = [0, 1, 2];
    const result = swapOrder(input, 0, 2);
    expect(input).toEqual([0, 1, 2]);
    expect(result).not.toBe(input);
  });

  it('works with larger arrays', () => {
    expect(swapOrder([0, 1, 2, 3, 4], 1, 3)).toEqual([0, 3, 2, 1, 4]);
  });

  it('works when swapping adjacent elements', () => {
    expect(swapOrder([0, 1, 2], 0, 1)).toEqual([1, 0, 2]);
  });
});
