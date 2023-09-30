const { contextBridge, ipcRenderer } = require('electron');

// Expose remote functions/events to the main process
contextBridge.exposeInMainWorld('replication', {
    addDart: (...args) => ipcRenderer.send('add-dart', ...args),
    changeDart: (...args) => ipcRenderer.send('change-dart', ...args),
    removeDart: (...args) => ipcRenderer.send('remove-dart', ...args),
    nextTurn: (...args) => ipcRenderer.send('next-turn', ...args),
    resizeBoard: (...args) => ipcRenderer.send('resize-board', ...args),
    getFormInfo: (...args) => ipcRenderer.send('getFormInfo', ...args),
    statSelect: (...args) => ipcRenderer.send('stat-select', ...args),
    getWinningMoves: (...args) => ipcRenderer.invoke('get-winning-moves', ...args),
    changeCombo: (...args) => ipcRenderer.send('change-combo', ...args)
});