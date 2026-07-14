export type SoundScene = 'rain' | 'forest' | 'coast' | 'cafe';

export interface SceneSound {
  filter: BiquadFilterType;
  frequency: number;
  gain: number;
}

const profiles: Record<SoundScene, SceneSound> = {
  rain: { filter: 'lowpass', frequency: 1400, gain: 0.34 },
  forest: { filter: 'bandpass', frequency: 720, gain: 0.2 },
  coast: { filter: 'lowpass', frequency: 520, gain: 0.3 },
  cafe: { filter: 'bandpass', frequency: 1050, gain: 0.16 },
};

export const getSceneSound = (scene: SoundScene): SceneSound => profiles[scene];

export function normalizedVolume(volume: number, muted: boolean): number {
  if (muted) return 0;
  return Math.max(0, Math.min(100, volume)) / 100;
}

export class WhiteNoiseEngine {
  private context?: AudioContext;
  private source?: AudioBufferSourceNode;
  private filter?: BiquadFilterNode;
  private gain?: GainNode;

  async start(scene: SoundScene, volume: number, muted: boolean): Promise<void> {
    if (!this.context) this.createGraph();
    await this.context!.resume();
    this.update(scene, volume, muted);
  }

  update(scene: SoundScene, volume: number, muted: boolean): void {
    if (!this.context || !this.filter || !this.gain) return;
    const profile = getSceneSound(scene);
    this.filter.type = profile.filter;
    this.filter.frequency.setTargetAtTime(profile.frequency, this.context.currentTime, 0.15);
    this.gain.gain.setTargetAtTime(profile.gain * normalizedVolume(volume, muted), this.context.currentTime, 0.08);
  }

  stop(): void {
    this.source?.stop();
    void this.context?.close();
    this.context = undefined;
    this.source = undefined;
  }

  private createGraph(): void {
    const AudioContextClass = window.AudioContext;
    this.context = new AudioContextClass();
    this.filter = this.context.createBiquadFilter();
    this.gain = this.context.createGain();
    const buffer = this.context.createBuffer(1, this.context.sampleRate * 3, this.context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) samples[index] = Math.random() * 2 - 1;
    this.source = this.context.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;
    this.source.connect(this.filter).connect(this.gain).connect(this.context.destination);
    this.source.start();
  }
}
