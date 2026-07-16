import { afterEach, describe, expect, it, vi } from 'vitest';
import { MediaAmbienceEngine } from './mediaAmbience';

class FakeAudio extends EventTarget {
  src = '';
  loop = false;
  preload = '';
  volume = 0;
  currentTime = 0;
  play = vi.fn(async () => undefined);
  pause = vi.fn();
}

describe('MediaAmbienceEngine', () => {
  afterEach(() => vi.useRealTimers());

  it('starts the selected recorded ambience as a loop', async () => {
    const channels: FakeAudio[] = [];
    const engine = new MediaAmbienceEngine(() => {
      const audio = new FakeAudio(); channels.push(audio); return audio as unknown as HTMLAudioElement;
    });

    await engine.start('rain', 60, false);

    expect(channels[0].src).toBe('./media/ambience/rain.ogg');
    expect(channels[0].loop).toBe(true);
    expect(channels[0].volume).toBeCloseTo(0.6);
    expect(channels[0].play).toHaveBeenCalledOnce();
  });

  it('cross-fades to a different scene and applies mute changes', async () => {
    vi.useFakeTimers();
    const channels: FakeAudio[] = [];
    const engine = new MediaAmbienceEngine(() => {
      const audio = new FakeAudio(); channels.push(audio); return audio as unknown as HTMLAudioElement;
    });
    await engine.start('rain', 80, false);

    engine.update('coast', 80, false);
    await vi.advanceTimersByTimeAsync(650);

    expect(channels[0].pause).toHaveBeenCalledOnce();
    expect(channels[1].src).toBe('./media/ambience/coast.ogg');
    expect(channels[1].volume).toBeCloseTo(0.8);
    engine.update('coast', 80, true);
    expect(channels[1].volume).toBe(0);
  });

  it('reports media failures for procedural fallback', async () => {
    const fallback = vi.fn();
    const audio = new FakeAudio();
    const engine = new MediaAmbienceEngine(() => audio as unknown as HTMLAudioElement, fallback);
    await engine.start('forest', 50, false);
    audio.dispatchEvent(new Event('error'));
    expect(fallback).toHaveBeenCalledWith('forest', 50, false);
  });
});
