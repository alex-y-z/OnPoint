const {allowed_throws, winning_throws} = require("./winning_move");
const {db} = require("./database");

let throws = new Map(Array.from(allowed_throws, a => a.reverse()))
throws["S0"] = 0;
throws["M/B"] = 0;
let doubles = new Map(Array.from(winning_throws, a => a.reverse()))
doubles.delete("B50")

// A class to represent each player in the game.
class Player {
    constructor (sqlResponse=undefined) {
        if(sqlResponse === undefined){
            this.pid = undefined
            this.first_name = undefined
            this.last_name = undefined
            this.country = undefined
            this.total_thrown = undefined
            this.number_thrown = undefined
            this.league_rank = undefined
            this.num_doubles = undefined
            this.num_checkouts_100 = undefined
            this.num_180s = undefined
        }
        else {
            this.pid = sqlResponse.pid
            this.first_name = sqlResponse.first_name
            this.last_name = sqlResponse.last_name
            this.country = sqlResponse.country
            this.total_thrown = sqlResponse.total_thrown
            this.number_thrown = sqlResponse.number_thrown
            this.league_rank = sqlResponse.league_rank
            this.num_doubles = sqlResponse.num_doubles
            this.num_checkouts_100 = sqlResponse.num_checkouts_100
            this.num_180s = sqlResponse.num_180s
        }
        //other parameters we generate as needed
    };

    getStats(range_start = undefined, range_end = undefined) {
        let inputstr = "Select * from Games where player_1 = ? or player_2 = ?";
        let args = [this.pid, this.pid];
        if(range_start !== undefined && range_end !== undefined){
            inputstr = "Select * from Games where (player_1 = ? or player_2 = ?) and (date between ? and ?)";
            args.push(range_start);
            args.push(range_end);
        }
        return new Promise((resolve, reject) => {
            db.all(inputstr, args, (err, result) => {
                if(err) {
                    reject(err);
                }
                else {
                    console.log(result);
                    let total_games = 0;
                    let total_wins = 0;
                    let win_percent = 0;
                    result.forEach((match) => {
                        if (match.winner){
                            total_games++;
                            if (match.winner == this.pid){
                                total_wins++;
                            }
                        }
                    })
                    if(total_games > 0){
                        win_percent = (total_wins / total_games) * 100
                    }
                    resolve({
                        league_rank: this.league_rank,
                        average_score: this.total_thrown / this.number_thrown,
                        number_thrown: this.number_thrown,
                        num_checkouts_100: this.num_checkouts_100,
                        num_180s: this.num_180s,
                        num_doubles: this.num_doubles,
                        total_wins: total_wins,
                        total_games: total_games,
                        win_percent: win_percent,
                        //probably need to discuss what "average season score" means before impl
                    })
                }
            })
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
        if(sqlResponse === undefined){
            this.lid = undefined
            this.player_1_score = undefined
            this.player_2_score = undefined
            this.player_1_darts = undefined
            this.player_2_darts = undefined
            this.match = undefined
        }
        else {
            this.lid = sqlResponse.lid
            this.player_1_score = sqlResponse.player_1_score
            this.player_2_score = sqlResponse.player_2_score
            if(sqlResponse.player_1_darts != ""){
                let player_1_turns = sqlResponse.player_1_darts.split("|")
                this.player_1_darts = Array.from(player_1_turns, a => a.split(","))
            }
            else this.player_1_darts = []
            if(sqlResponse.player_1_darts != ""){
                let player_2_turns = sqlResponse.player_2_darts.split("|")
                this.player_2_darts = Array.from(player_2_turns, a => a.split(","))
            }
            else this.player_2_darts = []
            this.match = sqlResponse.match
        }
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
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM Matches where mid = ?", [this.match], (err, row) => {
                if(err) reject(err);
                resolve(new Match(row));
            })
        })
    }

    getPlayerDartsString(darts) {
        let str = "";
        darts.forEach((turn) => {
            turn.forEach((player_throw) => {
                str = str + player_throw + ",";
            })
            str = str + "|";
        })
        if (str.length > 0)
        return str.slice(0, -1);
        else return str;
    }


}

// A class to represent each match.
class Match {
    constructor (sqlResponse=undefined) {
        if(sqlResponse === undefined){
            this.mid = undefined
            this.winner = undefined
            this.legs = []
            this.game = undefined
        }
        else{
            this.mid = sqlResponse.mid;
            this.winner = sqlResponse.winner;
            this.legs = sqlResponse.legs === null ? [] : sqlResponse.legs.split(',');
            this.game = sqlResponse.game
        }
    };

    getLegs() {
        return new Promise((resolve, reject) => {
            const placeholders = this.legs.map(() => "?").join(",");
            db.all(`SELECT * From Legs where lid in (${placeholders})`, this.legs, (err, rows) => {
                if (err) {
                    reject(err);
                }
                let legs = []
                rows.forEach((row) => {
                    legs.push(new Leg(row))
                })
                resolve(legs);
            })
        })

    }

    getLegString() {
        let str = "";
        this.legs.forEach((leg) => {
            str = str + leg + ",";
        })
        if (str.length > 0)
        return str.slice(0, -1);
        else return str;
    }

    getStats() {
        return new Promise((resolve, reject) => {
            this.getLegs().then((legs) => {
                let turnTotal = 0
                let turnNum = 0
                let highestTurn = 0
                let num180 = 0
                let numBull = 0
                let numDouble = 0
                legs.forEach((leg) => {
                    leg.player_1_darts.forEach((turn) => {
                        turnNum++;
                        let turn_score = throws.get(turn[0]) + throws.get(turn[1]) + throws.get(turn[2])
                        turnTotal = turnTotal + turn_score
                        if (highestTurn < turn_score) {
                            highestTurn = turn_score
                        }
                        num180 = num180 + (turn.filter(x => x === "T20").length === 3 ? 1 : 0)
                        numBull = numBull + turn.filter(x => x === "B50").length
                        numDouble = numDouble + turn.filter(x => doubles.has(x)).length
                    })
                    leg.player_2_darts.forEach((turn) => {
                        turnNum++;
                        let turn_score = throws.get(turn[0]) + throws.get(turn[1]) + throws.get(turn[2])
                        turnTotal = turnTotal + turn_score
                        if (highestTurn < turn_score) {
                            highestTurn = turn_score
                        }
                        num180 = num180 + (turn.filter(x => x === "T20").length === 3 ? 1 : 0)
                        numBull = numBull + turn.filter(x => x === "B50").length
                        numDouble = numDouble + turn.filter(x => doubles.has(x)).length
                    })
                })
                let avg_turn = 0
                if(turnNum > 0) {
                    avg_turn = turnTotal / turnNum;
                }
                resolve({
                    avg_turn: avg_turn,
                    highest_turn: highestTurn,
                    num_180: num180,
                    num_bull: numBull,
                    num_double: numDouble
                })
            })
        })
    }

    getParent() {
        return new Promise((resolve, reject) => {
            db.get("Select * from Games where gid = ?", [this.game], (err, row) => {
                if (err) reject(err);
                resolve(new Game(row));
            })
        })

    }



}

// A class to represent the game.
class Game {
    constructor (sqlResponse=undefined) {
        if(sqlResponse === undefined){
            this.gid = undefined;
            this.name = undefined;
            this.player_1 = undefined;
            this.player_2 = undefined;
            this.winner = undefined;
            this.official = undefined;
            this.location = undefined;
            this.date = undefined;
            this.leg_num = undefined;
            this.match_num = undefined;
            this.start_score = undefined;
            this.matches = [];
        }
        else{
            this.gid = sqlResponse.gid;
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
            this.matches = sqlResponse.matches === null ? [] : sqlResponse.matches.split(',');
        }

    };

    getMatches() {
        return new Promise((resolve, reject) => {
            const placeholders = this.matches.map(() => "?").join(",");
            db.all(`SELECT * From Matches where mid in (${placeholders})`, this.matches, (err, rows) => {
                if (err) {
                    reject(err);
                }
                let matches = []
                rows.forEach((row) => {
                    matches.push(new Match(row))
                })
                resolve(matches);
            })
        })

    }

    getMatchString() {
        let str = "";
        this.matches.forEach((match) => {
            str = str + match + ",";
        })
        if (str.length > 0)
        return str.slice(0, -1);
        else return str;
    }

    getStats() {
        return new Promise((resolve, reject) => {
            this.getMatches().then((matches) => {
                let matchTotal = 0
                let matchNum = 0
                let highestTurn = 0
                let num180 = 0
                let numBull = 0
                let numDouble = 0
                let avg_turn = 0
                Promise.all(Array.from(matches, m => m.getStats())).then((stats) => {
                    stats.forEach((stat) => {
                        matchTotal = matchTotal + stat.avg_turn;
                        matchNum = matchNum + 1;
                        if (highestTurn < stat.highest_turn) {
                            highestTurn = stat.highest_turn
                        }
                        num180 = num180 + stat.num_180;
                        numBull = numBull + stat.num_bull;
                        numDouble = numDouble + stat.num_double;
                    })
                    if(matchNum > 0) {
                        avg_turn = matchTotal / matchNum;
                    }
                    let statsObj = {
                        avg_turn: avg_turn,
                        highest_turn: highestTurn,
                        num_180: num180,
                        num_bull: numBull,
                        num_double: numDouble
                    };
                    resolve(statsObj)
                })
            })
        })
    }
}

module.exports = {Player, Leg, Match, Game};
