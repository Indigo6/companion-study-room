const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('companionAi', {
  ask: question => ipcRenderer.invoke('companion:ask', question),
  inspect: image => ipcRenderer.invoke('companion:inspect', image),
});
