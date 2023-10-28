const sqlite = require('sqlite3').verbose();

let db = new sqlite.Database('./DartsDatabase.db', (err) => {
    console.log(err)
  });


function init_db() {
  // Write Database tables here if they do not already exist
  // Players
  db.run("CREATE TABLE IF NOT EXISTS Players (pid INTEGER PRIMARY KEY AUTOINCREMENT, first_name TEXT NOT NULL, last_name TEXT NOT NULL, total_thrown INTEGER NOT NULL DEFAULT 0, number_thrown INTEGER NOT NULL DEFAULT 0, league_rank TEXT NOT NULL, last_win TEXT NOT NULL, num_180s INTEGER NOT NULL DEFAULT 0)")
  // Legs, delimit darts with , and |
  db.run("CREATE TABLE IF NOT EXISTS Legs (lid INTEGER PRIMARY KEY AUTOINCREMENT, player_1_score INTEGER NOT NULL, player_1_darts TEXT NOT NULL, player_2_score INTEGER NOT NULL, player_2_darts TEXT NOT NULL, match INTEGER NOT NULL, Foreign Key(match) references Matches(mid))")
  // Matches
  db.run("CREATE TABLE IF NOT EXISTS Matches (mid INTEGER PRIMARY KEY AUTOINCREMENT, winner INTEGER, legs TEXT, game INTEGER NOT NULL, Foreign Key(winner) references Players(pid), Foreign Key(game) references Games(gid))")
  // Game, dates in format of YYYY-MM-DD
  db.run("CREATE TABLE IF NOT EXISTS Games (gid INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, player_1 INTEGER NOT NULL, player_2 INTEGER NOT NULL, winner INTEGER, official TEXT, location TEXT NOT NULL, date TEXT NOT NULL, start_score INTEGER NOT NULL DEFAULT 501, leg_num INTEGER NOT NULL DEFAULT 14, match_num INTEGER NOT NULL DEFAULT 5, matches TEXT, Foreign Key(player_1) references Players(pid), Foreign Key(player_2) references Players(pid), Foreign key(winner) references Players(pid))")
  
}

async function request_players() {
    return new Promise(function(resolve, reject) 
        {   db.all("SELECT * FROM Players", [], function (err, rows) {
            if (err) reject(err.message);
            else resolve(rows);
        })
    });
}

async function search_players_by_first(first_name) {
    return new Promise(function(resolve, reject) 
    {   db.all("SELECT * FROM Players where first_name like ?", [`%${first_name}%`], function (err, rows) {
        if (err) reject(err.message);
        else resolve(rows);
    })
});
}

async function get_player_by_id(pid) {
  return new Promise(function(resolve, reject) 
  {
    db.get("Select * from Players where pid = ?", [pid], function(err, row) {
      if (err) reject(err.message);
      else resolve(row);
    })
  });
}

function create_player(first_name, last_name) {
  return new Promise(function(resolve, reject) 
  {
    db.run(`INSERT INTO Players (first_name, last_name, league_rank, last_win) VALUES(?,?,?,?)`,
      [first_name, last_name, "Unranked", "None"], function(err) {
          if (err) return reject(err.message);
          else resolve(this.lastID);
      }
    );
  });
}

function update_player(player) {
    db.run("UPDATE Players Set first_name = ?, last_name = ?, total_thrown = ?, number_thrown = ?, league_rank = ?, last_win = ?, num_180s = ? where pid = ?",
        [player.first_name, player.last_name, player.total_thrown, player.number_thrown, player.league_rank, player.last_win, player.num_180s, player.player_id],
        function(err) {
        if (err) return console.log(err.message);
        }
  )
}

function create_leg(match) {
  return new Promise(function(resolve, reject) 
  {
    game = match.getParent()
    db.run("INSERT INTO Legs (player_1_score, player_2_score, match) Values(?,?,?)",
    [game.start_score, game.start_score, match.match_id], // need some way to get the initial score of a game
    (err) => {
      if (err) {
        reject(err) 
      }
      match.legs.push(this.lastID);
      update_match(match);
      resolve(this.lastID);
    }
    )
  });
}


function update_leg(leg) {
  db.run("UPDATE Legs Set player_1_score = ?, player_1_darts = ?, player_2_score = ?, player_2_darts = ? where lid = ?",
  [leg.player_1_score, leg.player_1_darts, leg.player_2_score, leg.player_2_darts, leg.lid],
  function (err) {
    if (err) return console.log(err.message);
  }
  )
}

async function get_leg_by_id(lid) {
  return new Promise(function(resolve, reject) 
  {
    db.get("Select * from Legs where lid = ?", [lid], function(err, row) {
      if (err) reject(err.message);
      else resolve(row);
    })
  });
}

function create_match(game) {
  return new Promise(function(resolve, reject) 
  {
    db.run("INSERT INTO Match (game) Values(?)",
    [game.game_id],
    (err) => {
      if (err) {
        reject(err);
      }
      game.matches.push(str(this.lastID))
      resolve(this.lastID);
    }
    )
  });
}


function update_match(match) {
  db.run("UPDATE Matches Set winner = ?, legs = ? where mid = ?",
  [match.winner, match.getLegString(), match.mid],
  function (err) {
    if (err) return console.log(err.message);
  }
  )
}

async function get_match_by_id(mid) {
  return new Promise(function(resolve, reject) 
  {
    db.get("Select * from Matches where mid = ?", [mid], function(err, row) {
      if (err) reject(err.message);
      else resolve(row);
    })
  });
}

function create_game(name, player1, player2, official, location, date, leg_num, match_num, start_score) {
  return new Promise(function(resolve, reject) 
  {
    db.run("INSERT INTO Games (name, player_1, player_2, official, location, date, leg_num, match_num, start_score) Values(?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [name, player1, player2, official, location, date, leg_num, match_num, start_score],
    (err) => {
      if (err) {
        reject(err);
      }
      game.matches.push(str(this.lastID))
      resolve(this.lastID);
    }
    )
  });
}


function update_game(game) {
  // rest of our properties here are readonly past creation
  db.run("UPDATE Games Set winner = ?, matches = ? where gid = ?",
  [game.winner, game.getMatchString(), game.game_id],
  function (err) {
    if (err) return console.log(err.message);
  }
  )
}

async function get_game_by_id(gid) {
  return new Promise(function(resolve, reject) 
  {
    db.get("Select * from Games where gid = ?", [gid], function(err, row) {
      if (err) reject(err.message);
      else resolve(row);
    })
  });
}

module.exports = {db, init_db, request_players, get_player_by_id, search_players_by_first, create_player, update_player,
                  create_leg, update_leg, get_leg_by_id, create_match, update_match, get_match_by_id, create_game,
                  update_game, get_game_by_id};
