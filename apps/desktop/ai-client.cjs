function configuration(overrides = {}) {
  const baseUrl = (overrides.baseUrl || process.env.AI_BASE_URL || '').replace(/\/$/, '');
  const textModel = overrides.model || process.env.AI_TEXT_MODEL;
  const visionModel = overrides.model || process.env.AI_VISION_MODEL || textModel;
  if (!baseUrl || !textModel) throw new Error('请配置 AI_BASE_URL 和 AI_TEXT_MODEL');
  return { baseUrl, textModel, visionModel, apiKey: overrides.apiKey || process.env.AI_API_KEY };
}

async function complete(model, messages, fetcher = fetch, overrides = {}) {
  const config = configuration(overrides);
  const headers = { 'Content-Type': 'application/json' };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
  const response = await fetcher(`${config.baseUrl}/chat/completions`, {
    method: 'POST', headers,
    body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 500 }),
  });
  if (!response.ok) throw new Error(`AI 服务返回 ${response.status}`);
  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI 服务响应格式不兼容');
  return String(content).trim();
}

async function ask(question, fetcher, overrides = {}) {
  if (!question || question.length > 4000) throw new Error('问题不能为空且不能超过 4000 字符');
  const config = configuration(overrides);
  return complete(config.textModel, [
    { role: 'system', content: '你是简洁、支持性的学习伙伴。帮助用户拆解任务和理解知识，不编造事实。' },
    { role: 'user', content: question },
  ], fetcher, overrides);
}

async function inspect(image, fetcher, overrides = {}) {
  if (!image?.startsWith('data:image/jpeg;base64,') || image.length > 1_500_000) throw new Error('检查帧格式无效或过大');
  const config = configuration(overrides);
  const result = (await complete(config.visionModel, [
    { role: 'system', content: '判断自习者是否在摄像头前。只回答 present、absent 或 uncertain。' },
    { role: 'user', content: [{ type: 'text', text: '判断画面中的自习者是否在席。' }, { type: 'image_url', image_url: { url: image } }] },
  ], fetcher, overrides)).toLowerCase();
  return ['present', 'absent', 'uncertain'].find(value => result.includes(value)) || 'uncertain';
}

module.exports = { ask, inspect };
