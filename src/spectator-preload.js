const { contextBridge, ipcRenderer } = require('electron');

// Expose event handlers to the main process
contextBridge.exposeInMainWorld('replication', {
    onDartAdded: (regionId, posX, posY) => ipcRenderer.on('add-dart', regionId, posX, posY),
    onBoardResized: (width) => ipcRenderer.on('resize-board', width),
    getFormInfo: (legNum, name1, name2, score) => ipcRenderer.on('getFormInfo', legNum, name1, name2, score),
    onStatSelected: (stat_type) => ipcRenderer.on('stat-select', stat_type)
});