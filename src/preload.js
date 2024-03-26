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