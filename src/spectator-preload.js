const { contextBridge, ipcRenderer } = require('electron');

// Expose event handlers to the main process
contextBridge.exposeInMainWorld('replication', {
    onDartAdded: (...args) => ipcRenderer.on('add-dart', ...args),
    onDartChanged: (...args) => ipcRenderer.on('change-dart', ...args),
    onDartRemoved: (...args) => ipcRenderer.on('remove-dart', ...args),
    onNextTurn: (...args) => ipcRenderer.on('next-turn', ...args),
    onBoardResized: (...args) => ipcRenderer.on('resize-board', ...args),
    onGetFormInfo: (...args) => ipcRenderer.on('getFormInfo', ...args),
    onStatSelected: (...args) => ipcRenderer.on('stat-select', ...args),
    onComboChanged: (...args) => ipcRenderer.on('change-combo', ...args),
    onPerfectLegChanged: (...args) => ipcRenderer.on('change-perfect-leg', ...args),
    onScreenReset: (...args) => ipcRenderer.on('reset-screen', ...args),
    onShowWinner: (...args) => ipcRenderer.on('showWinner', ...args)
});