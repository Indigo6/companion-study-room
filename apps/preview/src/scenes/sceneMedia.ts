export type SceneId = 'rain' | 'forest' | 'coast' | 'cafe';

export interface SceneMedia {
  id: SceneId;
  name: string;
  noise: string;
  time: string;
  icon: string;
  artworkLabel: string;
  videoUrl: string;
  posterUrl: string;
  ambienceUrl: string;
  visualCredit: string;
  visualSourceUrl: string;
  visualLicenseUrl: string;
  audioCredit: string;
  audioSourceUrl: string;
  audioLicenseUrl: string;
}

const pexelsLicense = 'https://www.pexels.com/legal-pages/license/';
const cc0License = 'https://creativecommons.org/publicdomain/zero/1.0/';
const pixabayLicense = 'https://pixabay.com/service/license-summary/';

export const sceneMedia: readonly SceneMedia[] = [
  {
    id: 'rain', name: '雨天', noise: '雨滴绿噪音', time: '22:18', icon: '⌁',
    artworkLabel: '雨中绿叶', videoUrl: './media/scenes/rain.webm', posterUrl: './media/scenes/rain.webp', ambienceUrl: './media/ambience/rain.ogg',
    visualCredit: 'Hemanth K M · Pexels', visualSourceUrl: 'https://www.pexels.com/video/shallow-focus-of-green-leaves-wet-with-rain-5487781/', visualLicenseUrl: pexelsLicense,
    audioCredit: 'gingerleegalaxy_1 · Pixabay', audioSourceUrl: 'https://pixabay.com/zh/sound-effects/nature-rain-drops-on-window-green-noise-mix-231100/', audioLicenseUrl: pixabayLicense,
  },
  {
    id: 'forest', name: '森林', noise: '森林风声与鸟鸣', time: '06:42', icon: '♧',
    artworkLabel: '绿树与天空', videoUrl: './media/scenes/forest.webm', posterUrl: './media/scenes/forest.webp', ambienceUrl: './media/ambience/forest.ogg',
    visualCredit: 'Pexels contributor · Pexels', visualSourceUrl: 'https://www.pexels.com/video/green-trees-and-beautiful-sky-26840816/', visualLicenseUrl: pexelsLicense,
    audioCredit: 'Ambient_House · Pixabay', audioSourceUrl: 'https://pixabay.com/zh/sound-effects/nature-forest-park-with-wind-and-bird-calls-321622/', audioLicenseUrl: pixabayLicense,
  },
  {
    id: 'coast', name: '海边', noise: '轻柔海浪与远处海鸥', time: '18:27', icon: '≈',
    artworkLabel: '宁静沙滩海浪', videoUrl: './media/scenes/coast.webm', posterUrl: './media/scenes/coast.webp', ambienceUrl: './media/ambience/coast.ogg',
    visualCredit: '정규송 Nui MALAMA · Pexels', visualSourceUrl: 'https://www.pexels.com/video/serene-ocean-waves-on-sandy-beach-36494874/', visualLicenseUrl: pexelsLicense,
    audioCredit: 'JonathanSlatterMusic · Pixabay', audioSourceUrl: 'https://pixabay.com/zh/sound-effects/nature-sea-gently-lapping-waves-far-away-seagulls-486892/', audioLicenseUrl: pixabayLicense,
  },
  {
    id: 'cafe', name: '咖啡馆', noise: '咖啡馆低语', time: '15:06', icon: '⌇',
    artworkLabel: '咖啡馆室内窗景', videoUrl: './media/scenes/cafe.webm', posterUrl: './media/scenes/cafe.webp', ambienceUrl: './media/ambience/cafe.ogg',
    visualCredit: 'Bonus Studio · Pexels', visualSourceUrl: 'https://www.pexels.com/video/inside-an-empty-cafe-5498709/', visualLicenseUrl: pexelsLicense,
    audioCredit: 'mikemoons · Freesound CC0', audioSourceUrl: 'https://freesound.org/people/mikemoons/sounds/579500/', audioLicenseUrl: cc0License,
  },
] as const;

export function getSceneMedia(id: SceneId): SceneMedia {
  return sceneMedia.find(scene => scene.id === id)!;
}
