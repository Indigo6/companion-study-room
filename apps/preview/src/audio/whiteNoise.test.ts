import { describe, expect, it } from 'vitest';
import { getSceneSound, normalizedVolume } from './whiteNoise';

describe('white noise scene profiles', () => {
  it('gives every scene its own sound profile', () => {
    expect(getSceneSound('rain')).toEqual({ filter: 'lowpass', frequency: 1400, gain: 0.34 });
    expect(getSceneSound('forest')).not.toEqual(getSceneSound('coast'));
    expect(getSceneSound('cafe')).not.toEqual(getSceneSound('rain'));
  });

  it('normalizes the UI volume safely', () => {
    expect(normalizedVolume(62, false)).toBeCloseTo(0.62);
    expect(normalizedVolume(62, true)).toBe(0);
    expect(normalizedVolume(200, false)).toBe(1);
  });
});
