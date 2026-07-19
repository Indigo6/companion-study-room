import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { createMacManifest } from '../apps/desktop/create-mac-update-manifest.cjs';

test('creates an architecture-specific DMG manifest with SHA-512', () => {
  const payload = Buffer.from('dmg bytes');
  const manifest = createMacManifest({ version: '0.2.0', arch: 'arm64', file: 'Companion-0.2.0-arm64.dmg', payload });
  assert.deepEqual(manifest, {
    version: '0.2.0',
    file: 'Companion-0.2.0-arm64.dmg',
    sha512: createHash('sha512').update(payload).digest('base64'),
    size: payload.length,
  });
});
