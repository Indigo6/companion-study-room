const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function createMacManifest({ version, arch, file, payload }) {
  if (!version || !['arm64', 'x64'].includes(arch) || !file.endsWith('.dmg')) throw new Error('Invalid macOS update artifact');
  return { version, file, sha512: createHash('sha512').update(payload).digest('base64'), size: payload.length };
}

function writeMacManifest({ releaseDirectory, version, arch }) {
  const file = fs.readdirSync(releaseDirectory).find(name => name.endsWith(`${arch}.dmg`));
  if (!file) throw new Error(`No ${arch} DMG found in ${releaseDirectory}`);
  const manifest = createMacManifest({ version, arch, file, payload: fs.readFileSync(path.join(releaseDirectory, file)) });
  fs.writeFileSync(path.join(releaseDirectory, `latest-mac-${arch}.json`), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (require.main === module) {
  const projectRoot = path.join(__dirname, '..', '..');
  const packageJson = require(path.join(projectRoot, 'package.json'));
  writeMacManifest({ releaseDirectory: path.join(projectRoot, 'release'), version: packageJson.version, arch: process.argv[2] || process.arch });
}

module.exports = { createMacManifest, writeMacManifest };
