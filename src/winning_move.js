let known_checkouts = new Map([
    [170, ["T20", "T20", "B50"]],
    [167, ["T20", "T19", "B50"]],
    [164, ["T20", "T18", "B50"]],
    [161, ["T20", "T17", "B50"]],
    [160, ["T20", "T20", "D20"]],
    [158, ["T20", "T16", "B50"]],
    [157, ["T20", "T19", "D20"]],
    [156, ["T20", "T20", "D18"]],
    [155, ["T20", "T15", "B50"]],
    [154, ["T20", "T18", "D20"]],
    [153, ["T20", "T19", "D18"]],
    [152, ["T20", "T20", "D16"]],
    [151, ["T20", "T17", "D20"]],
    [150, ["T20", "T18", "D18"]],
    [149, ["T20", "T19", "D16"]],
    [148, ["T20", "T16", "D20"]],
    [147, ["T20", "T17", "D18"]],
    [146, ["T20", "T18", "D16"]]
])

let winning_throws = new Map(
    [
        [2, "D1"],
        [4, "D2"],
        [6, "D3"],
        [8, "D4"],
        [10, "D5"],
        [12, "D6"],
        [14, "D7"],
        [16, "D8"],
        [18, "D9"],
        [20, "D10"],
        [22, "D11"],
        [24, "D12"],
        [26, "D13"],
        [28, "D14"],
        [30, "D15"],
        [32, "D16"],
        [34, "D17"],
        [36, "D18"],
        [38, "D19"],
        [40, "D20"],
        [50, "B50"]
    ]
)
let allowed_throws = new Map(
    [
        [1, "S1"], 
        [2, "S2"], 
        [3, "S3"], 
        [4, "S4"], 
        [5, "S5"], 
        [6, "S6"], 
        [7, "S7"], 
        [8, "S8"], 
        [9, "S9"], 
        [10, "S10"], 
        [11, "S11"], 
        [12, "S12"], 
        [13, "S13"], 
        [14, "S14"], 
        [15, "S15"], 
        [16, "S16"], 
        [17, "S17"], 
        [18, "S18"], 
        [19, "S19"], 
        [20, "S20"],
        [2, "D1"], 
        [4, "D2"], 
        [6, "D3"], 
        [8, "D4"], 
        [10, "D5"], 
        [12, "D6"], 
        [14, "D7"], 
        [16, "D8"], 
        [18, "D9"], 
        [20, "D10"], 
        [22, "D11"], 
        [24, "D12"], 
        [26, "D13"], 
        [28, "D14"], 
        [30, "D15"], 
        [32, "D16"], 
        [34, "D17"], 
        [36, "D18"], 
        [38, "D19"], 
        [40, "D20"],
        [3, "T1"], 
        [9, "T3"], 
        [15, "T5"], 
        [21, "T7"], 
        [27, "T9"], 
        [33, "T11"], 
        [39, "T13"], 
        [42, "T14"], 
        [45, "T15"], 
        [48, "T16"], 
        [51, "T17"], 
        [54, "T18"], 
        [57, "T19"], 
        [60, "T20"],
        [25, "B25"],
        [50, "B50"]
    ]
)
function winning_move(score, remaining_throws) {
    if(score > 170) {
        // if the score is above 170, there are no possible wins
        return []
    }
    else if (known_checkouts.has(score) && remaining_throws == 3) {
        // if we know the known checkout, get it early
        return known_checkouts.get(score)
    }
    else if (winning_throws.has(score)) {
        // if the score matches a double, target it for victory
        return [winning_throws.get(score)]
    }
    else {
        let best_x = -1
        let best_y = -1
        let best_z = -1
        switch(remaining_throws) {
            case 1:
                // if 1 throw remains and it isn't a double, we cannot win
                return []
            case 2:
            case 3:
                for(const x of allowed_throws.keys()){
                    if(winning_throws.has(score - x)){
                        if(best_y < score - x){
                            best_x = x
                            best_y = score - x 
                        }
                    }
                }
                if(best_y == -1){
                    //no solution
                    if (remaining_throws == 2) return []
                }
                else {
                    return [allowed_throws.get(best_x), allowed_throws.get(best_y)]
                }
                //
                for(const x of allowed_throws.keys()){
                    for(const y of allowed_throws.keys()){
                        if(winning_throws.has(score - x - y)){
                            if (best_z < score - x -y){
                                best_x = x
                                best_y = y
                                best_z = score - x - y
                            }
                        }
                    }
                }
                if(best_z == -1){
                    //no solution
                    return []
                }
                else {
                    return [allowed_throws.get(best_x), allowed_throws.get(best_y), allowed_throws.get(best_z)]
                }
        }
    }
}

function perfect_leg(score) {
    // the idea for thresholds is that the score will need to be equal to or less than the given score for a turn
    // ie turn 1 needs to be score - 180 to be perfect
    // we have to allow some flexibility, for the 181 edge case and in general reaching scores below 170
    // this is why we provide the throw count as well
    let perfect = [];
    while(score > 181) {
        score = score - 180;
        perfect.push(score);
    }
    if (score > 170 || (score > 146 && !known_checkouts.has(score))) {
        // greater than 170 but less than/equal to 181 means we can always reach a score of 50 from this position, which is the optimal position
        score = 50;
        remaining = 2;
        perfect.push(score);
    }
    else remaining = (3 - winning_move(score, 3).length);
    perfect.push(0);
    return {
        scoreThresholds: perfect,
        throws: (perfect.length * 3) - remaining
    };
}

/*for(let i=101; i < 1101; i = i + 100){
    console.log(perfect_leg(i))
}*/

module.exports = {
    winning_move,
    allowed_throws,
    winning_throws,
    perfect_leg
}