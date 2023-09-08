const { contextBridge, ipcRenderer } = require('electron');

// Expose event handlers to the main process
contextBridge.exposeInMainWorld('replication', {
    onDartAdded: (regionId, posX, posY) => ipcRenderer.on('dart-added', regionId, posX, posY)
});