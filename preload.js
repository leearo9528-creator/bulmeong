const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('widget', {
  setIgnore: (v) => ipcRenderer.send('ignore', v),
  menu: () => ipcRenderer.send('menu'),
  drag: (dx, dy) => ipcRenderer.send('drag', dx, dy),
  dragEnd: () => ipcRenderer.send('drag-end'),
  settings: () => ipcRenderer.invoke('settings'),
  onSettings: (cb) => ipcRenderer.on('settings', (e, s) => cb(s)),
  onWood: (cb) => ipcRenderer.on('wood', () => cb()),
  shot: (file) => ipcRenderer.send('shot', file),
  shotFile: (process.argv.find(a => a.startsWith('--shot=')) || '').slice(7)
});
