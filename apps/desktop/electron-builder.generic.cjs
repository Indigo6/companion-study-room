const packageJson = require('../../package.json');

const updateUrl = process.env.COMPANION_UPDATE_URL;
let parsedUrl;
try { parsedUrl = new URL(updateUrl); } catch { throw new Error('COMPANION_UPDATE_URL must be a valid HTTPS URL'); }
if (parsedUrl.protocol !== 'https:') throw new Error('COMPANION_UPDATE_URL must use HTTPS');

module.exports = {
  ...packageJson.build,
  publish: { provider: 'generic', url: updateUrl },
  extraMetadata: {
    ...packageJson.build.extraMetadata,
    companionUpdateSource: { provider: 'generic', url: updateUrl },
  },
};
