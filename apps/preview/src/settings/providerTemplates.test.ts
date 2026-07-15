import { describe, expect, it, vi } from 'vitest';
import { applyProviderTemplate, providerTemplates, testServiceConnection } from './providerTemplates';

describe('AI provider templates', () => {
  it('provides common hosted and local compatible endpoints', () => {
    expect(providerTemplates.openai.baseUrl).toBe('https://api.openai.com/v1');
    expect(providerTemplates.deepseek.baseUrl).toContain('deepseek.com');
    expect(providerTemplates.siliconflow.baseUrl).toContain('siliconflow.cn');
    expect(providerTemplates.ollama.requiresKey).toBe(false);
  });

  it('applies capability-specific model defaults without sharing service state', () => {
    expect(applyProviderTemplate('chat', 'deepseek')).toMatchObject({ provider: 'deepseek', model: 'deepseek-chat' });
    expect(applyProviderTemplate('vision', 'openai').model).not.toBe(applyProviderTemplate('speech', 'openai').model);
  });

  it('tests compatible endpoints without leaking the key into the URL', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true });
    await expect(testServiceConnection(applyProviderTemplate('chat', 'openai'), 'secret', fetcher as typeof fetch)).resolves.toBe(true);
    expect(fetcher).toHaveBeenCalledWith('https://api.openai.com/v1/models', expect.objectContaining({ headers: { Authorization: 'Bearer secret' } }));
  });
});
