const { contextBridge, ipcRenderer } = require('electron');

// Expose remote functions/events to the main process
contextBridge.exposeInMainWorld('replication', {

    // Events
    addDart: (...args) => ipcRenderer.send('add-dart', ...args),
    changeDart: (...args) => ipcRenderer.send('change-dart', ...args),
    removeDart: (...args) => ipcRenderer.send('remove-dart', ...args),
    nextTurn: (...args) => ipcRenderer.send('next-turn', ...args),
    resizeBoard: (...args) => ipcRenderer.send('resize-board', ...args),
    getFormInfo: (...args) => ipcRenderer.send('getFormInfo', ...args),
    statSelect: (...args) => ipcRenderer.send('stat-select', ...args),
    changeCombo: (...args) => ipcRenderer.send('change-combo', ...args),
    changePerfectLeg: (...args) => ipcRenderer.send('change-perfect-leg', ...args),
    setLegWinner: (...args) => ipcRenderer.send('set-leg-winner', ...args),
    resetScreen: (...args) => ipcRenderer.send('reset-screen', ...args),
    showWinner: (...args) => ipcRenderer.send('showWinner', ...args),
    showLeader: (...args) => ipcRenderer.send('showLeader', ...args),
 
    // Functions
    getWinningMoves: (...args) => ipcRenderer.invoke('get-winning-moves', ...args),
    getPerfectLeg: (...args) => ipcRenderer.invoke('get-perfect-leg', ...args)
});

contextBridge.exposeInMainWorld('database', {
    requestPlayers: () => ipcRenderer.invoke('request-players'),
    createPlayer: (...args) => ipcRenderer.invoke('create-player', ...args),
    getPlayerByID: (...args) => ipcRenderer.invoke('get-player-by-id', ...args),
    getPlayerStats: (...args) => ipcRenderer.invoke('get-player-stats', ...args),
    searchPlayersByFirst: (...args) => ipcRenderer.invoke('search-players-by-first', ...args),
    setPlayer1: (...args) => ipcRenderer.invoke('set-player-1', ...args),
    setPlayer2: (...args) => ipcRenderer.invoke('set-player-2', ...args),
    createLeg: (...args) => ipcRenderer.invoke('create-leg', ...args),
    getLegByID: (...args) => ipcRenderer.invoke('get-leg-by-id', ...args),
    createMatch: (...args) => ipcRenderer.invoke('create-match', ...args),
    getMatchById: (...args) => ipcRenderer.invoke('get-match-by-id', ...args),
    createGame: (...args) => ipcRenderer.invoke('create-game', ...args),
    getGameByID: (...args) => ipcRenderer.invoke('get-game-by-id', ...args),
    updateGameStatus: (...args) => ipcRenderer.invoke('update-game-status', ...args),
    setMatchWinner: (...args) => ipcRenderer.invoke('set-match-winner', ...args),
    setGameWinner: (...args) => ipcRenderer.invoke('set-game-winner', ...args)
});
