const { contextBridge, ipcRenderer } = require('electron');

// Expose event handlers to the main process
contextBridge.exposeInMainWorld('replication', {
    onDartAdded: (regionId, posX, posY) => ipcRenderer.on('add-dart', regionId, posX, posY),
    onBoardResized: (width) => ipcRenderer.on('resize-board', width),
    onStatSelected: (stat_type, category) => ipcRenderer.on('stat-select', stat_type, category)
});