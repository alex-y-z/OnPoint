const { app, screen, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite = require('sqlite3').verbose();

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

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

  let db = new sqlite.Database('./DartsDatabase.db', (err) => {
    console.log(err)
  });
  // Write Database tables here if they do not already exist
  // Players
  db.run("CREATE TABLE IF NOT EXISTS Players (pid INTEGER PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL, total_thrown INTEGER NOT NULL DEFAULT 0, number_thrown INTEGER NOT NULL DEFAULT 0, league_rank TEXT NOT NULL, last_win TEXT NOT NULL, num_180s INTEGER NOT NULL DEFAULT 0)")
  // Legs, delimit darts with , and |
  db.run("CREATE TABLE IF NOT EXISTS Legs (lid INTEGER PRIMARY KEY, player_1_score INTEGER NOT NULL, player_1_darts TEXT NOT NULL, player_2_score INTEGER NOT NULL, player_2_darts TEXT NOT NULL)")
  // Sets
  db.run("CREATE TABLE IF NOT EXISTS Sets (sid INTEGER PRIMARY KEY, leg_1 INTEGER NOT NULL, leg_2 INTEGER NOT NULL, leg_3 INTEGER NOT NULL, leg_4 INTEGER NOT NULL, leg_5 INTEGER NOT NULL, leg_6 INTEGER NOT NULL, leg_7 INTEGER NOT NULL, leg_8 INTEGER NOT NULL, leg_9 INTEGER NOT NULL, leg_10 INTEGER NOT NULL, leg_11 INTEGER NOT NULL,leg_12 INTEGER NOT NULL, leg_13 INTEGER NOT NULL, leg_14 INTEGER NOT NULL, Foreign KEY(leg_1) references Legs(lid), Foreign KEY(leg_2) references Legs(lid),Foreign KEY(leg_3) references Legs(lid), Foreign KEY(leg_4) references Legs(lid), Foreign KEY(leg_5) references Legs(lid), Foreign KEY(leg_6) references Legs(lid), Foreign KEY(leg_7) references Legs(lid), Foreign KEY(leg_8) references Legs(lid), Foreign KEY(leg_9) references Legs(lid), Foreign KEY(leg_10) references Legs(lid), Foreign KEY(leg_11) references Legs(lid), Foreign KEY(leg_12) references Legs(lid), Foreign KEY(leg_13) references Legs(lid), Foreign KEY(leg_14) references Legs(lid))")
  // Matches
  db.run("CREATE TABLE IF NOT EXISTS Matches (mid INTEGER PRIMARY KEY, name TEXT NOT NULL, player_1 INTEGER NOT NULL, player_2 INTEGER NOT NULL, set_1 INTEGER NOT NULL, set_2 INTEGER NOT NULL, set_3 INTEGER NOT NULL, set_4 INTEGER NOT NULL, set_5 INTEGER NOT NULL, set_6 INTEGER NOT NULL, set_7 INTEGER NOT NULL, Foreign Key(player_1) references Players(pid), Foreign Key(player_2) references Players(pid), Foreign Key(set_1) references Sets(sid),  Foreign Key(set_2) references Sets(sid), Foreign Key(set_3) references Sets(sid), Foreign Key(set_4) references Sets(sid), Foreign Key(set_5) references Sets(sid), Foreign Key(set_6) references Sets(sid), Foreign Key(set_7) references Sets(sid))")

  // Replication event handlers
  // This forwards information from scorer to spectator
  const channels = ['add-dart', 'resize-board', 'getFormInfo', 'stat-select'];
  channels.forEach(channel => {
    ipcMain.on(channel, (event, ...args) => {
      spectatorWindow.webContents.send(channel, ...args);
    });
  });

  // Load HTML
  scorerWindow.loadFile(path.join(__dirname, 'scorer.html'));
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
