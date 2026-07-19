function registerUpdateIpc({ ipcMain, manager, getWindow }) {
  ipcMain.handle('update:get-state', () => manager.getState());
  ipcMain.handle('update:check', () => manager.check());
  ipcMain.handle('update:install', () => manager.install());
  ipcMain.handle('update:dismiss', () => manager.dismiss());
  return manager.subscribe(state => {
    const window = getWindow();
    if (!window || window.isDestroyed() || window.webContents.isDestroyed()) return;
    window.webContents.send('update:state', state);
  });
}

module.exports = { registerUpdateIpc };
