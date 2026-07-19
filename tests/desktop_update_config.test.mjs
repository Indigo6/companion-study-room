import assert from 'node:assert/strict';
import test from 'node:test';
import { updateSourceFromEnvironment } from '../apps/desktop/update-config.cjs';

test('uses packaged provider metadata unless an explicit override is configured', () => {
  assert.equal(updateSourceFromEnvironment({}, {}), undefined);
  assert.deepEqual(updateSourceFromEnvironment({}, { companionUpdateSource: { provider: 'github', owner: 'study', repo: 'companion' } }), { provider: 'github', owner: 'study', repo: 'companion' });
  assert.deepEqual(updateSourceFromEnvironment({ COMPANION_UPDATE_PROVIDER: 'github', COMPANION_UPDATE_GITHUB_OWNER: 'owner', COMPANION_UPDATE_GITHUB_REPO: 'repo' }), { provider: 'github', owner: 'owner', repo: 'repo' });
  assert.deepEqual(updateSourceFromEnvironment({ COMPANION_UPDATE_PROVIDER: 'generic', COMPANION_UPDATE_URL: 'https://updates.example.com' }), { provider: 'generic', url: 'https://updates.example.com' });
});
