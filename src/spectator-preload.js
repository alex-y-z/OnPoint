const { contextBridge, ipcRenderer } = require('electron');

// Expose event handlers to the main process
contextBridge.exposeInMainWorld('replication', {
    onDartAdded: (regionId, posX, posY) => ipcRenderer.on('add-dart', regionId, posX, posY),
    onBoardResized: (width) => ipcRenderer.on('resize-board', width)
});

// Event handler for Statistics
