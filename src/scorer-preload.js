const { contextBridge, ipcRenderer } = require('electron');

// Expose remote functions/events to the main process
contextBridge.exposeInMainWorld('replication', {
    addDart: (...args) => ipcRenderer.send('add-dart', ...args),
    changeDart: (...args) => ipcRenderer.send('change-dart', ...args),
    removeDart: (...args) => ipcRenderer.send('remove-dart', ...args),
    nextTurn: (...args) => ipcRenderer.send('next-turn', ...args),
    resizeBoard: (...args) => ipcRenderer.send('resize-board', ...args),
    getFormInfo: (legNum, name1, name2, score) => ipcRenderer.send('getFormInfo', legNum, name1, name2, score),
    statSelect: (stat_type) => ipcRenderer.send('stat-select', loc, stat_type)
});