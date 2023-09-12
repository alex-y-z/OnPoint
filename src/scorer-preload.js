const { contextBridge, ipcRenderer } = require('electron');

// Expose remote functions/events to the main process
contextBridge.exposeInMainWorld('replication', {
    addDart: (regionId, posX, posY) => ipcRenderer.send('add-dart', regionId, posX, posY),
    resizeBoard: (width) => ipcRenderer.send('resize-board', width), 
    statSelect: (stat_type, category) => ipcRenderer.send('stat-select', stat_type, category)
});
