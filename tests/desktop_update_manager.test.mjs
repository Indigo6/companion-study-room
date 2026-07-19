import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { createUpdateManager, resolveUpdateSource } from '../apps/desktop/update-manager.cjs';

class FakeUpdater extends EventEmitter {
  checks = 0;
  installs = 0;
  feed = null;
  setFeedURL(value) { this.feed = value; }
  async checkForUpdates() { this.checks += 1; return { updateInfo: { version: '0.2.0' } }; }
  quitAndInstall() { this.installs += 1; }
}

function createTimers() {
  const timeouts = [];
  const intervals = [];
  return {
    timeouts,
    intervals,
    setTimeout: callback => { timeouts.push(callback); return timeouts.length; },
    setInterval: callback => { intervals.push(callback); return intervals.length; },
  };
}

test('resolves public GitHub and HTTPS generic update sources', () => {
  assert.deepEqual(resolveUpdateSource({ provider: 'github', owner: 'study', repo: 'companion' }), { provider: 'github', owner: 'study', repo: 'companion' });
  assert.deepEqual(resolveUpdateSource({ provider: 'generic', url: 'https://updates.example.com/app/' }), { provider: 'generic', url: 'https://updates.example.com/app/' });
  assert.throws(() => resolveUpdateSource({ provider: 'generic', url: 'http://updates.example.com' }), /HTTPS/);
  assert.throws(() => resolveUpdateSource({ provider: 'github', owner: '', repo: 'companion' }), /GitHub/);
});

test('does not start outside packaged Windows and macOS applications', () => {
  const updater = new FakeUpdater();
  const timers = createTimers();
  const manager = createUpdateManager({ updater, platform: 'win32', isPackaged: false, source: { provider: 'github', owner: 'study', repo: 'companion' }, ...timers });
  assert.equal(manager.start(), false);
  assert.equal(timers.timeouts.length, 0);
  assert.equal(updater.feed, null);
});

test('starts with a delayed check and suppresses duplicate checks', async () => {
  const updater = new FakeUpdater();
  let finishCheck;
  updater.checkForUpdates = () => { updater.checks += 1; return new Promise(resolve => { finishCheck = resolve; }); };
  const timers = createTimers();
  const manager = createUpdateManager({ updater, platform: 'win32', isPackaged: true, source: { provider: 'generic', url: 'https://updates.example.com' }, ...timers });
  assert.equal(manager.start(), true);
  assert.deepEqual(updater.feed, { provider: 'generic', url: 'https://updates.example.com' });
  assert.equal(timers.timeouts.length, 1);
  assert.equal(timers.intervals.length, 1);
  const first = timers.timeouts[0]();
  await manager.check();
  assert.equal(updater.checks, 1);
  finishCheck({ updateInfo: { version: '0.2.0' } });
  await first;
});

test('normalizes update progress and recovers after an error', async () => {
  const updater = new FakeUpdater();
  const manager = createUpdateManager({ updater, platform: 'win32', isPackaged: true, source: { provider: 'github', owner: 'study', repo: 'companion' }, ...createTimers() });
  const states = [];
  manager.subscribe(state => states.push(state));
  manager.start();
  updater.emit('update-available', { version: '0.2.0' });
  updater.emit('download-progress', { percent: 42.345, transferred: 420, total: 1000 });
  assert.deepEqual(manager.getState(), { status: 'downloading', version: '0.2.0', percent: 42.3, transferred: 420, total: 1000 });
  updater.emit('error', new Error('secret server detail'));
  assert.deepEqual(manager.getState(), { status: 'error', message: '更新暂时不可用，请稍后重试' });
  await manager.check();
  assert.equal(updater.checks, 1);
  assert.equal(states.at(-1).status, 'checking');
});

test('installs a downloaded Windows update only after confirmation', () => {
  const updater = new FakeUpdater();
  const manager = createUpdateManager({ updater, platform: 'win32', isPackaged: true, source: { provider: 'github', owner: 'study', repo: 'companion' }, ...createTimers() });
  manager.start();
  assert.equal(manager.install(), false);
  updater.emit('update-downloaded', { version: '0.2.0', downloadedFile: 'C:\\update.exe' });
  assert.deepEqual(manager.getState(), { status: 'downloaded', version: '0.2.0', action: 'restart' });
  assert.equal(manager.install(), true);
  assert.equal(updater.installs, 1);
});

test('opens the downloaded DMG on unsigned macOS instead of auto-installing', async () => {
  const updater = new FakeUpdater();
  const opened = [];
  const manager = createUpdateManager({ updater, platform: 'darwin', isPackaged: true, macAutoInstall: false, openPath: async path => { opened.push(path); return ''; }, source: { provider: 'generic', url: 'https://updates.example.com' }, ...createTimers() });
  manager.start();
  updater.emit('update-downloaded', { version: '0.2.0', downloadedFile: '/tmp/Companion.dmg' });
  assert.deepEqual(manager.getState(), { status: 'downloaded', version: '0.2.0', action: 'open-installer' });
  assert.equal(await manager.install(), true);
  assert.deepEqual(opened, ['/tmp/Companion.dmg']);
  assert.equal(updater.installs, 0);
  manager.dismiss();
  assert.deepEqual(manager.getState(), { status: 'idle' });
});
