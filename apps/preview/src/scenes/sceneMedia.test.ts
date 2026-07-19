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
      expect(scene.audioLicenseUrl).toMatch(/^https:\/\/(creativecommons\.org|pixabay\.com)\//);
    }
  });

  it('returns the scene metadata by id', () => {
    expect(sceneMedia.map(scene => scene.name)).toEqual(['雨天', '森林', '海边', '咖啡馆']);
    expect(getSceneMedia('rain').visualSourceUrl).toContain('5487781');
    expect(getSceneMedia('rain').audioSourceUrl).toContain('231100');
    expect(getSceneMedia('rain').audioLicenseUrl).toBe('https://pixabay.com/service/license-summary/');
    expect(getSceneMedia('forest').visualSourceUrl).toContain('26840816');
    expect(getSceneMedia('forest').audioSourceUrl).toContain('321622');
    expect(getSceneMedia('forest').audioLicenseUrl).toBe('https://pixabay.com/service/license-summary/');
    expect(getSceneMedia('coast').visualSourceUrl).toContain('36494874');
    expect(getSceneMedia('coast').audioSourceUrl).toContain('486892');
    expect(getSceneMedia('coast').audioLicenseUrl).toBe('https://pixabay.com/service/license-summary/');
    expect(getSceneMedia('cafe').noise).toBe('咖啡馆低语');
  });
});
