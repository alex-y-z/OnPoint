import allowed_throws from "./winning_move"
import db from "./main"

throws = new Map(Array.from(allowed_throws, a => a.reverse()))

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
        return {
            league_rank: this.league_rank,
            average_score: this.total_thrown / this.number_thrown,
            last_win: this.last_win,
            total_thrown: this.total_thrown,
            num_180s: this.num_180s,
            win_percent: db.all(`Select * from Matches where player_1 = ${this.player_id} or player_2 = ${this.player_id}`,[], (err, result) => {
                if(err) {
                    return 0;
                }
                else {
                    total_games = 0;
                    total_wins = 0;
                    result.forEach((match) => {
                        if (match.winner){
                            total_games++;
                            if (match.winner == this.player_id){
                                total_wins++;
                            }
                        }
                    })
                    return total_wins / total_games;
                }
            }),
            //probably need to discuss what "average season score" means before impl
        }
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
    };

    // Pulls from the database
    

    /*
    Description: Takes the values from the thrownDarts array to update
                 the score for the player.
    Parameters:
    Returns:
    */
    calculateScore = () => {
        
    };


}

// A class to represent each match.
class Match {
    constructor (sqlResponse) {
        // 

    };

    





}

// A class to represent the game.
class Game {
    constructor () {

    };

    

}
