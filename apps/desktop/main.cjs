const path = require('node:path');
const { app, BrowserWindow, ipcMain, session } = require('electron');
const ai = require('./ai-client.cjs');

function createWindow() {
  const window = new BrowserWindow({
    width: 1360, height: 900, minWidth: 960, minHeight: 680,
    backgroundColor: '#071219', title: '伴读 · 陪伴自习室',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
    },
  });
  window.loadFile(path.join(__dirname, '..', 'preview', 'dist', 'index.html'));
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const trusted = webContents.getURL().startsWith('file:');
    callback(trusted && permission === 'media');
  });
  ipcMain.handle('companion:ask', (_event, question) => ai.ask(question));
  ipcMain.handle('companion:inspect', (_event, image) => ai.inspect(image));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
