import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('desktop app uses a scroll-free dynamic viewport shell', async () => {
  const css = await readFile(new URL('../apps/preview/src/responsive-shell.css', import.meta.url), 'utf8');
  assert.match(css, /height:\s*100dvh/);
  assert.match(css, /grid-template-rows:/);
  assert.match(css, /overflow:\s*hidden/);
  assert.match(css, /@media\s*\(max-height:\s*780px\)/);
});
