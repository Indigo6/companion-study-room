const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('companionAi', {
  ask: (question, config) => ipcRenderer.invoke('companion:ask', { question, config }),
  inspect: (image, config) => ipcRenderer.invoke('companion:inspect', { image, config }),
});
contextBridge.exposeInMainWorld('companionSettings', {
  secretStatus: () => ipcRenderer.invoke('settings:secret-status'),
  saveSecret: (service, value) => ipcRenderer.invoke('settings:save-secret', service, value),
  testService: (service, config) => ipcRenderer.invoke('settings:test-service', service, config),
  synthesize: (config, text) => ipcRenderer.invoke('settings:synthesize', config, text),
});
contextBridge.exposeInMainWorld('companionUpdate', {
  getState: () => ipcRenderer.invoke('update:get-state'),
  check: () => ipcRenderer.invoke('update:check'),
  install: () => ipcRenderer.invoke('update:install'),
  dismiss: () => ipcRenderer.invoke('update:dismiss'),
  onState: listener => {
    const handler = (_event, state) => listener(state);
    ipcRenderer.on('update:state', handler);
    return () => ipcRenderer.removeListener('update:state', handler);
  },
});
