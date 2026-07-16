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

export const sceneMedia: readonly SceneMedia[] = [
  {
    id: 'rain', name: '雨夜书房', noise: '窗外雨声', time: '22:18', icon: '⌁',
    artworkLabel: '雨夜城市窗景', videoUrl: './media/scenes/rain.webm', posterUrl: './media/scenes/rain.webp', ambienceUrl: './media/ambience/rain.ogg',
    visualCredit: 'leegusan · Pexels', visualSourceUrl: 'https://www.pexels.com/video/cozy-cafe-window-view-on-a-rainy-day-34717162/', visualLicenseUrl: pexelsLicense,
    audioCredit: 'CC0 field recordings · edited by 伴读', audioSourceUrl: 'https://freesound.org/search/?q=rain&f=license%3A%22Creative+Commons+0%22', audioLicenseUrl: cc0License,
  },
  {
    id: 'forest', name: '森林晨雾', noise: '林间风声', time: '06:42', icon: '♧',
    artworkLabel: '晨雾森林窗景', videoUrl: './media/scenes/forest.webm', posterUrl: './media/scenes/forest.webp', ambienceUrl: './media/ambience/forest.ogg',
    visualCredit: 'LIUKAI · Pexels', visualSourceUrl: 'https://www.pexels.com/video/sunlight-filtering-through-forest-mist-36805627/', visualLicenseUrl: pexelsLicense,
    audioCredit: 'CC0 field recordings · edited by 伴读', audioSourceUrl: 'https://freesound.org/search/?q=forest&f=license%3A%22Creative+Commons+0%22', audioLicenseUrl: cc0License,
  },
  {
    id: 'coast', name: '海边黄昏', noise: '缓慢潮声', time: '18:27', icon: '≈',
    artworkLabel: '黄昏海岸窗景', videoUrl: './media/scenes/coast.webm', posterUrl: './media/scenes/coast.webp', ambienceUrl: './media/ambience/coast.ogg',
    visualCredit: 'Dey Kheireddine · Pexels', visualSourceUrl: 'https://www.pexels.com/video/ocean-during-sunset-3937539/', visualLicenseUrl: pexelsLicense,
    audioCredit: 'CC0 field recordings · edited by 伴读', audioSourceUrl: 'https://freesound.org/search/?q=ocean&f=license%3A%22Creative+Commons+0%22', audioLicenseUrl: cc0License,
  },
  {
    id: 'cafe', name: '安静咖啡馆', noise: '咖啡馆低语', time: '15:06', icon: '⌇',
    artworkLabel: '咖啡馆室内窗景', videoUrl: './media/scenes/cafe.webm', posterUrl: './media/scenes/cafe.webp', ambienceUrl: './media/ambience/cafe.ogg',
    visualCredit: 'Quốc Thống Phạm Gia · Pexels', visualSourceUrl: 'https://www.pexels.com/video/relaxed-reading-in-a-cozy-cafe-setting-34280283/', visualLicenseUrl: pexelsLicense,
    audioCredit: 'CC0 field recordings · edited by 伴读', audioSourceUrl: 'https://freesound.org/search/?q=cafe&f=license%3A%22Creative+Commons+0%22', audioLicenseUrl: cc0License,
  },
] as const;

export function getSceneMedia(id: SceneId): SceneMedia {
  return sceneMedia.find(scene => scene.id === id)!;
}
