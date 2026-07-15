import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowUrl = new URL('../.github/workflows/build-desktop.yml', import.meta.url);

test('desktop workflow builds downloadable Windows and macOS installers on demand', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /runs-on: windows-latest/);
  assert.match(workflow, /runs-on: macos-15\b/);
  assert.match(workflow, /runs-on: macos-15-intel/);
  assert.equal((workflow.match(/npm run preview:test -- --run/g) ?? []).length, 3);
  assert.match(workflow, /electron-builder --win nsis --x64/);
  assert.match(workflow, /electron-builder --mac dmg --arm64/);
  assert.match(workflow, /electron-builder --mac dmg --x64/);
  assert.equal((workflow.match(/actions\/upload-artifact@v4/g) ?? []).length, 3);
  assert.match(workflow, /retention-days: 14/);
});
