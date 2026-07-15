import { describe, expect, it } from 'vitest';
import { generateSceneSamples, getSceneSound, normalizedVolume } from './whiteNoise';

describe('white noise scene profiles', () => {
  it('gives every scene its own sound profile', () => {
    expect(getSceneSound('rain').texture).toBe('rainfall');
    expect(getSceneSound('forest').texture).toBe('pink-breeze');
    expect(getSceneSound('coast').texture).toBe('tidal-brown');
    expect(getSceneSound('cafe').texture).toBe('room-hum');
  });

  it('generates materially different waveforms instead of filtering one noise loop', () => {
    const random = () => 0.75;
    const signatures = (['rain', 'forest', 'coast', 'cafe'] as const).map(scene =>
      Array.from(generateSceneSamples(scene, 8000, 8000, random).slice(0, 1000)).map(value => value.toFixed(4)).join(','),
    );
    expect(new Set(signatures)).toHaveLength(4);
  });

  it('normalizes the UI volume safely', () => {
    expect(normalizedVolume(62, false)).toBeCloseTo(0.62);
    expect(normalizedVolume(62, true)).toBe(0);
    expect(normalizedVolume(200, false)).toBe(1);
  });
});
