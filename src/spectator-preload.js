const { contextBridge, ipcRenderer } = require('electron');

// Expose event handlers to the main process
contextBridge.exposeInMainWorld('replication', {
    onDartAdded: (...args) => ipcRenderer.on('add-dart', ...args),
    onDartChanged: (...args) => ipcRenderer.on('change-dart', ...args),
    onDartRemoved: (...args) => ipcRenderer.on('remove-dart', ...args),
    onNextTurn: (...args) => ipcRenderer.on('next-turn', ...args),
    onBoardResized: (...args) => ipcRenderer.on('resize-board', ...args),
    getFormInfo: (legNum, name1, name2, score) => ipcRenderer.on('getFormInfo', legNum, name1, name2, score),
    onStatSelected: (stat_type) => ipcRenderer.on('stat-select', loc, stat_type)
});