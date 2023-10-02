const sqlite = require('sqlite3').verbose();

let db = new sqlite.Database('./DartsDatabase.db', (err) => {
    console.log(err)
  });


function init_db() {
  // Write Database tables here if they do not already exist
  // Players
  db.run("CREATE TABLE IF NOT EXISTS Players (pid INTEGER PRIMARY KEY AUTOINCREMENT, first_name TEXT NOT NULL, last_name TEXT NOT NULL, total_thrown INTEGER NOT NULL DEFAULT 0, number_thrown INTEGER NOT NULL DEFAULT 0, league_rank TEXT NOT NULL, last_win TEXT NOT NULL, num_180s INTEGER NOT NULL DEFAULT 0)")
  // Legs, delimit darts with , and |
  db.run("CREATE TABLE IF NOT EXISTS Legs (lid INTEGER PRIMARY KEY AUTOINCREMENT, player_1_score INTEGER NOT NULL, player_1_darts TEXT NOT NULL, player_2_score INTEGER NOT NULL, player_2_darts TEXT NOT NULL)")
  // Matches
  db.run("CREATE TABLE IF NOT EXISTS Matches (mid INTEGER PRIMARY KEY AUTOINCREMENT, winner INTEGER, legs TEXT, Foreign Key(winner) references Players(pid))")
  // Matches
  db.run("CREATE TABLE IF NOT EXISTS Games (gid INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, player_1 INTEGER NOT NULL, player_2 INTEGER NOT NULL, winner INTEGER, matches TEXT, Foreign Key(player_1) references Players(pid), Foreign Key(player_2) references Players(pid), Foreign key(winner) references Players(pid))")
  
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
  db.run(`INSERT INTO Players (first_name, last_name, league_rank, last_win) VALUES(?,?,?,?)`,
    [first_name, last_name, "Unranked", "None"], function(err) {
        if (err) return console.log(err.message);
    }
  );
}

function update_player(player) {
    console.log(player);
    db.run("UPDATE Players Set first_name = ?, last_name = ?, total_thrown = ?, number_thrown = ?, league_rank = ?, last_win = ?, num_180s = ? where pid = ?",
        [player.first_name, player.last_name, player.total_thrown, player.number_thrown, player.league_rank, player.last_win, player.num_180s, player.player_id],
        function(err) {
        if (err) return console.log(err.message);
        }
  )
}

/*function create_leg(match) {
  db.run("INSERT INTO Legs (player_1_score, player_2_score) Values(?,?)",
  [match.start_score, match.start_score] // need some way to get the initial score of a game
  )
}
//*/

function update_leg(leg) {
  console.log(leg);
  db.run("UPDATE Legs Set player_1_score = ?, player_1_darts = ?, player_2_score = ?, player_2_darts = ? where lid = ?",
  [leg.player_1_score, leg.player_1_darts, leg.player_2_score, leg.player_2_darts, leg.lid],
  function (err) {
    if (err) return console.log(err.message);
  }
  )
}

  // Create Player test
  // create_player("Test", "Player");

  // Update Player Test
  /* comment out this line to enable
  request_players().then((rows) => {
    console.log
    let test_player = new Player(rows[0]);
    console.log(test_player);
    test_player.first_name = "New";
    test_player.last_name = "Player";
    test_player.num_180s = 80;
    test_player.league_rank = "Gold";
    update_player(test_player);
  });
  //*/

module.exports = {db, init_db, request_players, get_player_by_id, search_players_by_first, create_player, update_player};