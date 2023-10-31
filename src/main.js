const { app, screen, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const {Player, Leg, Match, Game} = require('./classes');
const database = require('./database');
const { winning_move, perfect_leg } = require('./winning_move');

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

player_1 = null;
player_2 = null;
current_leg = null;
current_match = null;
current_game = null;

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

  database.init_db();

  // Replication event handlers
  // This forwards information from scorer to spectator
  const channels = [
    'add-dart', 'change-dart', 'remove-dart', 'next-turn', 'resize-board',
    'getFormInfo', 'stat-select', 'change-combo', 'change-perfect-leg',
    'reset-screen', 'showWinner'
  ];

  channels.forEach(channel => {
    ipcMain.on(channel, (event, ...args) => {
      spectatorWindow.webContents.send(channel, ...args);
    });
  });

  // Remote function handlers
  // These should fulfill requests from either renderer
  ipcMain.handle('get-winning-moves', (event, score, remaining_throws) => {
    return winning_move(score, remaining_throws);
  });

  ipcMain.handle('get-perfect-leg', (event, startScore) => {
    return perfect_leg(startScore);
  });

  ipcMain.handle('request-players', (event) => {
    return database.request_players();
  });
  
  ipcMain.handle('create-player', (event, first_name, last_name) => {
    return database.create_player(first_name, last_name);
  });
  
  ipcMain.handle('update-player', (event, player) => {
    database.update_player(new Player(player));
  });
  
  ipcMain.handle('get-player-by-id', (event, pid) => {
    return database.get_player_by_id(pid);
  });
  
  ipcMain.handle('search-players-by-first', (event, first_name) => {
    return database.search_players_by_first(first_name);
  });

  ipcMain.handle('create-leg', (event) => {
    return new Promise((resolve, reject) => {
      database.create_leg(current_match)
      .then((lid) => {
        database.get_leg_by_id(lid).then((leg) => {
          current_leg = new Leg(leg);
          resolve(current_leg);
        });
      });
    });
  });
  
  ipcMain.handle('update-leg', (event, leg) => {
    database.update_leg(new Leg(leg));
  });
  
  ipcMain.handle('get-leg-by-id', (event, lid) => {
    return database.get_leg_by_id(lid);
  });

  ipcMain.handle('create-match', (event) => {
    return new Promise((resolve, reject) => {
      database.create_match(current_game)
      .then((mid) => {
        database.get_match_by_id(mid).then((match) => {
          current_match = new Match(match);
          resolve(current_match);
        });
      });
    })
  });
  
  ipcMain.handle('update-match', (event, match) => {
    database.update_match(new Match(match));
  });
  
  ipcMain.handle('get-match-by-id', (event, mid) => {
    return database.get_match_by_id(mid);
  });

  ipcMain.handle('create-game', (event, name, player1, player2, official, location, date, leg_num, match_num, start_score) => {
    return new Promise((resolve, reject) => {
      database.create_game(name, player1, player2, official, location, date, leg_num, match_num, start_score)
      .then((gid) => {
        database.get_game_by_id(gid).then((game) => {
          current_game = new Game(game);
          resolve(current_game);
        });
      });
    })
  });
  
  ipcMain.handle('update-game', (event, game) => {
    database.update_game(new Game(game));
  });
  
  ipcMain.handle('get-game-by-id', (event, gid) => {
    return database.get_game_by_id(gid);
  });

  ipcMain.handle('set-player-1', (event, pid) => {
    database.get_player_by_id(pid).then((player) => {
      player_1 = new Player(player);
    })
  });

  ipcMain.handle('set-player-2', (event, pid) => {
    database.get_player_by_id(pid).then((player) => {
      player_2 = new Player(player);
    })
  });

  ipcMain.handle('update-game-status', (event) => {
    database.update_player(player_1);
    database.update_player(player_2);
    database.update_leg(current_leg);
  });

  ipcMain.handle('get-current-scores', (event) => {
    return current_leg.getScores();
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