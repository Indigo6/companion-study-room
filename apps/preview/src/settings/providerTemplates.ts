import type { ProviderId, ServiceId, ServicePreference } from './preferences';

export const providerTemplates: Record<ProviderId, { name: string; baseUrl: string; requiresKey: boolean; models: Record<ServiceId, string> }> = {
  openai: { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', requiresKey: true, models: { chat: 'gpt-4.1-mini', vision: 'gpt-4.1-mini', speech: 'gpt-4o-mini-tts' } },
  deepseek: { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', requiresKey: true, models: { chat: 'deepseek-chat', vision: 'deepseek-chat', speech: '' } },
  siliconflow: { name: '硅基流动', baseUrl: 'https://api.siliconflow.cn/v1', requiresKey: true, models: { chat: 'Qwen/Qwen2.5-7B-Instruct', vision: 'Qwen/Qwen2.5-VL-7B-Instruct', speech: '' } },
  ollama: { name: 'Ollama', baseUrl: 'http://127.0.0.1:11434/v1', requiresKey: false, models: { chat: 'qwen2.5:7b', vision: 'qwen2.5vl:7b', speech: '' } },
  custom: { name: '自定义兼容服务', baseUrl: '', requiresKey: true, models: { chat: '', vision: '', speech: '' } },
};

export function applyProviderTemplate(service: ServiceId, provider: ProviderId): ServicePreference {
  const template = providerTemplates[provider];
  return { provider, enabled: true, baseUrl: template.baseUrl, model: template.models[service], ...(service === 'speech' ? { voice: 'alloy' } : {}) };
}

export async function testServiceConnection(config: ServicePreference, apiKey: string, fetcher: typeof fetch = fetch): Promise<boolean> {
  const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
  const response = await fetcher(`${config.baseUrl.replace(/\/$/, '')}/models`, { headers });
  if (!response.ok) throw new Error(`连接失败（HTTP ${response.status}）`);
  return true;
}
