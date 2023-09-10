known_checkouts = new Map([
    [170, ["t20", "t20", "b50"]],
    [167, ["t20", "t19", "b50"]],
    [164, ["t20", "t18", "b50"]],
    [161, ["t20", "t17", "b50"]],
    [160, ["t20", "t20", "d20"]],
    [158, ["t20", "t16", "b50"]],
    [157, ["t20", "t19", "d20"]],
    [156, ["t20", "t20", "d18"]],
    [155, ["t20", "t15", "b50"]],
    [154, ["t20", "t18", "d20"]],
    [153, ["t20", "t19", "d18"]],
    [152, ["t20", "t20", "d16"]],
    [151, ["t20", "t17", "d20"]],
    [150, ["t20", "t18", "d18"]],
    [149, ["t20", "t19", "d16"]],
    [148, ["t20", "t16", "d20"]],
    [147, ["t20", "t17", "d18"]],
    [146, ["t20", "t18", "d16"]],
])

winning_throws = new Map(
    [
        [2, "d1"],
        [4, "d2"],
        [6, "d3"],
        [8, "d4"],
        [10, "d5"],
        [12, "d6"],
        [14, "d7"],
        [16, "d8"],
        [18, "d9"],
        [20, "d10"],
        [22, "d11"],
        [24, "d12"],
        [26, "d13"],
        [28, "d14"],
        [30, "d15"],
        [32, "d16"],
        [34, "d17"],
        [36, "d18"],
        [38, "d19"],
        [40, "d20"],
        [50, "b50"],

    ]
)
allowed_throws = new Map(
    [
        [1, "s1"], 
        [2, "s2"], 
        [3, "s3"], 
        [4, "s4"], 
        [5, "s5"], 
        [6, "s6"], 
        [7, "s7"], 
        [8, "s8"], 
        [9, "s9"], 
        [10, "s10"], 
        [11, "s11"], 
        [12, "s12"], 
        [13, "s13"], 
        [14, "s14"], 
        [15, "s15"], 
        [16, "s16"], 
        [17, "s17"], 
        [18, "s18"], 
        [19, "s19"], 
        [20, "s20"],
        [2, "d1"], 
        [4, "d2"], 
        [6, "d3"], 
        [8, "d4"], 
        [10, "d5"], 
        [12, "d6"], 
        [14, "d7"], 
        [16, "d8"], 
        [18, "d9"], 
        [20, "d10"], 
        [22, "d11"], 
        [24, "d12"], 
        [26, "d13"], 
        [28, "d14"], 
        [30, "d15"], 
        [32, "d16"], 
        [34, "d17"], 
        [36, "d18"], 
        [38, "d19"], 
        [40, "d20"],
        [3, "t1"], 
        [9, "t3"], 
        [15, "t5"], 
        [21, "t7"], 
        [27, "t9"], 
        [33, "t11"], 
        [39, "t13"], 
        [42, "t14"], 
        [45, "t15"], 
        [48, "t16"], 
        [51, "t17"], 
        [54, "t18"], 
        [57, "t19"], 
        [60, "t20"],
        [25, "b25"],
        [50, "b50"]
    ]
)
function winning_move(score, remaining_throws) {
    if(score > 170) {
        // if the score is above 170, there are no possible wins
        return []
    }
    else if (known_checkouts.has(score)) {
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
                    return []
                }
                else {
                    return [allowed_throws.get(best_x), allowed_throws.get(best_y)]
                }
            case 3:
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

module.exports = {
    winning_move,
    allowed_throws
}