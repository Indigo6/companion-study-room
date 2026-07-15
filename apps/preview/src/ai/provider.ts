export interface AiProvider {
  readonly label: string;
  ask(question: string): Promise<string>;
  inspectFrame(frame: Blob): Promise<'present' | 'absent' | 'uncertain'>;
}

export interface DesktopAiBridge {
  ask(question: string, config?: { baseUrl: string; model: string }): Promise<string>;
  inspect(image: string, config?: { baseUrl: string; model: string }): Promise<'present' | 'absent' | 'uncertain'>;
}

export class DemoAiProvider implements AiProvider {
  readonly label = '本地演示回复';
  async ask(): Promise<string> {
    return '先写下今天最小的一步，完成它以后再决定下一步。现在，先专注十分钟。';
  }
  async inspectFrame(): Promise<'present'> { return 'present'; }
}

export class ApiAiProvider implements AiProvider {
  readonly label = '已连接 AI 服务';
  constructor(private readonly endpoint: string, private readonly fetcher: typeof fetch = fetch) {}

  async ask(question: string): Promise<string> {
    const response = await this.fetcher(`${this.endpoint}/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }),
    });
    if (!response.ok) throw new Error(`AI 服务返回 ${response.status}`);
    const payload = await response.json() as { answer?: string };
    if (!payload.answer) throw new Error('AI 服务没有返回 answer');
    return payload.answer;
  }

  async inspectFrame(frame: Blob): Promise<'present' | 'absent' | 'uncertain'> {
    const image = await blobToDataUrl(frame);
    const response = await this.fetcher(`${this.endpoint}/vision`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image }),
    });
    if (!response.ok) throw new Error(`视觉服务返回 ${response.status}`);
    const payload = await response.json() as { status?: string };
    if (payload.status !== 'present' && payload.status !== 'absent' && payload.status !== 'uncertain') return 'uncertain';
    return payload.status;
  }
}

export class DesktopAiProvider implements AiProvider {
  readonly label = '桌面 AI 服务';
  constructor(private readonly bridge: DesktopAiBridge, private readonly config?: { baseUrl: string; model: string }) {}
  ask(question: string): Promise<string> { return this.bridge.ask(question, this.config); }
  async inspectFrame(frame: Blob): Promise<'present' | 'absent' | 'uncertain'> {
    return this.bridge.inspect(await blobToDataUrl(frame), this.config);
  }
}

export class CompatibleAiProvider implements AiProvider {
  readonly label = '自定义 AI 服务';
  constructor(private readonly config: { baseUrl: string; model: string; apiKey: string }, private readonly fetcher: typeof fetch = fetch) {}
  async ask(question: string): Promise<string> {
    const response = await this.completion([{ role: 'system', content: '你是简洁、支持性的学习伙伴。' }, { role: 'user', content: question }]);
    return response;
  }
  async inspectFrame(frame: Blob): Promise<'present' | 'absent' | 'uncertain'> {
    const image = await blobToDataUrl(frame);
    const answer = (await this.completion([{ role: 'system', content: '只回答 present、absent 或 uncertain。' }, { role: 'user', content: [{ type: 'image_url', image_url: { url: image } }] }])).toLowerCase();
    return answer.includes('absent') ? 'absent' : answer.includes('present') ? 'present' : 'uncertain';
  }
  private async completion(messages: unknown[]): Promise<string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.apiKey) headers.Authorization = `Bearer ${this.config.apiKey}`;
    const response = await this.fetcher(`${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers, body: JSON.stringify({ model: this.config.model, messages, temperature: 0.2, max_tokens: 500 }) });
    if (!response.ok) throw new Error(`AI 服务返回 ${response.status}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error('AI 服务响应格式不兼容');
    return content;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('无法读取检查帧'));
    reader.readAsDataURL(blob);
  });
}

export function createAiProvider(endpoint?: string, desktopBridge?: DesktopAiBridge): AiProvider {
  if (desktopBridge) return new DesktopAiProvider(desktopBridge);
  return endpoint ? new ApiAiProvider(endpoint) : new DemoAiProvider();
}
