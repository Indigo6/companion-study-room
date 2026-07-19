const path = require('node:path');
const fs = require('node:fs');
const { app, BrowserWindow, ipcMain, safeStorage, session, shell } = require('electron');
const ai = require('./ai-client.cjs');
const { createSettingsStore } = require('./settings-store.cjs');
const { createUpdateManager } = require('./update-manager.cjs');
const { registerUpdateIpc } = require('./update-ipc.cjs');

let mainWindow;

function updateSourceFromEnvironment(env = process.env) {
  if (env.COMPANION_UPDATE_PROVIDER === 'generic') return { provider: 'generic', url: env.COMPANION_UPDATE_URL };
  return {
    provider: 'github',
    owner: env.COMPANION_UPDATE_GITHUB_OWNER || 'Indigo6',
    repo: env.COMPANION_UPDATE_GITHUB_REPO || 'companion-study-room',
  };
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1360, height: 900, minWidth: 960, minHeight: 680,
    backgroundColor: '#071219', title: '伴读 · 陪伴自习室',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
    },
  });
  mainWindow = window;
  window.on('closed', () => { if (mainWindow === window) mainWindow = undefined; });
  window.loadFile(path.join(__dirname, '..', 'preview', 'dist', 'index.html'));
  return window;
}

app.whenReady().then(() => {
  const settings = createSettingsStore({ safeStorage, fs, filePath: path.join(app.getPath('userData'), 'secure-settings.json') });
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const trusted = webContents.getURL().startsWith('file:');
    callback(trusted && permission === 'media');
  });
  ipcMain.handle('settings:secret-status', () => settings.secretStatus());
  ipcMain.handle('settings:save-secret', (_event, service, value) => settings.saveSecret(service, value));
  ipcMain.handle('settings:test-service', async (_event, service, config) => {
    const headers = settings.getSecret(service) ? { Authorization: `Bearer ${settings.getSecret(service)}` } : {};
    const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/models`, { headers });
    if (!response.ok) throw new Error(`连接失败（HTTP ${response.status}）`); return true;
  });
  ipcMain.handle('settings:synthesize', async (_event, config, text) => {
    const headers = { 'Content-Type': 'application/json' }; const key = settings.getSecret('speech'); if (key) headers.Authorization = `Bearer ${key}`;
    const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/audio/speech`, { method: 'POST', headers, body: JSON.stringify({ model: config.model, voice: config.voice || 'alloy', input: text, response_format: 'mp3' }) });
    if (!response.ok) throw new Error(`语音服务返回 ${response.status}`);
    return Buffer.from(await response.arrayBuffer()).toString('base64');
  });
  ipcMain.handle('companion:ask', (_event, payload) => ai.ask(payload.question, undefined, { ...payload.config, apiKey: settings.getSecret('chat') }));
  ipcMain.handle('companion:inspect', (_event, payload) => ai.inspect(payload.image, undefined, { ...payload.config, apiKey: settings.getSecret('vision') }));
  createWindow();
  if (app.isPackaged) {
    try {
      const { autoUpdater } = require('electron-updater');
      const updates = createUpdateManager({ updater: autoUpdater, platform: process.platform, isPackaged: app.isPackaged, source: updateSourceFromEnvironment(), openPath: file => shell.openPath(file) });
      registerUpdateIpc({ ipcMain, manager: updates, getWindow: () => mainWindow });
      updates.start();
    } catch (error) {
      console.error('Desktop updates are unavailable:', error);
    }
  }
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

module.exports = { updateSourceFromEnvironment };
