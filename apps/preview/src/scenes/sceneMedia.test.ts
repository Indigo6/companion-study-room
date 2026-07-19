import { describe, expect, it } from 'vitest';
import { getSceneMedia, sceneMedia } from './sceneMedia';

describe('scene media manifest', () => {
  it('defines four unique offline scene bundles', () => {
    expect(sceneMedia).toHaveLength(4);
    expect(new Set(sceneMedia.map(scene => scene.id)).size).toBe(4);

    for (const scene of sceneMedia) {
      expect(scene.videoUrl).toMatch(/^\.\/media\/scenes\/.+\.webm$/);
      expect(scene.posterUrl).toMatch(/^\.\/media\/scenes\/.+\.webp$/);
      expect(scene.ambienceUrl).toMatch(/^\.\/media\/ambience\/.+\.ogg$/);
      expect(scene.visualLicenseUrl).toBe('https://www.pexels.com/legal-pages/license/');
      expect(scene.audioLicenseUrl).toBe('https://creativecommons.org/publicdomain/zero/1.0/');
    }
  });

  it('returns the scene metadata by id', () => {
    expect(sceneMedia.map(scene => scene.name)).toEqual(['雨天', '森林', '海边', '咖啡馆']);
    expect(getSceneMedia('rain').visualSourceUrl).toContain('5487781');
    expect(getSceneMedia('cafe').noise).toBe('咖啡馆低语');
  });
});
