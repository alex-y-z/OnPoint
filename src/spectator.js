const leftPanel = $('#left-panel');
const dartboard = $('#dartboard-svg');
const scoreboard = $('#scoreboard');

// Replicate scorer input
window.replication.onDartAdded((event, regionId, posX, posY) => {
  const region = dartboard.find(`#${regionId}`);
  region.css('fill', 'rgb(0, 238, 255');

  const value = parseInt(region.attr('data-value'));
  console.log(value);
});

// Replicate left panel width
window.replication.onBoardResized((event, width) => {
  leftPanel.css('width', width);
});

// Set the scoreboard info from the new game form
window.replication.getFormInfo((event, legNum, name1, name2, score) => {
  scoreboard.find('#numOfLegs').text(legNum);
  scoreboard.find('#p1').text(name1);
  scoreboard.find('#p2').text(name2);
  scoreboard.find('#p1Score').text(score);
  scoreboard.find('#p2Score').text(score);
});

// Display Statistic Scorer Selected
// stat_type can be any keyword associated in the option list (scorer.html)
window.replication.onStatSelected((event, stat_type) => {
  switch(stat_type) {
    case "avgTurn":
      // Execute for average turn score
      break;
    case "numOf180":
      // Execute for number of 180s in match
      break;
    case "lowTurn":
      // Execute for lowest turn score
      break;
    case "numOfBE":
      // Execute for number of bull's eyes in match
      break;
    case "numOfDouble":
      // Execute for number of doubles in match
      break;

    // Get p1 name from New Game submission or database
    case "p1-rank":
      // Execute for player 1's current league rank
      break;
    case "p1-lastWin":
      // Execute for player 1's last match win
      break;
    case "p1-avgScore":
      // Execute for player 1's average league score for the season
      break; 
    case "p1-180":
      // Execute for player 1's number of 180s in the season
      break; 
    case "p1-winPercent":
      // Execute for Player 1's overall win percentage
      break; 

    // Get p2 name from New Game submission or database  
    case "p2-rank":
      // Execute for player 2's current league rank
      break;
    case "p2-lastWin":
      // Execute for player 2's last match win
      break;
    case "p2-avgScore":
      // Execute for player 2's average league score for the season
      break; 
    case "p2-180":
      // Execute for player 2's number of 180s in the season
      break; 
    case "p2-winPercent":
      // Execute for Player 2's overall win percentage
      break; 
  }
});