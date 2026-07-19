import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { registerUpdateIpc } from '../apps/desktop/update-ipc.cjs';

test('preload exposes fixed update channels and removes state listeners', async () => {
  const exposed = {};
  const invokes = [];
  const listeners = new Map();
  const ipcRenderer = {
    invoke(channel) { invokes.push(channel); return Promise.resolve({ status: 'idle' }); },
    on(channel, listener) { listeners.set(channel, listener); },
    removeListener(channel, listener) { if (listeners.get(channel) === listener) listeners.delete(channel); },
  };
  const contextBridge = { exposeInMainWorld(name, api) { exposed[name] = api; } };
  const code = fs.readFileSync(new URL('../apps/desktop/preload.cjs', import.meta.url), 'utf8');
  vm.runInNewContext(code, { require: name => {
    if (name === 'electron') return { contextBridge, ipcRenderer };
    throw new Error(`unexpected require: ${name}`);
  } });

  assert.deepEqual(Object.keys(exposed.companionUpdate).sort(), ['check', 'dismiss', 'getState', 'install', 'onState']);
  await exposed.companionUpdate.getState();
  await exposed.companionUpdate.check();
  await exposed.companionUpdate.install();
  await exposed.companionUpdate.dismiss();
  assert.deepEqual(invokes, ['update:get-state', 'update:check', 'update:install', 'update:dismiss']);

  const received = [];
  const unsubscribe = exposed.companionUpdate.onState(state => received.push(state));
  listeners.get('update:state')({}, { status: 'checking' });
  assert.deepEqual(received, [{ status: 'checking' }]);
  unsubscribe();
  assert.equal(listeners.has('update:state'), false);
});

test('registers exact update handlers and forwards state only to the app window', async () => {
  const handlers = new Map();
  const ipcMain = { handle(channel, handler) { handlers.set(channel, handler); } };
  const sent = [];
  const window = { isDestroyed: () => false, webContents: { isDestroyed: () => false, send: (channel, state) => sent.push([channel, state]) } };
  let state = { status: 'idle' };
  let listener;
  const calls = [];
  const manager = {
    getState: () => state,
    check: async () => { calls.push('check'); return true; },
    install: async () => { calls.push('install'); return true; },
    dismiss: () => { calls.push('dismiss'); },
    subscribe: callback => { listener = callback; return () => {}; },
  };

  registerUpdateIpc({ ipcMain, manager, getWindow: () => window });
  assert.deepEqual([...handlers.keys()].sort(), ['update:check', 'update:dismiss', 'update:get-state', 'update:install']);
  assert.deepEqual(await handlers.get('update:get-state')(), { status: 'idle' });
  assert.equal(await handlers.get('update:check')(), true);
  assert.equal(await handlers.get('update:install')(), true);
  await handlers.get('update:dismiss')();
  assert.deepEqual(calls, ['check', 'install', 'dismiss']);

  state = { status: 'downloading', percent: 25 };
  listener(state);
  assert.deepEqual(sent, [['update:state', state]]);
});

test('does not send update state after the window is destroyed', () => {
  const ipcMain = { handle() {} };
  let listener;
  const manager = { getState() {}, check() {}, install() {}, dismiss() {}, subscribe(callback) { listener = callback; } };
  const window = { isDestroyed: () => true, webContents: { isDestroyed: () => false, send() { throw new Error('must not send'); } } };
  registerUpdateIpc({ ipcMain, manager, getWindow: () => window });
  assert.doesNotThrow(() => listener({ status: 'checking' }));
});
