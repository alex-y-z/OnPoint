const { app, screen, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindows = () => {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  // Create two windows side-by-side
  const scorerWindow = new BrowserWindow({
    width: width/2,
    height: height,
    x: 0,
    y: 0,
    webPreferences: {
      preload: path.join(__dirname, 'scorer-preload.js')
    }
  });

  const spectatorWindow = new BrowserWindow({
    width: width/2,
    height: height,
    x: width/2,
    y: 0,
    webPreferences: {
      preload: path.join(__dirname, 'spectator-preload.js')
    }
  });

  // Replication event handlers
  // This forwards information from scorer to spectator
  const channels = ['add-dart', 'resize-board', 'stat-select'];
  channels.forEach(channel => {
    ipcMain.on(channel, (event, ...args) => {
      spectatorWindow.webContents.send(channel, ...args);
    });
  });

  // Load HTML
  scorerWindow.loadFile(path.join(__dirname, 'index.html'));
  spectatorWindow.loadFile(path.join(__dirname, 'spectator.html'));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindows);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindows();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
