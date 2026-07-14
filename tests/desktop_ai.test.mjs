import assert from 'node:assert/strict';
import test from 'node:test';
import ai from '../apps/desktop/ai-client.cjs';

const original = { ...process.env };
test.afterEach(() => { process.env = { ...original }; });

test('desktop AI keeps credentials in the main process', async () => {
  process.env.AI_BASE_URL = 'http://localhost:11434/v1';
  process.env.AI_API_KEY = 'private';
  process.env.AI_TEXT_MODEL = 'study-model';
  let request;
  const fetcher = async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ choices: [{ message: { content: '先列出三点。' } }] }) };
  };
  assert.equal(await ai.ask('怎么复习？', fetcher), '先列出三点。');
  assert.equal(request.url, 'http://localhost:11434/v1/chat/completions');
  assert.equal(request.options.headers.Authorization, 'Bearer private');
});

test('desktop vision validates transient frame size and result', async () => {
  process.env.AI_BASE_URL = 'http://localhost:11434/v1';
  process.env.AI_TEXT_MODEL = 'text';
  process.env.AI_VISION_MODEL = 'vision';
  const fetcher = async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'present' } }] }) });
  assert.equal(await ai.inspect('data:image/jpeg;base64,AA==', fetcher), 'present');
  await assert.rejects(() => ai.inspect('bad', fetcher), /格式无效/);
});
