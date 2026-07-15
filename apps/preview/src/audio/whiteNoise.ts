export type SoundScene = 'rain' | 'forest' | 'coast' | 'cafe';
export type SoundTexture = 'rainfall' | 'pink-breeze' | 'tidal-brown' | 'room-hum';

export interface SceneSound {
  texture: SoundTexture;
  filter: BiquadFilterType;
  frequency: number;
  gain: number;
}

const profiles: Record<SoundScene, SceneSound> = {
  rain: { texture: 'rainfall', filter: 'highpass', frequency: 680, gain: 0.3 },
  forest: { texture: 'pink-breeze', filter: 'lowpass', frequency: 2400, gain: 0.22 },
  coast: { texture: 'tidal-brown', filter: 'lowpass', frequency: 760, gain: 0.38 },
  cafe: { texture: 'room-hum', filter: 'bandpass', frequency: 1100, gain: 0.2 },
};

export const getSceneSound = (scene: SoundScene): SceneSound => profiles[scene];

export function normalizedVolume(volume: number, muted: boolean): number {
  if (muted) return 0;
  return Math.max(0, Math.min(100, volume)) / 100;
}

export function generateSceneSamples(
  scene: SoundScene,
  length: number,
  sampleRate: number,
  random: () => number = Math.random,
): Float32Array {
  const output = new Float32Array(length);
  let brown = 0;
  let pink = 0;
  let droplet = 0;

  for (let index = 0; index < length; index += 1) {
    const white = random() * 2 - 1;
    const time = index / sampleRate;
    brown = Math.max(-1, Math.min(1, brown * 0.995 + white * 0.035));
    pink = pink * 0.94 + white * 0.06;

    if (scene === 'rain') {
      if (random() > 0.9985) droplet = 1;
      droplet *= 0.985;
      output[index] = white * 0.24 + droplet * Math.sin(time * 7600) * 0.34;
    } else if (scene === 'forest') {
      const breeze = 0.45 + 0.25 * Math.sin(time * 0.43);
      const birdWindow = Math.max(0, Math.sin(time * 0.71 - 1.2) - 0.93) * 5;
      output[index] = pink * breeze + Math.sin(time * 8600 + Math.sin(time * 18) * 3) * birdWindow * 0.13;
    } else if (scene === 'coast') {
      const tide = 0.18 + Math.pow((Math.sin(time * 0.46) + 1) / 2, 2) * 0.82;
      output[index] = brown * tide + white * tide * 0.035;
    } else {
      const roomTone = brown * 0.22 + Math.sin(time * Math.PI * 120) * 0.025;
      const clink = Math.max(0, Math.sin(time * 0.37 - 2.4) - 0.995) * Math.sin(time * 12500) * 8;
      output[index] = roomTone + clink;
    }
  }
  return output;
}

export class WhiteNoiseEngine {
  private context?: AudioContext;
  private source?: AudioBufferSourceNode;
  private filter?: BiquadFilterNode;
  private gain?: GainNode;
  private currentScene?: SoundScene;

  async start(scene: SoundScene, volume: number, muted: boolean): Promise<void> {
    if (!this.context) this.createGraph();
    await this.context!.resume();
    this.update(scene, volume, muted);
  }

  update(scene: SoundScene, volume: number, muted: boolean): void {
    if (!this.context || !this.filter || !this.gain) return;
    const profile = getSceneSound(scene);
    if (scene !== this.currentScene) this.switchSource(scene);
    this.filter.type = profile.filter;
    this.filter.frequency.setTargetAtTime(profile.frequency, this.context.currentTime, 0.15);
    this.gain.gain.setTargetAtTime(profile.gain * normalizedVolume(volume, muted), this.context.currentTime, 0.08);
  }

  stop(): void {
    this.source?.stop();
    void this.context?.close();
    this.context = undefined;
    this.source = undefined;
    this.currentScene = undefined;
  }

  private createGraph(): void {
    this.context = new window.AudioContext();
    this.filter = this.context.createBiquadFilter();
    this.gain = this.context.createGain();
    this.filter.connect(this.gain).connect(this.context.destination);
  }

  private switchSource(scene: SoundScene): void {
    if (!this.context || !this.filter) return;
    this.source?.stop();
    const seconds = 16;
    const buffer = this.context.createBuffer(1, this.context.sampleRate * seconds, this.context.sampleRate);
    buffer.copyToChannel(generateSceneSamples(scene, buffer.length, this.context.sampleRate), 0);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.filter);
    source.start();
    this.source = source;
    this.currentScene = scene;
  }
}
