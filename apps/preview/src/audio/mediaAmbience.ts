import { getSceneMedia, type SceneId } from '../scenes/sceneMedia';
import { normalizedVolume } from './whiteNoise';

type AudioFactory = () => HTMLAudioElement;
type Fallback = (scene: SceneId, volume: number, muted: boolean) => void;

export class MediaAmbienceEngine {
  private active?: HTMLAudioElement;
  private activeScene?: SceneId;
  private volume = 0;
  private muted = false;

  constructor(
    private readonly createAudio: AudioFactory = () => new Audio(),
    private readonly onFallback: Fallback = () => undefined,
    private readonly onPlaying: () => void = () => undefined,
  ) {}

  async start(scene: SceneId, volume: number, muted: boolean): Promise<void> {
    this.volume = volume;
    this.muted = muted;
    this.active?.pause();
    const channel = this.prepare(scene);
    channel.volume = normalizedVolume(volume, muted);
    this.active = channel;
    this.activeScene = scene;
    try { await channel.play(); this.onPlaying(); }
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
    const previous = this.active;
    previous.pause();
    const next = this.prepare(scene);
    next.volume = normalizedVolume(volume, muted);
    this.active = next;
    this.activeScene = scene;
    void next.play().then(() => this.onPlaying()).catch(() => this.onFallback(scene, this.volume, this.muted));
  }

  pause(): void { this.active?.pause(); }

  select(scene: SceneId, volume: number, muted: boolean): void {
    this.volume = volume;
    this.muted = muted;
    this.active?.pause();
    const channel = this.prepare(scene);
    channel.volume = normalizedVolume(volume, muted);
    this.active = channel;
    this.activeScene = scene;
  }

  async resume(): Promise<void> {
    if (!this.active) return;
    try { await this.active.play(); this.onPlaying(); }
    catch { if (this.activeScene) this.onFallback(this.activeScene, this.volume, this.muted); }
  }

  stop(): void {
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

}
