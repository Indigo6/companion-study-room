import { describe, expect, it, vi } from 'vitest';
import { buildTtsRequest, pickVoice, requestCompatibleSpeech } from './speech';

describe('companion speech', () => {
  it('builds an OpenAI-compatible speech request', () => {
    expect(buildTtsRequest('你好', { model: 'tts-model', voice: 'alloy' })).toEqual({ model: 'tts-model', voice: 'alloy', input: '你好', response_format: 'mp3' });
  });

  it('selects a requested system voice and safely falls back', () => {
    const voices = [{ voiceURI: 'a' }, { voiceURI: 'b' }] as SpeechSynthesisVoice[];
    expect(pickVoice(voices, 'b')?.voiceURI).toBe('b');
    expect(pickVoice(voices, 'missing')?.voiceURI).toBe('a');
  });

  it('requests configured online speech with authorization', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['audio']) });
    await requestCompatibleSpeech('你好', { baseUrl: 'https://speech.test/v1', model: 'tts', voice: 'warm' }, 'key', fetcher);
    expect(fetcher).toHaveBeenCalledWith('https://speech.test/v1/audio/speech', expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer key' }) }));
  });
});
