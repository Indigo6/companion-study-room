function resolveUpdateSource(source, { allowHttpForTests = false } = {}) {
  if (source?.provider === 'github') {
    if (!source.owner?.trim() || !source.repo?.trim()) throw new Error('GitHub 更新源需要 owner 和 repo');
    return { provider: 'github', owner: source.owner.trim(), repo: source.repo.trim() };
  }
  if (source?.provider === 'generic') {
    let url;
    try { url = new URL(source.url); } catch { throw new Error('更新服务器 URL 无效'); }
    if (url.protocol !== 'https:' && !(allowHttpForTests && url.protocol === 'http:')) throw new Error('更新服务器必须使用 HTTPS');
    return { provider: 'generic', url: source.url };
  }
  throw new Error('不支持的更新源');
}

function createUpdateManager({
  updater,
  platform,
  isPackaged,
  source,
  openPath = async () => '无法打开安装包',
  setTimeout = global.setTimeout,
  setInterval = global.setInterval,
  initialDelayMs = 15_000,
  intervalMs = 6 * 60 * 60_000,
  macAutoInstall = false,
  allowHttpForTests = false,
}) {
  let state = { status: 'idle' };
  let active = false;
  let checking = false;
  let downloadedFile = '';
  let version = '';
  const listeners = new Set();

  const publish = next => {
    state = next;
    for (const listener of listeners) listener(state);
  };

  const check = async () => {
    if (!active || checking) return false;
    checking = true;
    publish({ status: 'checking' });
    try {
      await updater.checkForUpdates();
      return true;
    } catch {
      publish({ status: 'error', message: '更新暂时不可用，请稍后重试' });
      return false;
    } finally {
      checking = false;
    }
  };

  const start = () => {
    if (active || !isPackaged || !['win32', 'darwin'].includes(platform)) return false;
    const feed = resolveUpdateSource(source, { allowHttpForTests });
    updater.autoDownload = true;
    updater.autoInstallOnAppQuit = false;
    updater.allowPrerelease = false;
    updater.setFeedURL(feed);
    updater.on('update-available', info => {
      version = info.version || '';
      publish({ status: 'available', ...(version && { version }) });
    });
    updater.on('update-not-available', () => publish({ status: 'idle' }));
    updater.on('download-progress', progress => publish({
      status: 'downloading',
      ...(version && { version }),
      percent: Math.round(Math.max(0, Math.min(100, progress.percent || 0)) * 10) / 10,
      transferred: progress.transferred || 0,
      total: progress.total || 0,
    }));
    updater.on('update-downloaded', info => {
      version = info.version || version;
      downloadedFile = info.downloadedFile || '';
      publish({ status: 'downloaded', ...(version && { version }), action: platform === 'darwin' && !macAutoInstall ? 'open-installer' : 'restart' });
    });
    updater.on('error', () => {
      checking = false;
      publish({ status: 'error', message: '更新暂时不可用，请稍后重试' });
    });
    active = true;
    setTimeout(() => check(), initialDelayMs);
    setInterval(() => check(), intervalMs);
    return true;
  };

  const install = () => {
    if (state.status !== 'downloaded') return false;
    if (platform === 'darwin' && !macAutoInstall) {
      if (!downloadedFile) return false;
      return Promise.resolve(openPath(downloadedFile)).then(error => {
        if (error) { publish({ status: 'error', message: '无法打开更新安装包，请稍后重试' }); return false; }
        return true;
      });
    }
    updater.quitAndInstall(false, true);
    return true;
  };

  return {
    start,
    check,
    install,
    dismiss: () => { if (state.status === 'downloaded' || state.status === 'error') publish({ status: 'idle' }); },
    getState: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}

module.exports = { createUpdateManager, resolveUpdateSource };
