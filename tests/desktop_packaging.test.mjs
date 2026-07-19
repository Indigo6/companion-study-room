import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('desktop packaging includes updater runtime and auto-update targets', async () => {
  const packageJson = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  const main = await readFile(new URL('apps/desktop/main.cjs', root), 'utf8');
  const macUpdater = await readFile(new URL('apps/desktop/mac-manual-updater.cjs', root), 'utf8');
  const genericConfig = await readFile(new URL('apps/desktop/electron-builder.generic.cjs', root), 'utf8');
  assert.match(packageJson.dependencies['electron-updater'], /^\^/);
  assert.deepEqual(packageJson.build.win.target, ['nsis', 'portable']);
  assert.deepEqual(packageJson.build.nsis, { oneClick: false, perMachine: false, allowToChangeInstallationDirectory: true, artifactName: '${productName}-${version}-setup-${arch}.${ext}' });
  assert.equal(packageJson.build.portable.artifactName, '${productName}-${version}-portable-${arch}.${ext}');
  assert.deepEqual(packageJson.build.mac.target, ['dmg', 'zip']);
  assert.equal(packageJson.build.publish.provider, 'github');
  assert.equal(packageJson.build.publish.owner, 'Indigo6');
  assert.equal(packageJson.build.publish.repo, 'companion-study-room');
  assert.doesNotMatch(packageJson.scripts['desktop:dist:generic'], /\$COMPANION_UPDATE_URL/);
  assert.match(packageJson.scripts['desktop:dist:generic'], /electron-builder\.generic\.cjs/);
  assert.match(genericConfig, /new URL\(updateUrl\)/);
  assert.match(genericConfig, /COMPANION_UPDATE_URL/);
  assert.match(main, /createMacManualUpdater/);
  assert.match(macUpdater, /latest-mac-/);
});

test('desktop workflow retains updater metadata and publishes version tags', async () => {
  const workflow = await readFile(new URL('.github/workflows/build-desktop.yml', root), 'utf8');
  assert.match(workflow, /tags:\s*\n\s*- ['"]v\*['"]/);
  assert.match(workflow, /release\/\*\.yml/);
  assert.match(workflow, /release\/\*\.blockmap/);
  assert.match(workflow, /release\/\*\.zip/);
  assert.match(workflow, /electron-builder --win nsis portable --x64/);
  assert.match(workflow, /release\/\*setup\*\.exe/);
  assert.match(workflow, /release\/\*portable\*\.exe/);
  assert.match(workflow, /release:\s*\n/);
  assert.match(workflow, /contents: write/);
  assert.match(workflow, /softprops\/action-gh-release@v2/);
});

test('update source variables and unsigned macOS fallback are documented', async () => {
  const env = await readFile(new URL('.env.example', root), 'utf8');
  const readme = await readFile(new URL('README.md', root), 'utf8');
  assert.match(env, /COMPANION_UPDATE_PROVIDER=github/);
  assert.match(env, /COMPANION_UPDATE_URL=https:\/\//);
  assert.match(readme, /GitHub Releases/);
  assert.match(readme, /自建 HTTPS/);
  assert.match(readme, /打开 DMG/);
});
