import { describe, expect, it, vi } from 'vitest';
import { ApiAiProvider, createAiProvider, DemoAiProvider } from './provider';

describe('AI providers', () => {
  it('keeps a useful offline demo response', async () => {
    await expect(new DemoAiProvider().ask('怎么开始？')).resolves.toContain('最小的一步');
    await expect(new DemoAiProvider().inspectFrame(new Blob(['frame']))).resolves.toBe('present');
  });

  it('posts questions to a configurable compatible endpoint', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ answer: '先列提纲' }) });
    const provider = new ApiAiProvider('/api/ai', fetcher);
    await expect(provider.ask('如何复习？')).resolves.toBe('先列提纲');
    expect(fetcher).toHaveBeenCalledWith('/api/ai/chat', expect.objectContaining({ method: 'POST' }));
  });

  it('uploads a transient frame only when API vision is explicitly used', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'absent' }) });
    const provider = new ApiAiProvider('/api/ai', fetcher);
    await expect(provider.inspectFrame(new Blob(['frame'], { type: 'image/jpeg' }))).resolves.toBe('absent');
    expect(fetcher).toHaveBeenCalledWith('/api/ai/vision', expect.objectContaining({ method: 'POST' }));
  });

  it('prefers the isolated desktop bridge when available', async () => {
    const bridge = { ask: vi.fn().mockResolvedValue('桌面回答'), inspect: vi.fn().mockResolvedValue('present' as const) };
    await expect(createAiProvider('/api/ai', bridge).ask('问题')).resolves.toBe('桌面回答');
  });
});
