import assert from 'node:assert/strict';
import test from 'node:test';
import { createSettingsStore } from '../apps/desktop/settings-store.cjs';

test('desktop secret store encrypts keys and exposes only presence to renderer', () => {
  let disk = '';
  const fs = { existsSync: () => Boolean(disk), readFileSync: () => disk, writeFileSync: (_path, value) => { disk = value; }, mkdirSync: () => {} };
  const safeStorage = { isEncryptionAvailable: () => true, encryptString: value => Buffer.from(`sealed:${value}`), decryptString: value => value.toString().replace('sealed:', '') };
  const store = createSettingsStore({ safeStorage, fs, filePath: '/tmp/settings.json' });
  store.saveSecret('vision', 'private-key');
  assert.equal(disk.includes('private-key'), false);
  assert.deepEqual(store.secretStatus(), { chat: false, vision: true, speech: false });
  assert.equal(store.getSecret('vision'), 'private-key');
});

test('desktop secret store refuses plaintext fallback', () => {
  const store = createSettingsStore({ safeStorage: { isEncryptionAvailable: () => false }, fs: { existsSync: () => false }, filePath: '/tmp/settings.json' });
  assert.throws(() => store.saveSecret('chat', 'key'), /系统加密不可用/);
});
