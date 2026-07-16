import { getSceneMedia, type SceneId } from '../scenes/sceneMedia';
import { normalizedVolume } from './whiteNoise';

type AudioFactory = () => HTMLAudioElement;
type Fallback = (scene: SceneId, volume: number, muted: boolean) => void;

export class MediaAmbienceEngine {
  private active?: HTMLAudioElement;
  private activeScene?: SceneId;
  private fadeTimer?: number;
  private volume = 0;
  private muted = false;

  constructor(
    private readonly createAudio: AudioFactory = () => new Audio(),
    private readonly onFallback: Fallback = () => undefined,
  ) {}

  async start(scene: SceneId, volume: number, muted: boolean): Promise<void> {
    this.volume = volume;
    this.muted = muted;
    const channel = this.prepare(scene);
    channel.volume = normalizedVolume(volume, muted);
    this.active = channel;
    this.activeScene = scene;
    try { await channel.play(); }
    catch { this.onFallback(scene, volume, muted); }
  }

  update(scene: SceneId, volume: number, muted: boolean): void {
    this.volume = volume;
    this.muted = muted;
    if (!this.active) return;
    if (scene === this.activeScene) {
      this.active.volume = normalizedVolume(volume, muted);
      return;
    }
    this.crossFade(scene);
  }

  stop(): void {
    if (this.fadeTimer) window.clearInterval(this.fadeTimer);
    this.active?.pause();
    this.active = undefined;
    this.activeScene = undefined;
  }

  private prepare(scene: SceneId): HTMLAudioElement {
    const channel = this.createAudio();
    channel.src = getSceneMedia(scene).ambienceUrl;
    channel.loop = true;
    channel.preload = 'auto';
    channel.addEventListener('error', () => this.onFallback(scene, this.volume, this.muted), { once: true });
    return channel;
  }

  private crossFade(scene: SceneId): void {
    const previous = this.active!;
    const next = this.prepare(scene);
    const target = normalizedVolume(this.volume, this.muted);
    next.volume = 0;
    this.active = next;
    this.activeScene = scene;
    void next.play().catch(() => this.onFallback(scene, this.volume, this.muted));
    if (this.fadeTimer) window.clearInterval(this.fadeTimer);
    let step = 0;
    this.fadeTimer = window.setInterval(() => {
      step += 1;
      const progress = Math.min(1, step / 12);
      previous.volume = Math.max(0, target * (1 - progress));
      next.volume = target * progress;
      if (progress === 1) {
        window.clearInterval(this.fadeTimer);
        this.fadeTimer = undefined;
        previous.pause();
      }
    }, 50);
  }
}
