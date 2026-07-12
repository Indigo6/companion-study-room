import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('keeps the approved planning source in the project', async () => {
  const markdown = await readFile(
    new URL('docs/superpowers/specs/2026-07-12-companion-study-room-product-plan.md', root),
    'utf8',
  );
  assert.match(markdown, /^# “陪伴自习室”多端 App 整体规划/m);
  assert.match(markdown, /^## 18\. 最终建议/m);
});

test('ships a complete and navigable standalone reader', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.match(html, /<title>陪伴自习室 · 产品规划<\/title>/);
  assert.match(html, /<meta name="viewport"/);
  assert.match(html, /id="reading-progress"/);
  assert.match(html, /aria-label="规划章节"/);
  assert.match(html, /id="section-18"/);
  assert.equal((html.match(/<section[^>]+id="section-\d+"/g) ?? []).length, 18);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(html, /@media print/);
  assert.match(html, /<script>/);
  assert.doesNotMatch(html, /<script[^>]+src=/);
  assert.doesNotMatch(html, /<link[^>]+stylesheet/);
});

