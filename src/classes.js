const {allowed_throws, winning_throws} = require("./winning_move");
const {db} = require("./database");

throws = new Map(Array.from(allowed_throws, a => a.reverse()))
doubles = new Map(Array.from(winning_throws, a => a.reverse()))
doubles.delete("B50")

// A class to represent each player in the game.
class Player {
    constructor (sqlResponse) {
        this.player_id = sqlResponse.pid
        this.first_name = sqlResponse.first_name
        this.last_name = sqlResponse.last_name
        this.total_thrown = sqlResponse.total_thrown
        this.number_thrown = sqlResponse.number_thrown
        this.league_rank = sqlResponse.league_rank
        this.last_win = sqlResponse.last_win
        this.num_180s = sqlResponse.num_180s
        //other parameters we generate as needed
    };

    getStats() {
        return db.all(`Select * from Matches where player_1 = ? or player_2 = ?`,[this.player_id, this.player_id], (err, result) => {
            if(err) {
                return 0;
            }
            else {
                let total_games = 0;
                let total_wins = 0;
                result.forEach((match) => {
                    if (match.winner){
                        total_games++;
                        if (match.winner == this.player_id){
                            total_wins++;
                        }
                    }
                })
                return {
                    league_rank: this.league_rank,
                    average_score: this.total_thrown / this.number_thrown,
                    last_win: this.last_win,
                    total_thrown: this.total_thrown,
                    num_180s: this.num_180s,
                    win_percent: total_wins / total_games,
                    //probably need to discuss what "average season score" means before impl
                }
            }
        })
    }

    // JS command to send to HTML
    // var playerName = ...
    // var name = document.getElementById('player1');
    // name.innerHTML = playerName;


}

// A class to represent each leg of the match.
class Leg {
    constructor (sqlResponse) {
        this.leg_id = sqlResponse.lid
        this.player_1_score = sqlResponse.player_1_score
        this.player_2_score = sqlResponse.player_2_score
        player_1_turns = sqlResponse.player_1_darts.split("|")
        this.player_1_darts = Array.from(player_1_turns, a => a.split(","))
        player_2_turns = sqlResponse.player_2_darts.split("|")
        this.player_2_darts = Array.from(player_2_turns, a => a.split(","))
        this.match = sqlResponse.match
    };

    // Pulls from the database
    

    calculateScore() {
        let p1_score = 0;
        let p2_score = 0;
        this.player_1_darts.forEach((turn_throws) => {
            for(i = 1; i < 4; i++){
                p1_score = p1_score + throws[turn_throws[i]];
            }
        })
        this.player_2_darts.forEach((turn_throws) => {
            for(i = 1; i < 4; i++){
                p2_score = p2_score + throws[turn_throws[i]];
            }
        })
        this.player_1_score = p1_score
        this.player_2_score = p2_score
    };

    addThrows(throws, player) {
        if(player = 1) {
            this.player_1_darts.push(throws);
        }
        else {
            if (player = 2) {
                this.player_2_darts.push(throws);
            }
        }
        this.calculateScore();
    }

    getPlayerScores() {
        return {
            p1: this.player_1_score,
            p2: this.player_2_score
        };
    }

    getParent() {
        return db.get("SELECT * FROM Matches where mid = ?", [this.match])
    }


}

// A class to represent each match.
class Match {
    constructor (sqlResponse) {
        // 
        this.match_id = sqlResponse.mid;
        this.winner = sqlResponse.winner;
        this.legs = Array.from(sqlResponse.legs, a => a.split(','))
        this.game = sqlResponse.game
    };

    getLegs() {
        return db.all("SELECT * From Legs where lid in ?", [this.legs], (err, rows) => {
            if (err) {
                return 0;
            }
            legs = []
            rows.forEach((row) => {
                legs.push(Leg(row))
            })
            return legs;
        })
    }

    getLegString() {
        str = "";
        this.legs.forEach((leg) => {
            str = str + leg + ",";
        })
        if (str.length > 0)
        return str.slice(0, -1);
        else return str;
    }

    getStats() {
        legs = this.getLegs()
        turnTotal = 0
        turnNum = 0
        highestTurn = 0
        num180 = 0
        numBull = 0
        numDouble = 0
        legs.forEach((leg) => {
            leg.player_1_darts.forEach((turn) => {
                turnNum++;
                turn_score = throws[turn[1]] + throws[turn[2]] + throws[turn[3]]
                turnTotal = turnTotal + turn_score
                if (highestTurn < turn_score) {
                    highestTurn = turn_score
                }
                num180 = num180 + (turn.filter(x => x === "T20").length === 3 ? 1 : 0)
                numBull = numBull + turn.filter(x => x === "B50").length
                numDouble = numDouble + turn.filter(x => doubles.includes(x)).length
            })
            leg.player_2_darts.forEach((turn) => {
                turnNum++;
                turn_score = throws[turn[1]] + throws[turn[2]] + throws[turn[3]]
                turnTotal = turnTotal + turn_score
                if (highestTurn < turn_score) {
                    highestTurn = turn_score
                }
                num180 = num180 + (turn.filter(x => x === "T20").length === 3 ? 1 : 0)
                numBull = numBull + turn.filter(x => x === "B50").length
                numDouble = numDouble + turn.filter(x => doubles.includes(x)).length
            })
        })
        return {
            avg_turn: turnTotal / turnNum,
            highest_turn: highestTurn,
            num_180: num180,
            num_bull: numBull,
            num_double: numDouble
        }

    }

    getParent() {
        return db.get("Select * from Games where gid = ?", [this.game], (err, row) => {
            if (err) return 0;
            return Game(row);
        })
    }



}

// A class to represent the game.
class Game {
    constructor (sqlResponse) {
        this.game_id = sqlResponse.gid;
        this.name = sqlResponse.name;
        this.player_1 = sqlResponse.player_1;
        this.player_2 = sqlResponse.player_2;
        this.winner = sqlResponse.winner;
        this.official = sqlResponse.official;
        this.location = sqlResponse.location;
        this.date = sqlResponse.date;
        this.leg_num = sqlResponse.leg_num;
        this.match_num = sqlResponse.match_num;
        this.start_score = sqlResponse.start_score;
        this.matches = Array.from(sqlResponse.matches, a => a.split(','));

    };

    getMatches() {
        return db.all("SELECT * From Matches where mid in ?", [this.matches], (err, rows) => {
            if (err) {
                return 0;
            }
            matches = []
            rows.forEach((row) => {
                matches.push(Match(row))
            })
            return matches;
        })
    }

    getMatchString() {
        str = "";
        this.matches.forEach((match) => {
            str = str + match + ",";
        })
        if (str.length > 0)
        return str.slice(0, -1);
        else return str;
    }

}

module.exports = {Player, Leg, Match, Game};
