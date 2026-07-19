import assert from 'node:assert/strict';
import test from 'node:test';
import { createPortableUpdateChecker } from '../apps/desktop/portable-update-checker.cjs';
import { createUpdateManager } from '../apps/desktop/update-manager.cjs';

function response(body, ok = true) { return { ok, status: ok ? 200 : 500, json: async () => body }; }
function timers() { return { setTimeout: () => 1, setInterval: () => 1 }; }

test('portable checker reports a newer stable GitHub release without downloading it', async () => {
  const requests = [];
  const checker = createPortableUpdateChecker({ currentVersion: '0.1.0', owner: 'Indigo6', repo: 'companion-study-room', fetch: async url => { requests.push(url); return response({ tag_name: 'v0.2.0', html_url: 'https://github.com/Indigo6/companion-study-room/releases/tag/v0.2.0', draft: false, prerelease: false }); } });
  const available = [];
  let downloaded = false;
  checker.on('update-available', info => available.push(info));
  checker.on('update-downloaded', () => { downloaded = true; });
  await checker.checkForUpdates();
  assert.deepEqual(requests, ['https://api.github.com/repos/Indigo6/companion-study-room/releases/latest']);
  assert.deepEqual(available, [{ version: '0.2.0', portable: true, releaseUrl: 'https://github.com/Indigo6/companion-study-room/releases/tag/v0.2.0' }]);
  assert.equal(downloaded, false);
});

test('portable checker ignores equal and prerelease versions', async () => {
  for (const release of [
    { tag_name: 'v0.1.0', html_url: 'https://github.com/Indigo6/companion-study-room/releases/tag/v0.1.0', draft: false, prerelease: false },
    { tag_name: 'v0.2.0-beta.1', html_url: 'https://github.com/Indigo6/companion-study-room/releases/tag/v0.2.0-beta.1', draft: false, prerelease: true },
  ]) {
    const checker = createPortableUpdateChecker({ currentVersion: '0.1.0', owner: 'Indigo6', repo: 'companion-study-room', fetch: async () => response(release) });
    let unavailable = false;
    checker.on('update-not-available', () => { unavailable = true; });
    await checker.checkForUpdates();
    assert.equal(unavailable, true);
  }
});

test('portable checker rejects release links outside the configured GitHub repository', async () => {
  const checker = createPortableUpdateChecker({ currentVersion: '0.1.0', owner: 'Indigo6', repo: 'companion-study-room', fetch: async () => response({ tag_name: 'v0.2.0', html_url: 'https://evil.example/update.exe', draft: false, prerelease: false }) });
  await assert.rejects(() => checker.checkForUpdates(), /链接无效/);
});

test('portable manager opens the stored release page and never calls quitAndInstall', async () => {
  const checker = createPortableUpdateChecker({ currentVersion: '0.1.0', owner: 'Indigo6', repo: 'companion-study-room', fetch: async () => response({ tag_name: 'v0.2.0', html_url: 'https://github.com/Indigo6/companion-study-room/releases/tag/v0.2.0', draft: false, prerelease: false }) });
  checker.quitAndInstall = () => { throw new Error('must not install'); };
  const opened = [];
  const manager = createUpdateManager({ updater: checker, platform: 'win32', isPackaged: true, source: { provider: 'github', owner: 'Indigo6', repo: 'companion-study-room' }, openExternal: async url => { opened.push(url); }, ...timers() });
  manager.start();
  await manager.check();
  assert.deepEqual(manager.getState(), { status: 'available', version: '0.2.0', action: 'open-download' });
  assert.equal(await manager.install(), true);
  assert.deepEqual(opened, ['https://github.com/Indigo6/companion-study-room/releases/tag/v0.2.0']);
  manager.dismiss();
  assert.deepEqual(manager.getState(), { status: 'idle' });
});
