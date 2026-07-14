import { describe, expect, it, vi } from 'vitest';
import { ApiAiProvider, DemoAiProvider } from './provider';

describe('AI providers', () => {
  it('keeps a useful offline demo response', async () => {
    await expect(new DemoAiProvider().ask('怎么开始？')).resolves.toContain('最小的一步');
  });

  it('posts questions to a configurable compatible endpoint', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ answer: '先列提纲' }) });
    const provider = new ApiAiProvider('/api/ai/chat', fetcher);
    await expect(provider.ask('如何复习？')).resolves.toBe('先列提纲');
    expect(fetcher).toHaveBeenCalledWith('/api/ai/chat', expect.objectContaining({ method: 'POST' }));
  });
});
