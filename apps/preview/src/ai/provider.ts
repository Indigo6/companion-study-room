export interface AiProvider {
  readonly label: string;
  ask(question: string): Promise<string>;
}

export class DemoAiProvider implements AiProvider {
  readonly label = '本地演示回复';
  async ask(): Promise<string> {
    return '先写下今天最小的一步，完成它以后再决定下一步。现在，先专注十分钟。';
  }
}

export class ApiAiProvider implements AiProvider {
  readonly label = '已连接 AI 服务';
  constructor(private readonly endpoint: string, private readonly fetcher: typeof fetch = fetch) {}

  async ask(question: string): Promise<string> {
    const response = await this.fetcher(this.endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }),
    });
    if (!response.ok) throw new Error(`AI 服务返回 ${response.status}`);
    const payload = await response.json() as { answer?: string };
    if (!payload.answer) throw new Error('AI 服务没有返回 answer');
    return payload.answer;
  }
}

export function createAiProvider(endpoint?: string): AiProvider {
  return endpoint ? new ApiAiProvider(endpoint) : new DemoAiProvider();
}
