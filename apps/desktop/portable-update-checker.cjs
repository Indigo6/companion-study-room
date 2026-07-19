const { EventEmitter } = require('node:events');
const { isNewerVersion } = require('./mac-manual-updater.cjs');

function trustedReleaseUrl(value, owner, repo) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'github.com' && url.pathname.startsWith(`/${owner}/${repo}/releases/`);
  } catch { return false; }
}

function createPortableUpdateChecker({ currentVersion, owner, repo, fetch }) {
  const checker = new EventEmitter();
  checker.portable = true;
  checker.setFeedURL = source => {
    if (source?.provider !== 'github') throw new Error('Portable 版本只支持 GitHub 更新提醒');
    owner = source.owner;
    repo = source.repo;
  };
  checker.checkForUpdates = async () => {
    try {
      const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
      if (!response.ok) throw new Error(`GitHub 返回 HTTP ${response.status}`);
      const release = await response.json();
      const version = String(release.tag_name || '').replace(/^v/, '');
      if (release.draft || release.prerelease || !isNewerVersion(version, currentVersion)) {
        checker.emit('update-not-available', { version: currentVersion });
        return { updateInfo: release };
      }
      if (!trustedReleaseUrl(release.html_url, owner, repo)) throw new Error('GitHub Release 下载链接无效');
      const info = { version, portable: true, releaseUrl: release.html_url };
      checker.emit('update-available', info);
      return { updateInfo: info };
    } catch (error) {
      checker.emit('error', error);
      throw error;
    }
  };
  return checker;
}

module.exports = { createPortableUpdateChecker, trustedReleaseUrl };
