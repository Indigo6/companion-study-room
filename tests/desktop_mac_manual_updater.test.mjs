import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { createMacManualUpdater } from '../apps/desktop/mac-manual-updater.cjs';

const bytes = Buffer.from('signed update payload');
const sha512 = createHash('sha512').update(bytes).digest('base64');

function response(body) {
  return { ok: true, status: 200, json: async () => body, arrayBuffer: async () => Buffer.from(body) };
}

test('downloads and verifies a newer DMG from a generic HTTPS manifest', async () => {
  const requests = [];
  const writes = [];
  const updater = createMacManualUpdater({
    currentVersion: '0.1.0', arch: 'arm64', source: { provider: 'generic', url: 'https://updates.example.com/app' },
    fetch: async url => {
      requests.push(url);
      if (url.endsWith('.json')) return response({ version: '0.2.0', file: 'companion-0.2.0-mac-arm64.dmg', sha512, size: bytes.length });
      return response(bytes);
    },
    saveFile: async (path, payload, onProgress) => { writes.push([path, Buffer.from(payload)]); onProgress(bytes.length); },
    downloadDirectory: '/tmp/updates',
  });
  const events = [];
  updater.on('update-available', info => events.push(['available', info.version]));
  updater.on('download-progress', info => events.push(['progress', info.percent]));
  updater.on('update-downloaded', info => events.push(['downloaded', info.downloadedFile]));

  await updater.checkForUpdates();
  assert.deepEqual(requests, ['https://updates.example.com/app/latest-mac-arm64.json', 'https://updates.example.com/app/companion-0.2.0-mac-arm64.dmg']);
  assert.deepEqual(writes, [['/tmp/updates/companion-0.2.0-mac-arm64.dmg', bytes]]);
  assert.deepEqual(events, [['available', '0.2.0'], ['progress', 100], ['downloaded', '/tmp/updates/companion-0.2.0-mac-arm64.dmg']]);
});

test('finds the architecture manifest in a public GitHub release', async () => {
  const requests = [];
  const updater = createMacManualUpdater({
    currentVersion: '0.1.0', arch: 'x64', source: { provider: 'github', owner: 'study', repo: 'companion' },
    fetch: async url => {
      requests.push(url);
      if (url.includes('/releases/latest')) return response({ assets: [{ name: 'latest-mac-x64.json', browser_download_url: 'https://github.test/manifest' }] });
      if (url.endsWith('/manifest')) return response({ version: '0.2.0', file: 'companion-0.2.0-mac-x64.dmg', url: 'https://github.test/update.dmg', sha512, size: bytes.length });
      return response(bytes);
    },
    saveFile: async () => {}, downloadDirectory: '/tmp/updates',
  });
  await updater.checkForUpdates();
  assert.deepEqual(requests, ['https://api.github.com/repos/study/companion/releases/latest', 'https://github.test/manifest', 'https://github.test/update.dmg']);
});

test('does not download the same or an older macOS version', async () => {
  let downloads = 0;
  const updater = createMacManualUpdater({
    currentVersion: '0.2.0', arch: 'arm64', source: { provider: 'generic', url: 'https://updates.example.com' },
    fetch: async () => response({ version: '0.2.0', file: 'same.dmg', sha512, size: bytes.length }),
    saveFile: async () => { downloads += 1; }, downloadDirectory: '/tmp',
  });
  let unavailable = false;
  updater.on('update-not-available', () => { unavailable = true; });
  await updater.checkForUpdates();
  assert.equal(downloads, 0);
  assert.equal(unavailable, true);
});

test('rejects a DMG whose SHA-512 does not match the manifest', async () => {
  const updater = createMacManualUpdater({
    currentVersion: '0.1.0', arch: 'arm64', source: { provider: 'generic', url: 'https://updates.example.com' },
    fetch: async url => url.endsWith('.json') ? response({ version: '0.2.0', file: 'bad.dmg', sha512: 'wrong', size: bytes.length }) : response(bytes),
    saveFile: async () => {}, downloadDirectory: '/tmp',
  });
  await assert.rejects(() => updater.checkForUpdates(), /校验失败/);
});
