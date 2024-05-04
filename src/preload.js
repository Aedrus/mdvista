// -----------------------------------
// Preloader: Used to expose backend 
// channels allowing the renderer to
// interface with the backend.
// -----------------------------------
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openDialogFile: () => ipcRenderer.invoke('dialog:openFile'),
    openDirectFile: () => ipcRenderer.invoke('direct:openFile'),
    loadPreferences: () => ipcRenderer.invoke('loadPreferences'),
    
    onOpenOptions: (callback) => ipcRenderer.on('openOptions', (_event, value) => callback(value)),
    onOpenNewFile: (callback) => ipcRenderer.on('dialog:openNewFile', (_event, value) => callback(value)),

    setPref: (preference) => ipcRenderer.send("json:setPref", preference),
    setTitleBarColor: (config) => ipcRenderer.send("titleBar:color", config),
    openMenu: () => ipcRenderer.send("menu:openMenu")
})