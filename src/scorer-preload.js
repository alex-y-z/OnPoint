const { contextBridge, ipcRenderer } = require('electron');

// Expose remote functions/events to the main process
contextBridge.exposeInMainWorld('replication', {
    addDart: (regionId, posX, posY) => ipcRenderer.send('add-dart', regionId, posX, posY),
    resizeBoard: (width) => ipcRenderer.send('resize-board', width),
    getFormInfo: (legNum, name1, name2, score) => ipcRenderer.send('getFormInfo', legNum, name1, name2, score),
    statSelect: (stat_type) => ipcRenderer.send('stat-select', loc, stat_type)
});