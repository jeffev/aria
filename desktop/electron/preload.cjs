'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  setExpanded: (expanded) => ipcRenderer.send('set-expanded', expanded),
  getConfig:   (key)      => ipcRenderer.invoke('get-config', key),
  setConfig:   (key, val) => ipcRenderer.send('set-config', key, val),
})
