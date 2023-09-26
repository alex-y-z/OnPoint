const { app, screen, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const {Player, Leg, Match, Game} = require('./classes');
const {db, update_player, request_players} = require("./database");

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

player_1 = null;
player_2 = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindows = () => {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  // Create two windows mide-by-mide
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

  // Write Database tables here if they do not already exist
  // Players
  db.run("CREATE TABLE IF NOT EXISTS Players (pid INTEGER PRIMARY KEY AUTOINCREMENT, first_name TEXT NOT NULL, last_name TEXT NOT NULL, total_thrown INTEGER NOT NULL DEFAULT 0, number_thrown INTEGER NOT NULL DEFAULT 0, league_rank TEXT NOT NULL, last_win TEXT NOT NULL, num_180s INTEGER NOT NULL DEFAULT 0)")
  // Legs, delimit darts with , and |
  db.run("CREATE TABLE IF NOT EXISTS Legs (lid INTEGER PRIMARY KEY AUTOINCREMENT, player_1_score INTEGER NOT NULL, player_1_darts TEXT NOT NULL, player_2_score INTEGER NOT NULL, player_2_darts TEXT NOT NULL)")
  // Matches
  db.run("CREATE TABLE IF NOT EXISTS Matches (mid INTEGER PRIMARY KEY AUTOINCREMENT, winner INTEGER, leg_1 INTEGER NOT NULL, leg_2 INTEGER NOT NULL, leg_3 INTEGER NOT NULL, leg_4 INTEGER NOT NULL, leg_5 INTEGER NOT NULL, leg_6 INTEGER NOT NULL, leg_7 INTEGER NOT NULL, leg_8 INTEGER NOT NULL, leg_9 INTEGER NOT NULL, leg_10 INTEGER NOT NULL, leg_11 INTEGER NOT NULL,leg_12 INTEGER NOT NULL, leg_13 INTEGER NOT NULL, leg_14 INTEGER NOT NULL, Foreign Key(winner) references Players(pid), Foreign KEY(leg_1) references Legs(lid), Foreign KEY(leg_2) references Legs(lid),Foreign KEY(leg_3) references Legs(lid), Foreign KEY(leg_4) references Legs(lid), Foreign KEY(leg_5) references Legs(lid), Foreign KEY(leg_6) references Legs(lid), Foreign KEY(leg_7) references Legs(lid), Foreign KEY(leg_8) references Legs(lid), Foreign KEY(leg_9) references Legs(lid), Foreign KEY(leg_10) references Legs(lid), Foreign KEY(leg_11) references Legs(lid), Foreign KEY(leg_12) references Legs(lid), Foreign KEY(leg_13) references Legs(lid), Foreign KEY(leg_14) references Legs(lid))")
  // Matches
  db.run("CREATE TABLE IF NOT EXISTS Games (gid INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, player_1 INTEGER NOT NULL, player_2 INTEGER NOT NULL, winner INTEGER, match_1 INTEGER NOT NULL, match_2 INTEGER NOT NULL, match_3 INTEGER NOT NULL, match_4 INTEGER NOT NULL, match_5 INTEGER NOT NULL, match_6 INTEGER NOT NULL, match_7 INTEGER NOT NULL, Foreign Key(player_1) references Players(pid), Foreign Key(player_2) references Players(pid), Foreign key(winner) references Players(pid) Foreign Key(match_1) references Matches(mid),  Foreign Key(match_2) references Matches(mid), Foreign Key(match_3) references Matches(mid), Foreign Key(match_4) references Matches(mid), Foreign Key(match_5) references Matches(mid), Foreign Key(match_6) references Matches(mid), Foreign Key(match_7) references Matches(mid))")
  

  // Replication event handlers
  // This forwards information from scorer to spectator
  const channels = [
    'add-dart', 'change-dart', 'remove-dart', 'next-turn', 'resize-board',
    'getFormInfo', 'stat-select'
  ];
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