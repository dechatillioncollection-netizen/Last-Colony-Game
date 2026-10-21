// The only bridge between the game page and the desktop app. The page sees window.lcDesktop and nothing else of Node or Electron.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('lcDesktop', {
  version: ((process.argv || []).find((a) => a.startsWith('--lc-version=')) || '').slice(13),
  platform: process.platform,
  saves: {
    get: (k) => ipcRenderer.invoke('saves:get', k),
    set: (k, v) => ipcRenderer.invoke('saves:set', k, v),
    del: (k) => ipcRenderer.invoke('saves:del', k),
  },
  quit: () => ipcRenderer.invoke('app:quit'),
  setFullScreen: (on) => ipcRenderer.invoke('app:fullscreen', on),
  isFullScreen: () => ipcRenderer.invoke('app:isFullscreen'),
  achieve: (name) => ipcRenderer.invoke('app:achieve', name),
});
