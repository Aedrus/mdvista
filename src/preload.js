// -----------------------------------
// Preloader: Used to expose backend 
// channels allowing the renderer to
// interface with the backend.
// -----------------------------------
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openDialogFile: () => ipcRenderer.invoke('dialog:openFile'),
    openDirectFile: () => ipcRenderer.invoke('direct:openFile')
})

// Expose channels using IPC to renderer.
contextBridge.exposeInMainWorld('ipc', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)) 
})