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
    getPerfectLeg: (...args) => ipcRenderer.invoke('get-perfect-leg', ...args),
    changeCombo: (...args) => ipcRenderer.send('change-combo', ...args),
    changePerfectLeg: (...args) => ipcRenderer.send('change-perfect-leg', ...args),
    resetScreen: (...args) => ipcRenderer.send('reset-screen', ...args)
});

contextBridge.exposeInMainWorld('database', {
    requestPlayers: () => ipcRenderer.invoke('request-players'),
    createPlayer: (...args) => ipcRenderer.invoke('create-player', ...args),
    updatePlayer: (...args) => ipcRenderer.invoke('update-player', ...args),
    getPlayerByID: (...args) => ipcRenderer.invoke('get-player-by-id', ...args),
    searchPlayersByFirst: (...args) => ipcRenderer.invoke('search-players-by-first', ...args),
    setPlayer1: (...args) => ipcRenderer.invoke('set-player-1', ...args),
    setPlayer2: (...args) => ipcRenderer.invoke('set-player-2', ...args),
    createLeg: (...args) => ipcRenderer.invoke('create-leg', ...args),
    updateLeg: (...args) => ipcRenderer.invoke('update-leg', ...args),
    getLegByID: (...args) => ipcRenderer.invoke('get-leg-by-id', ...args),
    createMatch: (...args) => ipcRenderer.invoke('create-match', ...args),
    updateMatch: (...args) => ipcRenderer.invoke('update-match', ...args),
    getMatchById: (...args) => ipcRenderer.invoke('get-match-by-id', ...args),
    createGame: (...args) => ipcRenderer.invoke('create-game', ...args),
    updateGame: (...args) => ipcRenderer.invoke('update-game', ...args),
    getGameByID: (...args) => ipcRenderer.invoke('get-game-by-id', ...args)
});
