const { createHash } = require('node:crypto');
const { EventEmitter } = require('node:events');
const path = require('node:path');

function isNewerVersion(candidate, current) {
  const parse = value => String(value).replace(/^v/, '').split('-')[0].split('.').map(part => Number(part) || 0);
  const next = parse(candidate);
  const installed = parse(current);
  for (let index = 0; index < Math.max(next.length, installed.length); index += 1) {
    if ((next[index] || 0) !== (installed[index] || 0)) return (next[index] || 0) > (installed[index] || 0);
  }
  return false;
}

function createMacManualUpdater({ currentVersion, arch, source, fetch, saveFile, downloadDirectory }) {
  const updater = new EventEmitter();
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = false;
  updater.allowPrerelease = false;
  updater.setFeedURL = value => { source = value; };
  updater.quitAndInstall = () => { throw new Error('未签名 macOS 不支持应用内安装'); };

  const readJson = async url => {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`更新服务器返回 HTTP ${response.status}`);
    return response.json();
  };

  const loadManifest = async () => {
    if (source?.provider === 'github') {
      const release = await readJson(`https://api.github.com/repos/${encodeURIComponent(source.owner)}/${encodeURIComponent(source.repo)}/releases/latest`);
      const asset = release.assets?.find(item => item.name === `latest-mac-${arch}.json`);
      if (!asset?.browser_download_url) throw new Error('GitHub Release 缺少 macOS 更新清单');
      return readJson(asset.browser_download_url);
    }
    if (source?.provider === 'generic') {
      const base = source.url.replace(/\/$/, '');
      const manifest = await readJson(`${base}/latest-mac-${arch}.json`);
      return { ...manifest, url: manifest.url || `${base}/${encodeURIComponent(manifest.file)}` };
    }
    throw new Error('macOS 手动更新需要明确的更新源');
  };

  updater.checkForUpdates = async () => {
    try {
      const manifest = await loadManifest();
      if (!isNewerVersion(manifest.version, currentVersion)) {
        updater.emit('update-not-available', { version: currentVersion });
        return { updateInfo: manifest };
      }
      if (!manifest.file?.endsWith('.dmg') || !manifest.sha512 || !manifest.url) throw new Error('macOS 更新清单无效');
      const downloadUrl = new URL(manifest.url);
      if (downloadUrl.protocol !== 'https:') throw new Error('macOS 更新包必须使用 HTTPS');
      updater.emit('update-available', { version: manifest.version });
      const response = await fetch(downloadUrl.toString());
      if (!response.ok) throw new Error(`更新包下载失败（HTTP ${response.status}）`);
      const payload = Buffer.from(await response.arrayBuffer());
      const actualHash = createHash('sha512').update(payload).digest('base64');
      if (actualHash !== manifest.sha512) throw new Error('macOS 更新包校验失败');
      const destination = path.join(downloadDirectory, path.basename(manifest.file));
      await saveFile(destination, payload, transferred => updater.emit('download-progress', {
        percent: payload.length ? transferred / payload.length * 100 : 100,
        transferred,
        total: payload.length,
      }));
      updater.emit('update-downloaded', { version: manifest.version, downloadedFile: destination });
      return { updateInfo: manifest };
    } catch (error) {
      updater.emit('error', error);
      throw error;
    }
  };
  return updater;
}

module.exports = { createMacManualUpdater, isNewerVersion };
